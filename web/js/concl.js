// Live conclusion box per guided question. It only reads results of the existing analysis components
// (life table, fixed-time and alarm rules, Spearman ρ, layer flags) for the current settings and writes them as text.
import { state } from "./state.js";
import { tr } from "./i18n.js";
import { lifeTable, fixTimes, fixedStats, alarmStats, signalAlarms, normalize, spearman, isFlagged } from "./analysis.js";

const f1 = (v) => (Number.isFinite(v) ? v.toFixed(1) : "–");
const f2 = (v) => (Number.isFinite(v) ? v.toFixed(2) : "–");

export function conclusion(step, ctx) {
  const thr = state.vbThr;
  if (step === "1") {
    const life = lifeTable(ctx.runs, ctx.tools, thr), tFleet = fixTimes(life, "fleet", state.fix)(1);
    const waste = (m) => {
      const v = life.filter((d) => d.machine === m && d.reached && tFleet < d.C).map((d) => ((d.C - tFleet) / d.C) * 100);
      return v.length ? d3.mean(v) : 0;
    };
    const loo = fixedStats(life, fixTimes(life, "machineLoo", state.fix));
    const w = [1, 2, 3].map(waste), worst = d3.maxIndex(w) + 1;
    return {
      title: tr("Each machine has its own tool life", "每台機台有自己的壽命"),
      body: tr(`With one time for all machines (${f1(tFleet)} min), M${worst} end mills waste ${w[worst - 1].toFixed(0)} % of their life on average. `
          + `One time per machine (leave-one-out): mean error ${f1(loo.mae)} min, ${loo.late} late. This is the baseline a signal rule must beat.`,
        `全廠用同一個時間（${f1(tFleet)} min）時，M${worst} 的刀平均浪費 ${w[worst - 1].toFixed(0)}% 壽命。`
          + `每台機台各訂時間（留一法）：平均誤差 ${f1(loo.mae)} min、${loo.late} 次太晚。這是訊號規則要打贏的基準。`),
    };
  }
  if (step === "2") {
    const info = ctx.meta.features[state.feature], sub = ctx.runs.filter(ctx.inRange);
    const per = ctx.tools.map((t) => { const rs = sub.filter((r) => r.tool === t); return spearman(rs.map((r) => ctx.y[r.i]), rs.map((r) => r.VB_um)).rho; });
    const minR = d3.min(per), pooled = spearman(sub.map((r) => ctx.y[r.i]), sub.map((r) => r.VB_um)).rho;
    const yFx = normalize(ctx.runs, "Fx_mean", state.norm), fx = spearman(sub.map((r) => yFx[r.i]), sub.map((r) => r.VB_um)).rho;
    const all = minR >= 0.8;
    return {
      title: all ? tr(`${info.label}: rises with wear in every end mill`, `${info.label}：每把刀都跟著磨耗上升`)
        : tr(`${info.label}: not every end mill follows wear`, `${info.label}：不是每把刀都跟著磨耗`),
      body: tr(`Lowest ρ over the nine end mills ${f2(minR)}, pooled ρ ${f2(pooled)} (dynamometer Force X: ${f2(fx)}).`,
          `九把刀最低 ρ = ${f2(minR)}，全部合併 ρ = ${f2(pooled)}（測力計 Force X：${f2(fx)}）。`)
        + (info.source === "dynamometer" ? tr(" Dynamometer features are not available in production.", "測力計特徵在產線上沒有。")
          : tr(" A trend alone does not yet set a replacement time: see Q3.", "趨勢對不代表能決定換刀時間：見 Q3。")),
    };
  }
  if (step === "3") {
    const a = state.alarm, life = lifeTable(ctx.runs, ctx.tools, thr);
    const run = (cal) => alarmStats(signalAlarms(ctx.runs, ctx.tools, ctx.trail, thr, cal, a.level, a.persist));
    const o = run("other"), l = run("loo"), b = fixedStats(life, fixTimes(life, "machineLoo", state.fix));
    const loses = !(l.mae <= b.mae);
    return {
      title: loses ? tr("The alarm level does not transfer; the signal still loses to a fixed time", "警示線不能跨機台，訊號仍輸給固定時間")
        : tr("The per-machine signal alarm matches the fixed time", "每台各自校正的訊號警示追上固定時間"),
      body: tr(`Level from the other machines: mean error ${f1(o.mae)} min, ${o.missed} missed. Same machine (leave-one-out): ${f1(l.mae)} min, `
          + `${l.missed} missed. Baseline, fixed time per machine: ${f1(b.mae)} min.`,
        `用其他機台校正：平均誤差 ${f1(o.mae)} min、${o.missed} 支漏報。同機台（留一法）：${f1(l.mae)} min、${l.missed} 支漏報。`
          + `基準（每台機台固定時間）：${f1(b.mae)} min。`),
    };
  }
  if (step === "4") {
    const t = state.tool, al = ctx.alarms.find((d) => d.tool === t);
    const isF = (l) => isFlagged(l, state.jumpThr, state.riseThr);
    const nF = ctx.layers.filter(isF).length;
    const rule = tr(" Rule: an alarm in a flagged layer triggers an inspection, not a replacement.", "規則：警示落在被標記的層 → 先檢查，不直接換刀。");
    if (!al || !al.alarm) {
      return { title: tr(`E${t}: no alarm with the current settings`, `E${t}：目前設定下沒有警示`),
        body: tr(`${nF} of ${ctx.layers.length} layers are flagged.`, `全部 ${ctx.layers.length} 層中有 ${nF} 層被標記。`) + rule };
    }
    const layers = ctx.layers.filter((l) => l.tool === t), k = layers.findIndex((l) => l.layer === al.alarm.layer);
    const L = layers[k], next = layers[k + 1], flagged = L && isF(L);
    const drop = next && L ? (next.median / L.median - 1) * 100 : NaN;
    const when = al.err == null ? "" : al.err < 0 ? tr(`${f1(-al.err)} min early`, `提早 ${f1(-al.err)} min`) : tr(`${f1(al.err)} min late`, `晚了 ${f1(al.err)} min`);
    const title = flagged
      ? (drop < 0 ? tr(`E${t}: the alarm falls in a flagged layer and the next layer falls back — likely not wear`, `E${t}：警示落在被標記的層，下一層回落 → 可能不是磨耗`)
        : tr(`E${t}: the alarm falls in a flagged layer — inspect`, `E${t}：警示落在被標記的層 → 先檢查`))
      : tr(`E${t}: the alarm is not in a flagged layer — the level itself is off`, `E${t}：警示不在被標記的層，是警示線本身不準`);
    return {
      title,
      body: tr(`Alarm at run ${al.alarm.run} (layer ${al.alarm.layer}, VB ${al.alarm.VB_um} µm)${when ? ", " + when : ""}.`
          + (Number.isFinite(drop) ? ` Next layer median ${drop >= 0 ? "+" : ""}${drop.toFixed(0)} %.` : "")
          + ` ${nF} of ${ctx.layers.length} layers are flagged.`,
        `警示在 run ${al.alarm.run}（第 ${al.alarm.layer} 層，VB ${al.alarm.VB_um} µm）${when ? "，" + when : ""}。`
          + (Number.isFinite(drop) ? `下一層中位數 ${drop >= 0 ? "+" : ""}${drop.toFixed(0)}%。` : "")
          + `全部 ${ctx.layers.length} 層中有 ${nF} 層被標記。`) + rule,
    };
  }
  return null;
}
