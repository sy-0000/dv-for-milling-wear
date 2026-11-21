# Demo 腳本(修訂版)

> 老師規定:現場 demo 約 **5 分鐘 + 5 分鐘問答**;影片 **4–6 分鐘,需英文旁白或字幕**。
> **3 分鐘核心版** = 0:00–3:00;**5 分鐘完整版**再加上標 ⊕ 的段落。
> 數字來自 `data/verify_expected.json`,網頁顯示已由 `scripts/verify_app.js` 核對。刀具名稱為 **E1–E9**。

事前準備:瀏覽器縮放 110%;按 **Reset selections**;正規化選 **× own first 3–6 min**;VB 門檻 140 µm。

---

## 0:00–0:25 開場
**說**:使用者是要在多台機台導入刀具監控的製程工程師,產線上只有機台控制器的訊號。他們有三個問題:該用什麼換刀規則、哪個訊號可以取代顯微鏡、訊號變了是不是真的磨耗。
**EN**: "WearLens supports process engineers who introduce tool-condition monitoring on several machine tools. In production they only have machine-control signals. They need to choose a replacement rule, find a signal that can replace the microscope, and tell real wear from other signal changes."

## 0:25–1:10 ① 固定時間規則(V1、V2)
**做**:按 **①**。指向 V1 三列 → V2。
**說**:如果全廠用同一個換刀時間 53.5 分鐘,M2 的刀會浪費 34–36% 的壽命。**做**:按 **fixed time · per machine** → 平均浪費約 2%。**說**:但 M2 的刀全來自另一個批次,所以這不一定是機台的功勞。而且每台機台各自訂時間,前提是要先跑過整把刀的壽命。能不能改用訊號?
**EN**: "One fixed time for all machines leaves 34–36 % of every M2 end mill unused; one time per machine cuts that to about 2 %. But the M2 end mills come from a different batch, and a per-machine time needs complete tool lives first. Can a signal do better?"

## 1:10–2:10 ② 找指標,並測試能不能跨機台(V3、V4、V2)
**做**:按 **②**。指向 V3 上半部。
**說**:正規化用新刀前 3–6 分鐘的水準,這在產線上做得到。主軸扭矩在每把刀都 ≥ 0.97,9 把合併 0.95。V4 也可以看到三台機台的曲線同方向上升。
**做**:V2 切到 **signal alarm**(預設是用另外兩台機台校正)。
**說**:用 M2、M3 校正的警示值拿到 M1 測試,其他機台依此類推。結果 M1、M2 提早 6–15 分鐘警示,**M3 三把刀完全沒觸發**。**做**:改成 **calibrated on own machine** → 平均誤差 3.2 分鐘。**說**:所以趨勢可以跨機台,警示值不行,每台機台至少需要一把試驗刀來校正。
**EN**: "With a production-feasible normalization, spindle torque follows wear in every end mill. But a level calibrated on the other two machines alarms 6 to 15 minutes early on M1 and M2 and never on M3. Calibrated on its own machine, the mean error drops to 3.2 minutes. The trend transfers, the alarm level does not: each machine needs at least one calibration tool."

## 2:10–3:00 ③ 誤報(V5、V6、V2)
**做**:按 **③**(E1,訊號警示)。指向 V5 第 15 層的 **J** 和 ▼ 警示。
**說**:E1 在 VB 103 就觸發警示,比該換的時間早 12 分鐘。原因是第 15 層整層扭矩跳高,下一層又回落,而磨耗不會倒退。**做**:點第 14 層一個 run → **pin** → 點第 15 層一個 run。**說**:V6 裡機台訊號和測力計參考同時跳高,所以不是感測器問題,而是和換層有關的變化。
**做**:V2 把延續條件設成 **30**。**說**:要求超過一整層都高於警示值,E1 的誤報就消失了,警示改成只早 0.5 分鐘。
**EN**: "End mill E1 alarms at VB 103, 12 minutes too early, because the whole of layer 15 jumps and then drops back. Wear cannot go backwards. Requiring the level to persist for more than one layer removes this false alarm."

**(3 分鐘版到此結束)**

## ⊕ 3:00–3:50 取捨和 E9
**做**:V2 改成 **calibrated on own machine**,延續條件保持 30。**說**:同樣的設定在這裡會讓 5 把刀漏報。延續條件是誤報和漏報之間的取捨,這要由工程師決定,不是演算法。
**做**:V5 下拉選 **E9**。**說**:E9 每層內扭矩上升 5–7%,而 VB 100 到 140 之間扭矩倍數只差約 0.06–0.09,所以這種層內變化不能忽略。
**EN**: "The same persistence makes five end mills miss the alarm when the level is calibrated on the own machine. That trade-off between false and missed alarms is a decision for the engineer."

## ⊕ 3:50–4:20 連動
**做**:在 V1 拖曳一段時間範圍 → V3 重新排序(有動畫)、V4 淡化範圍外的點;在 V4 框選 → V1、V5 同步高亮。

## ⊕ 4:20–4:50 總結
**說**:
1. 每台機台各自訂時間,可以大幅減少浪費,但可能混著批次效應。
2. 主軸扭矩的趨勢可以跨機台,警示值要每台機台各自校正。
3. 層級旗標加上延續條件,可以處理和換層有關的誤報,但會換來漏報,必須權衡。
限制:VB 大多是內插值、只有 9 把刀、機台和批次效應混淆。
**EN**: "Per-machine replacement times cut unused life, but may reflect the tool batch. Spindle-torque trends transfer across machines, alarm levels need per-machine calibration. Layer flags and persistence handle layer-related false alarms at the cost of missed ones. Limitations: interpolated VB, nine tools, machine–batch confounding."

---

## 預想問題
| 問題 | 回答重點 |
|---|---|
| 新刀不知道全壽命,怎麼正規化? | 用前 3–6 分鐘的水準,不需要顯微鏡,也不用未來的資料;滑動中位數也只看過去 15 個 run |
| 為什麼依機台訂時間?可能是批次的原因 | 同意。系統和報告都有標註。這也是我們改看訊號警示的理由之一 |
| 系統能做到什麼是靜態報告做不到的? | 規則、校正方式、延續條件、門檻的組合很多,每改一個,誤報和漏報都會一起變,需要即時看結果才能取捨 |
| 只有機台訊號,看得出 E9 的鋸齒嗎? | 扭矩每層上升 5–7%,幅度小,但和 VB 100–140 之間的訊號差(約 0.06–0.09 倍)相當,所以會影響警示 |
| 為什麼不用自動模型? | 只有 9 把刀;用其他機台校正的測試已經顯示警示值無法跨機台;規則的取捨需要人決定 |
| 0.95 的相關不就夠了嗎? | 相關高只代表趨勢一致。用其他機台校正的測試才是真正的考驗,而這個測試的結果是誤差 6–15 分鐘,M3 全部漏報 |
