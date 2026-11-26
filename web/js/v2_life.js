// V2 · Replacement rules vs the VB threshold.
//  fixed time (one for all machines / one per machine): bar = contact time until VB >= threshold, dashed line = replacement time
//  signal alarm: alarm time from the selected feature (trailing median >= level for `persist` runs); level calibrated
//                on the other machines (out-of-machine test), on the own machine (in-sample) or set manually.
import { tr } from "./i18n.js";
import { state, set, ACCENT, INK, INK2, GRAY, BAND } from "./state.js";
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
    .attr("patternTransform", "rotate(45)").append("line").attr("y2", 5).attr("stroke", INK2).attr("stroke-width", 1.4);
  const g = svg.append("g").attr("transform", `translate(${M.l},${M.t})`);
  g.append("g").attr("class", "grid").attr("transform", `translate(0,${ih})`).call(d3.axisBottom(x).ticks(6).tickSize(-ih).tickFormat(""));
  g.append("g").attr("class", "axis").attr("transform", `translate(0,${ih})`).call(d3.axisBottom(x).ticks(6));
  // axis title below the tick labels (fix: it used to overlap them); the bar legend is in the hint above
  g.append("text").attr("class", "lbl-2").attr("x", iw).attr("y", ih + 31).attr("text-anchor", "end")
    .text(tr("contact time C [min]", "累計切削時間 C [min]"));
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
      row.append("rect").attr("x", x(d.C) - 1).attr("width", 2).attr("height", h).attr("fill", INK);
      label = tr(`not reached (max VB ${d.VBmax} µm)`, `未達門檻（最大 VB ${d.VBmax} µm）`);
    } else if (tf < d.C - 0.05) {
      const pct = ((d.C - tf) / d.C) * 100;
      unusedSum += pct; unusedN++;
      label = tr(`unused ${pct.toFixed(0)} %`, `浪費 ${pct.toFixed(0)} %`);
    } else if (tf <= d.C + 0.05) {
      label = tr("replaced at threshold", "在門檻時更換"); unusedN++;
    } else {
      row.append("rect").attr("x", x(d.C)).attr("width", x(tf) - x(d.C)).attr("height", h).attr("fill", "url(#hatch)");
      overrun++; unusedN++;
      label = tr(`⚠ ${(tf - d.C).toFixed(1)} min overrun`, `⚠ 超過 ${(tf - d.C).toFixed(1)} min`);
    }
    row.append("text").attr("x", x(Math.max(d.C, tf)) + 4).attr("y", h / 2 + 4).attr("class", "lbl-2").text(label);
    row.on("mousemove", (ev) => ctx.tip.show(`<b>E${d.tool}</b> (M${d.machine}, ${tr("tool batch", "刀具批次")} ${ctx.meta.machines[d.machine].batch})<br>`
      + (d.reached ? tr(`reaches VB ${state.vbThr} µm at C = ${d.C.toFixed(1)} min`, `在 C = ${d.C.toFixed(1)} min 達到 VB ${state.vbThr} µm`)
        : tr(`never reaches ${state.vbThr} µm (max ${d.VBmax} µm)`, `未達 ${state.vbThr} µm（最大 ${d.VBmax} µm）`))
      + `<br>${tr("replacement at", "換刀時間")} ${tf.toFixed(1)} min → ${label}`, ev)).on("mouseleave", () => ctx.tip.hide());
  });
  if (state.fix.mode === "machineLoo") { // one tick per end mill, not draggable
    life.forEach((d, k) => g.append("line").attr("x1", x(tfOf(d.tool))).attr("x2", x(tfOf(d.tool)))
      .attr("y1", rowY(k) - 3).attr("y2", rowY(k) + ROW - 1).attr("stroke", INK).attr("stroke-width", 2).attr("stroke-dasharray", "3 2"));
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
    .attr("stroke", INK).attr("stroke-width", 2).attr("stroke-dasharray", "5 3");
  lines.append("rect").attr("x", (d) => x(d.t) - 6).attr("width", 12).attr("y", (d) => d.y0 - 6).attr("height", (d) => d.y1 - d.y0 + 6)
    .attr("fill", "transparent");
  lines.append("text").attr("class", "halo").attr("x", (d) => x(d.t) + 4).attr("y", (d) => d.y0 - 4).attr("font-weight", 600)
    .text((d) => `${d.t.toFixed(1)} min`);
  const mode = state.fix.mode === "fleet" ? tr("Fixed time for all machines", "全廠固定時間") : state.fix.mode === "machine"
    ? tr("Fixed time per machine (in-sample)", "每台機台固定時間（樣本內）") : tr("Fixed time per machine, leave-one-out", "每台機台固定時間（留一法）");
  const maeF = errsF.length ? d3.mean(errsF, Math.abs) : NaN;
  const mf = Number.isFinite(maeF) ? maeF.toFixed(1) : "–", mu = unusedN ? (unusedSum / unusedN).toFixed(1) : "–";
  d3.select("#v2-summary").html(tr(`<b>${mode}:</b> mean |error| ${mf} min · mean unused life ${mu} % · ${overrun} overrun(s), 0 missed`,
    `<b>${mode}：</b>平均 |誤差| ${mf} min · 平均浪費壽命 ${mu} % · ${overrun} 次超過門檻、0 漏報`));
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
    if (!d.reached) label = tr(`threshold not reached (max VB ${ctx.meta.tool_max_vb[d.tool]} µm)`, `未達門檻（最大 VB ${ctx.meta.tool_max_vb[d.tool]} µm）`);
    if (d.alarm) {
      const used = Math.min(d.Calarm, end);
      row.append("rect").attr("width", x(used)).attr("height", h).attr("rx", 2).attr("fill", c);
      if (d.reached && d.Calarm > d.Cthr) row.append("rect").attr("x", x(d.Cthr)).attr("width", x(d.Calarm) - x(d.Cthr))
        .attr("height", h).attr("fill", "url(#hatch)");
      row.append("path").attr("d", d3.symbol(d3.symbolTriangle, 36)()).attr("transform", `translate(${x(d.Calarm)},${-1}) rotate(180)`)
        .attr("fill", ACCENT);
      if (d.reached) {
        errs.push(d.err);
        if (d.err < 0) { early++; label = tr(`${(-d.err).toFixed(1)} min early · VB ${d.VBalarm}`, `提早 ${(-d.err).toFixed(1)} min · VB ${d.VBalarm}`); }
        else { late++; label = tr(`⚠ ${d.err.toFixed(1)} min late`, `⚠ 晚了 ${d.err.toFixed(1)} min`); }
      }
    } else if (d.reached) { miss++; label = tr("⚠ no alarm", "⚠ 未報警"); }
    row.append("text").attr("x", x(Math.max(end, d.Calarm ?? 0)) + 4).attr("y", h / 2 + 4).attr("class", "lbl-2").text(label);
    row.on("mousemove", (ev) => ctx.tip.show(`<b>E${d.tool}</b> (M${d.machine})<br>${tr("alarm level", "警示線")} ${ctx.fmt(d.level)} `
      + `(${{ other: tr("other machines", "其他機台"), loo: tr("same machine, other end mills", "同機台其他刀"), insample: tr("same machine, in-sample", "同機台樣本內"), manual: tr("manual", "手動") }[state.alarm.cal]})<br>`
      + (d.alarm ? tr(`alarm at C = ${d.Calarm.toFixed(1)} min, VB = ${d.VBalarm} µm`, `警示於 C = ${d.Calarm.toFixed(1)} min，VB = ${d.VBalarm} µm`) : tr("no alarm", "未報警"))
      + (d.reached ? `<br>VB ≥ ${state.vbThr} µm ${tr("at", "於")} C = ${d.Cthr.toFixed(1)} min` : ""), ev)).on("mouseleave", () => ctx.tip.hide());
  });
  const mae = errs.length ? d3.mean(errs, Math.abs) : NaN;
  const cal = state.alarm.cal === "other" ? tr("level from the other two machines", "警示線取自另外兩台機台")
    : state.alarm.cal === "loo" ? tr("level from the other end mills of this machine", "警示線取自同機台其他刀")
    : state.alarm.cal === "insample" ? tr("level from this machine incl. the tested end mill (in-sample)", "警示線取自同機台含受測刀（樣本內）")
    : tr(`manual level ${state.alarm.level}`, `手動警示線 ${state.alarm.level}`);
  const m = Number.isFinite(mae) ? mae.toFixed(1) : "–", p = state.alarm.persist;
  d3.select("#v2-summary").html(tr(`<b>Signal alarm</b> on ${info.label} [${state.norm}], ${cal}, persistence ${p} run(s): `
    + `mean |error| ${m} min · ${early} early · ${late} late · <b>${miss} missed</b>.`,
    `<b>訊號警示</b>：${info.label} [${state.norm}]，${cal}，延續 ${p} 個 run：平均 |誤差| ${m} min · ${early} 早 · ${late} 晚 · <b>${miss} 漏報</b>。`)
    + (ctx.meta.features[state.feature].source === "dynamometer" ? tr(" <b>Dynamometer features are not available in production.</b>", "<b>測力計特徵在產線上沒有。</b>") : ""));
}

// ---------- scoreboard: every rule under the same test, so the signal alarm is always compared with the baseline ----------
const RULES = () => [
  { key: "fleet", label: tr("Fixed · all machines", "固定 · 全廠"), sub: tr("status quo", "現況"), fix: "fleet" },
  { key: "machineLoo", label: tr("Fixed · per machine", "固定 · 每台（留一）"), sub: tr("leave-one-out · baseline", "留一法 · 基準"), fix: "machineLoo" },
  { key: "sig-other", label: tr("Signal · other machines", "訊號 · 其他機台"), sub: tr("level from 2 other machines", "警示線取自另外兩台"), fix: "signal", cal: "other" },
  { key: "sig-loo", label: tr("Signal · same machine", "訊號 · 同機台（留一）"), sub: tr("leave-one-out", "留一法"), fix: "signal", cal: "loo" },
];

function renderScore() {
  const box = d3.select("#v2-score");
  box.selectAll("*").remove();
  const life = lifeTable(ctx.runs, ctx.tools, state.vbThr), a = state.alarm;
  const rows = RULES().map((r) => ({ ...r, ...(r.fix === "signal"
    ? alarmStats(signalAlarms(ctx.runs, ctx.tools, ctx.trail, state.vbThr, r.cal, a.level, a.persist))
    : fixedStats(life, fixTimes(life, r.fix, state.fix))) }));
  const cur = (r) => r.fix === state.fix.mode && (r.fix !== "signal" || r.cal === a.cal);
  const base = rows.find((r) => r.key === "machineLoo");
  const info = ctx.meta.features[state.feature];
  box.append("p").attr("class", "hint").html(tr(`Signal = <b>${info.label}</b> [${state.norm}] · persistence ${a.persist} · VB ≥ ${state.vbThr} µm`, `訊號 = <b>${info.label}</b> [${state.norm}] · 延續 ${a.persist} · VB ≥ ${state.vbThr} µm`));
  const RH = 19, L = { l: 150, r: 150, t: 14, b: 26 };
  const W = box.node().clientWidth, iw = Math.max(60, W - L.l - L.r), ih = rows.length * RH;
  const x = d3.scaleLinear().domain([0, d3.max(rows, (r) => (Number.isFinite(r.mae) ? r.mae : 0)) || 1]).nice().range([0, iw]);
  const svg = box.append("svg").attr("width", W).attr("height", ih + L.t + L.b)
    .attr("role", "img").attr("aria-label", "Mean error of each replacement rule");
  const g = svg.append("g").attr("transform", `translate(${L.l},${L.t})`);
  g.append("g").attr("class", "grid").attr("transform", `translate(0,${ih})`).call(d3.axisBottom(x).ticks(4).tickSize(-ih).tickFormat(""));
  g.append("g").attr("class", "axis").attr("transform", `translate(0,${ih})`).call(d3.axisBottom(x).ticks(4).tickSize(3));
  g.append("text").attr("class", "lbl-2").attr("x", iw).attr("y", ih + 24).attr("text-anchor", "end").text(tr("mean |error| [min]", "平均 |誤差| [min]"));
  const row = g.selectAll("g.srow").data(rows).join("g").attr("class", "srow").attr("transform", (r, k) => `translate(0,${k * RH})`)
    .style("cursor", "pointer")
    .on("click", (ev, r) => set(r.fix === "signal" ? { fix: { ...state.fix, mode: "signal" }, alarm: { ...state.alarm, cal: r.cal } }
      : { fix: { ...state.fix, mode: r.fix } }));
  row.append("rect").attr("x", -L.l).attr("width", W).attr("height", RH).attr("fill", (r) => (cur(r) ? BAND : "transparent"));
  row.append("text").attr("x", -6).attr("y", RH / 2 + 4).attr("text-anchor", "end").attr("font-weight", (r) => (cur(r) ? 700 : 400))
    .text((r) => r.label).append("title").text((r) => r.sub);
  // length encodes the error: bars start at 0 (neutral gray, colour stays reserved for machines)
  row.append("rect").attr("y", 4).attr("height", RH - 8).attr("rx", 2)
    .attr("width", (r) => (Number.isFinite(r.mae) ? x(r.mae) : 0)).attr("fill", (r) => (cur(r) ? INK : "#c9c8c3"));
  row.append("text").attr("class", "lbl-2").attr("x", (r) => (Number.isFinite(r.mae) ? x(r.mae) : 0) + 4).attr("y", RH / 2 + 4)
    .html((r) => `${Number.isFinite(r.mae) ? r.mae.toFixed(1) : "–"} min · ${r.late} ${tr("late", "晚")}`
      + (r.missed ? ` · <tspan font-weight="700" >${r.missed} ${tr("missed", "漏報")}</tspan>` : ""));
  if (Number.isFinite(base.mae)) {
    g.append("line").attr("x1", x(base.mae)).attr("x2", x(base.mae)).attr("y1", -2).attr("y2", ih)
      .attr("stroke", INK).attr("stroke-dasharray", "2 2").attr("pointer-events", "none");
    g.append("text").attr("class", "lbl-2").attr("x", x(base.mae)).attr("y", -4).attr("text-anchor", "middle").text(tr("baseline", "基準"));
  }
}
