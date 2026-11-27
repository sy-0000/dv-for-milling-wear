// V4 · Feature (normalized) vs VB, all runs. 2-D brush selects runs; band = feature level at the VB threshold.
import { tr } from "./i18n.js";
import { state, set, MACHINE_DASH, ACCENT, GRAY, INK2 } from "./state.js";
import { normLabel, median } from "./analysis.js";

let ctx, root, x, y, g, dots, delaunay, pts;
const M = { t: 34, r: 12, b: 34, l: 40 }, H = 330;

export function init(c) {
  ctx = c;
  root = d3.select("#v4 .plot");
  d3.select("#v4-lines").on("change", render);
  render();
}

export function update(keys) {
  if (!keys || ["feature", "norm", "vbThr", "cRange", "showDyn"].some((k) => keys.has(k))) return render();
  if (keys.has("tool") || keys.has("brushed") || keys.has("runIdx")) style();
}

function render() {
  root.selectAll("*").remove();
  const W = root.node().clientWidth, iw = W - M.l - M.r, ih = H - M.t - M.b;
  const yv = ctx.y, f = state.feature, info = ctx.meta.features[f];
  x = d3.scaleLinear().domain([0, 165]).range([0, iw]);
  const ext = d3.extent(yv.filter(Number.isFinite));
  y = d3.scaleLinear().domain(ext).nice().range([ih, 0]);
  const svg = root.append("svg").attr("width", W).attr("height", H).attr("role", "img")
    .attr("aria-label", `${info.label} versus wear for all runs`);
  g = svg.append("g").attr("transform", `translate(${M.l},${M.t})`);
  g.append("g").attr("class", "grid").call(d3.axisLeft(y).ticks(5).tickSize(-iw).tickFormat(""));
  g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(5));
  g.append("g").attr("class", "axis").attr("transform", `translate(0,${ih})`).call(d3.axisBottom(x).ticks(8));
  g.append("text").attr("class", "lbl-2").attr("x", iw).attr("y", ih + 28).attr("text-anchor", "end").text("VB [µm]");
  g.append("text").attr("class", "lbl-2").attr("x", -M.l + 2).attr("y", -20).text(`↑ ${info.label} [${normLabel(state.norm, info.unit)}]`);
  if (state.norm === "raw" && f.startsWith("ax_")) g.append("text").attr("class", "note halo").attr("x", 6).attr("y", 12)
    .text(tr("raw units differ: M1 in Nm (ball screw), M2/M3 in N (linear motor) — use a normalization", "原始單位不同：M1 為 Nm（滾珠螺桿）、M2/M3 為 N（線性馬達）——請使用正規化"));
  if (info.source === "dynamometer") g.append("text").attr("class", "note halo").attr("x", 6).attr("y", 24)
    .text(tr("dynamometer: reference only, not available in production", "測力計：只作參考，產線上沒有"));

  // band at threshold: per-tool median of y for runs with |VB - thr| <= 3
  const per = ctx.tools.map((t) => median(ctx.runs.filter((r) => r.tool === t && Math.abs(r.VB_um - state.vbThr) <= 3).map((r) => yv[r.i])))
    .filter(Number.isFinite);
  g.append("line").attr("x1", x(state.vbThr)).attr("x2", x(state.vbThr)).attr("y1", 0).attr("y2", ih)
    .attr("stroke", GRAY).attr("stroke-dasharray", "3 3");
  if (per.length) {
    const [lo, hi] = d3.extent(per);
    g.append("rect").attr("x", 0).attr("width", iw).attr("y", y(hi)).attr("height", Math.max(1, y(lo) - y(hi)))
      .attr("fill", INK2).attr("opacity", 0.12); // neutral gray: the accent is reserved for alarms and selection (C4)
    // band label in the top margin with a swatch, so the trend lines can no longer cover it (B5)
    const bl = g.append("text").attr("x", iw).attr("text-anchor", "end").attr("y", -6).attr("font-weight", 600)
      .text(tr(`at VB ${state.vbThr} µm: ${ctx.fmt(lo)} – ${ctx.fmt(hi)} (${per.length} tools)`, `VB ${state.vbThr} µm 時：${ctx.fmt(lo)} – ${ctx.fmt(hi)}（${per.length} 把刀）`));
    const bw = bl.node().getComputedTextLength();
    g.append("rect").attr("x", iw - bw - 16).attr("y", -15).attr("width", 11).attr("height", 10).attr("fill", INK2).attr("opacity", 0.25);
  }

  pts = ctx.runs.map((r) => ({ r, px: x(r.VB_um), py: y(yv[r.i]) })).filter((p) => Number.isFinite(p.py));
  dots = g.append("g").selectAll("circle").data(pts).join("circle")
    .attr("cx", (p) => p.px).attr("cy", (p) => p.py).attr("r", 1.8).attr("fill", (p) => ctx.color(p.r.machine));
  if (d3.select("#v4-lines").property("checked")) {
    const line = d3.line().defined((r) => Number.isFinite(ctx.roll[r.i])).x((r) => x(r.VB_um)).y((r) => y(ctx.roll[r.i]));
    g.append("g").selectAll("path").data(d3.groups(ctx.runs, (r) => r.tool)).join("path")
      .attr("fill", "none").attr("stroke", ([t, rs]) => ctx.color(rs[0].machine)).attr("stroke-width", 1.6)
      .attr("stroke-dasharray", ([, rs]) => MACHINE_DASH[rs[0].machine])
      .attr("d", ([, rs]) => line(rs));
  }
  g.append("g").attr("class", "selmark");

  delaunay = d3.Delaunay.from(pts, (p) => p.px, (p) => p.py);
  const brush = d3.brush().extent([[0, 0], [iw, ih]]).on("end", (ev) => {
    if (!ev.sourceEvent) return;
    if (!ev.selection) {
      if (state.brushed) set({ brushed: null });
      else pick(ev);
      return;
    }
    const [[x0, y0], [x1, y1]] = ev.selection;
    const s = new Set(pts.filter((p) => p.px >= x0 && p.px <= x1 && p.py >= y0 && p.py <= y1 && ctx.inRange(p.r)).map((p) => p.r.i));
    set({ brushed: s });
  });
  const bg = g.append("g").attr("class", "brush").call(brush);
  bg.select(".overlay").on("mousemove.tip", (ev) => {
    const [mx, my] = d3.pointer(ev);
    const p = pts[delaunay.find(mx, my)];
    if (Math.hypot(p.px - mx, p.py - my) > 12) return ctx.tip.hide();
    const r = p.r;
    ctx.tip.show(`<b>E${r.tool}</b> (M${r.machine}) · run ${r.run} · layer ${r.layer}<br>VB = ${r.VB_um} µm · C = ${r.C_min.toFixed(1)} min<br>`
      + `${info.label}: ${ctx.fmt(r[f])} ${info.unit}${state.norm !== "raw" ? ` → ${ctx.fmt(yv[r.i])}` : ""}<br><span class="muted">${tr("click to open in V5/V6", "點擊在 V5/V6 開啟")}</span>`, ev);
  }).on("mouseleave.tip", () => ctx.tip.hide());
  style();
}

function pick(ev) {
  const [mx, my] = d3.pointer(ev, g.node());
  const p = pts[delaunay.find(mx, my)];
  if (p && Math.hypot(p.px - mx, p.py - my) <= 12) set({ tool: p.r.tool, runIdx: p.r.i });
}

function style() {
  const b = state.brushed;
  dots.attr("opacity", (p) => {
    if (!ctx.inRange(p.r)) return 0.04;
    if (b) return b.has(p.r.i) ? 0.9 : 0.06;
    return p.r.tool === state.tool ? 0.7 : 0.18;
  }).attr("r", (p) => (p.r.tool === state.tool ? 2.4 : 1.8));
  const sel = state.runIdx != null ? pts.filter((p) => p.r.i === state.runIdx) : [];
  g.select(".selmark").selectAll("circle").data(sel).join("circle").attr("cx", (p) => p.px).attr("cy", (p) => p.py)
    .attr("r", 5).attr("fill", "none").attr("stroke", ACCENT).attr("stroke-width", 1.8);
}
