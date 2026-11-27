// Bilingual UI (中 / EN). Feature names and units stay in English in both languages.
//  - tr(en, zh): inline strings built in the view code
//  - STATIC + applyStatic(): elements with data-i18n="key" (innerHTML), data-i18n-title, data-i18n-aria
import { state } from "./state.js";

export const tr = (en, zh) => (state.lang === "zh" ? zh : en);

export const STATIC = {
  brand: { en: "End-mill wear", zh: "刀具磨耗判讀" },
  q1: { en: "One replacement time for all machines?", zh: "所有機台用同一個換刀時間？" },
  q2: { en: "Does torque rise with wear?", zh: "扭矩會跟著磨耗上升嗎？" },
  q3: { en: "Can a signal set the alarm?", zh: "能用訊號設定警報嗎？" },
  q4: { en: "Is this jump really wear?", zh: "這個跳升真的是磨耗嗎？" },
  qall: { en: "All views", zh: "全部視圖" },
  note1: { en: "Compare the wear curves of the nine end mills (V1) with the replacement rules (V2). Machine and tool batch are confounded.",
           zh: "比較九把刀的磨耗曲線（V1）和換刀規則（V2）。注意機台和刀具批次分不開。" },
  note2: { en: "A worn tool needs more force to keep the same speed and feed. Does a production signal follow wear in every end mill (V3)? Do all machines rise (V4)?",
           zh: "刀越鈍，維持同樣轉速和進給要越大力。產線訊號是否在每把刀都跟著磨耗（V3）？三台機台都上升嗎（V4）？" },
  note3: { en: "A trend is not yet a replacement time. Set the alarm level on the other machines or on the same machine and compare with the baseline in the scoreboard.",
           zh: "趨勢對不代表能決定換刀時間。用其他機台或同機台校正警示線，和計分板的基準比較。" },
  note4: { en: "Compare flagged layers (J = jump, R = rise) with the alarm. Pin a run before the jump and open one inside it in V6.",
           zh: "比對被標記的層（J 層間跳升、R 層內上升）與警報；在跳升前後各釘一個 run，在 V6 比較細節。" },
  noteall: { en: "All six views at full size, for free exploration. Selections are shared with Q1–Q4.",
             zh: "六個視圖全部放大，方便自由探索；選取狀態和 Q1–Q4 共用。" },
  thumbs: { en: "Other views · still linked", zh: "其他視圖 · 縮圖仍連動" },
  thumbsHint: { en: "Click a thumbnail to open the question that uses it. Selections in the large views update the thumbnails.",
                zh: "點縮圖會切到使用該視圖的問題；在大圖上的選取會即時反映在縮圖上。" },
  open: { en: "open", zh: "展開" },
  reset: { en: "Reset", zh: "重設" },
  feature: { en: "Feature", zh: "特徵" },
  norm: { en: "Norm.", zh: "正規化" },
  vbLimit: { en: "VB limit", zh: "VB 門檻" },
  dyn: { en: "Dynamometer ref.", zh: "測力計參考" },
  normEarly: { en: "× own first 3–6 min", zh: "× 自己前 3–6 分鐘" },
  normVbref: { en: "× own VB 50–60 µm", zh: "× 自己 VB 50–60 µm" },
  normZ: { en: "machine z-score", zh: "機台 z-score" },
  normRaw: { en: "raw", zh: "原始值" },
  normTitle: { en: "early: divide by the same end mill's median in its first 3–6 min (available in production). VB 50–60 µm and z-score need microscope data or complete tool lives (trial only).",
               zh: "前 3–6 分鐘：除以同一把刀前 3–6 分鐘的中位數（產線可用）。VB 50–60 µm 和 z-score 需要顯微鏡資料或完整壽命（只限試驗）。" },
  about: { en: "Can signals the machine already has — <b>without a dynamometer</b> — tell when to replace an end mill? Target user: a process engineer introducing tool-condition monitoring on a machine fleet. In production only <b>machine-control signals</b> are available; the dynamometer is shown as a <i>reference</i> from the trial.",
           zh: "只靠機台本身就有的訊號、<b>不用測力計</b>，能不能知道什麼時候該換刀？目標使用者：在多台機台導入刀具監控的製程工程師。產線上只有<b>機台控制訊號</b>，測力計只是試驗時的<i>參考</i>。" },
  conclLabel: { en: "Conclusion", zh: "結論" },
  limits: { en: "Data limitations &amp; source", zh: "資料限制與來源" },
  // view titles and short names
  v1t: { en: "V1 · Wear curves per end mill", zh: "V1 · 各刀磨耗曲線" },
  v1s: { en: "Wear curves", zh: "磨耗曲線" },
  v2t: { en: "V2 · Scoreboard: replacement rules", zh: "V2 · 換刀規則計分板" },
  v3t: { en: "V3 · Which signal follows wear?", zh: "V3 · 哪個訊號跟著磨耗？" },
  v3s: { en: "Feature × end mill ρ", zh: "特徵 × 刀 ρ" },
  v4t: { en: "V4 · Feature vs wear", zh: "V4 · 特徵 vs 磨耗" },
  v4s: { en: "Feature vs VB", zh: "特徵 vs VB" },
  v5t: { en: "V5 · Run timeline of", zh: "V5 · Run 時序：" },
  v5s: { en: "Run timeline", zh: "Run 時序" },
  v6t: { en: "V6 · Run details", zh: "V6 · Run 細節" },
  v6s: { en: "Run details", zh: "Run 細節" },
  analysis: { en: "analysis", zh: "分析" },
  sortBy: { en: "Sort by", zh: "排序" },
  sortMin: { en: "worst end mill", zh: "最差的刀" },
  sortPooled: { en: "all pooled", zh: "全部合併" },
  trend: { en: "trend lines", zh: "趨勢線" },
  jump: { en: "Layer jump ≥", zh: "層間跳升 ≥" },
  rise: { en: "In-layer rise ≥", zh: "層內上升 ≥" },
  rule: { en: "Rule", zh: "規則" },
  mFleet: { en: "fixed · all", zh: "固定 · 全廠" },
  mMachine: { en: "fixed · per machine", zh: "固定 · 每台" },
  mLoo: { en: "per machine · LOO", zh: "每台 · 留一法" },
  mSignal: { en: "signal alarm", zh: "訊號警示" },
  sig1: { en: "Alarm when the trailing median (15 runs) of the <b>selected feature</b> stays ≥ level for", zh: "當<b>所選特徵</b>的滑動中位數（15 個 run）連續" },
  sig2: { en: "runs. Level:", zh: "個 run ≥ 警示線時報警。警示線：" },
  calOther: { en: "calibrated on the other machines", zh: "用其他機台校正" },
  calLoo: { en: "same machine, other end mills <i>(leave-one-out)</i>", zh: "同機台、其他刀<i>（留一法）</i>" },
  calIn: { en: "same machine incl. itself <i>(in-sample)</i>", zh: "同機台含自己<i>（樣本內）</i>" },
  calManual: { en: "manual", zh: "手動" },
  v6empty: { en: "Click a run in V4 or V5.", zh: "在 V4 或 V5 點一個 run。" },
  // info popovers
  i1: { en: "VB (flank wear) vs cumulated contact time, one row per machine; dashed line = VB threshold. Drag horizontally in a panel to filter a contact-time range (updates V3 and V4); click a panel to select the end mill. VB is measured every 1–2 layers and interpolated in between.",
        zh: "VB（刀腹磨耗）對累計切削時間，一列一台機台；虛線 = VB 門檻。在小圖上水平拖曳可篩選時間範圍（會更新 V3、V4）；點小圖選擇刀具。VB 每 1–2 層量一次，中間為內插。" },
  i2: { en: "<p><b>Scoreboard:</b> every rule under the same test — mean |replacement time − time VB reaches the threshold| over the end mills that reach it; missed alarms are counted separately. Dashed line = baseline (fixed time per machine, leave-one-out). Click a rule to show it below.</p><p><b>Bars below:</b> time until VB reaches the threshold; dark = used, light = unused life, hatched = overrun / late, ▼ = alarm. Drag the dashed line to change a fixed replacement time. Leave-one-out: each end mill gets the earliest life of the <i>other</i> end mills of its machine.</p><p>M2 end mills are tool batch B: machine and batch effects are confounded.</p>",
        zh: "<p><b>計分板：</b>所有規則用同一個測試——平均 |換刀時間 − VB 達門檻時間|，只算有達門檻的刀；漏報另外計數。虛線 = 基準（每台機台固定時間，留一法）。點一條規則，下方顯示它的細節。</p><p><b>下方長條：</b>到達門檻的時間；深色 = 用掉的壽命、淺色 = 浪費的壽命、斜線 = 超過門檻／太晚、▼ = 警示。拖曳虛線可改固定換刀時間。留一法：每把刀的時間只用同機台<i>其他</i>刀的最短壽命。</p><p>M2 的刀是批次 B：機台和批次的影響分不開。</p>" },
  i3: { en: "Spearman ρ between the feature (current normalization, current time filter) and VB, per end mill and pooled. Hover a cell for ρ and n; click a row to select the feature. All 8 machine-control features are listed; of the 13 dynamometer features only 2 representatives are shown (the rest are in the Feature menu). Feed axis: M1 = ball-screw motor torque [Nm], M2/M3 = linear-motor force [N], and M2 runs tool batch B, so units and batches differ across machines. Within an end mill VB is mostly interpolated from contact time, so per-end-mill ρ is optimistic.",
        zh: "特徵（目前的正規化與時間篩選）和 VB 的 Spearman ρ，分每把刀和全部合併。滑鼠移到格子上看 ρ 和 n；點一列即選擇該特徵。列出全部 8 個機台控制特徵；13 個測力計特徵只顯示 2 個代表（其餘在特徵選單中）。進給軸：M1 是滾珠螺桿馬達扭矩 [Nm]，M2/M3 是線性馬達出力 [N]，且 M2 是批次 B，跨機台的單位與批次不同。單把刀內的 VB 多為依時間內插，所以單刀 ρ 會偏樂觀。" },
  i4: { en: "Each dot = one run (feature after normalization vs VB). Lines = per-end-mill rolling median, line style per machine (M1 solid · M2 dashed · M3 dotted). Gray band = range of the feature level at which the end mills reach the VB threshold: this is where an alarm level would be calibrated. Drag a box to brush runs (highlighted in V1 and V5); click a dot to open the run.",
        zh: "每個點 = 一個 run（正規化後的特徵對 VB）。線 = 每把刀的滑動中位數，線型代表機台（M1 實線 · M2 虛線 · M3 點線）。灰色帶 = 各刀到達 VB 門檻時的特徵水準範圍，也就是警示線校正的位置。框選可刷選 run（在 V1、V5 高亮）；點一個點可開啟該 run。" },
  i5: { en: "Feature per run of the selected end mill; faint bands and ticks mark layers (29 runs each). Flags: <b>J</b> = jump vs neighbouring layers, <b>R</b> = rise within the layer (computed on the raw feature). In signal-alarm mode the black line is the trailing median (15 runs), the dashed line the alarm level and ▼ the alarm. Bottom strip: VB, interpolated between microscope measurements. Click a run to open it in V6.",
        zh: "所選刀具每個 run 的特徵；淡色帶和刻度標出層（每層 29 個 run）。標記：<b>J</b> = 和相鄰層比的跳升，<b>R</b> = 層內上升（用原始特徵計算）。在訊號警示模式下，黑線是滑動中位數（15 個 run）、虛線是警示線、▼ 是警示。下方小條：VB，在顯微鏡量測之間內插。點一個 run 在 V6 開啟。" },
  i6: { en: "Signal envelopes of the selected run: machine signals (machine colour) and the dynamometer reference (gray). Faint band = detected cut; dashed lines = window used for the features. “Pin as comparison” keeps a run in light gray. Bottom: 20 ms of the raw force at 25 kHz from the nearest representative run of the same end mill (peaks = cutting edges).",
        zh: "所選 run 的訊號包絡：機台訊號（機台色）和測力計參考（灰）。淡色帶 = 偵測到的切削段；虛線 = 計算特徵用的時間窗。「釘選比較」會把一個 run 以淺灰保留。下方：同一把刀最接近的代表 run 的 20 ms 原始力波形（25 kHz，峰值 = 刀刃）。" },
};

export function applyStatic() {
  const L = state.lang;
  document.documentElement.lang = L === "zh" ? "zh-Hant" : "en";
  document.querySelectorAll("[data-i18n]").forEach((el) => { const s = STATIC[el.dataset.i18n]; if (s) el.innerHTML = s[L]; });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => { const s = STATIC[el.dataset.i18nTitle]; if (s) el.title = s[L]; });
  document.querySelectorAll("[data-i18n-aria]").forEach((el) => { const s = STATIC[el.dataset.i18nAria]; if (s) el.setAttribute("aria-label", s[L]); });
  document.querySelectorAll(".lang button").forEach((b) => b.classList.toggle("on", b.dataset.lang === L));
}

/** Initial language: ?lang=en|zh, then the last choice in this browser, else Chinese. */
export function initialLang() {
  const q = new URLSearchParams(location.search).get("lang");
  if (q === "en" || q === "zh") return q;
  try { const s = localStorage.getItem("wearlens-lang"); if (s === "en" || s === "zh") return s; } catch (e) { /* storage blocked */ }
  return "zh";
}
export function rememberLang(l) { try { localStorage.setItem("wearlens-lang", l); } catch (e) { /* storage blocked */ } }
