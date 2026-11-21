"""Stage 8 verification: cross-check web data against the raw .h5 files and filelist.csv.

1. Per tool: number of runs, max C, final VB, max VB  -> raw h5 labels vs filelist.csv vs web/data/runs.csv
2. 40 random runs: recompute |torque_spindle| mean and |Fxy| mean from raw h5 (independent code) vs runs.csv
3. Reference values the app should display (life at VB 140, unused life, band at VB 140, pooled rho)
   -> written to data/verify_expected.json for the browser check (scripts/verify_app.js)
Read-only on data/raw. Usage: python scripts/verify.py
"""
import json
from pathlib import Path

import h5py
import numpy as np
import pandas as pd
from scipy.stats import spearmanr

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"
fl = pd.read_csv(ROOT / "data" / "filelist.csv")
web = pd.read_csv(ROOT / "web" / "data" / "runs.csv")
ok = True

print("== 1. per-tool labels: raw h5 vs filelist.csv vs web runs.csv")
rows = []
for t, g in fl.sort_values(["tool", "run"]).groupby("tool"):
    last = g.iloc[-1]
    with h5py.File(RAW / last.filename) as f:
        h_c = int(f["labels/cumulated_tool_contact_time"][0, 0])
        h_vb = int(f["labels/wear"][0, 0])
        h_run = int(f["labels/run"][0, 0])
    w = web[web.tool == t]
    rows.append(dict(tool=t, runs_filelist=len(g), runs_web=len(w), lastrun_h5=h_run,
                     Cmax_h5=h_c, Cmax_filelist=int(g.cumulated_tool_contact_time.max()), Cmax_web=int(w.C_s.max()),
                     VBfinal_h5=h_vb, VBfinal_web=int(w.VB_um.iloc[-1]), VBmax_web=int(w.VB_um.max())))
t1 = pd.DataFrame(rows)
print(t1.to_string(index=False))
same = (t1.runs_filelist == t1.runs_web).all() and (t1.lastrun_h5 == t1.runs_web).all() and \
       (t1.Cmax_h5 == t1.Cmax_web).all() and (t1.Cmax_filelist == t1.Cmax_web).all() and (t1.VBfinal_h5 == t1.VBfinal_web).all()
print("RESULT:", "PASS" if same else "FAIL")
ok &= bool(same)

print("\n== 2. independent recomputation of two features (40 random runs)")
fmap = dict(zip(fl.filename, fl.index))
web_keyed = web.set_index(["tool", "run"])
errs = []
for _, r in fl.sample(40, random_state=1).iterrows():
    w = web_keyed.loc[(r.tool, r.run)]
    with h5py.File(RAW / r.filename) as f:
        tm = f["signals_machine/time_machine"][0]
        ts = f["signals_sensor/time_sensor"][0]
        tq = np.abs(f["signals_machine/torque_spindle"][0])
        fx, fy = f["signals_sensor/force_sensor_x"][0], f["signals_sensor/force_sensor_y"][0]
    a, b = w.t_on + 0.15, w.t_off - 0.15
    tsp = tq[(tm >= a) & (tm <= b)].mean()
    fxy = np.sqrt(fx ** 2 + fy ** 2)[(ts >= a) & (ts <= b)].mean()
    errs.append((abs(tsp / w.Tsp_mean - 1), abs(fxy / w.Fxy_mean - 1)))
errs = np.array(errs)
print(f"max relative error: Tsp_mean {errs[:, 0].max():.2e}, Fxy_mean {errs[:, 1].max():.2e}")
p2 = errs.max() < 1e-3
print("RESULT:", "PASS" if p2 else "FAIL")
ok &= bool(p2)

print("\n== 3. reference values for the app (VB threshold 140 µm, feature Tsp_mean, × tool reference)")
web["C_min"] = web.C_s / 60
life = {}
for t, g in web.groupby("tool"):
    hit = g[g.VB_um >= 140]
    life[t] = round(float(hit.C_min.iloc[0]), 1) if len(hit) else None
fix = min(v for v in life.values() if v is not None)
unused = {t: (round((c - fix) / c * 100) if c and c - fix > 0.05 else 0) for t, c in life.items()}
ref = web[web.VB_um.between(50, 60)].groupby("tool").Tsp_mean.median()
web["Tsp_ratio"] = web.Tsp_mean / web.tool.map(ref)
band = [float(web[(web.tool == t) & ((web.VB_um - 140).abs() <= 3)].Tsp_ratio.median()) for t in range(1, 10)]
rho_all = spearmanr(web.Tsp_ratio, web.VB_um)[0]
exp = dict(life_at_140=life, fleet_fix=round(fix, 1), unused_pct=unused,
           band_lo=round(min(band), 3), band_hi=round(max(band), 3), rho_all_Tsp_ratio=round(float(rho_all), 2))
print(json.dumps(exp, indent=1))
(ROOT / "data" / "verify_expected.json").write_text(json.dumps(exp, indent=1))
print("\nOVERALL:", "PASS" if ok else "FAIL")
