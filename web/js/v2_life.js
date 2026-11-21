// V2 · Tool life at the VB threshold + fixed replacement time (fleet-wide or per machine) -> unused life.
import { state, set } from "./state.js";
import { lifeTable } from "./analysis.js";

let ctx, root;
const M = { t: 18, r: 70, b: 26, l: 46 }, ROW = 17;
const gap = () => (state.fix.mode === "fleet" ? 10 : 20);

export function init(c) {
  ctx = c;
  root = d3.select("#v2 .plot");
  d3.selectAll("#v2-mode button").on("click", function () {
    set({ fix: { ...state.fix, mode: this.dataset.mode } });
  });
  render();
}

export function update(keys) {
  if (!keys || keys.has("vbThr") || keys.has("fix") || keys.has("tool")) render();
}

function fixTimes(life) {
  const auto = (list) => d3.min(list.filter((d) => d.reached), (d) => d.C) ?? d3.min(list, (d) => d.C);
  if (state.fix.mode === "fleet") {
    const t = state.fix.fleet ?? auto(life);
    return { 1: t, 2: t, 3: t };
  }
  const o = {};
  for (const m of [1, 2, 3]) o[m] = state.fix.m[m] ?? auto(life.filter((d) => d.machine === m));
  return o;
}

function render() {
  d3.selectAll("#v2-mode button").classed("on", function () { return this.dataset.mode === state.fix.mode; });
  root.selectAll("*").remove();
  const life = lifeTable(ctx.runs, ctx.tools, state.vbThr);
  const fx = fixTimes(life);
  const W = root.node().clientWidth, iw = W - M.l - M.r;
  const rowY = (k) => k * ROW + Math.floor(k / 3) * gap();
  const ih = rowY(8) + ROW;
  const x = d3.scaleLinear().domain([0, 90]).range([0, iw]);
  const svg = root.append("svg").attr("width", W).attr("height", ih + M.t + M.b)
    .attr("role", "img").attr("aria-label", "Contact time at which each tool reaches the VB threshold");
  const defs = svg.append("defs");
  defs.append("pattern").attr("id", "hatch").attr("width", 5).attr("height", 5).attr("patternUnits", "userSpaceOnUse")
    .attr("patternTransform", "rotate(45)").append("line").attr("y2", 5).attr("stroke", "#52514e").attr("stroke-width", 1.4);
  const g = svg.append("g").attr("transform", `translate(${M.l},${M.t})`);
  g.append("g").attr("class", "grid").attr("transform", `translate(0,${ih})`)
    .call(d3.axisBottom(x).ticks(6).tickSize(-ih).tickFormat(""));
  g.append("g").attr("class", "axis").attr("transform", `translate(0,${ih})`).call(d3.axisBottom(x).ticks(6));
  g.append("text").attr("class", "lbl-2").attr("x", iw).attr("y", ih + 24).attr("text-anchor", "end")
    .text(`contact time C [min] until VB ≥ ${state.vbThr} µm`);

  let unusedSum = 0, unusedN = 0, overrun = 0;
  life.forEach((d, k) => {
    const yy = rowY(k), h = ROW - 4, c = ctx.color(d.machine), tf = fx[d.machine];
    const row = g.append("g").attr("transform", `translate(0,${yy})`).style("cursor", "pointer")
      .on("click", () => set({ tool: d.tool }));
    row.append("text").attr("x", -6).attr("y", h / 2 + 4).attr("text-anchor", "end")
      .attr("font-weight", d.tool === state.tool ? 700 : 400).text(`T${d.tool} M${d.machine}`);
    const used = Math.min(tf, d.C);
    row.append("rect").attr("width", x(d.C)).attr("height", h).attr("rx", 2).attr("fill", c).attr("opacity", 0.28);
    row.append("rect").attr("width", x(used)).attr("height", h).attr("rx", 2).attr("fill", c);
    let label;
    if (!d.reached) {
      row.append("rect").attr("x", x(d.C) - 1).attr("width", 2).attr("height", h).attr("fill", "#0b0b0b");
      label = `not reached (max VB ${d.VBmax} µm)`;
    } else if (tf < d.C - 0.05) {
      const pct = ((d.C - tf) / d.C) * 100;
      unusedSum += pct; unusedN++;
      label = `unused ${pct.toFixed(0)} %`;
    } else if (tf <= d.C + 0.05) {
      label = "replaced at threshold";
      unusedN++;
    } else {
      row.append("rect").attr("x", x(d.C)).attr("width", x(tf) - x(d.C)).attr("height", h).attr("fill", "url(#hatch)");
      overrun++;
      label = `⚠ ${(tf - d.C).toFixed(1)} min past threshold`;
      unusedN++;
    }
    row.append("text").attr("x", x(Math.max(d.C, tf)) + 4).attr("y", h / 2 + 4).attr("class", "lbl-2").text(label);
    row.on("mousemove", (ev) => ctx.tip.show(`<b>T${d.tool}</b> (M${d.machine}, batch ${ctx.meta.machines[d.machine].batch})<br>`
      + (d.reached ? `reaches VB ${state.vbThr} µm at C = ${d.C.toFixed(1)} min` : `never reaches ${state.vbThr} µm (max ${d.VBmax} µm)`)
      + `<br>replacement at ${tf.toFixed(1)} min → ${label}`, ev)).on("mouseleave", () => ctx.tip.hide());
  });

  // draggable replacement-time line(s)
  const groups = state.fix.mode === "fleet" ? [{ key: "fleet", y0: -6, y1: ih, t: fx[1] }]
    : [1, 2, 3].map((m) => ({ key: m, y0: rowY((m - 1) * 3) - 8, y1: rowY((m - 1) * 3 + 2) + ROW, t: fx[m] }));
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
  lines.append("text").attr("class", "halo").attr("x", (d) => x(d.t) + 4).attr("y", (d) => d.y0 - 4).attr("text-anchor", "start").attr("font-weight", 600)
    .text((d) => `${d.t.toFixed(1)} min`);

  const mode = state.fix.mode === "fleet" ? "one replacement time for all machines" : "one replacement time per machine";
  d3.select("#v2-summary").html(`<b>${mode}:</b> mean unused life ${unusedN ? (unusedSum / unusedN).toFixed(1) : "–"} % of tools that reach the threshold`
    + (overrun ? ` · <b>⚠ ${overrun} tool(s) run past the threshold</b>` : "")
    + ` <span class="muted">(M2 tools = batch B: machine and batch effects are confounded)</span>`);
}
