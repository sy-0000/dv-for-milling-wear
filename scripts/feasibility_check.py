"""Stage 3 feasibility check: do simple signal features change with tool wear VB?

Subsamples every Nth run per tool, detects the cutting window from the dynamometer's
XY resultant force, computes a few features, then plots feature vs VB per tool.
Read-only on data/raw. Outputs: data/feasibility_features.csv, docs/figs/feasibility_*.png

Usage: python scripts/feasibility_check.py [--step 3]
"""
import argparse
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

import h5py
import matplotlib
import numpy as np
import pandas as pd
from scipy.stats import spearmanr

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"
FIG = ROOT / "docs" / "figs"
TRIM = 0.15  # s trimmed at each end of the cutting window (entry/exit transients, ~100 ms sync offset)


def cut_window(t, fx, fy, fs=25000):
    """Cutting window = first/last time the 50 ms moving RMS of |Fxy| exceeds 30% of its 95th pct."""
    f = np.hypot(fx, fy)
    w = int(0.05 * fs)
    mrms = np.sqrt(np.convolve(f**2, np.ones(w) / w, mode="same"))
    on = np.flatnonzero(mrms > 0.3 * np.percentile(mrms, 95))
    return t[on[0]] + TRIM, t[on[-1]] - TRIM


def rms(x):
    return float(np.sqrt(np.mean(np.square(x))))


def features(path):
    with h5py.File(path, "r") as f:
        lab = {k: int(f["labels"][k][0, 0]) for k in ["machine", "tool", "run", "wear", "cumulated_tool_contact_time"]}
        s, m = f["signals_sensor"], f["signals_machine"]
        ts = s["time_sensor"][0]
        fx, fy, fz = s["force_sensor_x"][0], s["force_sensor_y"][0], s["force_sensor_z"][0]
        t0, t1 = cut_window(ts, fx, fy)
        k = (ts >= t0) & (ts <= t1)
        tm = m["time_machine"][0]
        km = (tm >= t0) & (tm <= t1)
        tq = np.abs(m["torque_spindle"][0][km])  # sign convention differs per machine
        ax = "torque_axis" if "torque_axis_x" in m else "force_axis"
        fxy = np.hypot(fx[k], fy[k])
        out = dict(
            lab,
            file=path.name,
            cut_s=t1 - t0 + 2 * TRIM,
            F_xy_mean=float(fxy.mean()),
            F_xy_rms=rms(fxy),
            F_x_std=float(fx[k].std()),
            F_y_std=float(fy[k].std()),
            F_z_std=float(fz[k].std()),
            F_xy_p99=float(np.percentile(fxy, 99)),
            T_spindle_mean=float(tq.mean()),
            axis_x_mean_abs=float(np.abs(m[f"{ax}_x"][0][km]).mean()),
            axis_y_mean_abs=float(np.abs(m[f"{ax}_y"][0][km]).mean()),
            pcd_y_std=float(m["position_control_deviation_axis_y"][0][km].std()),
        )
    return out


FEATS = ["F_xy_mean", "F_xy_rms", "F_x_std", "F_y_std", "F_z_std", "F_xy_p99",
         "T_spindle_mean", "axis_x_mean_abs", "axis_y_mean_abs", "pcd_y_std"]
COLORS = {1: "#2a7ab9", 2: "#e69f00", 3: "#555555"}  # machine colors (Okabe-Ito-like, CVD-safe)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--step", type=int, default=3)
    a = ap.parse_args()
    fl = pd.read_csv(ROOT / "data" / "filelist.csv").sort_values(["tool", "run"])
    sel = fl.groupby("tool", group_keys=False).apply(lambda g: g.iloc[:: a.step])
    paths = [RAW / f for f in sel.filename]
    with ProcessPoolExecutor() as ex:
        df = pd.DataFrame(list(ex.map(features, paths, chunksize=16)))
    out = ROOT / "data" / "feasibility_features.csv"
    df.to_csv(out, index=False)
    print(f"{len(df)} runs -> {out}")
    print("cut duration [s]:", df.cut_s.describe().round(2).to_dict())

    # Spearman rho per tool, then summarize per machine
    rows = []
    for (mach, tool), g in df.groupby(["machine", "tool"]):
        for ft in FEATS:
            rows.append(dict(machine=mach, tool=tool, feature=ft, rho=spearmanr(g[ft], g.wear)[0]))
    r = pd.DataFrame(rows)
    piv = r.pivot_table(index="feature", columns="tool", values="rho").round(2)
    piv["median"] = piv.median(axis=1).round(2)
    print(piv.sort_values("median", ascending=False).to_string())
    piv.to_csv(ROOT / "data" / "feasibility_spearman.csv")

    FIG.mkdir(parents=True, exist_ok=True)
    fig, axs = plt.subplots(2, 5, figsize=(18, 7))
    for axp, ft in zip(axs.flat, FEATS):
        for tool, g in df.groupby("tool"):
            axp.scatter(g.wear, g[ft], s=3, alpha=0.5, color=COLORS[g.machine.iat[0]])
        axp.set_title(f"{ft}  (median ρ={piv.loc[ft, 'median']})", fontsize=9)
        axp.set_xlabel("VB [µm]", fontsize=8)
    for mach, c in COLORS.items():
        axs[0, 0].scatter([], [], color=c, label=f"M{mach}")
    axs[0, 0].legend(fontsize=8)
    fig.suptitle(f"Feasibility: feature vs VB (every {a.step}rd run, cutting window only; color = machine)")
    fig.tight_layout()
    fig.savefig(FIG / "feasibility_scatter.png", dpi=100)


if __name__ == "__main__":
    main()
