"""Stage 4: extract one row of features per run (all 6,418 .h5 files) + downsampled signals for drill-down.

Read-only on data/raw. Re-runnable (outputs are overwritten).
Outputs
  data/features.csv                     one row per run (labels + features), see FEATURE_DOC below
  data/signals/envelopes.npz            every run: 200-bin envelopes of |Fxy| (RMS), |torque_spindle|, |axis_y|
  data/signals/representative.json      per tool ~5 runs at VB ~ 10/50/80/110/140 um:
                                        raw 25 kHz force snippet (20 ms, mid-cut) + 100 Hz machine signals
  data/extract_errors.csv               files that failed (if any)

Usage: python scripts/extract_features.py [--limit N] [--workers 4]
"""
import argparse
import json
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

import h5py
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"
OUT = ROOT / "data"
SIG = OUT / "signals"

FS_S, FS_M = 25000, 500  # sensor / machine sample rates [Hz]
TRIM = 0.15  # s trimmed at both ends of the cutting window
F_SPINDLE = 200e3 / (np.pi * 8) / 60  # vc=200 m/min, D=8 mm -> 132.6 Hz
F_TOOTH = 4 * F_SPINDLE  # 4 edges -> 530.5 Hz (verified: peak at 530.3 Hz in Fx/Fy)
N_BINS = 200
REP_VB = [10, 50, 80, 110, 140]

FEATURE_DOC = {
    # labels / context
    "machine": "machine tool 1-3", "tool": "tool 1-9", "run": "run counter per tool (gaps not counted)",
    "C_s": "cumulated tool contact time before run [s] (h5 attr says 'min' but values are seconds)",
    "VB_um": "flank wear width [um]; mostly linearly interpolated between microscope measurements",
    "x_pos_mm": "mean tool_position_x during cut [mm] (which pass within a layer)",
    "cut_s": "detected cutting duration [s] (incl. trimmed ends)",
    "axis_type": "torque (M1, ball screw, Nm) or force (M2/M3, linear drive, N)",
    # dynamometer, cutting window only
    "Fx_mean/Fy_mean/Fz_mean": "mean force [N]", "Fx_std/Fy_std/Fz_std": "std of force [N]",
    "Fxy_mean/Fxy_rms/Fxy_p99": "XY resultant force mean / RMS / 99th pct [N]",
    "F3_mean": "3D resultant force mean [N]",
    "A_tooth": "spectral amplitude at tooth-pass freq 530 Hz, sqrt(Ax^2+Ay^2) [N]",
    "A_spindle": "spectral amplitude at spindle freq 133 Hz (edge imbalance / runout) [N]",
    "runout_ratio": "A_spindle / A_tooth [-]",
    "entry_peak/exit_peak": "max |Fxy| in first/last 0.3 s of the (untrimmed) cut [N]",
    # machine control (500 Hz), same time window (note ~100 ms sync uncertainty)
    "Tsp_mean/Tsp_std": "|torque_spindle| mean / std [Nm] (sign convention differs by machine)",
    "ax_x_mean/ax_y_mean/ax_z_mean": "|torque_axis| [Nm] (M1) or |force_axis| [N] (M2/M3) mean",
    "ax_y_std": "std of axis_y signal", "pcd_x_std/pcd_y_std": "std of position control deviation [mm]",
}


def cut_window(fxy):
    """Indices where the 50 ms moving RMS of |Fxy| exceeds 30% of its 95th percentile."""
    w = int(0.05 * FS_S)
    mrms = np.sqrt(np.convolve(fxy**2, np.ones(w) / w, mode="same"))
    on = np.flatnonzero(mrms > 0.3 * np.percentile(mrms, 95))
    return on[0], on[-1]


def band_amp(x, f0, bw=3.0):
    x = x - x.mean()
    a = np.abs(np.fft.rfft(x * np.hanning(len(x)))) * 2 / (len(x) * 0.5)  # Hann coherent gain 0.5
    fr = np.fft.rfftfreq(len(x), 1 / FS_S)
    return float(a[(fr > f0 - bw) & (fr < f0 + bw)].max())


def binned(t, x, t_end, fn):
    edges = np.linspace(0, t_end, N_BINS + 1)
    idx = np.clip(np.digitize(t, edges) - 1, 0, N_BINS - 1)
    out = np.full(N_BINS, np.nan, dtype=np.float32)
    for b in range(N_BINS):
        v = x[idx == b]
        if v.size:
            out[b] = fn(v)
    return out


def process(path: Path):
    try:
        with h5py.File(path, "r") as f:
            L, S, M = f["labels"], f["signals_sensor"], f["signals_machine"]
            lab = dict(machine=int(L["machine"][0, 0]), tool=int(L["tool"][0, 0]), run=int(L["run"][0, 0]),
                       C_s=int(L["cumulated_tool_contact_time"][0, 0]), VB_um=int(L["wear"][0, 0]))
            ts = S["time_sensor"][0].astype(np.float64)
            fx, fy, fz = (S[k][0].astype(np.float64) for k in ("force_sensor_x", "force_sensor_y", "force_sensor_z"))
            tm = M["time_machine"][0].astype(np.float64)
            ax_name = "torque_axis" if "torque_axis_x" in M else "force_axis"
            msig = {k: M[k][0].astype(np.float64) for k in
                    ("torque_spindle", f"{ax_name}_x", f"{ax_name}_y", f"{ax_name}_z",
                     "position_control_deviation_axis_x", "position_control_deviation_axis_y", "tool_position_x")}
    except Exception as e:  # noqa: BLE001
        return None, dict(file=path.name, error=repr(e))

    fxy_all = np.hypot(fx, fy)
    i0, i1 = cut_window(fxy_all)
    t_on, t_off = ts[i0], ts[i1]
    t0, t1 = t_on + TRIM, t_off - TRIM
    k = (ts >= t0) & (ts <= t1)
    km = (tm >= t0) & (tm <= t1)
    fxy = fxy_all[k]
    ax = {a: msig[f"{ax_name}_{a}"][km] for a in "xyz"}
    tsp = np.abs(msig["torque_spindle"][km])
    ent = (ts >= t_on) & (ts <= t_on + 0.3)
    ext = (ts >= t_off - 0.3) & (ts <= t_off)
    at_x, at_y = band_amp(fx[k], F_TOOTH), band_amp(fy[k], F_TOOTH)
    as_x, as_y = band_amp(fx[k], F_SPINDLE), band_amp(fy[k], F_SPINDLE)
    a_tooth, a_spin = float(np.hypot(at_x, at_y)), float(np.hypot(as_x, as_y))

    row = dict(
        file=path.name, **lab,
        x_pos_mm=float(msig["tool_position_x"][km].mean()),
        cut_s=float(t_off - t_on),
        axis_type="torque" if ax_name == "torque_axis" else "force",
        Fx_mean=float(fx[k].mean()), Fy_mean=float(fy[k].mean()), Fz_mean=float(fz[k].mean()),
        Fx_std=float(fx[k].std()), Fy_std=float(fy[k].std()), Fz_std=float(fz[k].std()),
        Fxy_mean=float(fxy.mean()), Fxy_rms=float(np.sqrt(np.mean(fxy**2))), Fxy_p99=float(np.percentile(fxy, 99)),
        F3_mean=float(np.sqrt(fx[k] ** 2 + fy[k] ** 2 + fz[k] ** 2).mean()),
        A_tooth=a_tooth, A_spindle=a_spin, runout_ratio=a_spin / a_tooth if a_tooth else np.nan,
        entry_peak=float(fxy_all[ent].max()), exit_peak=float(fxy_all[ext].max()),
        Tsp_mean=float(tsp.mean()), Tsp_std=float(tsp.std()),
        ax_x_mean=float(np.abs(ax["x"]).mean()), ax_y_mean=float(np.abs(ax["y"]).mean()),
        ax_z_mean=float(np.abs(ax["z"]).mean()), ax_y_std=float(ax["y"].std()),
        pcd_x_std=float(msig["position_control_deviation_axis_x"][km].std()),
        pcd_y_std=float(msig["position_control_deviation_axis_y"][km].std()),
        t_on=float(t_on), t_off=float(t_off), t_end=float(max(ts[-1], tm[-1])),
    )
    t_end = row["t_end"]
    env = np.stack([
        binned(ts, fxy_all, t_end, lambda v: np.sqrt(np.mean(v**2))),
        binned(tm, np.abs(msig["torque_spindle"]), t_end, np.mean),
        binned(tm, np.abs(msig[f"{ax_name}_y"]), t_end, np.mean),
    ])
    return row, env


def representative(df):
    """Per tool, the run whose VB is closest to each REP_VB target (skip targets outside the tool's range)."""
    picks = []
    for tool, g in df.groupby("tool"):
        for vb in REP_VB:
            if vb < g.VB_um.min() - 5 or vb > g.VB_um.max() + 5:
                continue
            picks.append(g.iloc[(g.VB_um - vb).abs().argmin()].file)
    return sorted(set(picks))


def rep_signals(fname, row):
    with h5py.File(RAW / fname, "r") as f:
        S, M = f["signals_sensor"], f["signals_machine"]
        ts = S["time_sensor"][0]
        mid = (row["t_on"] + row["t_off"]) / 2
        k = (ts >= mid) & (ts < mid + 0.02)  # 20 ms = ~2.65 spindle revolutions
        snip = {c: np.round(S[f"force_sensor_{c}"][0][k], 1).tolist() for c in "xyz"}
        tm = M["time_machine"][0]
        ax_name = "torque_axis" if "torque_axis_x" in M else "force_axis"
        step = FS_M // 100
        mach = {"t": np.round(tm[::step], 3).tolist(),
                "torque_spindle_abs": np.round(np.abs(M["torque_spindle"][0][::step]), 3).tolist(),
                "axis_y_abs": np.round(np.abs(M[f"{ax_name}_y"][0][::step]), 3).tolist()}
    return dict(file=fname, machine=int(row["machine"]), tool=int(row["tool"]), run=int(row["run"]),
                VB_um=int(row["VB_um"]), C_s=int(row["C_s"]), snippet_fs=FS_S,
                snippet_t0=float(mid), force_snippet=snip, machine_100hz=mach,
                axis_unit="Nm" if ax_name == "torque_axis" else "N")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int)
    ap.add_argument("--workers", type=int, default=4)
    a = ap.parse_args()
    fl = pd.read_csv(OUT / "filelist.csv").sort_values(["tool", "run"])
    files = [RAW / f for f in fl.filename][: a.limit]
    rows, envs, errs = [], [], []
    with ProcessPoolExecutor(a.workers) as ex:
        for i, (row, env) in enumerate(ex.map(process, files, chunksize=16), 1):
            if row is None:
                errs.append(env)
            else:
                rows.append(row)
                envs.append(env)
            if i % 500 == 0:
                print(f"{i}/{len(files)}", flush=True)
    df = pd.DataFrame(rows)
    # sanity: labels inside file must match filelist.csv
    chk = df.merge(fl, left_on="file", right_on="filename")
    bad = chk[(chk.VB_um != chk.wear) | (chk.C_s != chk.cumulated_tool_contact_time) | (chk.machine_x != chk.machine_y)]
    print(f"rows={len(df)} errors={len(errs)} label mismatches vs filelist={len(bad)}")
    df.to_csv(OUT / "features.csv", index=False, float_format="%.6g")
    SIG.mkdir(parents=True, exist_ok=True)
    np.savez_compressed(SIG / "envelopes.npz", env=np.stack(envs).astype(np.float16), files=np.array(df.file.tolist(), dtype=str),
                        channels=np.array(["Fxy_rms_N", "torque_spindle_abs", "axis_y_abs"]),
                        t_end=df.t_end.values.astype(np.float32))
    rep = [rep_signals(fn, df.set_index("file").loc[fn].to_dict() | {"file": fn}) for fn in representative(df)]
    (SIG / "representative.json").write_text(json.dumps(rep))
    (OUT / "features_doc.json").write_text(json.dumps(FEATURE_DOC, indent=1, ensure_ascii=False))
    if errs:
        pd.DataFrame(errs).to_csv(OUT / "extract_errors.csv", index=False)
    print(f"representative runs: {len(rep)}")


if __name__ == "__main__":
    main()
