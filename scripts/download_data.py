"""Download (via curl) the Hannover milling dataset (Mendeley Data, DOI 10.17632/zpxs87bjt8, CC BY 4.0).

- Re-runnable: files already present with a matching sha256 are skipped.
- Never modifies existing files with a correct hash; corrupt/partial files are re-downloaded.
- Output: data/raw/*.h5 (+ data/raw/meta.json). data/raw/ is git-ignored.

Usage: python scripts/download_data.py [--limit N] [--workers 8] [--pattern M1T1]
"""
import argparse
import hashlib
import json
import sys
import subprocess
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"
API = "https://data.mendeley.com/public-api/datasets/zpxs87bjt8"


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def fetch_meta() -> dict:
    out = subprocess.run(["curl", "-sSfL", "-m", "60", API], check=True, capture_output=True).stdout
    meta = json.loads(out)
    (RAW / "meta.json").write_text(json.dumps(meta))
    return meta


def download(entry: dict, retries: int = 4) -> str:
    name = entry["filename"]
    cd = entry["content_details"]
    dst = RAW / name
    if dst.exists() and sha256(dst) == cd["sha256_hash"]:
        return "skip"
    tmp = dst.with_suffix(dst.suffix + ".part")
    for attempt in range(retries):
        try:
            subprocess.run(["curl", "-sSfL", "-m", "180", "-o", str(tmp), cd["download_url"]],
                           check=True, capture_output=True)
            if sha256(tmp) != cd["sha256_hash"]:
                raise ValueError("sha256 mismatch")
            tmp.replace(dst)
            return "ok"
        except Exception as e:  # noqa: BLE001
            if attempt == retries - 1:
                return f"FAIL {e}"
            time.sleep(2 ** attempt)
    return "FAIL"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=None)
    ap.add_argument("--workers", type=int, default=8)
    ap.add_argument("--pattern", default="", help="only files whose name contains this")
    a = ap.parse_args()
    RAW.mkdir(parents=True, exist_ok=True)
    files = [f for f in fetch_meta()["files"] if a.pattern in f["filename"]]
    files = files[: a.limit] if a.limit else files
    counts, fails = {}, []
    with ThreadPoolExecutor(a.workers) as ex:
        futs = {ex.submit(download, f): f["filename"] for f in files}
        for i, fut in enumerate(as_completed(futs), 1):
            res = fut.result()
            key = res.split()[0]
            counts[key] = counts.get(key, 0) + 1
            if key == "FAIL":
                fails.append((futs[fut], res))
            if i % 200 == 0 or i == len(files):
                print(f"{i}/{len(files)} {counts}", flush=True)
    for name, res in fails:
        print(name, res, file=sys.stderr)
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
