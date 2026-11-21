# Demo 腳本

> ⚠️ 老師規定:現場 demo 每組約 **5 分鐘 demo + 5 分鐘問答**;影片 **4–6 分鐘、需英文旁白或字幕**。
> 下面的 **3 分鐘核心版**是原本規劃的長度,**5 分鐘完整版**是在核心版之外加上 ⊕ 標記的段落。影片可以直接用 5 分鐘版加英文旁白。
> 所有數字都已在 `docs/07_verification.md` 核對過。

事前準備:瀏覽器縮放 110%;按 **Reset selections**;門檻 140 µm;正規化選 × tool reference。

---

## 0:00–0:30 開場:使用者與挑戰
**做什麼**:停在首頁,滑鼠指標指向標題列。
**說(中)**:我們的使用者是要在多台機台導入刀具監控的製程工程師。現場三個問題:刀什麼時候換、哪個機台訊號能代替顯微鏡、訊號變了是不是真的磨耗。產線上沒有測力計,所以主要指標只用機台控制器訊號。
**EN**: "WearLens is for process engineers who want to roll out tool-condition monitoring across a fleet of machine tools. They face three questions: when to replace a tool, which built-in machine signal can replace the microscope, and whether a signal change is really wear. In production there is no dynamometer, so our main indicators are machine-control signals only."

## 0:30–1:20 ① 換刀策略(V1 + V2)
**做什麼**:按 **① Replacement strategy**。指向 V1 的三列,再指向 V2。
**說**:同型號的刀,M2 的三把磨到 140 µm 要 81–84 分鐘,M1、M3 只要 53–58 分鐘。如果全廠用同一個換刀時間 53.5 分鐘,M2 的刀會浪費 34–36% 的壽命。
**做什麼**:按 V2 的 **one time per machine**。
**說**:改成每台機台各自訂時間,平均浪費只剩約 2%。但要注意,M2 的刀全是批次 B,機台和批次的影響分不開(指向圖說)。
**EN**: "M2 tools need 81–84 minutes to reach 140 µm, M1 and M3 tools only 53–58. One fleet-wide replacement time leaves 34–36 % of every M2 tool unused; one time per machine cuts that to about 2 %. Caveat: all M2 tools come from a different batch, so machine and batch effects are confounded."

## 1:20–2:20 ② 選一個產線指標(V3 + V4)
**做什麼**:按 **② Choose an indicator**。指向 V3 上半部(機台訊號)。
**說**:V3 是每個特徵和磨耗的相關。上半部是產線拿得到的訊號,下半部灰色的是測力計,只當參考。主軸扭矩在 9 把刀都 ≥ 0.97。
**做什麼**:把正規化切成 **raw**,指 V3 的 All 欄(主軸扭矩約 .57),再切回 **× tool reference**(.97)。
**說**:原始值不能跨機台比較,三台機台的起點不同;除以每把刀磨合期之後的參考值,就可以放在一起比。
**做什麼**:指向 V4 的紫色帶。
**說**:到 140 µm 時,9 把刀的主軸扭矩都落在參考值的 1.2–1.32 倍。所以「主軸扭矩上升約 25%」有機會當作不用顯微鏡的換刀警示,但只有 9 把刀,這是假說,不是結論。
**EN**: "Spindle torque follows wear in all nine tools. Raw values don't transfer across machines, but relative to each tool's own post-break-in level, all nine tools reach 1.2 to 1.32 times that level at 140 µm. A rise of about 25 % in spindle torque is a candidate microscope-free alarm — a hypothesis to validate, since we only have nine tools."

## 2:20–3:00 ③ 檢查可疑變化(V5 + V6)
**做什麼**:按 **③ Check suspicious changes**(T1)。指向 V5 上方的紫色 **J** 旗標(第 15 層)。點旗標前一層的一個 run,按 **pin as comparison**,再點第 15 層的一個 run。
**說**:T1 第 15 層主軸扭矩整層跳高約 20%,下一層又回落。V6 中機台訊號和測力計參考兩套獨立系統同時跳,所以不是感測器問題。但磨耗不會倒退,所以這段的變化不完全是磨耗。如果只看指標,會誤以為磨耗突然加速、提早換刀。
**EN**: "In T1, layer 15 jumps by about 20 % and then drops back. Both the machine signal and the dynamometer reference show it, so it isn't a sensor glitch — but wear can't go backwards. Without drilling down, an alarm based on the indicator alone would fire too early."

**(3 分鐘核心版到此結束,可以接一句總結)**

## ⊕ 3:00–4:00 補充:T9 的層內鋸齒,以及連動操作
**做什麼**:在 V5 下拉選 **T9**,特徵選 **Force |Fxy|, mean**(測力計參考)。指向第 10–14 層的 **R** 旗標。
**說**:T9 每一層內的力上升 30–50%,換層時又重置,主軸扭矩也有同步但較小(約 4%)的鋸齒。這和換層同步,可能跟換層停機量 VB 有關,但資料中沒有紀錄能證實,我們只把它標記出來,交給工程師判斷。
**做什麼**:在 V1 拖曳一段時間範圍,讓觀眾看 V3 重新排序(有動畫)、V4 淡化範圍外的點;再在 V4 框選一群點,看 V1、V5 同步高亮。
**EN**: "Linking: brushing a time range in V1 re-ranks the features in V3 and fades the other runs in V4; brushing points in V4 highlights them in V1 and V5."

## ⊕ 4:00–4:40 總結:回到三個挑戰
**說**:
1. 換刀:依機台訂時間,可以把浪費從約 35% 降到約 2%。
2. 指標:主軸扭矩加上依刀具正規化,是跨機台最一致的產線訊號。
3. 誤報:層級旗標加上下鑽比對,可以分辨真正的磨耗和換層造成的變化。
限制:VB 大多是內插值,只有 9 把刀,M2 的機台和批次效應混淆。
**EN**: "Back to the three challenges: per-machine replacement times cut unused life from about 35 % to about 2 %; normalized spindle torque is the most consistent production signal across machines; and layer flags plus drill-down separate real wear from layer-related changes. Limitations: interpolated VB labels, nine tools, and machine–batch confounding."

---

## 預想問題(依老師的 AI 審查格式準備)
| 可能被問的問題 | 回答重點 |
|---|---|
| 為什麼不直接訓練模型預測 VB? | 只有 9 把刀,無法驗證能否套用到新機台;VB 大多是內插的;異常需要人解釋;工程師要先看到證據才敢在產線上用 |
| ρ ≈ 0.99 不是太高了嗎? | 對,單把刀內 VB 是依時間內插的,會高估。所以我們看跨機台合併後的 ρ,以及 V4 曲線是否重疊,而不是只看單把刀的 ρ |
| 為什麼用 VB 50–60 µm 當參考? | 三台機台的刀都會快速磨過磨合期;T8 缺早期資料,但也有這段區間,所以 9 把刀都能用 |
| M2 壽命長是因為機台嗎? | 無法確定,M2 的刀全是批次 B,我們在 V2 圖說和報告限制中都有標註 |
| 層級旗標的門檻怎麼定? | 依 9 把刀所有層的分布:主軸扭矩的層間跳動第 95 百分位數約 1%,T1 第 15 層 19%;預設 5%,使用者可以調整 |
| 測力計產線沒有,為什麼還要顯示? | 它是試驗階段的「參考答案」,用來驗證機台訊號;介面上一律灰色並標「reference only」 |
