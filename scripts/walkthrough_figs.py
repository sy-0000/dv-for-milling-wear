"""Explanatory figures for the data walkthrough (docs/01_data.md, docs/02_findings.md). Read-only.

Usage: python scripts/walkthrough_figs.py
"""
from pathlib import Path

import h5py
import matplotlib
import numpy as np
import pandas as pd

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
from matplotlib.patches import Rectangle  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
FIG = ROOT / "docs" / "figs"
MC = {1: "#0072B2", 2: "#E69F00", 3: "#555555"}
d = pd.read_csv(ROOT / "data" / "features_enriched.csv")

# ---------- walk_1: anatomy of the data ----------
fig = plt.figure(figsize=(15, 9))
gs = fig.add_gridspec(3, 3)
# (a) top view of one layer: passes at measured x positions
ax = fig.add_subplot(gs[:, 0])
ax.add_patch(Rectangle((0, 0), 170, 100, fc="#eeeeee", ec="k"))
lay = d[(d.tool == 1) & (d.layer == 5)]
for i, (_, r) in enumerate(lay.iterrows()):
    ax.annotate("", xy=(r.x_pass_mm, 104), xytext=(r.x_pass_mm, -4),
                arrowprops=dict(arrowstyle="->", color=MC[1], lw=1))
for x in sorted(set(range(11, 164, 4)) - set(lay.x_pass_mm.astype(int))):
    ax.plot([x, x], [-4, 104], color="red", lw=.8, ls=":")
ax.text(85, 108, "feed direction +Y (one arrow = one run ≈ 4 s cutting)", ha="center", fontsize=8)
ax.text(85, -12, "red dotted = runs removed (first/last of layer, mounting holes)", ha="center", fontsize=8,
        color="red")
ax.set(xlim=(-5, 175), ylim=(-18, 115), xlabel="X [mm]  (next run shifts +4 mm = cutting width ae)",
       ylabel="Y [mm]", title="(a) Top view of one layer (T1, layer 5): 29 kept runs", aspect="equal")
# (b) one run: position and force over time
f = ROOT / "data" / "raw" / d[(d.tool == 1) & (d.run == 150)].file.iat[0]
r = d[(d.tool == 1) & (d.run == 150)].iloc[0]
with h5py.File(f) as h:
    tm, ts = h["signals_machine/time_machine"][0], h["signals_sensor/time_sensor"][0]
    y, z = h["signals_machine/tool_position_y"][0], h["signals_machine/tool_position_z"][0]
    tsp = np.abs(h["signals_machine/torque_spindle"][0])
    fxy = np.hypot(h["signals_sensor/force_sensor_x"][0], h["signals_sensor/force_sensor_y"][0])
for k, (sig, t, lab) in enumerate([(y, tm, "tool_position_y [mm]\n(steady feed 26.5 mm/s)"),
                                   (z, tm, "tool_position_z [mm]\n(−2 = depth of cut)"),
                                   (tsp, tm, "|torque_spindle| [Nm]\n(machine control, 500 Hz)"),
                                   (fxy, ts, "|F_xy| [N]\n(dynamometer, 25 kHz)")][:3]):
    ax = fig.add_subplot(gs[k, 1])
    ax.plot(t, sig, lw=.6, color="k")
    ax.axvspan(r.t_on, r.t_off, color="#2ca02c", alpha=.12)
    ax.axvspan(r.t_on + .15, r.t_off - .15, color="#2ca02c", alpha=.18)
    ax.set_ylabel(lab, fontsize=8)
    if k == 0:
        ax.set_title(f"(b) One run (T1 R150, VB={r.VB_um} µm): green = detected cut, darker = used", fontsize=9)
ax.set_xlabel("time within run [s]")
ax = fig.add_subplot(gs[0, 2])
ax.plot(ts, fxy, lw=.2, color="k")
ax.axvspan(r.t_on + .15, r.t_off - .15, color="#2ca02c", alpha=.18)
ax.set(title="(c) |F_xy| dynamometer 25 kHz, same run", xlabel="time [s]", ylabel="N")
ax = fig.add_subplot(gs[1, 2])
k = (ts > 2) & (ts < 2.02)
ax.plot((ts[k] - 2) * 1000, fxy[k], lw=.8, color="k")
ax.set(title="(d) zoom 20 ms: each bump = one cutting edge (530 Hz)", xlabel="ms", ylabel="N")
ax = fig.add_subplot(gs[2, 2])
g = d[d.tool == 1]
ax.plot(g.C_min, g.VB_um, color=MC[1])
for L, h in g.groupby("layer"):
    ax.axvline(h.C_min.min(), color="k", lw=.3, alpha=.4)
ax.set(title="(e) whole tool T1: 21 layers (gray lines), 609 runs", xlabel="C [min]", ylabel="VB [µm]")
fig.tight_layout()
fig.savefig(FIG / "walk_1_anatomy.png", dpi=110)

# ---------- walk_2: F5 normalization ----------
fig, axs = plt.subplots(1, 3, figsize=(16, 4.5))
for t, g in d.groupby("tool"):
    m = g.machine.iat[0]
    axs[0].plot(g.VB_um, g.Tsp_mean.rolling(15, center=True).median(), color=MC[m], lw=1)
    axs[1].plot(g.VB_um, g.Tsp_mean__ratio.rolling(15, center=True).median(), color=MC[m], lw=1)
    axs[2].plot(g.VB_um, g.A_tooth__ratio.rolling(15, center=True).median(), color=MC[m], lw=1)
for a in axs:
    a.axvspan(50, 60, color="k", alpha=.07)
    a.set_xlabel("VB [µm]")
for m, c in MC.items():
    axs[0].plot([], [], color=c, label=f"M{m}")
axs[0].legend(fontsize=8)
axs[0].set(title="(a) Spindle torque, raw: machines start at different levels", ylabel="|torque_spindle| [Nm]")
axs[1].set(title="(b) Same, divided by each tool's value at VB 50–60\n→ the 3 machines overlap",
           ylabel="× reference")
axs[2].set(title="(c) 530 Hz tooth amplitude, same normalization\n→ M3 goes DOWN, M1/M2 go up", ylabel="× reference")
axs[1].axhline(1, color="k", lw=.5, ls=":")
axs[2].axhline(1, color="k", lw=.5, ls=":")
fig.tight_layout()
fig.savefig(FIG / "walk_2_F5_normalization.png", dpi=110)

# ---------- walk_3: F7 anomalies ----------
fig, axs = plt.subplots(2, 2, figsize=(15, 7.5))
for col, (tool, runs, title) in enumerate([(9, (280, 440), "T9 (M3), runs 280–440"),
                                            (1, (380, 530), "T1 (M1), runs 380–530")]):
    g = d[(d.tool == tool) & d.run.between(*runs)]
    for L, h in g.groupby("layer"):
        c = "#fde0c5" if L % 2 else "white"
        for a in axs[:, col]:
            a.axvspan(h.run.min() - .5, h.run.max() + .5, color=c, lw=0)
        axs[0, col].text(h.run.mean(), g.Fxy_mean.max() * 1.02, f"L{L}", ha="center", fontsize=7)
    axs[0, col].plot(g.run, g.Fxy_mean, ".-", ms=3, lw=.6, color="k", label="F_xy mean (dynamometer)")
    ax2 = axs[0, col].twinx()
    ax2.plot(g.run, g.Tsp_mean, ".-", ms=3, lw=.6, color=MC[g.machine.iat[0]], label="|torque_spindle| (machine)")
    ax2.set_ylabel("Nm", color=MC[g.machine.iat[0]])
    axs[0, col].set(title=f"(a{col + 1}) {title}: force vs spindle torque, shaded = layers", ylabel="N")
    axs[0, col].legend(loc="upper left", fontsize=7)
    ax2.legend(loc="lower right", fontsize=7)
    axs[1, col].plot(g.run, g.A_tooth, ".-", ms=3, lw=.6, color="k", label="A_tooth 530 Hz [N]")
    ax3 = axs[1, col].twinx()
    ax3.plot(g.run, g.runout_ratio, ".-", ms=3, lw=.6, color="#CC79A7", label="runout_ratio (133/530 Hz)")
    axs[1, col].legend(loc="upper left", fontsize=7)
    ax3.legend(loc="upper right", fontsize=7)
    axs[1, col].set(xlabel="run", title=f"(b{col + 1}) edge-level frequency features")
fig.tight_layout()
fig.savefig(FIG / "walk_3_F7_anomalies.png", dpi=110)
print("ok")
