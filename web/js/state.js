// Global UI state with a tiny publish/subscribe mechanism.
// Muted, colour-vision-safe machine hues (same values as --m1..--m3 in style.css; validated with the dataviz
// skill's validate_palette.js) and the single accent reserved for alarms and selected objects.
export const MACHINE_COLOR = { 1: "#4a76b8", 2: "#c4862e", 3: "#3f9b78" };
export const ACCENT = "#b0306f";
export const INK = "#1d1d1b", INK2 = "#5c5b57", GRAY = "#8f8e89", BAND = "#f5f4f1";
// secondary encoding (colour-vision deficiency): line style per machine
export const MACHINE_DASH = { 1: null, 2: "7 3", 3: "2 2" };

export const state = {
  lang: "zh",             // zh | en (UI language; set from ?lang= / last choice in main.js)
  feature: "Tsp_mean",
  norm: "early",          // early (production) | vbref | z | raw
  showDyn: true,          // show dynamometer reference rows / panels
  vbThr: 140,             // µm
  jumpThr: 5,             // % layer jump flag
  riseThr: 20,            // % within-layer rise flag
  cRange: null,           // [min, max] contact time filter in minutes (V1 brush)
  brushed: null,          // Set of run indices brushed in V4
  tool: 1,                // selected tool
  runIdx: null,           // selected run (index into runs array)
  pinIdx: null,           // pinned comparison run in V6
  fix: { mode: "fleet", fleet: null, m: { 1: null, 2: null, 3: null } }, // mode: fleet | machine | signal; null = auto
  alarm: { cal: "other", level: 1.25, persist: 1 }, // signal-based rule: calibration (other | own | manual), level, persistence [runs]
};

const subs = [];
export function on(fn) { subs.push(fn); }
export function set(patch) {
  Object.assign(state, patch);
  const keys = new Set(Object.keys(patch));
  subs.forEach((fn) => fn(keys));
}
