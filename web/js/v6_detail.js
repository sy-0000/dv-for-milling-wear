// V6 · Details of the selected run: envelopes of machine signals (+ dynamometer reference), pinned comparison run,
// and a 20 ms raw force snippet from the nearest representative run of the same tool.
import { state, set } from "./state.js";

let ctx, root;
const M = { t: 6, r: 10, b: 26, l: 48 }, PH = 62;

export function init(c) { ctx = c; root = d3.select("#v6 .plot"); render(); }

export function update(keys) {
  if (!keys || ["runIdx", "pinIdx", "showDyn", "tool"].some((k) => keys.has(k))) render();
}

async function render() {
  root.selectAll("*").remove();
  const head = d3.select("#v6-head");
  if (state.runIdx == null) { head.html("Click a run in V4 or V5 to see its signals."); return; }
  await ctx.envelopes();
  const r = ctx.runs[state.runIdx], mach = ctx.meta.machines[r.machine];
  const pin = state.pinIdx != null && state.pinIdx !== state.runIdx ? ctx.runs[state.pinIdx] : null;
  const badges = ['<span class="badge">VB interpolated unless at a measurement</span>'];
  if (r.machine === 2) badges.push('<span class="badge warn">M2: spindle/axis may be aliased</span>');
  if (ctx.meta.tool_notes[r.tool]) badges.push(`<span class="badge warn">${ctx.meta.tool_notes[r.tool]}</span>`);
  head.html(`<b>E${r.tool} · M${r.machine} · run ${r.run}</b> — layer ${r.layer}, x = ${r.x_pass} mm, C = ${r.C_min.toFixed(1)} min, `
    + `VB = ${r.VB_um} µm ${badges.join("")} `
    + `<button id="v6-pin" class="ghost small">${state.pinIdx === state.runIdx ? "unpin" : "pin as comparison"}</button>`
    + (pin ? ` <span class="muted">gray = pinned run ${pin.run} (E${pin.tool}, VB ${pin.VB_um} µm)</span>` : ""));
  d3.select("#v6-pin").on("click", () => set({ pinIdx: state.pinIdx === state.runIdx ? null : state.runIdx }));

  const panels = [
    { ch: 1, label: "|spindle torque| [Nm]", src: "machine" },
    { ch: 2, label: `|feed axis Y| [${mach.axis_unit}]`, src: "machine" },
  ];
  if (state.showDyn) panels.push({ ch: 0, label: "|Fxy| RMS [N] — reference", src: "dynamometer" });
  const W = root.node().clientWidth, iw = W - M.l - M.r;
  const tEnd = Math.max(r.t_end, pin ? pin.t_end : 0);
  const x = d3.scaleLinear().domain([0, tEnd]).range([0, iw]);
  const svg = root.append("svg").attr("width", W).attr("height", panels.length * PH + M.t + M.b + 8)
    .attr("role", "img").attr("aria-label", "Signal envelopes of the selected run");
  panels.forEach((p, k) => {
    const g = svg.append("g").attr("transform", `translate(${M.l},${M.t + k * PH})`), ih = PH - 12;
    const series = [{ run: r, v: ctx.envelope(r.i, p.ch), col: p.src === "machine" ? ctx.color(r.machine) : "#52514e" }];
    if (pin) series.unshift({ run: pin, v: ctx.envelope(pin.i, p.ch), col: "#b9b8b2" });
    const y = d3.scaleLinear().domain([0, d3.max(series, (s) => d3.max(s.v)) * 1.05]).range([ih, 0]);
    g.append("rect").attr("x", x(r.t_on)).attr("width", x(r.t_off) - x(r.t_on)).attr("height", ih).attr("fill", "#f1f0ec");
    g.append("rect").attr("x", x(r.t_on + 0.15)).attr("width", x(r.t_off - 0.15) - x(r.t_on + 0.15)).attr("height", ih)
      .attr("fill", "#e5e4de");
    g.append("g").attr("class", "axis").call(d3.axisLeft(y).ticks(3).tickSize(3));
    series.forEach((s) => {
      const nb = s.v.length, dt = s.run.t_end / nb;
      g.append("path").datum(s.v).attr("fill", "none").attr("stroke", s.col).attr("stroke-width", 1.6)
        .attr("d", d3.line().x((v, j) => x((j + 0.5) * dt)).y((v) => y(v)));
    });
    g.append("text").attr("class", p.src === "machine" ? "halo" : "lbl-2 halo").attr("x", 30).attr("y", 9).text(p.label);
    if (k === panels.length - 1) {
      g.append("g").attr("class", "axis").attr("transform", `translate(0,${ih})`).call(d3.axisBottom(x).ticks(6));
      g.append("text").attr("class", "lbl-2").attr("x", iw).attr("y", ih + 24).attr("text-anchor", "end")
        .text("time within run [s] · shaded = detected cut, darker = window used for features");
    }
  });

  // 20 ms snippet (dynamometer reference)
  if (!state.showDyn) return;
  const sn = ctx.snippets.filter((s) => s.tool === r.tool);
  if (!sn.length) return;
  const s = sn.reduce((a, b) => (Math.abs(b.VB_um - r.VB_um) < Math.abs(a.VB_um - r.VB_um) ? b : a));
  const sh = 70, g = root.append("svg").attr("width", W).attr("height", sh + 30)
    .append("g").attr("transform", `translate(${M.l},14)`);
  const v = s.fx.map((fx, j) => Math.hypot(fx, s.fy[j]));
  const xs = d3.scaleLinear().domain([0, (v.length / s.fs) * 1000]).range([0, iw]);
  const ys = d3.scaleLinear().domain([0, d3.max(v) * 1.05]).range([sh, 0]);
  g.append("text").attr("class", "lbl-2").attr("y", -4)
    .text(`|Fxy| 25 kHz, 20 ms of run ${s.run} (VB ${s.VB_um} µm) · peaks = cutting edges`);
  g.append("g").attr("class", "axis").call(d3.axisLeft(ys).ticks(3).tickSize(3));
  g.append("g").attr("class", "axis").attr("transform", `translate(0,${sh})`).call(d3.axisBottom(xs).ticks(5).tickFormat((d) => `${d} ms`));
  g.append("path").datum(v).attr("fill", "none").attr("stroke", "#52514e").attr("stroke-width", 1.2)
    .attr("d", d3.line().x((d, j) => xs((j / s.fs) * 1000)).y((d) => ys(d)));
}
