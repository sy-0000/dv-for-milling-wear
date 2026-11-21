"""Stage 7: build the compact files the D3 web app loads (web/data/). Re-runnable, read-only on inputs.

Inputs : data/features.csv, data/signals/envelopes.npz, data/signals/representative.json, data/filelist.csv
Outputs: web/data/runs.csv          one row per run, only the columns the app uses
         web/data/meta.json         machines, tools, feature dictionary, data-limitation notes
         web/data/envelopes.bin     Uint16, shape (runs, 3 channels, 200 bins), row order = runs.csv
         web/data/snippets.json     20 ms raw force snippets of representative runs (dynamometer reference)

Usage: python scripts/build_web_data.py
"""
import json
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "web" / "data"
OUT.mkdir(parents=True, exist_ok=True)

MACHINE_FEATS = {
    "Tsp_mean": ("Spindle torque, mean |T|", "Nm"),
    "Tsp_std": ("Spindle torque, std", "Nm"),
    "ax_x_mean": ("Feed axis X effort, mean |·|", "Nm (M1) / N (M2, M3)"),
    "ax_y_mean": ("Feed axis Y effort, mean |·|", "Nm (M1) / N (M2, M3)"),
    "ax_z_mean": ("Feed axis Z effort, mean |·|", "Nm (M1) / N (M2, M3)"),
    "ax_y_std": ("Feed axis Y effort, std", "Nm (M1) / N (M2, M3)"),
    "pcd_x_std": ("Position control deviation X, std", "µm"),
    "pcd_y_std": ("Position control deviation Y, std", "µm"),
}
DYN_FEATS = {
    "Fxy_mean": ("Force |Fxy|, mean", "N"),
    "Fxy_p99": ("Force |Fxy|, 99th pct", "N"),
    "Fx_mean": ("Force X, mean |·|", "N"),
    "Fy_mean": ("Force Y, mean |·|", "N"),
    "Fz_mean": ("Force Z, mean |·|", "N"),
    "Fx_std": ("Force X, std", "N"),
    "Fy_std": ("Force Y, std", "N"),
    "Fz_std": ("Force Z, std", "N"),
    "A_tooth": ("Tooth-pass amplitude 530 Hz", "N"),
    "A_spindle": ("Spindle-freq amplitude 133 Hz", "N"),
    "runout_ratio": ("Runout ratio (133 Hz / 530 Hz)", "–"),
    "entry_peak": ("Entry peak |Fxy|", "N"),
    "exit_peak": ("Exit peak |Fxy|", "N"),
}

d = pd.read_csv(ROOT / "data" / "features.csv")
order = d.sort_values(["tool", "run"]).index
d = d.loc[order].reset_index(drop=True)
for c in ["Fx_mean", "Fy_mean", "Fz_mean"]:
    d[c] = d[c].abs()
d["pcd_x_std"] *= 1000  # mm -> µm
d["pcd_y_std"] *= 1000
d["layer"] = d.groupby("tool").x_pos_mm.transform(lambda s: (s.diff() < -50).cumsum())
d["x_pass"] = (((d.x_pos_mm - 11) / 4).round() * 4 + 11).astype(int)

cols = ["tool", "machine", "run", "C_s", "VB_um", "layer", "x_pass", "t_on", "t_off", "t_end"] + \
       list(MACHINE_FEATS) + list(DYN_FEATS)
d[cols].to_csv(OUT / "runs.csv", index=False, float_format="%.5g")

# envelopes: reorder to runs.csv order, quantize per channel to Uint16
# envelopes.npz rows are in the same order as data/features.csv rows (both written by extract_features.py)
z = np.load(ROOT / "data" / "signals" / "envelopes.npz", allow_pickle=False)
env = z["env"].astype(np.float32)[order.to_numpy()]  # (n, 3, 200), reordered like runs.csv
env = np.nan_to_num(env, nan=0.0)
scales = []
q = np.empty(env.shape, dtype="<u2")
for c in range(env.shape[1]):
    mx = float(env[:, c].max())
    scales.append(mx / 65535)
    q[:, c] = np.round(env[:, c] / scales[-1]).astype("<u2")
q.tofile(OUT / "envelopes.bin")

rep = json.loads((ROOT / "data" / "signals" / "representative.json").read_text())
snips = [dict(tool=r["tool"], run=r["run"], VB_um=r["VB_um"], fs=r["snippet_fs"],
              fx=r["force_snippet"]["x"], fy=r["force_snippet"]["y"]) for r in rep]
(OUT / "snippets.json").write_text(json.dumps(snips, separators=(",", ":")))

life_max = d.groupby("tool").VB_um.max().to_dict()
meta = dict(
    source="Denkena, Klemme, Stiehl (2023) Data in Brief 50:109574; Mendeley Data doi:10.17632/zpxs87bjt8 (CC BY 4.0)",
    n_runs=len(d),
    machines={
        "1": dict(name="DMG Mori Milltap 700", control="Siemens 840D sl", drive="ball screw", tools=[1, 2, 3],
                  batch="A", axis_unit="Nm"),
        "2": dict(name="DMG Mori HSC 30 linear", control="Siemens 840D sl", drive="linear direct drive",
                  tools=[4, 5, 6], batch="B", axis_unit="N",
                  note="Spindle torque & feed-axis force may be aliased (control low-pass filter disabled)."),
        "3": dict(name="DMG Mori HSC 55 linear", control="Heidenhain iTNC 530", drive="linear direct drive",
                  tools=[7, 8, 9], batch="A", axis_unit="N"),
    },
    tool_notes={"7": "XY coordinate system rotated ~1–2° (affects feed-axis & position signals).",
                "8": "First runs missing (data start at C = 177 s, VB = 34 µm); XY rotated ~1–2°."},
    tool_max_vb={str(k): int(v) for k, v in life_max.items()},
    features={k: dict(label=v[0], unit=v[1], source="machine") for k, v in MACHINE_FEATS.items()} |
             {k: dict(label=v[0], unit=v[1], source="dynamometer") for k, v in DYN_FEATS.items()},
    envelopes=dict(file="envelopes.bin", dtype="uint16", n_bins=200,
                   channels=["|Fxy| RMS [N]", "|torque_spindle| [Nm]", "|feed axis Y| [Nm or N]"],  # order as in extract_features.py
                   scales=scales),
    limitations=[
        "VB was measured by microscope only every 1–2 layers (~40 runs); other runs are linearly interpolated.",
        "Force (dynamometer) and control signals may be misaligned by up to ~100 ms.",
        "M2 end mills (E4–E6) come from tool batch B, all others from batch A: machine and batch effects are confounded.",
        "Each end mill ran on one machine only; 3 end mills per machine. End mills are labelled E1–E9.",
    ],
)
(OUT / "meta.json").write_text(json.dumps(meta, indent=1, ensure_ascii=False))
for f in sorted(OUT.iterdir()):
    print(f"{f.name:16s} {f.stat().st_size / 1e6:6.2f} MB")
