import { state, set, on, MACHINE_COLOR } from "./state.js";
import { normalize, rollingByTool, trailingByTool, layerDiagnostics, signalAlarms } from "./analysis.js";
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
document.getElementById("ctl-reset").onclick = () => leaveStep() ||
  set({ cRange: null, brushed: null, runIdx: null, pinIdx: null, fix: { mode: state.fix.mode, fleet: null, m: { 1: null, 2: null, 3: null } } });

d3.select("#legend").selectAll("span").data(Object.entries(meta.machines)).join("span")
  .html(([m, d]) => `<i style="background:${MACHINE_COLOR[m]}"></i>M${m} · E${d.tools[0]}–E${d.tools[2]}`)
  .attr("title", ([, d]) => `${d.name}, ${d.control}, ${d.drive}, tool batch ${d.batch}${d.note ? " — " + d.note : ""}`);
document.getElementById("limitations").innerHTML = meta.limitations.join("<br>");

function syncControls() {
  if (fSel.value !== state.feature) fSel.value = state.feature;
  nSel.value = state.norm;
  const prod = state.norm === "early" || state.norm === "raw", badge = document.getElementById("norm-badge");
  badge.textContent = prod ? "production" : "trial only";
  badge.classList.toggle("warn", !prod);
  document.getElementById("ctl-dyn").checked = state.showDyn;
  for (const [id, out, key, unit] of [["ctl-thr", "out-thr", "vbThr", "µm"], ["ctl-jump", "out-jump", "jumpThr", "%"],
    ["ctl-rise", "out-rise", "riseThr", "%"]]) {
    document.getElementById(id).value = state[key];
    document.getElementById(out).textContent = `${state[key]} ${unit}`;
  }
}

// ---------- guided steps (follow the demo narrative: apply settings + point at the relevant views) ----------
const GUIDE = {
  1: { patch: { feature: "Tsp_mean", norm: "early", vbThr: 140, cRange: null, brushed: null, tool: 4,
                fix: { mode: "fleet", fleet: null, m: { 1: null, 2: null, 3: null } } },
       views: ["v1", "v2"],
       note: "① V1: each machine has its own tool life (end mills in one row almost overlap). V2: one fixed time for all machines "
           + "wastes 34–36 % of every M2 end mill. Alternatives: one time per machine, or let a machine signal tell when. "
           + "Machine and tool batch are confounded." },
  2: { patch: { feature: "Tsp_mean", norm: "early", cRange: null, brushed: null, showDyn: true },
       views: ["v3", "v4", "v6"],
       note: "② Hypothesis: a worn tool needs more force to keep the same speed and feed. V3: does a production signal follow wear "
           + "in every end mill, and how close is it to the dynamometer? V4: do all machines rise? Optional: pin an early run "
           + "and open a late run of the same end mill in V6." },
  3: { patch: { feature: "Tsp_mean", norm: "early", cRange: null, brushed: null,
                fix: { mode: "signal", fleet: null, m: { 1: null, 2: null, 3: null } }, alarm: { cal: "other", level: 1.25, persist: 1 } },
       views: ["v2", "v4"],
       note: "③ A trend is not yet a replacement time. V2: an alarm level calibrated on the other machines — does it work on a new machine? "
           + "Compare the band heights in V4. Then switch the level to 'same machine, other end mills' and compare with the baseline in the scoreboard." },
  4: { patch: { feature: "Tsp_mean", norm: "early", tool: 1, runIdx: null, brushed: null, showDyn: true,
                fix: { mode: "signal", fleet: null, m: { 1: null, 2: null, 3: null } }, alarm: { cal: "other", level: 1.25, persist: 1 } },
       views: ["v5", "v6", "v2"],
       note: "④ Where does the largest error come from? In V5, compare flagged layers (J = jump, R = rise) with the alarm. "
           + "Pin a run before the flagged layer and open one inside it in V6. Is it wear? Then try a longer persistence in V2." },
};
// Focus per step: views of the active step stay normal, the others fade (hover restores them). Clicking the active step,
// ✕ or Reset leaves the step.
let activeStep = null;
function leaveStep() {
  activeStep = null;
  document.querySelectorAll(".guide button").forEach((x) => x.classList.remove("on"));
  document.querySelectorAll(".view").forEach((v) => v.classList.remove("dim"));
  document.getElementById("guide-note").hidden = true;
  measureBar();
}
document.getElementById("guide-close").onclick = () => leaveStep();
document.querySelectorAll(".guide button").forEach((b) => (b.onclick = () => {
  if (activeStep === b.dataset.step) return leaveStep();
  activeStep = b.dataset.step;
  const g = GUIDE[activeStep];
  document.querySelectorAll(".guide button").forEach((x) => x.classList.toggle("on", x === b));
  const note = document.getElementById("guide-note");
  note.querySelector("span").textContent = g.note;
  note.hidden = false;
  set(g.patch);
  measureBar();
  document.querySelectorAll(".view").forEach((v) => v.classList.toggle("dim", !g.views.includes(v.id)));
  // scroll to the step row of the first evidence view; the scoreboard (V2) is always visible on wide screens
  const target = g.views.map((id) => document.getElementById(id).closest(".step")).find(Boolean);
  target.scrollIntoView({ behavior: "smooth", block: "start" });
}));

// sticky bar height -> CSS variable, so the sticky scoreboard and scroll targets sit below it
function measureBar() {
  document.documentElement.style.setProperty("--bar-h", `${document.getElementById("bar").offsetHeight}px`);
}
measureBar();

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
addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { measureBar(); VIEWS.forEach((v) => v.update(null)); }, 200); });
