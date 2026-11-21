// V1 · Wear curves as 3×3 small multiples (rows = machines). Brush x to filter a contact-time range.
import { state, set } from "./state.js";

let ctx, root, cells = [], x, y;
const H = 96, M = { t: 16, r: 8, b: 18, l: 30 };

export function init(c) { ctx = c; root = d3.select("#v1 .plot"); render(); }

export function update(keys) {
  if (!keys || keys.has("vbThr")) return render();
  if (keys.has("cRange")) syncBrush();
  if (keys.has("tool") || keys.has("brushed") || keys.has("runIdx")) highlight();
}

function render() {
  root.selectAll("*").remove();
  cells = [];
  const W = root.node().clientWidth, cw = W / 3;
  const iw = cw - M.l - M.r, ih = H - M.t - M.b;
  x = d3.scaleLinear().domain([0, 90]).range([0, iw]);
  y = d3.scaleLinear().domain([0, 165]).range([ih, 0]);
  const svg = root.append("svg").attr("width", W).attr("height", H * 3 + 14)
    .attr("role", "img").attr("aria-label", "Wear curves of tools T1 to T9");
  ctx.tools.forEach((t, k) => {
    const rs = ctx.runs.filter((r) => r.tool === t), m = rs[0].machine;
    const g = svg.append("g").attr("transform", `translate(${(k % 3) * cw + M.l},${Math.floor(k / 3) * H + M.t})`);
    g.append("g").attr("class", "grid").call(d3.axisLeft(y).tickValues([50, 100, 150]).tickSize(-iw).tickFormat(""));
    g.append("g").attr("class", "axis").call(d3.axisLeft(y).tickValues([0, 50, 100, 150]).tickSize(3));
    g.append("g").attr("class", "axis").attr("transform", `translate(0,${ih})`)
      .call(d3.axisBottom(x).tickValues([0, 30, 60, 90]).tickSize(3));
    g.append("line").attr("x1", 0).attr("x2", iw).attr("y1", y(state.vbThr)).attr("y2", y(state.vbThr))
      .attr("stroke", "#0b0b0b").attr("stroke-dasharray", "3 3").attr("stroke-width", 1);
    g.append("path").datum(rs).attr("fill", "none").attr("stroke", ctx.color(m)).attr("stroke-width", 2)
      .attr("d", d3.line().x((r) => x(r.C_min)).y((r) => y(r.VB_um)));
    g.append("g").attr("class", "marks");
    const title = g.append("text").attr("x", 4).attr("y", -4).attr("font-weight", 600).style("cursor", "pointer")
      .text(`T${t} · M${m}`);
    const note = ctx.meta.tool_notes[t];
    if (t === 8) g.append("text").attr("class", "note halo").attr("x", iw - 2).attr("text-anchor", "end").attr("y", ih - 4).text("no data before C = 3 min");
    if (note) title.append("title").text(note);
    if (k === 0) g.append("text").attr("class", "lbl-2").attr("x", iw).attr("y", -4).attr("text-anchor", "end").text("VB [µm]");
    if (k === 8) g.append("text").attr("class", "lbl-2").attr("x", iw).attr("y", ih + 30).attr("text-anchor", "end")
      .text("contact time C [min]");
    // brush + hover
    const brush = d3.brushX().extent([[0, 0], [iw, ih]])
      .on("end", (ev) => {
        if (!ev.sourceEvent) return;
        if (!ev.selection) { if (state.cRange) set({ cRange: null }); else set({ tool: t }); return; }
        set({ cRange: ev.selection.map(x.invert) });
      });
    const bg = g.append("g").attr("class", "brush").call(brush);
    bg.select(".overlay")
      .on("mousemove.tip", (ev) => {
        const cx = x.invert(d3.pointer(ev)[0]);
        const r = rs[d3.bisector((d) => d.C_min).center(rs, cx)];
        ctx.tip.show(`<b>T${t}</b> (M${m}) · run ${r.run}<br>C = ${r.C_min.toFixed(1)} min · VB = ${r.VB_um} µm<br>`
          + `<span class="muted">layer ${r.layer}; VB mostly interpolated between microscope measurements</span>`, ev);
      })
      .on("mouseleave.tip", () => ctx.tip.hide());
    title.on("click", () => set({ tool: t }));
    cells.push({ t, g, bg, brush, rs, iw, ih });
  });
  syncBrush();
  highlight();
}

function syncBrush() {
  cells.forEach((c) => c.bg.call(c.brush.move, state.cRange ? state.cRange.map((v) => x(Math.min(90, v))) : null));
}

function highlight() {
  cells.forEach((c) => {
    c.g.select("text").attr("text-decoration", c.t === state.tool ? "underline" : null);
    c.g.selectAll(".sel-frame").remove();
    if (c.t === state.tool) c.g.insert("rect", ":first-child").attr("class", "sel-frame").attr("x", -2).attr("y", -2)
      .attr("width", c.iw + 4).attr("height", c.ih + 4).attr("fill", "#f1f0ec");
    const marks = [];
    if (state.brushed) c.rs.forEach((r) => state.brushed.has(r.i) && marks.push({ r, k: "b" }));
    if (state.runIdx != null && ctx.runs[state.runIdx].tool === c.t) marks.push({ r: ctx.runs[state.runIdx], k: "s" });
    c.g.select(".marks").selectAll("circle").data(marks).join("circle")
      .attr("cx", (d) => x(d.r.C_min)).attr("cy", (d) => y(d.r.VB_um))
      .attr("r", (d) => (d.k === "s" ? 4.5 : 2.2))
      .attr("fill", (d) => (d.k === "s" ? "none" : "#0b0b0b"))
      .attr("stroke", (d) => (d.k === "s" ? "#0b0b0b" : "none")).attr("stroke-width", 1.5);
  });
}
