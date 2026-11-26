// V5 · Run timeline of the selected tool: feature per run, layer bands, layer-level flags (jump / rise), VB strip.
import { tr } from "./i18n.js";
import { state, set, ACCENT, INK, INK2, GRAY, BAND } from "./state.js";
import { normLabel, isFlagged } from "./analysis.js";

let ctx, root;
const M = { t: 40, r: 10, b: 30, l: 48 }, H = 290, VBH = 46, GAP = 20; // GAP between feature plot and VB strip

export function init(c) {
  ctx = c;
  root = d3.select("#v5 .plot");
  const sel = d3.select("#v5-tool");
  sel.selectAll("option").data(ctx.tools).join("option").attr("value", (t) => t)
    .text((t) => `E${t} (M${ctx.runs.find((r) => r.tool === t).machine})`);
  sel.on("change", function () { set({ tool: +this.value, runIdx: null }); });
  render();
}

export function update(keys) {
  if (!keys || ["tool", "feature", "norm", "jumpThr", "riseThr", "showDyn", "fix", "alarm", "vbThr"].some((k) => keys.has(k))) return render();
  if (keys.has("brushed") || keys.has("runIdx") || keys.has("cRange")) render();
}

function render() {
  d3.select("#v5-tool").property("value", state.tool);
  root.selectAll("*").remove();
  const rs = ctx.runs.filter((r) => r.tool === state.tool), f = state.feature, info = ctx.meta.features[f];
  const yv = ctx.y;
  const W = root.node().clientWidth, iw = W - M.l - M.r, ih = H - M.t - M.b - VBH - GAP;
  const x = d3.scaleLinear().domain([rs[0].run - 0.5, rs[rs.length - 1].run + 0.5]).range([0, iw]);
  const y = d3.scaleLinear().domain(d3.extent(rs, (r) => yv[r.i])).nice().range([ih, 0]);
  const yb = d3.scaleLinear().domain([0, 165]).range([VBH, 0]);
  const svg = root.append("svg").attr("width", W).attr("height", H).attr("role", "img")
    .attr("aria-label", tr(`Run timeline of end mill ${state.tool}`, `刀具 E${state.tool} 的 run 時序`));
  const g = svg.append("g").attr("transform", `translate(${M.l},${M.t})`);
  const layers = ctx.layers.filter((l) => l.tool === state.tool);
  const isFlag = (l) => isFlagged(l, state.jumpThr, state.riseThr);
  d3.select("#v5-count").text(tr(`Flagged layers: ${ctx.layers.filter(isFlag).length} of ${ctx.layers.length} (all end mills), `
    + `${layers.filter(isFlag).length} in E${state.tool}.`, `被標記的層：${ctx.layers.length} 層中 ${ctx.layers.filter(isFlag).length} 層（全部刀），E${state.tool} 有 ${layers.filter(isFlag).length} 層。`));
  const runOf = (i) => ctx.runs[i].run;

  // layer bands + flags
  layers.forEach((l, k) => {
    const x0 = x(runOf(l.i0) - 0.5), x1 = x(runOf(l.i1) + 0.5);
    // background recedes: a very faint band on every other layer + a fine tick at each layer boundary (instead of strong stripes)
    if (k % 2) g.append("rect").attr("x", x0).attr("width", x1 - x0).attr("y", 0).attr("height", ih + GAP + VBH).attr("fill", BAND).attr("opacity", 0.7);
    if (k) g.append("line").attr("x1", x0).attr("x2", x0).attr("y1", ih - 4).attr("y2", ih).attr("stroke", "#c9c8c3");
    const flags = [];
    if (l.jumpPeak && Math.abs(l.jump) >= state.jumpThr) flags.push("J");
    if (Math.abs(l.rise) >= state.riseThr) flags.push("R");
    if (flags.length) {
      // flagged layer = suspicious change: the single accent colour
      g.append("rect").attr("x", x0).attr("width", x1 - x0).attr("y", -17).attr("height", 13).attr("rx", 3).attr("fill", ACCENT);
      g.append("text").attr("x", (x0 + x1) / 2).attr("y", -7).attr("text-anchor", "middle").style("fill", "#fff").attr("font-size", 10).attr("font-weight", 600)
        .text(flags.join(""));
    }
    g.append("rect").attr("x", x0).attr("width", x1 - x0).attr("y", -18).attr("height", ih + 18 + GAP + VBH).attr("fill", "transparent")
      .on("mousemove", (ev) => ctx.tip.show(`<b>${tr("layer", "第")} ${l.layer}${tr("", " 層")}</b> (runs ${runOf(l.i0)}–${runOf(l.i1)})<br>`
        + `${tr("median", "中位數")} ${info.label}: ${ctx.fmt(l.median)} ${info.unit}<br>${tr("jump vs neighbours", "和相鄰層比的跳升")}: ${Number.isFinite(l.jump) ? l.jump.toFixed(1) : "–"} %<br>`
        + `${tr("rise within layer", "層內上升")}: ${Number.isFinite(l.rise) ? l.rise.toFixed(1) : "–"} %<br><span class="muted">${tr("computed on the raw feature", "用原始特徵計算")}</span>`, ev))
      .on("mouseleave", () => ctx.tip.hide());
  });
  g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(5));
  // axis title above the flag row, outside the data area (it used to sit on top of the flags and the line)
  g.append("text").attr("class", "lbl-2").attr("x", -M.l + 2).attr("y", -26)
    .text(`↑ ${info.label} [${normLabel(state.norm, info.unit)}]`);
  const c = ctx.color(rs[0].machine);
  g.append("path").datum(rs).attr("fill", "none").attr("stroke", c).attr("stroke-width", 1).attr("opacity", 0.6)
    .attr("d", d3.line().x((r) => x(r.run)).y((r) => y(yv[r.i])));
  g.append("g").selectAll("circle").data(rs).join("circle").attr("cx", (r) => x(r.run)).attr("cy", (r) => y(yv[r.i]))
    .attr("r", (r) => (state.brushed?.has(r.i) ? 3 : 2)).attr("fill", (r) => (state.brushed?.has(r.i) ? ACCENT : c))
    .attr("opacity", (r) => (ctx.inRange(r) ? 1 : 0.2)).style("cursor", "pointer")
    .on("mousemove", (ev, r) => ctx.tip.show(`<b>run ${r.run}</b> · ${tr("layer", "層")} ${r.layer} · x = ${r.x_pass} mm<br>`
      + `C = ${r.C_min.toFixed(1)} min · VB = ${r.VB_um} µm<br>${info.label}: ${ctx.fmt(r[f])} ${info.unit}`, ev))
    .on("mouseleave", () => ctx.tip.hide())
    .on("click", (ev, r) => set({ runIdx: r.i }));

  // VB strip (separate scale, no dual axis)
  const gb = g.append("g").attr("transform", `translate(0,${ih + GAP})`);
  gb.append("g").attr("class", "axis").call(d3.axisLeft(yb).tickValues([0, 150]).tickSize(3));
  gb.append("path").datum(rs).attr("fill", "none").attr("stroke", INK2).attr("stroke-width", 1.5)
    .attr("d", d3.line().x((r) => x(r.run)).y((r) => yb(r.VB_um)));
  gb.append("line").attr("x1", 0).attr("x2", iw).attr("y1", yb(state.vbThr)).attr("y2", yb(state.vbThr))
    .attr("stroke", GRAY).attr("stroke-dasharray", "3 3");
  gb.append("text").attr("class", "lbl-2").attr("x", 0).attr("y", -5).text(tr("↑ VB [µm] (interpolated between measurements)", "↑ VB [µm]（量測之間為內插）"));
  gb.append("g").attr("class", "axis").attr("transform", `translate(0,${VBH})`).call(d3.axisBottom(x).ticks(8));
  gb.append("text").attr("class", "lbl-2").attr("x", iw).attr("y", VBH + 26).attr("text-anchor", "end").text("run");

  if (state.runIdx != null && ctx.runs[state.runIdx].tool === state.tool) {
    const r = ctx.runs[state.runIdx];
    g.append("line").attr("x1", x(r.run)).attr("x2", x(r.run)).attr("y1", -2).attr("y2", ih + GAP + VBH)
      .attr("stroke", ACCENT).attr("stroke-width", 1.5).attr("pointer-events", "none");
  }
  // signal-alarm overlay: trailing median (what an online monitor sees), alarm level, alarm run
  if (state.fix.mode === "signal") {
    const a = ctx.alarms.find((d) => d.tool === state.tool);
    g.append("path").datum(rs).attr("fill", "none").attr("stroke", INK).attr("stroke-width", 1.4)
      .attr("d", d3.line().defined((r) => Number.isFinite(ctx.trail[r.i])).x((r) => x(r.run)).y((r) => y(ctx.trail[r.i])))
      .attr("pointer-events", "none");
    if (Number.isFinite(a.level) && a.level >= y.domain()[0] && a.level <= y.domain()[1]) {
      g.append("line").attr("x1", 0).attr("x2", iw).attr("y1", y(a.level)).attr("y2", y(a.level))
        .attr("stroke", INK2).attr("stroke-dasharray", "6 3").attr("pointer-events", "none");
      g.append("text").attr("class", "halo").attr("x", iw - 4).attr("y", y(a.level) - 4).attr("text-anchor", "end")
        .text(tr(`alarm level ${ctx.fmt(a.level)}`, `警示線 ${ctx.fmt(a.level)}`));
    }
    if (a.alarm) {
      g.append("path").attr("d", d3.symbol(d3.symbolTriangle, 50)()).attr("transform", `translate(${x(a.alarm.run)},${y(ctx.trail[a.alarm.i]) - 10}) rotate(180)`)
        .attr("fill", ACCENT).attr("pointer-events", "none");
      const right = x(a.alarm.run) < iw * 0.6;
      g.append("text").attr("class", "halo").attr("x", x(a.alarm.run) + (right ? 8 : -8)).attr("y", y(ctx.trail[a.alarm.i]) + 4)
        .attr("text-anchor", right ? "start" : "end").attr("font-weight", 600).text(tr(`▼ alarm: run ${a.alarm.run}, VB ${a.alarm.VB_um} µm`, `▼ 警示：run ${a.alarm.run}，VB ${a.alarm.VB_um} µm`));
    }
  }
  if (state.pinIdx != null && ctx.runs[state.pinIdx].tool === state.tool) {
    const r = ctx.runs[state.pinIdx];
    g.append("line").attr("x1", x(r.run)).attr("x2", x(r.run)).attr("y1", -2).attr("y2", ih + GAP + VBH)
      .attr("stroke", GRAY).attr("stroke-width", 1.5).attr("stroke-dasharray", "4 2").attr("pointer-events", "none");
  }
}
