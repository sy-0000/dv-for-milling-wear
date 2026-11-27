import { state, set, on, MACHINE_COLOR } from "./state.js";
import { normalize, rollingByTool, trailingByTool, layerDiagnostics, signalAlarms } from "./analysis.js";
import { tr, STATIC, applyStatic, initialLang, rememberLang } from "./i18n.js";
import { conclusion } from "./concl.js";
import * as V1 from "./v1_wear.js";
import * as V2 from "./v2_life.js";
import * as V3 from "./v3_rank.js";
import * as V4 from "./v4_scatter.js";
import * as V5 from "./v5_timeline.js";
import * as V6 from "./v6_detail.js";

const VIEWS = [V1, V2, V3, V4, V5, V6];
state.lang = initialLang(); // before the first render (no publish needed)

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
  y: null, roll: null, trail: null, layers: null, alarms: null,
};

function derive(keys) {
  if (!keys || keys.has("feature") || keys.has("norm")) {
    ctx.y = normalize(runs, state.feature, state.norm);
    ctx.roll = rollingByTool(runs, ctx.y, 15);
    ctx.trail = trailingByTool(runs, ctx.y, 15);
  }
  if (!keys || ["feature", "norm", "vbThr", "alarm"].some((k) => keys.has(k))) {
    const a = state.alarm;
    ctx.alarms = signalAlarms(runs, ctx.tools, ctx.trail, state.vbThr, a.cal, a.level, a.persist);
  }
  if (!keys || keys.has("feature")) ctx.layers = layerDiagnostics(runs, state.feature);
}

// ---------- controls ----------
const fSel = document.getElementById("ctl-feature");
function fillFeatureSelect() {
  fSel.innerHTML = "";
  for (const [grp, src] of [[tr("Machine control (production)", "機台控制（產線可用）"), "machine"], [tr("Dynamometer (reference)", "測力計（參考）"), "dynamometer"]]) {
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
fSel.onchange = () => set({ feature: fSel.value });
const nSel = document.getElementById("ctl-norm");
nSel.onchange = () => set({ norm: nSel.value });
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

function fillLegend() {
  d3.select("#legend").selectAll("span").data(Object.entries(meta.machines)).join("span")
    .html(([m, d]) => `<i style="background:${MACHINE_COLOR[m]}"></i>M${m} · E${d.tools[0]}–E${d.tools[2]}`)
    .attr("title", ([, d]) => `${d.name}, ${d.control}, ${d.drive}, ${tr("tool batch", "刀具批次")} ${d.batch}${d.note ? " — " + d.note : ""}`);
}
document.getElementById("limitations").innerHTML = meta.limitations.join("<br>");

function syncControls() {
  if (fSel.value !== state.feature) fSel.value = state.feature;
  nSel.value = state.norm;
  const prod = state.norm === "early" || state.norm === "raw", badge = document.getElementById("norm-badge");
  badge.textContent = prod ? tr("production", "產線可用") : tr("trial only", "只限試驗");
  badge.classList.toggle("warn", !prod);
  document.getElementById("ctl-dyn").checked = state.showDyn;
  for (const [id, out, key, unit] of [["ctl-thr", "out-thr", "vbThr", "µm"], ["ctl-jump", "out-jump", "jumpThr", "%"],
    ["ctl-rise", "out-rise", "riseThr", "%"]]) {
    document.getElementById(id).value = state[key];
    document.getElementById(out).textContent = `${state[key]} ${unit}`;
  }
}

// ---------- guided questions Q1–Q4: settings applied when a question is chosen (demo narrative) ----------
const NOFIX = () => ({ fleet: null, m: { 1: null, 2: null, 3: null } });
const GUIDE = {
  1: { feature: "Tsp_mean", norm: "early", vbThr: 140, cRange: null, brushed: null, tool: 4, fix: { mode: "fleet", ...NOFIX() } },
  2: { feature: "Tsp_mean", norm: "early", cRange: null, brushed: null, showDyn: true },
  3: { feature: "Tsp_mean", norm: "early", cRange: null, brushed: null, fix: { mode: "signal", ...NOFIX() }, alarm: { cal: "other", level: 1.25, persist: 1 } },
  4: { feature: "Tsp_mean", norm: "early", tool: 1, runIdx: null, brushed: null, showDyn: true,
       fix: { mode: "signal", ...NOFIX() }, alarm: { cal: "other", level: 1.25, persist: 1 } },
};
// compromise layout: main views per question; every other view (except the V2 scoreboard) becomes a linked thumbnail
const LAYOUT = { 1: ["v1"], 2: ["v3", "v4"], 3: ["v4", "v5"], 4: ["v5", "v6"], all: ["v1", "v3", "v4", "v5", "v6"] };
const OPENS = { v1: "1", v3: "2", v4: "2", v5: "4", v6: "4" }; // clicking a thumbnail opens the question that uses it
const SLOTS = ["v1", "v3", "v4", "v5", "v6"];
let step = "1";

function applyLayout() {
  const main = LAYOUT[step], mainc = document.getElementById("mainc"), list = document.getElementById("thumb-list");
  main.forEach((v) => mainc.appendChild(document.getElementById(`slot-${v}`)));
  SLOTS.filter((v) => !main.includes(v)).forEach((v) => list.appendChild(document.getElementById(`slot-${v}`)));
  document.getElementById("layout").classList.toggle("all", step === "all");
}
function headerText() {
  document.querySelectorAll(".tab").forEach((b) => b.classList.toggle("on", b.dataset.step === step));
  document.getElementById("q-num").textContent = step === "all" ? "ALL" : `Q${step}`;
  document.getElementById("q-title").innerHTML = STATIC[step === "all" ? "qall" : `q${step}`][state.lang];
  document.getElementById("q-note").innerHTML = STATIC[step === "all" ? "noteall" : `note${step}`][state.lang];
}
function renderConclusion() {
  const c = conclusion(step, ctx);
  document.getElementById("concl").hidden = !c;
  if (!c) return;
  document.getElementById("concl-q").textContent = `Q${step}`;
  document.getElementById("concl-title").textContent = c.title;
  document.getElementById("concl-body").textContent = c.body;
}
function selectStep(s, withPatch = true) {
  step = s;
  headerText();
  applyLayout();
  if (withPatch && GUIDE[s]) set(GUIDE[s]); // re-renders the views through the subscription
  VIEWS.forEach((v) => v.update(null)); // widths changed with the layout
  renderConclusion();
  measureBar();
  scrollTo({ top: 0, behavior: "smooth" });
}
document.querySelectorAll(".tab").forEach((b) => (b.onclick = () => selectStep(b.dataset.step)));
SLOTS.forEach((v) => document.getElementById(`slot-${v}`).addEventListener("click", (ev) => {
  if (ev.currentTarget.parentElement.id === "thumb-list") selectStep(OPENS[v]);
}));

// ---------- language ----------
document.querySelectorAll(".lang button").forEach((b) => (b.onclick = () => { rememberLang(b.dataset.lang); set({ lang: b.dataset.lang }); }));

// ---------- ⓘ popovers: long explanations are hidden next to the panel title (click / tap to open) ----------
document.querySelectorAll(".info").forEach((btn) => {
  const body = document.getElementById(btn.getAttribute("aria-controls"));
  btn.onclick = (ev) => {
    ev.stopPropagation();
    const open = body.hidden;
    document.querySelectorAll(".info-body").forEach((b) => (b.hidden = true));
    document.querySelectorAll(".info").forEach((b) => b.setAttribute("aria-expanded", "false"));
    body.hidden = !open;
    btn.setAttribute("aria-expanded", String(open));
  };
});
document.addEventListener("click", (ev) => {
  if (ev.target.closest(".info-body")) return;
  document.querySelectorAll(".info-body").forEach((b) => (b.hidden = true));
  document.querySelectorAll(".info").forEach((b) => b.setAttribute("aria-expanded", "false"));
});

// sticky header height -> CSS variable, so the sticky columns sit below it
function measureBar() {
  document.documentElement.style.setProperty("--bar-h", `${document.getElementById("bar").offsetHeight}px`);
}

// ---------- wire up ----------
applyStatic();
fillFeatureSelect();
fillLegend();
const qs = new URLSearchParams(location.search).get("step");
step = ["1", "2", "3", "4", "all"].includes(qs) ? qs : "1";
headerText();
applyLayout(); // place the slots before the first render so each view gets its final width
derive();
VIEWS.forEach((v) => v.init(ctx));
syncControls();
renderConclusion();
measureBar();
on((keys) => {
  if (keys.has("lang")) {
    applyStatic();
    fillFeatureSelect();
    fillLegend();
    headerText();
    syncControls();
    VIEWS.forEach((v) => v.update(null));
    renderConclusion();
    measureBar();
    return;
  }
  if (keys.has("showDyn")) fillFeatureSelect();
  derive(keys);
  syncControls();
  VIEWS.forEach((v) => v.update(keys));
  renderConclusion();
});
if (GUIDE[qs]) selectStep(qs); // an explicit ?step=1..4 also applies that question's settings (used for report figures)
let rt;
addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { measureBar(); VIEWS.forEach((v) => v.update(null)); }, 200); });
