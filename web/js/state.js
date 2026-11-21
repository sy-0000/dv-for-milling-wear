// Global UI state with a tiny publish/subscribe mechanism.
export const MACHINE_COLOR = { 1: "#2a78d6", 2: "#eb6834", 3: "#1baf7a" };

export const state = {
  feature: "Tsp_mean",
  norm: "ratio",          // raw | z | ratio
  showDyn: true,          // show dynamometer reference rows / panels
  vbThr: 140,             // µm
  jumpThr: 5,             // % layer jump flag
  riseThr: 20,            // % within-layer rise flag
  cRange: null,           // [min, max] contact time filter in minutes (V1 brush)
  brushed: null,          // Set of run indices brushed in V4
  tool: 1,                // selected tool
  runIdx: null,           // selected run (index into runs array)
  pinIdx: null,           // pinned comparison run in V6
  fix: { mode: "fleet", fleet: null, m: { 1: null, 2: null, 3: null } }, // null = auto
};

const subs = [];
export function on(fn) { subs.push(fn); }
export function set(patch) {
  Object.assign(state, patch);
  const keys = new Set(Object.keys(patch));
  subs.forEach((fn) => fn(keys));
}
