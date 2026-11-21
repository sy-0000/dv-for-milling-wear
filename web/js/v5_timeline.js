// V5 · Run timeline of the selected tool: feature per run, layer bands, layer-level flags (jump / rise), VB strip.
import { state, set } from "./state.js";
import { normLabel } from "./analysis.js";

let ctx, root;
const M = { t: 26, r: 10, b: 30, l: 48 }, H = 250, VBH = 46;

export function init(c) {
  ctx = c;
  root = d3.select("#v5 .plot");
  const sel = d3.select("#v5-tool");
  sel.selectAll("option").data(ctx.tools).join("option").attr("value", (t) => t)
    .text((t) => `T${t} (M${ctx.runs.find((r) => r.tool === t).machine})`);
  sel.on("change", function () { set({ tool: +this.value, runIdx: null }); });
  render();
}

export function update(keys) {
  if (!keys || ["tool", "feature", "norm", "jumpThr", "riseThr", "showDyn"].some((k) => keys.has(k))) return render();
  if (keys.has("brushed") || keys.has("runIdx") || keys.has("cRange")) render();
}

function render() {
  d3.select("#v5-tool").property("value", state.tool);
  root.selectAll("*").remove();
  const rs = ctx.runs.filter((r) => r.tool === state.tool), f = state.feature, info = ctx.meta.features[f];
  const yv = ctx.y;
  const W = root.node().clientWidth, iw = W - M.l - M.r, ih = H - M.t - M.b - VBH - 8;
  const x = d3.scaleLinear().domain([rs[0].run - 0.5, rs[rs.length - 1].run + 0.5]).range([0, iw]);
  const y = d3.scaleLinear().domain(d3.extent(rs, (r) => yv[r.i])).nice().range([ih, 0]);
  const yb = d3.scaleLinear().domain([0, 165]).range([VBH, 0]);
  const svg = root.append("svg").attr("width", W).attr("height", H).attr("role", "img")
    .attr("aria-label", `Run timeline of tool ${state.tool}`);
  const g = svg.append("g").attr("transform", `translate(${M.l},${M.t})`);
  const layers = ctx.layers.filter((l) => l.tool === state.tool);
  const runOf = (i) => ctx.runs[i].run;

  // layer bands + flags
  layers.forEach((l, k) => {
    const x0 = x(runOf(l.i0) - 0.5), x1 = x(runOf(l.i1) + 0.5);
    if (k % 2) g.append("rect").attr("x", x0).attr("width", x1 - x0).attr("y", 0).attr("height", ih + 8 + VBH).attr("fill", "#f1f0ec");
    const flags = [];
    if (l.jumpPeak && Math.abs(l.jump) >= state.jumpThr) flags.push("J");
    if (Math.abs(l.rise) >= state.riseThr) flags.push("R");
    if (flags.length) {
      g.append("rect").attr("x", x0).attr("width", x1 - x0).attr("y", -18).attr("height", 14).attr("rx", 3).attr("fill", "#6250d6");
      g.append("text").attr("x", (x0 + x1) / 2).attr("y", -8).attr("text-anchor", "middle").attr("fill", "#fff").attr("font-size", 9)
        .text(flags.join(""));
    }
    g.append("rect").attr("x", x0).attr("width", x1 - x0).attr("y", -18).attr("height", ih + 26 + VBH).attr("fill", "transparent")
      .on("mousemove", (ev) => ctx.tip.show(`<b>layer ${l.layer}</b> (runs ${runOf(l.i0)}–${runOf(l.i1)})<br>`
        + `median ${info.label}: ${ctx.fmt(l.median)} ${info.unit}<br>jump vs neighbours: ${Number.isFinite(l.jump) ? l.jump.toFixed(1) : "–"} %<br>`
        + `rise within layer: ${Number.isFinite(l.rise) ? l.rise.toFixed(1) : "–"} %<br><span class="muted">computed on the raw feature</span>`, ev))
      .on("mouseleave", () => ctx.tip.hide());
  });
  g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(5));
  g.append("text").attr("class", "lbl-2 halo").attr("x", 4).attr("y", 10)
    .text(`${info.label} [${normLabel(state.norm, info.unit)}]`);
  const c = ctx.color(rs[0].machine);
  g.append("path").datum(rs).attr("fill", "none").attr("stroke", c).attr("stroke-width", 1).attr("opacity", 0.6)
    .attr("d", d3.line().x((r) => x(r.run)).y((r) => y(yv[r.i])));
  g.append("g").selectAll("circle").data(rs).join("circle").attr("cx", (r) => x(r.run)).attr("cy", (r) => y(yv[r.i]))
    .attr("r", (r) => (state.brushed?.has(r.i) ? 3 : 2)).attr("fill", (r) => (state.brushed?.has(r.i) ? "#0b0b0b" : c))
    .attr("opacity", (r) => (ctx.inRange(r) ? 1 : 0.2)).style("cursor", "pointer")
    .on("mousemove", (ev, r) => ctx.tip.show(`<b>run ${r.run}</b> · layer ${r.layer} · x = ${r.x_pass} mm<br>`
      + `C = ${r.C_min.toFixed(1)} min · VB = ${r.VB_um} µm<br>${info.label}: ${ctx.fmt(r[f])} ${info.unit}`, ev))
    .on("mouseleave", () => ctx.tip.hide())
    .on("click", (ev, r) => set({ runIdx: r.i }));

  // VB strip (separate scale, no dual axis)
  const gb = g.append("g").attr("transform", `translate(0,${ih + 8})`);
  gb.append("g").attr("class", "axis").call(d3.axisLeft(yb).tickValues([0, 150]).tickSize(3));
  gb.append("path").datum(rs).attr("fill", "none").attr("stroke", "#52514e").attr("stroke-width", 1.5)
    .attr("d", d3.line().x((r) => x(r.run)).y((r) => yb(r.VB_um)));
  gb.append("line").attr("x1", 0).attr("x2", iw).attr("y1", yb(state.vbThr)).attr("y2", yb(state.vbThr))
    .attr("stroke", "#0b0b0b").attr("stroke-dasharray", "3 3");
  gb.append("text").attr("class", "lbl-2 halo").attr("x", 30).attr("y", 9).text("VB [µm] (interpolated between measurements)");
  gb.append("g").attr("class", "axis").attr("transform", `translate(0,${VBH})`).call(d3.axisBottom(x).ticks(8));
  gb.append("text").attr("class", "lbl-2").attr("x", iw).attr("y", VBH + 26).attr("text-anchor", "end").text("run");

  if (state.runIdx != null && ctx.runs[state.runIdx].tool === state.tool) {
    const r = ctx.runs[state.runIdx];
    g.append("line").attr("x1", x(r.run)).attr("x2", x(r.run)).attr("y1", -2).attr("y2", ih + 8 + VBH)
      .attr("stroke", "#0b0b0b").attr("stroke-width", 1.5).attr("pointer-events", "none");
  }
  if (state.pinIdx != null && ctx.runs[state.pinIdx].tool === state.tool) {
    const r = ctx.runs[state.pinIdx];
    g.append("line").attr("x1", x(r.run)).attr("x2", x(r.run)).attr("y1", -2).attr("y2", ih + 8 + VBH)
      .attr("stroke", "#8a8984").attr("stroke-width", 1.5).attr("stroke-dasharray", "4 2").attr("pointer-events", "none");
  }
}
