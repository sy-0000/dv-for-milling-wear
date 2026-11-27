> ⚠ 已由 `10_demo_script_final.md` 取代(Q1–Q4 介面、逐步操作與評分對照)。

# Demo 講稿 v2(以「不用測力計能做到什麼」為主線)

> 取代 `08_demo_script.md` 的敘事順序;數字沿用 `data/verify_expected.json`(與 08 相同)。
> 時間:5 分鐘。標 ⊕ 的段落可在 3 分鐘版跳過。
> 介面:上方 Q1–Q4 分頁對應下面四段(另有「全部視圖」分頁);每個問題的主視圖放大在中間,其他視圖縮成左側縮圖(仍連動),右側固定 V2 計分板與即時結論框。右上角「中 / EN」切換語言,錄英文影片時切 EN。
> 事前準備:按 **Reset**;正規化 **× own first 3–6 min**;VB 門檻 140 µm;特徵 **Spindle torque, mean |T|**。

## 敘事主線

| 段落 | 問題 | 證據(視圖) | 答案 |
|---|---|---|---|
| 開場 | 產線沒有測力計,只靠機台訊號能不能知道何時換刀? | — | 假設 |
| ① 問題 | 全廠用同一個換刀時間好嗎? | V1、V2 fixed · all | 不好:M2 浪費 34–36%,每台機台有自己的壽命 |
| ② 假設 | 刀越鈍,維持同樣切削參數要越大力 → 扭矩會跟著磨耗上升? | V3、V4、V6 | 成立:主軸扭矩每把刀 ρ ≥ 0.97,和測力計差不多 |
| ③ 測試 | 扭矩能不能直接決定「何時換」? | V2 signal、V4 | 換機台不行;同機台可以,但 4.7 min 仍輸固定時間 1.7 min |
| ④ 原因 | 為什麼輸? | V5、V6 | 換層造成的跳動會誤報 → 被標記就檢查 |
| 結論 | 怎麼用? | V2 | 每台機台固定時間當主規則;機台訊號當各自校正的安全網 |

---

## 0:00–0:30 開場:假設

- **操作**:停在全頁,指標題和 ①②③。

**中文**:刀具磨耗通常用測力計來監測,但測力計很貴,產線上幾乎不會裝。我們的問題是:**不用測力計,只靠機台本身就有的訊號,例如主軸扭矩、進給馬達出力,能不能知道什麼時候該換刀?** 資料是三台機台、九把刀的試驗,有顯微鏡量的磨耗量,也有測力計可以當標準答案。顏色只代表機台:藍 M1、橘 M2、青綠 M3。

**English**: Tool wear is usually monitored with a dynamometer, which is expensive and rarely installed in production. Our question: **without a dynamometer, using only signals the machine already has, such as spindle torque and feed-motor force, can we tell when to replace the tool?** The data are trials on three machines and nine end mills, with microscope wear measurements and a dynamometer as ground truth. Colour encodes the machine: blue M1, orange M2, teal M3.

## 0:30–1:20 ① 問題:全廠一個換刀時間不行

- **操作**:按 **Q1**。指 V1 三列 → V2 停在 **fixed time · all machines**,指 M2 的淺色段。
- **畫面重點**:V1 每列一台機台,虛線是 VB 140 µm;V2 長條 = 磨到門檻的時間,虛線 = 換刀時間,淺色 = 浪費的壽命。

**中文**:現在工廠最常見的做法是固定時間換刀。V1 是九把刀的磨耗曲線,一列一台機台。M1 和 M3 大約 54 到 56 分鐘碰到門檻,M2 要 83 分鐘。V2 如果全廠用同一個時間 53.5 分鐘,M2 的刀每把都浪費 34 到 36% 的壽命。但同一列的三把刀幾乎重疊。也就是說,**每台機台有自己的壽命**。那有兩條路:每台機台各自訂時間,或者讓機台自己告訴我們刀快鈍了。我們想試第二條。

**English**: The common practice is a fixed replacement time. V1 shows the nine wear curves, one row per machine. M1 and M3 reach the limit after 54 to 56 minutes, M2 after 83. With one time for all machines, 53.5 minutes, every M2 end mill wastes 34 to 36 percent of its life. Yet the three end mills in a row almost overlap: **each machine has its own tool life**. That leaves two options: one time per machine, or letting the machine tell us when the tool is worn. We try the second.

## 1:20–2:20 ② 假設:刀越鈍越費力

- **操作**:按 **Q2**。指 V3「Spindle torque」列與「All」欄(hover 顯示 ρ),再指下方測力計的「Force X, mean」→ 指 V4 三色往右上的線和門檻帶 → 指右側結論框的 ρ 數字 →⊕ 切到「全部視圖」,在 V5 點一刀早期 run(VB 約 30)按 **pin**,再點一刀接近門檻的 run,指 V6 扭矩面板。
- **畫面重點**:V3 顏色 = 特徵和磨耗的 Spearman ρ,紅 = 一起上升;V4 x = 磨耗、y = 扭矩(除以新刀前 3–6 分鐘);V6 灰 = 新刀、彩色 = 鈍刀。

**中文**:我們的理由很直覺:刀越鈍,要維持同樣的轉速和進給,馬達就要出越大的力。V3 檢查這件事:主軸扭矩在九把刀的相關係數都超過 0.97,九把合併是 0.95,和測力計 X 方向的 0.98 差不多。這裡的扭矩除以新刀前 3 到 6 分鐘的水準,產線上做得到,不需要顯微鏡。V4 把所有 run 畫出來,三台機台都往右上升;磨到門檻時,扭矩大約是新刀的 1.24 到 1.37 倍。⊕ V6 直接比較同一把刀的新刀和鈍刀,扭矩整段都變高。所以**第一個答案:不用測力計,機台扭矩就看得到磨耗的趨勢。**

**English**: Our reasoning is simple: a worn tool needs more force to keep the same speed and feed. V3 checks this. Spindle torque correlates above 0.97 with wear in every end mill and 0.95 pooled, close to the dynamometer's 0.98. Torque is divided by each new tool's first 3 to 6 minutes, which works in production without a microscope. V4 plots all runs: all three machines rise, and at the wear limit torque is about 1.24 to 1.37 times the new-tool level. ⊕ V6 compares a new and a worn state of the same end mill: torque is higher over the whole cut. **First answer: without a dynamometer, machine torque already shows the wear trend.**

## 2:20–3:20 ③ 測試:趨勢對,但能決定「何時換」嗎?

- **操作**:按 **Q3**(V2 自動切到 **signal alarm**、**calibrated on the other machines**)→ 指 M3 三列「no alarm」→ 回 V4 指灰色門檻帶裡 M3 較低的位置 → 點計分板的 **Signal · same machine** 列,指它和 **baseline** 虛線(1.7 min)的距離。
- **畫面重點**:V2 上方計分板 = 四種規則在同一個測試下的平均誤差,虛線 = 基準(每台機台固定時間);下方 ▼ = 警示響的時間,斜線 = 太晚。

**中文**:趨勢對,不代表能決定換刀時間。換刀需要一條警示線:扭矩超過多少就換。我們先用兩台機台訂警示線,拿到第三台測試。結果 M1、M2 提早 6 到 15 分鐘,M3 三把完全沒響。為什麼?回到 V4:到了門檻,M3 的扭矩倍數比較低,警示線訂在 M1、M2 的高度,M3 永遠碰不到。所以**趨勢可以跨機台,警示線不行**。那改成每台機台自己訂,而且只用其他刀來訂,公平測試:平均誤差 4.7 分鐘,一次晚、一次漏報。還是輸給每台機台固定時間的 1.7 分鐘。

**English**: A correct trend does not yet decide when to replace. That needs an alarm level. We set the level on two machines and test it on the third: M1 and M2 alarm 6 to 15 minutes early, and M3 never alarms. Why? Back to V4: at the limit, M3's torque ratio is lower, so a level set at M1 and M2's height is never reached. **The trend transfers between machines, the alarm level does not.** Calibrated per machine on the other end mills, a fair test, the mean error is 4.7 minutes with one late and one missed alarm, still worse than 1.7 minutes for one fixed time per machine.

## 3:20–4:20 ④ 原因:換層造成的誤報

- **操作**:按 **Q4**(自動選 E1)。指 V5 第 15 層的 **J**、▼ 警示、標題「222 層中 2 層被標記」→ 點第 14 層一刀(run 420)按 **pin** → 點第 15 層一刀(run 443)→ 指 V6 扭矩與測力計面板。
- **畫面重點**:V5 x = 第幾刀,底色交替 = 層,下方小條 = VB;V6 灰 = 第 14 層,彩色 = 第 15 層。

**中文**:誤差從哪來?最大的一把是 E1,早了 12 分鐘。V5 是 E1 每一刀的扭矩,底色代表層,每 1 到 2 層刀就會被拆下來量磨耗。第 15 層整層跳高 19%,警示就在這裡響;但第 16 層又掉回來,磨耗不會倒退,所以這不是磨耗。V6 對照:扭矩和測力計一起變高,不是感測器壞掉,比較像重新裝刀後狀態改變。全部 222 層只有 2 層被標記,所以處理方式是:**警示落在被標記的層,先檢查,不直接換刀。**

**English**: Where does the error come from? The largest is E1, 12 minutes early. V5 shows E1's torque run by run; bands are layers, and the tool is removed for measurement every one or two layers. Layer 15 jumps by 19 percent and the alarm fires there, but layer 16 falls back, and wear never goes back, so it is not wear. In V6, torque and dynamometer force rise together, so no sensor fault, more likely a changed setup after re-clamping. Only 2 of 222 layers are flagged, so: **an alarm in a flagged layer triggers an inspection, not a replacement.**

## 4:20–5:00 結論

- **操作**:指右側計分板四條長條,停在全頁。

**中文**:回到開場的問題。第一,**不用測力計,機台扭矩看得到磨耗趨勢**,和測力計差不多。第二,但它**還不能單獨決定換刀時間**:警示線不能跨機台,同機台校正也輸給固定時間。所以我們建議:**每台機台用試驗刀訂自己的換刀時間當主規則,扭矩警示當每台各自校正的安全網,被標記的層先檢查。** 限制:每台只有 3 把刀、切削條件固定,所以固定時間才會這麼準;條件會變的產線,訊號監控的價值會更高。謝謝。

**English**: Back to our question. First, **without a dynamometer, machine torque shows the wear trend** about as well as the dynamometer. Second, it **cannot yet decide the replacement time on its own**: the alarm level does not transfer between machines, and even per-machine calibration loses to a fixed time. We therefore recommend **a fixed time per machine, set with trial tools, as the main rule, a per-machine torque alarm as a safety net, and inspection of flagged layers.** Limitations: three end mills per machine and constant cutting conditions, which is why a fixed time works so well here; where conditions vary, signal monitoring becomes more valuable. Thank you.

---

## 預想問題

| 問題 | 回答重點 |
|---|---|
| 所以特徵完全不能用? | 能用來看趨勢、當安全網;不能單獨決定換刀時間,因為警示線要每台機台校正 |
| 為什麼警示線不能跨機台? | V4:到 VB 140 時 M3 的扭矩倍數較低。可能原因是驅動方式不同(M1 滾珠螺桿、M2/M3 線性馬達)和刀具批次,本資料分不開 |
| 那為什麼固定時間這麼準? | 同機台、同批次、同切削條件,三把刀到門檻最多只差 3.4 分鐘;條件會變時固定時間就不準了 |
| 有沒有直接證明「越鈍越費力」? | V4 九把刀都上升、門檻時約 1.24–1.37 倍;V6 釘住新刀 run 對照鈍刀 run |
| 為什麼是 140 µm? | 論文終點 150 µm,但 M2 三把刀最大只到 147–149 µm;門檻可在介面調整 |
| 新刀怎麼正規化? | 用自己前 3–6 分鐘的中位數,不需要顯微鏡或未來資料 |
| 拉長延續條件能濾掉 E1 嗎? | 要超過一整層(30 個 run)才行,但同機台校正時 9 把中 5 把會漏報,所以改用「被標記就檢查」 |
| MAE 怎麼算漏報? | 只算有警示的刀,漏報另外列出 |
| 為什麼不用機器學習? | 只有 9 把刀,跨機台測試已顯示警示線無法推廣;規則取捨需要人決定 |
