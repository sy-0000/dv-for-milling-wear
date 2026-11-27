"""Stage 5 exploratory analysis on data/features.csv. Read-only; writes figures + tables.

Outputs: docs/figs/eda_2_spearman_heatmap.png, docs/figs/eda_4_position_effect.png, data/eda_*.csv, data/features_enriched.csv
Usage: python scripts/eda.py
"""
from pathlib import Path

import matplotlib
import numpy as np
import pandas as pd
from scipy.stats import spearmanr

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
FIG = ROOT / "docs" / "figs"
FIG.mkdir(parents=True, exist_ok=True)
MC = {1: "#0072B2", 2: "#E69F00", 3: "#555555"}  # machine colors (Okabe-Ito blue/orange + gray; CVD-safe)
FEATS = ["Fxy_mean", "Fxy_rms", "Fxy_p99", "F3_mean", "Fx_mean", "Fy_mean", "Fz_mean", "Fx_std", "Fy_std",
         "Fz_std", "A_tooth", "A_spindle", "runout_ratio", "entry_peak", "exit_peak", "Tsp_mean", "Tsp_std",
         "ax_x_mean", "ax_y_mean", "ax_z_mean", "ax_y_std", "pcd_x_std", "pcd_y_std"]
VB_LEVELS = [50, 100, 140]
REF_BAND = (50, 60)  # post break-in reference band (all tools incl. T8 have runs here)

d = pd.read_csv(ROOT / "data" / "features.csv").sort_values(["tool", "run"]).reset_index(drop=True)
d["C_min"] = d.C_s / 60
d["layer"] = d.groupby("tool").x_pos_mm.transform(lambda s: (s.diff() < -50).cumsum())
# T7/T8 coordinates are rotated (x = 11.3/11.4 ...): snap to the 4 mm pass grid
d["x_pass_mm"] = ((d.x_pos_mm - 11) / 4).round() * 4 + 11
# Fz is mostly negative/positive depending on setup; use magnitude for means
for c in ["Fx_mean", "Fy_mean", "Fz_mean"]:
    d[c] = d[c].abs()

# ---------- derived: tool-baseline ratio and machine z-score ----------
for f in FEATS:
    ref = d[d.VB_um.between(*REF_BAND)].groupby("tool")[f].median()
    d[f + "__ratio"] = d[f] / d.tool.map(ref)
    d[f + "__z"] = d.groupby("machine")[f].transform(lambda s: (s - s.mean()) / s.std())
    # detrended residual vs one-layer (29 runs) centered rolling median within tool
    roll = d.groupby("tool")[f].transform(lambda s: s.rolling(29, center=True, min_periods=10).median())
    d[f + "__resid"] = d[f] / roll - 1
d.to_csv(ROOT / "data" / "features_enriched.csv", index=False, float_format="%.6g")

# ---------- 1. tool life ----------
life = []
for t, g in d.groupby("tool"):
    row = dict(tool=t, machine=g.machine.iat[0], runs=len(g), C_end_min=round(g.C_min.max(), 1),
               VB_end=int(g.VB_um.iat[-1]))
    for v in VB_LEVELS:
        hit = g[g.VB_um >= v]
        row[f"C_at_VB{v}_min"] = round(hit.C_min.iat[0], 1) if len(hit) else np.nan
    life.append(row)
life = pd.DataFrame(life)
life.to_csv(ROOT / "data" / "eda_tool_life.csv", index=False)
print(life.to_string(index=False))
print(life.groupby("machine")[[f"C_at_VB{v}_min" for v in VB_LEVELS]].agg(["mean", "min", "max"]).round(1).to_string())

# wear rate per layer (slope of interpolated VB) -> phases
rate = (d.groupby(["tool", "layer"])
        .apply(lambda h: pd.Series(dict(machine=h.machine.iat[0], VB_mid=h.VB_um.mean(), C_mid=h.C_min.mean(),
                                        rate=np.polyfit(h.C_min, h.VB_um, 1)[0] if len(h) > 3 else np.nan)))
        .reset_index())
rate.to_csv(ROOT / "data" / "eda_wear_rate_per_layer.csv", index=False)

# ---------- 2. Spearman: per tool (raw) & pooled with normalizations ----------
rows = []
for f in FEATS:
    r = {"feature": f}
    for t, g in d.groupby("tool"):
        r[f"T{t}"] = spearmanr(g[f], g.VB_um)[0]
    for norm in ["", "__z", "__ratio"]:
        col = f + norm
        r[f"pooled{norm or '_raw'}_VB"] = spearmanr(d[col], d.VB_um)[0]
        r[f"pooled{norm or '_raw'}_C"] = spearmanr(d[col], d.C_s)[0]
    rows.append(r)
sp = pd.DataFrame(rows).set_index("feature")
tcols = [f"T{t}" for t in range(1, 10)]
sp["min_tool_rho"] = sp[tcols].min(axis=1)
sp["median_tool_rho"] = sp[tcols].median(axis=1)
sp = sp.sort_values("pooled__ratio_VB", ascending=False)
sp.round(3).to_csv(ROOT / "data" / "eda_spearman.csv")
print(sp[["median_tool_rho", "min_tool_rho", "pooled_raw_VB", "pooled__z_VB", "pooled__z_C",
          "pooled__ratio_VB", "pooled__ratio_C"]].round(2).to_string())

fig, ax = plt.subplots(figsize=(11, 8))
show = sp[tcols + ["pooled_raw_VB", "pooled__z_VB", "pooled__ratio_VB"]]
im = ax.imshow(show.values, cmap="RdBu_r", vmin=-1, vmax=1, aspect="auto")
ax.set_xticks(range(show.shape[1]), [c.replace("pooled_", "all ").replace("_VB", "") for c in show.columns],
              rotation=45, ha="right", fontsize=8)
ax.set_yticks(range(show.shape[0]), show.index, fontsize=8)
for i in range(show.shape[0]):
    for j in range(show.shape[1]):
        v = show.values[i, j]
        ax.text(j, i, f"{v:.2f}", ha="center", va="center", fontsize=6.5, color="white" if abs(v) > .6 else "black")
ax.axvline(8.5, color="k", lw=1)
fig.colorbar(im, ax=ax, label="Spearman ρ with VB")
ax.set_title("Spearman ρ(feature, VB): per tool (left) and all 9 tools pooled with 3 normalizations (right)")
fig.tight_layout()
fig.savefig(FIG / "eda_2_spearman_heatmap.png", dpi=110)

# features used for the position-effect table
top = ["Fxy_mean", "Tsp_mean", "ax_y_mean", "A_tooth", "Fy_std", "runout_ratio"]
# ---------- 3. position-in-layer effect ----------
pos = d.groupby(["machine", "x_pass_mm"])[[f + "__resid" for f in top]].mean().reset_index()
pos.to_csv(ROOT / "data" / "eda_position_effect.csv", index=False)
fig, axs = plt.subplots(1, 3, figsize=(15, 4))
for axp, f in zip(axs, ["Fxy_mean", "Tsp_mean", "ax_y_mean"]):
    for m, g in pos.groupby("machine"):
        axp.plot(g.x_pass_mm, 100 * g[f + "__resid"], "o-", ms=3, color=MC[m], label=f"M{m}")
    axp.axhline(0, color="k", lw=.6)
    axp.set(xlabel="tool_position_x within layer [mm]", ylabel="deviation from layer trend [%]", title=f)
axs[0].legend(fontsize=8)
fig.suptitle("Position effect: same feature, different x position in the layer (averaged over all layers)")
fig.tight_layout()
fig.savefig(FIG / "eda_4_position_effect.png", dpi=110)
print("position effect range [%]:")
print((100 * pos.groupby("machine")[[f + "__resid" for f in ["Fxy_mean", "Tsp_mean", "ax_y_mean"]]]
       .agg(lambda s: s.max() - s.min())).round(1).to_string())

# ---------- 4. gaps & anomalies ----------
d["dC"] = d.groupby("tool").C_s.diff()
gaps = d[d.dC > 30][["tool", "machine", "run", "C_s", "dC", "VB_um", "layer"]]
gaps.to_csv(ROOT / "data" / "eda_gaps.csv", index=False)
print("C gaps > 30 s:\n", gaps.to_string(index=False))
anom = []
for f in ["Fxy_mean", "Tsp_mean", "ax_y_mean", "entry_peak"]:
    r = d[f + "__resid"]
    mad = d.groupby("tool")[f + "__resid"].transform(lambda s: (s - s.median()).abs().median())
    rz = (r - d.groupby("tool")[f + "__resid"].transform("median")) / (1.4826 * mad)
    d[f + "__rz"] = rz
    hit = d[rz.abs() > 6]
    for _, h in hit.iterrows():
        anom.append(dict(feature=f, file=h.file, tool=h.tool, run=h.run, VB=h.VB_um, x_pos=h.x_pos_mm,
                         resid_pct=round(100 * h[f + "__resid"], 1), robust_z=round(h[f + "__rz"], 1)))
anom = pd.DataFrame(anom)
anom.to_csv(ROOT / "data" / "eda_anomalies.csv", index=False)
print("anomalies (|robust z|>6):", len(anom))
if len(anom):
    print(anom.groupby(["feature", "tool"]).size().unstack(fill_value=0).to_string())

# M2 aliasing hint: torque_spindle std relative to mean, per machine
d["Tsp_cv"] = d.Tsp_std / d.Tsp_mean
print("Tsp std/mean by machine:", d.groupby("machine").Tsp_cv.median().round(3).to_dict())
