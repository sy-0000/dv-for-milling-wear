import { state, set, on, MACHINE_COLOR } from "./state.js";
import { normalize, rollingByTool, layerDiagnostics } from "./analysis.js";
import * as V1 from "./v1_wear.js";
import * as V2 from "./v2_life.js";
import * as V3 from "./v3_rank.js";
import * as V4 from "./v4_scatter.js";
import * as V5 from "./v5_timeline.js";
import * as V6 from "./v6_detail.js";

const VIEWS = [V1, V2, V3, V4, V5, V6];

// ---------- tooltip ----------
const tipEl = document.getElementById("tooltip");
const tip = {
  show(html, ev) {
    tipEl.innerHTML = html;
    tipEl.hidden = false;
    const pad = 14, w = tipEl.offsetWidth, h = tipEl.offsetHeight;
    let x = ev.clientX + pad, y = ev.clientY + pad;
    if (x + w > innerWidth - 4) x = ev.clientX - w - pad;
    if (y + h > innerHeight - 4) y = ev.clientY - h - pad;
    tipEl.style.left = `${x}px`;
    tipEl.style.top = `${y}px`;
  },
  hide() { tipEl.hidden = true; },
};

const [runs, meta, snippets] = await Promise.all([
  d3.csv("data/runs.csv", d3.autoType),
  d3.json("data/meta.json"),
  d3.json("data/snippets.json"),
]);
runs.forEach((r, i) => { r.i = i; r.C_min = r.C_s / 60; });

let envCache = null;
async function envelopes() {
  if (!envCache) {
    const buf = await (await fetch("data/envelopes.bin")).arrayBuffer();
    envCache = new Uint16Array(buf);
  }
  return envCache;
}
function envelope(i, ch) {
  const nb = meta.envelopes.n_bins, sc = meta.envelopes.scales[ch];
  const off = (i * 3 + ch) * nb;
  return Array.from(envCache.subarray(off, off + nb), (q) => q * sc);
}

const feats = Object.keys(meta.features);
const ctx = {
  runs, meta, snippets, tip, feats,
  tools: d3.range(1, 10),
  color: (m) => MACHINE_COLOR[m],
  envelopes, envelope,
  inRange: (r) => !state.cRange || (r.C_min >= state.cRange[0] && r.C_min <= state.cRange[1]),
  fmt: d3.format(".3~g"),
  y: null, roll: null, layers: null,
};

function derive(keys) {
  if (!keys || keys.has("feature") || keys.has("norm")) {
    ctx.y = normalize(runs, state.feature, state.norm);
    ctx.roll = rollingByTool(runs, ctx.y, 15);
  }
  if (!keys || keys.has("feature")) ctx.layers = layerDiagnostics(runs, state.feature);
}

// ---------- controls ----------
const fSel = document.getElementById("ctl-feature");
function fillFeatureSelect() {
  fSel.innerHTML = "";
  for (const [grp, src] of [["Machine control (production)", "machine"], ["Dynamometer (reference)", "dynamometer"]]) {
    if (src === "dynamometer" && !state.showDyn) continue;
    const og = document.createElement("optgroup");
    og.label = grp;
    feats.filter((f) => meta.features[f].source === src).forEach((f) => {
      const o = document.createElement("option");
      o.value = f;
      o.textContent = meta.features[f].label;
      og.appendChild(o);
    });
    fSel.appendChild(og);
  }
  fSel.value = state.feature;
}
fillFeatureSelect();
fSel.onchange = () => set({ feature: fSel.value });
document.querySelectorAll("input[name=norm]").forEach((el) => (el.onchange = () => set({ norm: el.value })));
document.getElementById("ctl-dyn").onchange = (e) => {
  const patch = { showDyn: e.target.checked };
  if (!e.target.checked && meta.features[state.feature].source === "dynamometer") patch.feature = "Tsp_mean";
  set(patch);
};
const bindRange = (id, out, key, unit) => {
  const el = document.getElementById(id), o = document.getElementById(out);
  el.oninput = () => { o.textContent = `${el.value} ${unit}`; set({ [key]: +el.value }); };
};
bindRange("ctl-thr", "out-thr", "vbThr", "µm");
bindRange("ctl-jump", "out-jump", "jumpThr", "%");
bindRange("ctl-rise", "out-rise", "riseThr", "%");
document.getElementById("ctl-reset").onclick = () =>
  set({ cRange: null, brushed: null, runIdx: null, pinIdx: null, fix: { mode: state.fix.mode, fleet: null, m: { 1: null, 2: null, 3: null } } });

d3.select("#legend").selectAll("span").data(Object.entries(meta.machines)).join("span")
  .html(([m, d]) => `<i style="background:${MACHINE_COLOR[m]}"></i>M${m} ${d.name.replace("DMG Mori ", "")} (T${d.tools[0]}–T${d.tools[2]})`)
  .attr("title", ([, d]) => `${d.name}, ${d.control}, ${d.drive}, tool batch ${d.batch}${d.note ? " — " + d.note : ""}`);
document.getElementById("limitations").innerHTML = "<b>Data limitations:</b> " + meta.limitations.join(" · ");

function syncControls() {
  if (fSel.value !== state.feature) fSel.value = state.feature;
  document.querySelectorAll("input[name=norm]").forEach((el) => (el.checked = el.value === state.norm));
  document.getElementById("ctl-dyn").checked = state.showDyn;
  for (const [id, out, key, unit] of [["ctl-thr", "out-thr", "vbThr", "µm"], ["ctl-jump", "out-jump", "jumpThr", "%"],
    ["ctl-rise", "out-rise", "riseThr", "%"]]) {
    document.getElementById(id).value = state[key];
    document.getElementById(out).textContent = `${state[key]} ${unit}`;
  }
}

// ---------- guided steps (apply settings + point at the relevant views) ----------
const GUIDE = {
  1: { patch: { feature: "Tsp_mean", norm: "ratio", vbThr: 140, cRange: null, brushed: null, tool: 4,
                fix: { mode: "fleet", fleet: null, m: { 1: null, 2: null, 3: null } } },
       views: ["v1", "v2"],
       note: "① Compare the wear curves (V1) and the tool life at the threshold (V2). Where do the machines differ? "
           + "How much life would a single fixed replacement time leave unused? Try the per-machine option." },
  2: { patch: { norm: "ratio", cRange: null, brushed: null, showDyn: true },
       views: ["v3", "v4"],
       note: "② Which production signal (top rows of V3) follows wear in every tool? Click a row and check in V4 "
           + "whether the three machines collapse onto one curve, and what level the band shows at the threshold." },
  3: { patch: { feature: "Tsp_mean", norm: "ratio", tool: 1, runIdx: null, brushed: null, showDyn: true },
       views: ["v5", "v6"],
       note: "③ Look for flagged layers in V5 (J = jump, R = rise). Open runs before and inside a flagged layer in V6 "
           + "and compare machine signals with the dynamometer reference. Is it wear, or something else?" },
};
document.querySelectorAll(".guide button").forEach((b) => (b.onclick = () => {
  const g = GUIDE[b.dataset.step];
  document.querySelectorAll(".guide button").forEach((x) => x.classList.toggle("on", x === b));
  const note = document.getElementById("guide-note");
  note.textContent = g.note;
  note.hidden = false;
  set(g.patch);
  document.querySelectorAll(".view").forEach((v) => v.classList.toggle("flash", g.views.includes(v.id)));
  document.getElementById(g.views[0]).scrollIntoView({ behavior: "smooth", block: "center" });
  setTimeout(() => document.querySelectorAll(".view").forEach((v) => v.classList.remove("flash")), 2500);
}));

// ---------- wire up ----------
derive();
VIEWS.forEach((v) => v.init(ctx));
on((keys) => {
  if (keys.has("showDyn")) fillFeatureSelect();
  derive(keys);
  syncControls();
  VIEWS.forEach((v) => v.update(keys));
});
let rt;
addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => VIEWS.forEach((v) => v.update(null)), 200); });
