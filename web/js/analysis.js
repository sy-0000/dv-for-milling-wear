// Analysis components computed in the browser so users can change their parameters interactively.

export const REF_BAND = [50, 60]; // µm, post break-in reference band (trial only: needs microscope VB)
export const EARLY_BAND = [180, 360]; // s of contact time: first 3–6 min of a new tool (production-feasible)

export const NORMS = {
  early: { label: "× own first 3–6 min", prod: true },
  vbref: { label: "× own VB 50–60 µm", prod: false },
  z: { label: "machine z-score", prod: false },
  raw: { label: "raw", prod: true },
};

export function median(a) {
  const v = a.filter((x) => Number.isFinite(x)).sort((p, q) => p - q);
  if (!v.length) return NaN;
  const m = v.length >> 1;
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}

function ranks(a) {
  const idx = a.map((v, i) => [v, i]).sort((p, q) => p[0] - q[0]);
  const r = new Array(a.length);
  for (let i = 0; i < idx.length;) {
    let j = i;
    while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++;
    const avg = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) r[idx[k][1]] = avg;
    i = j + 1;
  }
  return r;
}

/** Spearman rank correlation, ignoring non-finite pairs. Returns {rho, n}. */
export function spearman(x, y) {
  const xs = [], ys = [];
  for (let i = 0; i < x.length; i++) if (Number.isFinite(x[i]) && Number.isFinite(y[i])) { xs.push(x[i]); ys.push(y[i]); }
  const n = xs.length;
  if (n < 10) return { rho: NaN, n };
  const rx = ranks(xs), ry = ranks(ys);
  const mx = d3.mean(rx), my = d3.mean(ry);
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) { const a = rx[i] - mx, b = ry[i] - my; sxy += a * b; sxx += a * a; syy += b * b; }
  return { rho: sxx && syy ? sxy / Math.sqrt(sxx * syy) : NaN, n };
}

/**
 * Normalized values of feature f for all runs.
 *  raw   : unchanged
 *  early : ÷ median of the same tool's runs with C in 3–6 min  (available in production: no microscope, no future data)
 *  vbref : ÷ median of the same tool's runs with VB 50–60 µm   (trial only: needs microscope)
 *  z     : z-score within machine over all runs                (trial only: needs complete tool lives)
 */
export function normalize(runs, f, mode) {
  const out = new Float64Array(runs.length);
  if (mode === "raw") { runs.forEach((r, i) => (out[i] = r[f])); return out; }
  if (mode === "z") {
    const st = d3.rollup(runs, (v) => ({ m: d3.mean(v, (r) => r[f]), s: d3.deviation(v, (r) => r[f]) }), (r) => r.machine);
    runs.forEach((r, i) => { const s = st.get(r.machine); out[i] = (r[f] - s.m) / s.s; });
    return out;
  }
  const inRef = mode === "early" ? (r) => r.C_s >= EARLY_BAND[0] && r.C_s <= EARLY_BAND[1]
    : (r) => r.VB_um >= REF_BAND[0] && r.VB_um <= REF_BAND[1];
  const ref = d3.rollup(runs.filter(inRef), (v) => median(v.map((r) => r[f])), (r) => r.tool);
  runs.forEach((r, i) => (out[i] = r[f] / ref.get(r.tool)));
  return out;
}

export function normLabel(mode, unit) {
  return mode === "raw" ? unit : mode === "z" ? "z-score within machine"
    : mode === "early" ? "× own level in first 3–6 min" : "× own level at VB 50–60 µm";
}

/** Trailing (causal) rolling median within each tool: uses only the current and previous win-1 runs. */
export function trailingByTool(runs, y, win = 15) {
  const out = new Float64Array(runs.length).fill(NaN);
  let s = 0;
  while (s < runs.length) {
    let e = s;
    while (e < runs.length && runs[e].tool === runs[s].tool) e++;
    for (let i = s; i < e; i++) {
      const a = [];
      for (let k = Math.max(s, i - win + 1); k <= i; k++) a.push(y[k]);
      out[i] = median(a);
    }
    s = e;
  }
  return out;
}

/**
 * Signal-based replacement alarm per tool.
 * Alarm fires at the first run where the trailing median has stayed >= level for `persist` consecutive runs.
 * Level per tool:
 *   manual : one level for all tools
 *   other    : median (over tools of the OTHER machines) of their trailing median at VB ≈ thr  -> out-of-machine test
 *   loo      : same, over the OTHER tools of the SAME machine (leave-one-end-mill-out test)
 *   insample : same, over all tools of the same machine INCLUDING the tested one (in-sample, optimistic)
 */
export function signalAlarms(runs, tools, trail, thr, cal, manualLevel, persist) {
  const atThr = new Map(tools.map((t) => [t, median(runs.filter((r) => r.tool === t && Math.abs(r.VB_um - thr) <= 3).map((r) => trail[r.i]))]));
  const machineOf = new Map(tools.map((t) => [t, runs.find((r) => r.tool === t).machine]));
  return tools.map((t) => {
    const m = machineOf.get(t);
    let level = manualLevel;
    if (cal !== "manual") {
      const pool = tools.filter((u) => (cal === "other" ? machineOf.get(u) !== m
        : cal === "loo" ? machineOf.get(u) === m && u !== t : machineOf.get(u) === m));
      level = median(pool.map((u) => atThr.get(u)));
    }
    const rs = runs.filter((r) => r.tool === t);
    let streak = 0, alarm = null;
    for (const r of rs) {
      streak = trail[r.i] >= level ? streak + 1 : 0;
      if (streak >= persist) { alarm = r; break; }
    }
    const hit = rs.find((r) => r.VB_um >= thr);
    return { tool: t, machine: m, level, alarm, reached: !!hit, Cthr: hit ? hit.C_min : null,
             Calarm: alarm ? alarm.C_min : null, VBalarm: alarm ? alarm.VB_um : null,
             err: alarm && hit ? alarm.C_min - hit.C_min : null, Cmax: rs[rs.length - 1].C_min };
  });
}

/** Contact time [min] at which each tool first reaches VB >= thr. */
export function lifeTable(runs, tools, thr) {
  return tools.map((t) => {
    const rs = runs.filter((r) => r.tool === t);
    const hit = rs.find((r) => r.VB_um >= thr);
    const last = rs[rs.length - 1];
    return { tool: t, machine: rs[0].machine, reached: !!hit, C: (hit ?? last).C_s / 60,
             Cmax: last.C_s / 60, VBmax: d3.max(rs, (r) => r.VB_um) };
  });
}

/** Rolling median of y over a centered window within each tool (runs must be ordered by tool, run). */
export function rollingByTool(runs, y, win = 15) {
  const out = new Float64Array(runs.length).fill(NaN);
  const half = win >> 1;
  let s = 0;
  while (s < runs.length) {
    let e = s;
    while (e < runs.length && runs[e].tool === runs[s].tool) e++;
    for (let i = s; i < e; i++) {
      const a = [];
      for (let k = Math.max(s, i - half); k < Math.min(e, i + half + 1); k++) a.push(y[k]);
      out[i] = median(a);
    }
    s = e;
  }
  return out;
}

/**
 * Layer diagnostics on the raw feature (normalization-independent).
 * jump = layer median vs mean of neighbouring layer medians [%]
 * rise = linear-fit change from first to last run of the layer, relative to the layer median [%]
 */
export function layerDiagnostics(runs, f) {
  const out = [];
  const byTool = d3.group(runs.map((r, i) => ({ r, i })), (d) => d.r.tool);
  for (const [tool, list] of byTool) {
    const layers = d3.groups(list, (d) => d.r.layer).sort((a, b) => a[0] - b[0]);
    const med = layers.map(([, v]) => median(v.map((d) => d.r[f])));
    layers.forEach(([layer, v], k) => {
      const nb = [med[k - 1], med[k + 1]].filter(Number.isFinite);
      const jump = nb.length ? (med[k] / d3.mean(nb) - 1) * 100 : NaN;
      let rise = NaN;
      if (v.length > 5) {
        const xs = v.map((_, j) => j), ys = v.map((d) => d.r[f]);
        const mx = d3.mean(xs), my = d3.mean(ys);
        const slope = d3.sum(xs, (x, j) => (x - mx) * (ys[j] - my)) / d3.sum(xs, (x) => (x - mx) ** 2);
        rise = (slope * (v.length - 1)) / med[k] * 100;
      }
      out.push({ tool, layer, i0: v[0].i, i1: v[v.length - 1].i, median: med[k], jump, rise });
    });
    // a jump in one layer also shows (with opposite sign) in its neighbours: keep only local peaks of |jump|
    const mine = out.filter((o) => o.tool === tool);
    mine.forEach((o, k) => {
      const a = Math.abs(o.jump), p = Math.abs(mine[k - 1]?.jump ?? 0), n = Math.abs(mine[k + 1]?.jump ?? 0);
      o.jumpPeak = Number.isFinite(a) && a >= p && a >= n;
    });
  }
  return out;
}

/**
 * Fixed replacement time per tool for a fixed-time rule.
 *  fleet      : one time for all machines (dragged value or the earliest life of all tools)
 *  machine    : one time per machine (dragged value or the earliest life on that machine; in-sample)
 *  machineLoo : per tool, the earliest life among the OTHER tools of the same machine (leave-one-out)
 * Returns a function tool -> replacement time [min].
 */
export function fixTimes(life, mode, fix) {
  const auto = (list) => d3.min(list.filter((d) => d.reached), (d) => d.C) ?? d3.min(list, (d) => d.C);
  const machineOf = new Map(life.map((d) => [d.tool, d.machine]));
  if (mode === "machineLoo") {
    const o = new Map(life.map((d) => [d.tool, auto(life.filter((e) => e.machine === d.machine && e.tool !== d.tool))]));
    return (t) => o.get(t);
  }
  if (mode === "fleet") { const t = fix.fleet ?? auto(life); return () => t; }
  const o = {};
  for (const m of [1, 2, 3]) o[m] = fix.m[m] ?? auto(life.filter((d) => d.machine === m));
  return (t) => o[machineOf.get(t)];
}

/** Error summary of a fixed-time rule over the tools that reach the threshold (error = replacement − threshold time). */
export function fixedStats(life, tf) {
  const errs = life.filter((d) => d.reached).map((d) => tf(d.tool) - d.C);
  return { mae: errs.length ? d3.mean(errs, Math.abs) : NaN, late: errs.filter((e) => e > 0.05).length, missed: 0, n: errs.length };
}

/** Error summary of a signal alarm (output of signalAlarms); missed alarms are counted separately, not in the MAE. */
export function alarmStats(alarms) {
  const errs = alarms.filter((d) => d.reached && d.alarm).map((d) => d.err);
  return { mae: errs.length ? d3.mean(errs, Math.abs) : NaN, late: errs.filter((e) => e > 0).length,
           missed: alarms.filter((d) => d.reached && !d.alarm).length, n: errs.length };
}
