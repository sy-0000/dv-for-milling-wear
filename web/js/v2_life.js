// V2 · Replacement rules vs the VB threshold.
//  fixed time (one for all machines / one per machine): bar = contact time until VB >= threshold, dashed line = replacement time
//  signal alarm: alarm time from the selected feature (trailing median >= level for `persist` runs); level calibrated
//                on the other machines (out-of-machine test), on the own machine (in-sample) or set manually.
import { state, set } from "./state.js";
import { lifeTable, fixTimes, fixedStats, alarmStats, signalAlarms } from "./analysis.js";

let ctx, root;
const M = { t: 18, r: 96, b: 34, l: 46 }, ROW = 17;
const gap = () => (state.fix.mode === "fleet" ? 10 : 20);

export function init(c) {
  ctx = c;
  root = d3.select("#v2 .plot");
  d3.selectAll("#v2-mode button").on("click", function () { set({ fix: { ...state.fix, mode: this.dataset.mode } }); });
  d3.selectAll("input[name=cal]").on("change", function () { set({ alarm: { ...state.alarm, cal: this.value } }); });
  d3.select("#v2-level").on("change", function () { set({ alarm: { ...state.alarm, level: +this.value } }); });
  d3.select("#v2-persist").on("change", function () { set({ alarm: { ...state.alarm, persist: Math.max(1, +this.value) } }); });
  render();
}

export function update(keys) {
  if (!keys || ["vbThr", "fix", "tool", "alarm", "feature", "norm"].some((k) => keys.has(k))) render();
}

function syncControls() {
  d3.selectAll("#v2-mode button").classed("on", function () { return this.dataset.mode === state.fix.mode; });
  const sig = state.fix.mode === "signal";
  d3.select("#v2-signal-ctl").attr("hidden", sig ? null : true);
  d3.select("#v2-fixed-hint").attr("hidden", sig ? true : null);
  d3.selectAll("input[name=cal]").property("checked", function () { return this.value === state.alarm.cal; });
  d3.select("#v2-level").property("value", state.alarm.level);
  d3.select("#v2-persist").property("value", state.alarm.persist);
}

function frame() {
  root.selectAll("*").remove();
  const W = root.node().clientWidth, iw = W - M.l - M.r;
  const rowY = (k) => k * ROW + Math.floor(k / 3) * gap();
  const ih = rowY(8) + ROW;
  const x = d3.scaleLinear().domain([0, 90]).range([0, iw]);
  const svg = root.append("svg").attr("width", W).attr("height", ih + M.t + M.b)
    .attr("role", "img").attr("aria-label", "Replacement rules compared with the time each end mill reaches the VB threshold");
  svg.append("defs").append("pattern").attr("id", "hatch").attr("width", 5).attr("height", 5).attr("patternUnits", "userSpaceOnUse")
    .attr("patternTransform", "rotate(45)").append("line").attr("y2", 5).attr("stroke", "#52514e").attr("stroke-width", 1.4);
  const g = svg.append("g").attr("transform", `translate(${M.l},${M.t})`);
  g.append("g").attr("class", "grid").attr("transform", `translate(0,${ih})`).call(d3.axisBottom(x).ticks(6).tickSize(-ih).tickFormat(""));
  g.append("g").attr("class", "axis").attr("transform", `translate(0,${ih})`).call(d3.axisBottom(x).ticks(6));
  // axis title below the tick labels (fix: it used to overlap them); the bar legend is in the hint above
  g.append("text").attr("class", "lbl-2").attr("x", iw).attr("y", ih + 31).attr("text-anchor", "end")
    .text("contact time C [min]");
  return { g, x, rowY, ih };
}

function rowFrame(g, k, rowY, d) {
  const row = g.append("g").attr("transform", `translate(0,${rowY(k)})`).style("cursor", "pointer").on("click", () => set({ tool: d.tool }));
  row.append("text").attr("x", -6).attr("y", (ROW - 4) / 2 + 4).attr("text-anchor", "end")
    .attr("font-weight", d.tool === state.tool ? 700 : 400).text(`E${d.tool} M${d.machine}`);
  return row;
}

function render() {
  syncControls();
  renderScore();
  if (state.fix.mode === "signal") return renderSignal();
  const life = lifeTable(ctx.runs, ctx.tools, state.vbThr);
  const tfOf = fixTimes(life, state.fix.mode, state.fix);
  const { g, x, rowY, ih } = frame();
  let unusedSum = 0, unusedN = 0, overrun = 0;
  const errsF = [];
  life.forEach((d, k) => {
    const h = ROW - 4, c = ctx.color(d.machine), tf = tfOf(d.tool);
    if (d.reached) errsF.push(tf - d.C);
    const row = rowFrame(g, k, rowY, d);
    row.append("rect").attr("width", x(d.C)).attr("height", h).attr("rx", 2).attr("fill", c).attr("opacity", 0.28);
    row.append("rect").attr("width", x(Math.min(tf, d.C))).attr("height", h).attr("rx", 2).attr("fill", c);
    let label;
    if (!d.reached) {
      row.append("rect").attr("x", x(d.C) - 1).attr("width", 2).attr("height", h).attr("fill", "#0b0b0b");
      label = `not reached (max VB ${d.VBmax} µm)`;
    } else if (tf < d.C - 0.05) {
      const pct = ((d.C - tf) / d.C) * 100;
      unusedSum += pct; unusedN++;
      label = `unused ${pct.toFixed(0)} %`;
    } else if (tf <= d.C + 0.05) {
      label = "replaced at threshold"; unusedN++;
    } else {
      row.append("rect").attr("x", x(d.C)).attr("width", x(tf) - x(d.C)).attr("height", h).attr("fill", "url(#hatch)");
      overrun++; unusedN++;
      label = `⚠ ${(tf - d.C).toFixed(1)} min overrun`;
    }
    row.append("text").attr("x", x(Math.max(d.C, tf)) + 4).attr("y", h / 2 + 4).attr("class", "lbl-2").text(label);
    row.on("mousemove", (ev) => ctx.tip.show(`<b>E${d.tool}</b> (M${d.machine}, tool batch ${ctx.meta.machines[d.machine].batch})<br>`
      + (d.reached ? `reaches VB ${state.vbThr} µm at C = ${d.C.toFixed(1)} min` : `never reaches ${state.vbThr} µm (max ${d.VBmax} µm)`)
      + `<br>replacement at ${tf.toFixed(1)} min → ${label}`, ev)).on("mouseleave", () => ctx.tip.hide());
  });
  if (state.fix.mode === "machineLoo") { // one tick per end mill, not draggable
    life.forEach((d, k) => g.append("line").attr("x1", x(tfOf(d.tool))).attr("x2", x(tfOf(d.tool)))
      .attr("y1", rowY(k) - 3).attr("y2", rowY(k) + ROW - 1).attr("stroke", "#0b0b0b").attr("stroke-width", 2).attr("stroke-dasharray", "3 2"));
  }
  const groups = state.fix.mode === "machineLoo" ? [] : state.fix.mode === "fleet" ? [{ key: "fleet", y0: -6, y1: ih, t: tfOf(1) }]
    : [1, 2, 3].map((m) => ({ key: m, y0: rowY((m - 1) * 3) - 8, y1: rowY((m - 1) * 3 + 2) + ROW, t: tfOf(ctx.meta.machines[m].tools[0]) }));
  const drag = d3.drag().on("drag", (ev, d) => {
    const t = Math.max(1, Math.min(90, x.invert(ev.x)));
    const fix = structuredClone(state.fix);
    if (d.key === "fleet") fix.fleet = t; else fix.m[d.key] = t;
    set({ fix });
  });
  const lines = g.selectAll(".fixline").data(groups).join("g").attr("class", "fixline").style("cursor", "ew-resize").call(drag);
  lines.append("line").attr("x1", (d) => x(d.t)).attr("x2", (d) => x(d.t)).attr("y1", (d) => d.y0 - 6).attr("y2", (d) => d.y1)
    .attr("stroke", "#0b0b0b").attr("stroke-width", 2).attr("stroke-dasharray", "5 3");
  lines.append("rect").attr("x", (d) => x(d.t) - 6).attr("width", 12).attr("y", (d) => d.y0 - 6).attr("height", (d) => d.y1 - d.y0 + 6)
    .attr("fill", "transparent");
  lines.append("text").attr("class", "halo").attr("x", (d) => x(d.t) + 4).attr("y", (d) => d.y0 - 4).attr("font-weight", 600)
    .text((d) => `${d.t.toFixed(1)} min`);
  const mode = state.fix.mode === "fleet" ? "Fixed time for all machines" : state.fix.mode === "machine"
    ? "Fixed time per machine (in-sample)" : "Fixed time per machine, leave-one-out";
  const maeF = errsF.length ? d3.mean(errsF, Math.abs) : NaN;
  d3.select("#v2-summary").html(`<b>${mode}:</b> mean |error| ${Number.isFinite(maeF) ? maeF.toFixed(1) : "–"} min · `
    + `mean unused life ${unusedN ? (unusedSum / unusedN).toFixed(1) : "–"} % · ${overrun} overrun(s), 0 missed`
    + ` <span class="muted">(end mills that reach the threshold; error = replacement time − time VB reaches ${state.vbThr} µm)</span>`
    + ` <span class="muted">M2 end mills = tool batch B: machine and batch effects are confounded.</span>`);
}

function renderSignal() {
  const A = ctx.alarms, info = ctx.meta.features[state.feature];
  const { g, x, rowY } = frame();
  let early = 0, late = 0, miss = 0, errs = [];
  A.forEach((d, k) => {
    const h = ROW - 4, c = ctx.color(d.machine);
    const row = rowFrame(g, k, rowY, d);
    const end = d.reached ? d.Cthr : d.Cmax;
    row.append("rect").attr("width", x(end)).attr("height", h).attr("rx", 2).attr("fill", c).attr("opacity", 0.28);
    let label;
    if (!d.reached) label = `threshold not reached (max VB ${ctx.meta.tool_max_vb[d.tool]} µm)`;
    if (d.alarm) {
      const used = Math.min(d.Calarm, end);
      row.append("rect").attr("width", x(used)).attr("height", h).attr("rx", 2).attr("fill", c);
      if (d.reached && d.Calarm > d.Cthr) row.append("rect").attr("x", x(d.Cthr)).attr("width", x(d.Calarm) - x(d.Cthr))
        .attr("height", h).attr("fill", "url(#hatch)");
      row.append("path").attr("d", d3.symbol(d3.symbolTriangle, 36)()).attr("transform", `translate(${x(d.Calarm)},${-1}) rotate(180)`)
        .attr("fill", "#0b0b0b");
      if (d.reached) {
        errs.push(d.err);
        if (d.err < 0) { early++; label = `${(-d.err).toFixed(1)} min early · VB ${d.VBalarm}`; }
        else { late++; label = `⚠ ${d.err.toFixed(1)} min late`; }
      }
    } else if (d.reached) { miss++; label = "⚠ no alarm"; }
    row.append("text").attr("x", x(Math.max(end, d.Calarm ?? 0)) + 4).attr("y", h / 2 + 4).attr("class", "lbl-2").text(label);
    row.on("mousemove", (ev) => ctx.tip.show(`<b>E${d.tool}</b> (M${d.machine})<br>alarm level ${ctx.fmt(d.level)} `
      + `(${{ other: "other machines", loo: "same machine, other end mills", insample: "same machine, in-sample", manual: "manual" }[state.alarm.cal]})<br>`
      + (d.alarm ? `alarm at C = ${d.Calarm.toFixed(1)} min, VB = ${d.VBalarm} µm` : "no alarm")
      + (d.reached ? `<br>VB ≥ ${state.vbThr} µm at C = ${d.Cthr.toFixed(1)} min` : ""), ev)).on("mouseleave", () => ctx.tip.hide());
  });
  const mae = errs.length ? d3.mean(errs, Math.abs) : NaN;
  const cal = state.alarm.cal === "other" ? "level calibrated on the other two machines (out-of-machine test)"
    : state.alarm.cal === "loo" ? "level calibrated on the other end mills of the same machine (leave-one-out)"
    : state.alarm.cal === "insample" ? "level calibrated on the same machine incl. the tested end mill (in-sample, optimistic)"
    : `manual level ${state.alarm.level}`;
  d3.select("#v2-summary").html(`<b>Signal alarm</b> on ${info.label} [${state.norm}], ${cal}, persistence ${state.alarm.persist} run(s): `
    + `mean |error| ${Number.isFinite(mae) ? mae.toFixed(1) : "–"} min · ${early} early · ${late} late · <b>${miss} missed</b>. `
    + `<span class="muted">▼ = alarm. Error = alarm time − time VB reaches ${state.vbThr} µm (early < 0 ≤ late); `
    + `mean |error| over the end mills that alarm, missed alarms counted separately. Light bar = life until the threshold.</span>`
    + (ctx.meta.features[state.feature].source === "dynamometer" ? " <b>Dynamometer features are not available in production.</b>" : ""));
}

// ---------- scoreboard: every rule under the same test, so the signal alarm is always compared with the baseline ----------
const RULES = [
  { key: "fleet", label: "Fixed · all machines", sub: "status quo", fix: "fleet" },
  { key: "machineLoo", label: "Fixed · per machine", sub: "leave-one-out · baseline", fix: "machineLoo" },
  { key: "sig-other", label: "Signal · other machines", sub: "level from 2 other machines", fix: "signal", cal: "other" },
  { key: "sig-loo", label: "Signal · same machine", sub: "leave-one-out", fix: "signal", cal: "loo" },
];

function renderScore() {
  const box = d3.select("#v2-score");
  box.selectAll("*").remove();
  const life = lifeTable(ctx.runs, ctx.tools, state.vbThr), a = state.alarm;
  const rows = RULES.map((r) => ({ ...r, ...(r.fix === "signal"
    ? alarmStats(signalAlarms(ctx.runs, ctx.tools, ctx.trail, state.vbThr, r.cal, a.level, a.persist))
    : fixedStats(life, fixTimes(life, r.fix, state.fix))) }));
  const cur = (r) => r.fix === state.fix.mode && (r.fix !== "signal" || r.cal === a.cal);
  const base = rows.find((r) => r.key === "machineLoo");
  const info = ctx.meta.features[state.feature];
  box.append("p").attr("class", "hint").html(`Same test for every rule: mean |replacement − time VB reaches ${state.vbThr} µm|, `
    + `missed alarms counted separately. Signal = <b>${info.label}</b> [${state.norm}], persistence ${a.persist}. Click a rule to show it below.`);
  const RH = 19, L = { l: 150, r: 150, t: 14, b: 26 };
  const W = box.node().clientWidth, iw = Math.max(60, W - L.l - L.r), ih = rows.length * RH;
  const x = d3.scaleLinear().domain([0, d3.max(rows, (r) => (Number.isFinite(r.mae) ? r.mae : 0)) || 1]).nice().range([0, iw]);
  const svg = box.append("svg").attr("width", W).attr("height", ih + L.t + L.b)
    .attr("role", "img").attr("aria-label", "Mean error of each replacement rule");
  const g = svg.append("g").attr("transform", `translate(${L.l},${L.t})`);
  g.append("g").attr("class", "grid").attr("transform", `translate(0,${ih})`).call(d3.axisBottom(x).ticks(4).tickSize(-ih).tickFormat(""));
  g.append("g").attr("class", "axis").attr("transform", `translate(0,${ih})`).call(d3.axisBottom(x).ticks(4).tickSize(3));
  g.append("text").attr("class", "lbl-2").attr("x", iw).attr("y", ih + 24).attr("text-anchor", "end").text("mean |error| [min]");
  const row = g.selectAll("g.srow").data(rows).join("g").attr("class", "srow").attr("transform", (r, k) => `translate(0,${k * RH})`)
    .style("cursor", "pointer")
    .on("click", (ev, r) => set(r.fix === "signal" ? { fix: { ...state.fix, mode: "signal" }, alarm: { ...state.alarm, cal: r.cal } }
      : { fix: { ...state.fix, mode: r.fix } }));
  row.append("rect").attr("x", -L.l).attr("width", W).attr("height", RH).attr("fill", (r) => (cur(r) ? "#f1f0ec" : "transparent"));
  row.append("text").attr("x", -6).attr("y", RH / 2 + 4).attr("text-anchor", "end").attr("font-weight", (r) => (cur(r) ? 700 : 400))
    .text((r) => r.label).append("title").text((r) => r.sub);
  // length encodes the error: bars start at 0 (neutral gray, colour stays reserved for machines)
  row.append("rect").attr("y", 4).attr("height", RH - 8).attr("rx", 2)
    .attr("width", (r) => (Number.isFinite(r.mae) ? x(r.mae) : 0)).attr("fill", (r) => (cur(r) ? "#0b0b0b" : "#8a8984"));
  row.append("text").attr("class", "lbl-2").attr("x", (r) => (Number.isFinite(r.mae) ? x(r.mae) : 0) + 4).attr("y", RH / 2 + 4)
    .html((r) => `${Number.isFinite(r.mae) ? r.mae.toFixed(1) : "–"} min · ${r.late} late`
      + (r.missed ? ` · <tspan font-weight="700" fill="#0b0b0b">${r.missed} missed</tspan>` : ""));
  if (Number.isFinite(base.mae)) {
    g.append("line").attr("x1", x(base.mae)).attr("x2", x(base.mae)).attr("y1", -2).attr("y2", ih)
      .attr("stroke", "#0b0b0b").attr("stroke-dasharray", "2 2").attr("pointer-events", "none");
    g.append("text").attr("class", "lbl-2").attr("x", x(base.mae)).attr("y", -4).attr("text-anchor", "middle").text("baseline");
  }
}
