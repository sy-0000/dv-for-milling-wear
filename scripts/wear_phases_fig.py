"""Wear phases per machine: VB curves, per-layer wear rate, and phase-average rates.

Phase rate = VB change / contact time between threshold crossings
(break-in: start -> 50 um, steady: 50 -> 110 um, accelerated: 110 -> 140 um).
Output: docs/figs/wear_phases_by_machine.png, data/wear_phase_rates.csv
"""
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
plt.rcParams["font.family"] = ["WenQuanYi Zen Hei", "DejaVu Sans"]
MC = {1: "#2a78d6", 2: "#eb6834", 3: "#1baf7a"}
PHASES = [("磨合期", 0, 50), ("穩定期", 50, 110), ("加速期", 110, 140)]

d = pd.read_csv(ROOT / "data" / "features.csv")
d["C_min"] = d.C_s / 60
rate = pd.read_csv(ROOT / "data" / "eda_wear_rate_per_layer.csv")


def first_c(g, v):
    hit = g.loc[g.VB_um >= v, "C_min"]
    return hit.iloc[0] if len(hit) else np.nan


rows = []
for t, g in d.groupby("tool"):
    g = g.sort_values("C_min")
    m = int(g.machine.iloc[0])
    c = {v: first_c(g, v) for v in (50, 110, 140)}
    c0, v0 = g.C_min.iloc[0], g.VB_um.iloc[0]
    rows.append(dict(tool=t, machine=m,
                     breakin=(50 - v0) / (c[50] - c0), steady=60 / (c[110] - c[50]), accel=30 / (c[140] - c[110]),
                     t_breakin_min=c[50] - c0, t_steady_min=c[110] - c[50], t_accel_min=c[140] - c[110]))
pr = pd.DataFrame(rows)
pr.round(2).to_csv(ROOT / "data" / "wear_phase_rates.csv", index=False)

fig, ax = plt.subplots(1, 3, figsize=(16, 4.8), gridspec_kw=dict(width_ratios=[1.25, 1.1, 1]))

# (a) VB curves + machine mean on a common C grid
a = ax[0]
for name, lo, hi in PHASES:
    a.axhspan(lo, hi, color="0.5", alpha=0.06 if name == "穩定期" else 0.13, lw=0)
    a.text(1, (lo + hi) / 2, name, va="center", fontsize=9, color="0.35")
grid = np.linspace(0, 87, 300)
for m in (1, 2, 3):
    curves = []
    for t, g in d[d.machine == m].groupby("tool"):
        a.plot(g.C_min, g.VB_um, color=MC[m], lw=0.8, alpha=0.45)
        curves.append(np.interp(grid, g.C_min, g.VB_um, left=np.nan, right=np.nan))
    mean = np.nanmean(curves, axis=0) if False else np.mean(curves, axis=0)  # NaN outside common range
    a.plot(grid, mean, color=MC[m], lw=2.6, label=f"M{m}（3 把刀平均）")
a.set(xlabel="累計切削時間 C [min]", ylabel="VB [µm]", ylim=(0, 165), xlim=(0, 88),
      title="(a) 磨耗曲線：細線 = 單把刀，粗線 = 同機台平均")
a.legend(loc="lower right", fontsize=8, frameon=False)

# (b) wear rate per layer vs layer VB
b = ax[1]
for name, lo, hi in PHASES:
    b.axvspan(lo, hi, color="0.5", alpha=0.06 if name == "穩定期" else 0.13, lw=0)
bins = np.arange(0, 170, 10)
for m, g in rate.groupby("machine"):
    m = int(m)
    b.scatter(g.VB_mid, g.rate, s=10, color=MC[m], alpha=0.45)
    med = g.groupby(pd.cut(g.VB_mid, bins)).rate.median()
    b.plot([iv.mid for iv in med.index], med.values, "-o", ms=3, color=MC[m], lw=2, label=f"M{m} 中位數")
b.set(xlabel="該層平均 VB [µm]", ylabel="磨耗速率 [µm/min]（每層斜率）", ylim=(-0.3, 9), xlim=(0, 165),
      title="(b) 每層磨耗速率（點 = 一把刀的一層）")
b.text(3, 8.4, "第一層約 13 µm/min，超出畫面", fontsize=8, color="0.35")
b.legend(loc="upper center", fontsize=8, frameon=False)

# (c) phase-average rate per machine, dots = tools
c = ax[2]
keys = [("breakin", "磨合期\n0→50 µm"), ("steady", "穩定期\n50→110 µm"), ("accel", "加速期\n110→140 µm")]
w = 0.26
for k, (col, lab) in enumerate(keys):
    for j, m in enumerate((1, 2, 3)):
        v = pr[pr.machine == m][col]
        xpos = k + (j - 1) * w
        c.bar(xpos, v.mean(), w * 0.9, color=MC[m], alpha=0.85, label=f"M{m}" if k == 0 else None)
        c.scatter([xpos] * len(v), v, s=14, color="black", zorder=3)
        c.text(xpos, v.mean() + 0.25, f"{v.mean():.1f}", ha="center", fontsize=8)
c.set_xticks(range(3), [l for _, l in keys])
c.set(ylabel="平均磨耗速率 [µm/min]", title="(c) 各階段平均速率（長條 = 機台平均，黑點 = 單把刀）")
c.legend(fontsize=8, frameon=False)

fig.text(0.01, 0.005, "注意：VB 每 1–2 層才用顯微鏡量一次，中間為線性內插，所以 (b) 的速率是內插斜率。"
         "T8 缺磨合期（從 VB 34 µm 開始）。M2 的刀為批次 B，與機台效應混淆。", fontsize=8, color="0.3")
fig.tight_layout(rect=(0, 0.03, 1, 1))
out = ROOT / "docs" / "figs" / "wear_phases_by_machine.png"
fig.savefig(out, dpi=150)
print(pr.round(2).to_string(index=False))
print(pr.groupby("machine")[["breakin", "steady", "accel", "t_breakin_min", "t_steady_min", "t_accel_min"]].mean().round(2))
print(out)
