// Analysis components computed in the browser so users can change their parameters interactively.

export const REF_BAND = [50, 60]; // µm, post break-in reference band (all tools incl. T8 have runs here)

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

/** Normalized values of feature f for all runs. mode: raw | z (per machine) | ratio (per tool reference band). */
export function normalize(runs, f, mode) {
  const out = new Float64Array(runs.length);
  if (mode === "raw") { runs.forEach((r, i) => (out[i] = r[f])); return out; }
  if (mode === "z") {
    const st = d3.rollup(runs, (v) => ({ m: d3.mean(v, (r) => r[f]), s: d3.deviation(v, (r) => r[f]) }), (r) => r.machine);
    runs.forEach((r, i) => { const s = st.get(r.machine); out[i] = (r[f] - s.m) / s.s; });
    return out;
  }
  const ref = d3.rollup(runs.filter((r) => r.VB_um >= REF_BAND[0] && r.VB_um <= REF_BAND[1]),
    (v) => median(v.map((r) => r[f])), (r) => r.tool);
  runs.forEach((r, i) => (out[i] = r[f] / ref.get(r.tool)));
  return out;
}

export function normLabel(mode, unit) {
  return mode === "raw" ? unit : mode === "z" ? "z-score within machine" : "× tool reference (VB 50–60 µm)";
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
