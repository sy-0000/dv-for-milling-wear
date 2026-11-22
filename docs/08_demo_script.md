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

## 1:10–2:10 ② 公平比較:固定時間 vs 訊號警示(V2、V3)
**做**:V2 按 **per machine · leave-one-out**。**說**:每台機台的時間如果用同一批刀訂,再用同一批刀評估,結果會偏樂觀。所以每把刀改用「同機台另外兩把」訂出的時間 → 平均誤差 1.7 分鐘,3 次超限(最多 2 分鐘),沒有漏報。
**做**:按 **②**,指向 V3 的主軸扭矩(每把 ≥ 0.97)。V2 切到 **signal alarm**(用其他機台校正)→ M3 三把全部漏報。改成 **same machine, other end mills** → 平均誤差 4.7 分鐘,1 晚、1 漏報。
**說**:在同樣的測試下,每台機台各自訂固定時間反而比較準,因為同一台機台的刀壽命很一致。訊號警示最多只能當安全網,而且每台機台要各自校正。
**EN**: "Under the same leave-one-out test, a fixed time per machine has a mean error of 1.7 minutes and no missed tool; the spindle-torque alarm has 4.7 minutes, one late and one missed. Alarm levels from other machines miss all M3 tools. For this process, per-machine fixed times win; a signal alarm is at most a safety net."

## 2:10–3:00 ③ 一個事件如何左右評估(V5、V6)
**做**:按 **③**(E1)。指向 V5 第 15 層的 **J** 和警示,以及標題上「222 層中有 2 層被標記」。點第 14 層一個 run → **pin** → 點第 15 層。
**說**:E1 是最大的誤差,早了 12 分鐘。警示就發生在被標記的層,V6 裡扭矩和測力計一起跳高,下一層又回落,所以這不是感測器問題,也不是磨耗。延續條件要超過一整層(30 個 run)才能濾掉它,但會讓其他刀漏報。所以我們的規則是:警示落在被標記的層就去檢查,不直接換刀。被標記的層只有 2 層,這條規則現場做得到。
**EN**: "E1's alarm, the largest error, sits in one of only two flagged layers. Both signal chains jump and fall back, so it is neither a sensor fault nor wear. Absorbing it needs a persistence longer than a layer, which causes missed alarms, so alarms in flagged layers trigger an inspection instead."

**(3 分鐘版到此結束)**

## ⊕ 3:00–3:50 E2–E9 的提早原因、延續條件的代價
**做**:V5 切換幾把 M1/M2 的刀(例如 E2、E4)。**說**:它們的警示都不在被標記的層,所以是警示值本身不準;排除 E1 後,平均誤差還是 3.6 分鐘,高於固定時間的 1.7 分鐘。
**做**:V2 改成 **same machine incl. itself**,延續條件設 30。**說**:延續條件長到可以濾掉 E1 時,9 把裡有 5 把會漏報,這個代價太大,所以我們改用「被標記就檢查」的規則。
**EN**: "The other early alarms are not in flagged layers, so the alarm level itself is the weakness: without E1 the error is still 3.6 minutes. A persistence long enough to hide E1 makes five of nine tools miss the alarm."

## ⊕ 3:50–4:20 連動
**做**:在 V1 拖曳一段時間範圍 → V3 重新排序(有動畫)、V4 淡化範圍外的點;在 V4 框選 → V1、V5 同步高亮。

## ⊕ 4:20–4:50 總結
**說**:
1. 用公平的留一把刀測試,每台機台各自訂固定時間比主軸扭矩警示準確(1.7 vs 4.7 分鐘)。
2. 警示值無法跨機台;訊號警示若要用,必須每台各自校正,而且只適合當安全網。
3. 換層造成的事件很少(222 層中 2 層),用「被標記就檢查」處理,比拉長延續條件好。
限制:每台只有 3 把刀、VB 每 2.4–4.7 分鐘才量一次、M2 機台和批次混淆。
**EN**: "With a fair leave-one-out test, per-machine fixed times beat the spindle-torque alarm, 1.7 versus 4.7 minutes. Alarm levels do not transfer between machines, so a signal alarm is at most a calibrated safety net. Rare layer events are handled by inspecting flagged layers rather than by longer persistence. Limitations: three tools per machine, VB measured every 2.4 to 4.7 minutes, and machine–batch confounding."

---

## 預想問題
| 問題 | 回答重點 |
|---|---|
| 新刀不知道全壽命,怎麼正規化? | 用前 3–6 分鐘的水準,不需要顯微鏡,也不用未來的資料;滑動中位數也只看過去 15 個 run |
| 為什麼依機台訂時間?可能是批次的原因 | 同意,機台和批次分不開。但結論只需要「同一台機台的刀壽命一致」,這點和原因無關;M1、M3 同批次,也同樣成立 |
| 系統能做到什麼是靜態報告做不到的? | 規則、校正方式、延續條件、門檻的組合很多,每改一個,誤報和漏報都會一起變,需要即時看結果才能取捨 |
| 只有機台訊號,看得出 E9 的鋸齒嗎? | 扭矩每層上升 5–7%,幅度小,但和 VB 100–140 之間的訊號差(約 0.06–0.09 倍)相當,所以會影響警示 |
| 為什麼不用自動模型? | 只有 9 把刀;用其他機台校正的測試已經顯示警示值無法跨機台;規則的取捨需要人決定 |
| MAE 怎麼處理漏報? | MAE 只算有警示的刀,漏報一律另外列出,系統的摘要也會同時顯示早、晚、漏報的數量 |
| 延續 30 不就是針對 E1 調出來的嗎? | 對,所以我們沒有採用。30 剛好是「一層 29 個 run 再加 1」,它說明要濾掉換層事件必須超過一整層,代價是 5 把漏報 |
| 0.95 的相關不就夠了嗎? | 相關高只代表趨勢一致。用其他機台校正的測試才是真正的考驗,而這個測試的結果是誤差 6–15 分鐘,M3 全部漏報 |
