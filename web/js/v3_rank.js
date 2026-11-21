// V3 · Spearman ρ(feature, VB) per tool and pooled; recomputed for normalization, time filter and source toggle.
import { state, set } from "./state.js";
import { normalize, spearman } from "./analysis.js";

let ctx, root, svg, g, layout = {};
const M = { t: 30, r: 8, b: 30, l: 158 }, ROWH = 15;
const color = d3.scaleDiverging().domain([-1, 0, 1]).clamp(true)
  .interpolator(d3.piecewise(d3.interpolateLab, ["#1f5fae", "#e9e8e4", "#c43b3a"]));

export function init(c) { ctx = c; root = d3.select("#v3 .plot"); render(true); }

export function update(keys) {
  if (!keys) return render(true);
  if (keys.has("norm") || keys.has("cRange") || keys.has("showDyn")) render(keys.has("showDyn"));
  else if (keys.has("feature") || keys.has("tool")) mark();
}

function compute() {
  const feats = ctx.feats.filter((f) => state.showDyn || ctx.meta.features[f].source === "machine");
  const sub = ctx.runs.filter(ctx.inRange);
  return feats.map((f) => {
    const y = normalize(ctx.runs, f, state.norm);
    const cells = ctx.tools.map((t) => {
      const rs = sub.filter((r) => r.tool === t);
      return { col: `T${t}`, tool: t, ...spearman(rs.map((r) => y[r.i]), rs.map((r) => r.VB_um)) };
    });
    const pooled = spearman(sub.map((r) => y[r.i]), sub.map((r) => r.VB_um));
    cells.push({ col: "All", tool: null, ...pooled });
    return { f, src: ctx.meta.features[f].source, cells, pooled: pooled.rho, minTool: d3.min(cells.slice(0, 9), (c) => c.rho) };
  });
}

function render(rebuild) {
  const rows = compute();
  // order: machine group first, then by pooled rho (descending) within group
  const order = d3.groups(rows, (r) => r.src).flatMap(([, v]) => v.sort((a, b) => d3.descending(a.pooled, b.pooled)));
  const W = root.node().clientWidth, iw = W - M.l - M.r;
  const cols = [...ctx.tools.map((t) => `T${t}`), "All"];
  const xb = d3.scaleBand().domain(cols).range([0, iw]).paddingInner(0.06);
  const yPos = new Map();
  let yy = 0, lastSrc = null;
  order.forEach((r) => { if (r.src !== lastSrc) { yy += 14; lastSrc = r.src; } yPos.set(r.f, yy); yy += ROWH; });
  const ih = yy;
  if (rebuild || !svg) {
    root.selectAll("*").remove();
    svg = root.append("svg").attr("role", "img").attr("aria-label", "Correlation heatmap of features with wear");
    g = svg.append("g").attr("transform", `translate(${M.l},${M.t})`);
    g.append("g").attr("class", "heads");
    g.append("g").attr("class", "groups");
    g.append("g").attr("class", "rows");
    g.append("g").attr("class", "legend");
  }
  svg.attr("width", W).attr("height", ih + M.t + M.b);
  layout = { xb, yPos, iw };

  g.select(".heads").selectAll("text").data(cols).join("text")
    .attr("x", (c) => xb(c) + xb.bandwidth() / 2).attr("y", -6).attr("text-anchor", "middle")
    .attr("font-weight", (c) => (c === "All" ? 700 : 400)).style("cursor", (c) => (c === "All" ? null : "pointer"))
    .text((c) => c).on("click", (ev, c) => c !== "All" && set({ tool: +c.slice(1) }));
  g.select(".heads").selectAll("line").data([0]).join("line")
    .attr("x1", xb("All") - 2).attr("x2", xb("All") - 2).attr("y1", -16).attr("y2", ih).attr("stroke", "#8a8984");

  const firstOf = d3.rollups(order, (v) => v[0].f, (r) => r.src);
  g.select(".groups").selectAll("text").data(firstOf).join("text")
    .attr("x", -M.l + 2).attr("y", ([, f]) => yPos.get(f) - 4).attr("font-weight", 600).attr("class", "lbl-2")
    .text(([src]) => (src === "machine" ? "Machine control signals — available in production"
      : "Dynamometer — reference only (not in production)"));

  const t = svg.transition().duration(600);
  const rowSel = g.select(".rows").selectAll("g.row").data(order, (r) => r.f).join(
    (enter) => {
      const e = enter.append("g").attr("class", "row").attr("transform", (r) => `translate(0,${yPos.get(r.f)})`)
        .style("cursor", "pointer").on("click", (ev, r) => set({ feature: r.f }));
      e.append("text").attr("class", "rl").attr("x", -6).attr("y", ROWH / 2 + 3).attr("text-anchor", "end");
      e.append("g").attr("class", "cells");
      return e;
    });
  rowSel.transition(t).attr("transform", (r) => `translate(0,${yPos.get(r.f)})`);
  rowSel.select(".rl").text((r) => ctx.meta.features[r.f].label.slice(0, 30))
    .attr("fill", (r) => (r.src === "machine" ? "#0b0b0b" : "#52514e"));
  rowSel.select(".cells").selectAll("g.cell").data((r) => r.cells.map((c) => ({ ...c, f: r.f }))).join((e) => {
    const c = e.append("g").attr("class", "cell");
    c.append("rect"); c.append("text");
    return c;
  }).each(function (c) {
    const s = d3.select(this);
    s.select("rect").attr("x", xb(c.col)).attr("width", xb.bandwidth()).attr("height", ROWH - 2).attr("rx", 2)
      .attr("fill", Number.isFinite(c.rho) ? color(c.rho) : "#f5f5f3");
    s.select("text").attr("x", xb(c.col) + xb.bandwidth() / 2).attr("y", ROWH / 2 + 3).attr("text-anchor", "middle")
      .attr("font-size", 9).attr("fill", Number.isFinite(c.rho) && Math.abs(c.rho) > 0.6 ? "#fff" : "#0b0b0b")
      .text(Number.isFinite(c.rho) ? c.rho.toFixed(2).replace("0.", ".") : "–");
  }).on("mousemove", (ev, c) => ctx.tip.show(`<b>${ctx.meta.features[c.f].label}</b><br>${c.col === "All" ? "all tools pooled" : c.col}: `
      + `ρ = ${Number.isFinite(c.rho) ? c.rho.toFixed(3) : "n/a (too few runs)"} (n = ${c.n})<br>`
      + `<span class="muted">normalization: ${state.norm}${state.cRange ? `; C ${state.cRange[0].toFixed(0)}–${state.cRange[1].toFixed(0)} min` : ""}. `
      + `Within a tool VB is mostly interpolated from C, so per-tool ρ is optimistic.</span>`, ev))
    .on("mouseleave", () => ctx.tip.hide());

  // colour legend
  const lw = Math.min(160, iw * 0.5), lg = g.select(".legend").attr("transform", `translate(${iw - lw},${ih + 10})`);
  lg.selectAll("*").remove();
  const gid = "rho-grad";
  const grad = svg.select("defs").empty() ? svg.insert("defs", ":first-child") : svg.select("defs");
  grad.selectAll("*").remove();
  const lin = grad.append("linearGradient").attr("id", gid);
  d3.range(0, 1.01, 0.1).forEach((p) => lin.append("stop").attr("offset", p).attr("stop-color", color(p * 2 - 1)));
  lg.append("rect").attr("width", lw).attr("height", 8).attr("fill", `url(#${gid})`);
  lg.append("g").attr("class", "axis").attr("transform", "translate(0,8)")
    .call(d3.axisBottom(d3.scaleLinear().domain([-1, 1]).range([0, lw])).ticks(5).tickSize(3));
  lg.append("text").attr("x", -6).attr("y", 8).attr("text-anchor", "end").attr("class", "lbl-2").text("Spearman ρ");
  mark();
}

function mark() {
  g.select(".rows").selectAll("g.row").select(".rl").attr("font-weight", (r) => (r.f === state.feature ? 700 : 400));
  g.select(".rows").selectAll("rect.selrow").remove();
  const y0 = layout.yPos.get(state.feature);
  g.select(".rows").selectAll("rect.selrow").data(y0 == null ? [] : [y0]).join("rect").attr("class", "selrow")
    .attr("x", -M.l + 2).attr("y", (d) => d - 1).attr("width", layout.iw + M.l - 2).attr("height", ROWH)
    .attr("fill", "none").attr("stroke", "#0b0b0b").attr("stroke-width", 1.5).attr("rx", 3).attr("pointer-events", "none");
  g.select(".heads").selectAll("text").attr("text-decoration", (c) => (c === `T${state.tool}` ? "underline" : null));
}
