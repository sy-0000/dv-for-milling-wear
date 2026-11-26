// V3 · Spearman ρ(feature, VB) per tool and pooled; recomputed for normalization, time filter and source toggle.
// Shows all 8 machine-control features (production) and 2 representative dynamometer features (reference only);
// the other dynamometer features stay available in the global Feature menu.
import { state, set, ACCENT, INK, INK2, GRAY } from "./state.js";
import { normalize, spearman } from "./analysis.js";

let ctx, root, svg, g, layout = {};
let sortKey = "min"; // min = lowest per-end-mill ρ (follows wear in EVERY end mill?) | pooled
const DYN_SHOWN = ["Fx_mean", "A_tooth"]; // Force X mean (ρ comparable to spindle torque) + tooth-pass amplitude (inconsistent across machines)
const M = { t: 22, r: 8, b: 44, l: 0 }, ROWH = 17, GROUPH = 22;
// desaturated diverging scale: muted blue – neutral gray – muted brick, midpoint ρ = 0 (C1); ends are not full-saturation
const color = d3.scaleDiverging().domain([-1, 0, 1]).clamp(true)
  .interpolator(d3.piecewise(d3.interpolateLab, ["#4d6f99", "#eceae6", "#a85a45"]));
const GROUP_LABEL = { machine: "Machine control — production-ready", dynamometer: "Dynamometer — reference only (not in production)" };
const AXIS_NOTE = "Feed axis: M1 = ball-screw motor torque [Nm], M2/M3 = linear-motor force [N]; M2 is also tool batch B.";

export function init(c) {
  ctx = c;
  root = d3.select("#v3 .plot");
  d3.selectAll("#v3-sort button").on("click", function () {
    sortKey = this.dataset.sort;
    d3.selectAll("#v3-sort button").classed("on", function () { return this.dataset.sort === sortKey; });
    render(false);
  });
  render(true);
}

export function update(keys) {
  if (!keys) return render(true);
  if (keys.has("norm") || keys.has("cRange") || keys.has("showDyn")) render(keys.has("showDyn"));
  else if (keys.has("feature") || keys.has("tool")) mark();
}

function compute() {
  const feats = ctx.feats.filter((f) => ctx.meta.features[f].source === "machine" || (state.showDyn && DYN_SHOWN.includes(f)));
  const sub = ctx.runs.filter(ctx.inRange);
  return feats.map((f) => {
    const y = normalize(ctx.runs, f, state.norm);
    const cells = ctx.tools.map((t) => {
      const rs = sub.filter((r) => r.tool === t);
      return { col: `E${t}`, tool: t, ...spearman(rs.map((r) => y[r.i]), rs.map((r) => r.VB_um)) };
    });
    const pooled = spearman(sub.map((r) => y[r.i]), sub.map((r) => r.VB_um));
    cells.push({ col: "All", tool: null, ...pooled });
    return { f, src: ctx.meta.features[f].source, cells, pooled: pooled.rho, minTool: d3.min(cells.slice(0, 9), (c) => c.rho) };
  });
}

function labelWidth(labels) {
  // measure the longest row label so labels are never cut (no truncation, no scrolling)
  const tmp = root.append("svg").attr("width", 0).attr("height", 0).style("position", "absolute");
  const w = d3.max(labels, (s) => tmp.append("text").text(s).node().getComputedTextLength());
  tmp.remove();
  return Math.ceil(w) + 12;
}

function render(rebuild) {
  const rows = compute();
  // order: machine group first, then within the group by the lowest per-end-mill rho (default: "does it follow wear
  // in every end mill?", A3) or by the pooled rho
  const key = (r) => (sortKey === "min" ? r.minTool : r.pooled);
  const order = d3.groups(rows, (r) => r.src).flatMap(([, v]) => v.sort((a, b) => d3.descending(key(a), key(b))));
  if (rebuild || !svg) {
    root.selectAll("*").remove();
    svg = root.append("svg").attr("role", "img").attr("aria-label", "Correlation heatmap of features with wear");
    g = svg.append("g");
    g.append("g").attr("class", "bgs");
    g.append("g").attr("class", "heads");
    g.append("g").attr("class", "groups");
    g.append("g").attr("class", "rows");
    g.append("g").attr("class", "legend");
  }
  M.l = labelWidth(ctx.feats.map((f) => ctx.meta.features[f].label));
  const W = root.node().clientWidth, iw = W - M.l - M.r;
  const cols = [...ctx.tools.map((t) => `E${t}`), "All"];
  const xb = d3.scaleBand().domain(cols).range([0, iw]).paddingInner(0.08);
  const yPos = new Map(), groupY = [];
  let yy = 0, lastSrc = null;
  order.forEach((r) => {
    if (r.src !== lastSrc) { groupY.push({ src: r.src, y: yy }); yy += GROUPH; lastSrc = r.src; }
    yPos.set(r.f, yy); yy += ROWH;
  });
  const ih = yy;
  g.attr("transform", `translate(${M.l},${M.t})`);
  svg.attr("width", W).attr("height", ih + M.t + M.b);
  layout = { xb, yPos, iw };

  // reference group recedes: light gray background under the whole dynamometer block
  const dynY = groupY.find((d) => d.src === "dynamometer");
  g.select(".bgs").selectAll("rect").data(dynY ? [dynY] : []).join("rect")
    .attr("x", -M.l).attr("y", (d) => d.y).attr("width", W).attr("height", ih - dynY?.y || 0).attr("fill", "#f6f5f2");

  g.select(".heads").selectAll("text").data(cols).join("text")
    .attr("x", (c) => xb(c) + xb.bandwidth() / 2).attr("y", -7).attr("text-anchor", "middle")
    .attr("font-weight", (c) => (c === "All" ? 600 : 400)).style("cursor", (c) => (c === "All" ? null : "pointer"))
    .text((c) => c).on("click", (ev, c) => c !== "All" && set({ tool: +c.slice(1) }));
  g.select(".heads").selectAll("line").data([0]).join("line")
    .attr("x1", xb("All") - 2).attr("x2", xb("All") - 2).attr("y1", -18).attr("y2", ih).attr("stroke", "#d6d5d0");

  // group titles + thin separator line between the groups
  const gt = g.select(".groups").selectAll("g").data(groupY, (d) => d.src).join((e) => {
    const s = e.append("g");
    s.append("line"); s.append("text");
    return s;
  });
  gt.attr("transform", (d) => `translate(0,${d.y})`);
  gt.select("line").attr("x1", -M.l).attr("x2", iw).attr("y1", 0).attr("y2", 0)
    .attr("stroke", (d, k) => (k ? "#d6d5d0" : "none"));
  gt.select("text").attr("x", -M.l + 2).attr("y", GROUPH - 7).attr("font-weight", 600)
    .style("fill", (d) => (d.src === "machine" ? INK : GRAY)).text((d) => GROUP_LABEL[d.src]);

  const t = svg.transition().duration(600);
  const rowSel = g.select(".rows").selectAll("g.row").data(order, (r) => r.f).join(
    (enter) => {
      const e = enter.append("g").attr("class", "row").attr("transform", (r) => `translate(0,${yPos.get(r.f)})`)
        .style("cursor", "pointer").on("click", (ev, r) => set({ feature: r.f }));
      e.append("text").attr("class", "rl").attr("x", -8).attr("y", ROWH / 2 + 4).attr("text-anchor", "end");
      e.append("g").attr("class", "cells");
      return e;
    });
  rowSel.transition(t).attr("transform", (r) => `translate(0,${yPos.get(r.f)})`);
  rowSel.select(".rl").text((r) => ctx.meta.features[r.f].label).style("fill", (r) => (r.src === "machine" ? INK : GRAY));
  rowSel.select(".cells").selectAll("rect.cell").data((r) => r.cells.map((c) => ({ ...c, f: r.f, src: r.src }))).join("rect")
    .attr("class", "cell").attr("x", (c) => xb(c.col)).attr("y", 1).attr("width", xb.bandwidth()).attr("height", ROWH - 3).attr("rx", 2)
    .attr("fill", (c) => (Number.isFinite(c.rho) ? color(c.rho) : "#f5f5f3"))
    .attr("opacity", (c) => (c.src === "machine" ? 1 : 0.75)) // reference rows a little lighter
    .attr("stroke", "none")
    // values on demand only: no numbers in the cells, the tooltip gives ρ and n
    .on("mouseenter", function () { d3.select(this).attr("stroke", INK).attr("stroke-width", 1.2); })
    .on("mousemove", (ev, c) => ctx.tip.show(`<b>${ctx.meta.features[c.f].label}</b><br>${c.col === "All" ? "all end mills pooled" : c.col}: `
      + `ρ = ${Number.isFinite(c.rho) ? c.rho.toFixed(2) : "n/a (too few runs)"} (n = ${c.n})<br>`
      + (c.f.startsWith("ax_") ? `<span class="muted">${AXIS_NOTE}</span><br>` : "")
      + `<span class="muted">normalization: ${state.norm}${state.cRange ? `; C ${state.cRange[0].toFixed(0)}–${state.cRange[1].toFixed(0)} min` : ""}. `
      + `Within an end mill VB is mostly interpolated from C, so per-end-mill ρ is optimistic.</span>`, ev))
    .on("mouseleave", function () { d3.select(this).attr("stroke", "none"); ctx.tip.hide(); });

  // colour legend (shares the drawing scale)
  const lw = Math.min(150, iw * 0.5), lg = g.select(".legend").attr("transform", `translate(${iw - lw},${ih + 10})`);
  lg.selectAll("*").remove();
  const gid = "rho-grad";
  const defs = svg.select("defs").empty() ? svg.insert("defs", ":first-child") : svg.select("defs");
  defs.selectAll("*").remove();
  const lin = defs.append("linearGradient").attr("id", gid);
  d3.range(0, 1.01, 0.1).forEach((p) => lin.append("stop").attr("offset", p).attr("stop-color", color(p * 2 - 1)));
  lg.append("rect").attr("width", lw).attr("height", 7).attr("rx", 2).attr("fill", `url(#${gid})`);
  lg.append("g").attr("class", "axis").attr("transform", "translate(0,7)")
    .call(d3.axisBottom(d3.scaleLinear().domain([-1, 1]).range([0, lw])).ticks(5).tickSize(3));
  lg.append("text").attr("x", -6).attr("y", 7).attr("text-anchor", "end").attr("class", "lbl-2").text("Spearman ρ");
  lg.append("text").attr("x", lw).attr("y", 32).attr("text-anchor", "end").attr("class", "note")
    .text(state.showDyn ? "11 more dynamometer features: Feature menu" : "");
  mark();
}

function mark() {
  g.select(".rows").selectAll("g.row").select(".rl").attr("font-weight", (r) => (r.f === state.feature ? 700 : 400));
  g.select(".rows").selectAll("rect.selrow").remove();
  const y0 = layout.yPos.get(state.feature);
  // selected feature: accent outline (the one accent colour = selection / alarm)
  g.select(".rows").selectAll("rect.selrow").data(y0 == null ? [] : [y0]).join("rect").attr("class", "selrow")
    .attr("x", -M.l + 2).attr("y", (d) => d - 1).attr("width", layout.iw + M.l - 2).attr("height", ROWH + 1)
    .attr("fill", "none").attr("stroke", ACCENT).attr("stroke-width", 1.5).attr("rx", 3).attr("pointer-events", "none");
  g.select(".heads").selectAll("text").attr("text-decoration", (c) => (c === `E${state.tool}` ? "underline" : null))
    .style("fill", (c) => (c === `E${state.tool}` ? INK : INK2));
}
