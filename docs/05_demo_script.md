# 05 Demo 講稿（Q1–Q4 介面）

> 對應的報告是 `report/main.tex`（合併版）。數字都來自 `data/verify_expected.json`，或是介面即時算出的值，並已用 `scripts/verify_app.js` 核對。
> **長度**：現場 demo 5 分鐘，標 ⊕ 的段落或句子可跳過，跳過後約 3 分 40 秒；影片 4–6 分鐘，介面切成 **EN**，旁白用 English 欄。
> **每一步的格式**：**操作**（點哪裡）→ **畫面重點** → **回答的評分項目** → 中文講稿 → English。

## 事前準備（開場前 1 分鐘）
1. 在 `web/` 資料夾執行 `python -m http.server 8000`，用 Chrome 或 Edge 開啟 `http://localhost:8000`。不需要網路。
2. 瀏覽器縮放 100–110%，視窗寬至少 1280 px。
3. 右上角 **中 / EN**：現場講中文就點「中」，錄影片就點「EN」。
4. 確認畫面上方 Feature = **Spindle torque, mean |T|**、Norm. = **× own first 3–6 min**、VB limit = **140 µm**。
5. 按問題列右邊的 **Reset**（中文介面是「重設」）。

## 評分項目對照（講到哪一段，就在回答哪一題）

| 評分項目 | 在哪一段回答 | 一句話重點 |
|---|---|---|
| 邏輯鏈 Data → Users、C1 | 開場 | 多機台試驗資料就是導入監控的工程師手上會有的資料 |
| Users → Challenges、C1 為什麼要 VA | 開場、Q4 結尾 | 規則有 6 個參數會一起影響結果；一個事件到底是不是磨耗，要靠人判斷 |
| Challenges → Tasks、C2 | 每段開頭說「這是 T?」 | CH1→T1、T2；CH2→T3、T4、T7；CH3→T5、T6 |
| Tasks → Design、C3、C4 | 每段的「畫面重點」 | 每個任務都有對應的視圖和互動；編碼的理由在預想問題裡 |
| C5 連動、總覽→篩選→細節 | Q2 的排序動畫、Q4 的點選、⊕ 連動段 | 縮圖會同步更新；V1 刷選會重算 V3；點 run 會在 V6 開啟細節 |
| C6 分析元件 | Q1–Q4 | A1 正規化、A2 ρ 排名、A3 規則評估、A4 層級診斷，參數都能即時調整 |
| C7 Insight 回到挑戰 | 每段結尾的結論框、總結 | 三個結論分別回答 CH1–CH3，也回答了開場的假設 |
| C8 | 整場 | 系統名稱 WearLens 出現在開場和結尾 |

---

## 0:00–0:40 開場：問題、使用者、資料（Data → Users → Challenges）
- **操作**：停在 Q1 畫面。滑鼠依序指：左上「WearLens」→ 上方 Q1–Q4 分頁 → 右上 Feature 和 VB limit → 右上 中 / EN。
- **畫面重點**：介面分成四個問題分頁。每個問題的主視圖放大在中間，其他視圖縮在左邊，右邊固定是計分板和結論框。
- **回答**：C1（使用者合理嗎？為什麼要 VA？）、邏輯鏈的第 1、2 環。

**中文**：在加工產線上，刀具會隨使用磨耗，影響加工品質，所以工廠通常用固定時間換刀。要知道刀實際磨到什麼程度，得停機用顯微鏡量；要量切削力，得裝昂貴的測力計，這兩種都不會出現在一般產線上。WearLens 的使用者是要在多台機台導入刀具監控的製程工程師。導入前，他們會先做試驗：在每台機台把刀用到壽命結束，用顯微鏡量磨耗，同時記錄機台訊號。我們用的就是這種公開試驗資料：三台機台、九把刀、6,418 次切削。我們的問題是：**不用測力計，只靠機台本身記錄的訊號，能不能判斷什麼時候該換刀？**上面四個分頁，就是把這個問題拆成四步。

**English**: In production, cutting tools wear with use and wear affects part quality, so plants usually replace tools after a fixed time. Measuring the actual wear means stopping the machine and using a microscope; measuring cutting force needs an expensive dynamometer. Neither is installed on a normal production line. WearLens is for process engineers who introduce tool monitoring on several machines. Before deployment they run trials: tools are worn out on each machine, wear is measured with a microscope, and machine signals are recorded. We use such an open trial dataset: three machines, nine end mills and 6,418 runs. Our question: **without a dynamometer, can the signals the machine already records tell when to replace the tool?** The four tabs break this question into four steps.

## 0:40–1:35 Q1：全廠用同一個換刀時間好嗎？（CH1 → T1、T2）
- **操作**：
  1. 點上方分頁 **Q1**。
  2. 指中間 **V1**：三列從上到下分別是 M1、M2、M3，再指虛線（VB 140 µm）。
  3. 指右邊 **V2**：規則停在 **fixed · all**（固定 · 全廠），指 M2 三條的淺色段「unused 34–36 %」。
  4. ⊕ 拖曳 V2 上的黑色虛線往右，出現斜線段（超過門檻），再按 **Reset**。
  5. 點 V2 的規則按鈕 **per machine · LOO**（每台 · 留一法），指 V2 底下的摘要「mean |error| 1.7 min · 3 overrun(s)」。
  6. 指計分板裡的虛線 **baseline**，再指右下的**結論框**。
- **畫面重點**：V1 同一列的三把刀幾乎重疊，M2 中段特別平。V2 的長條從 0 開始：深色是用掉的壽命、淺色是浪費的壽命、斜線是超過門檻。
- **回答**：C2（T1 總覽、T2 比較）、C6（A3 規則評估、留一法）、C7。

**中文**：先看最基本的做法：固定時間換刀。T1 是磨耗曲線總覽，一列一台機台。M2 的中段比較平，要 83 分鐘才到門檻，另外兩台大約 54 到 56 分鐘；同一台機台的三把刀則幾乎重疊。要注意，M2 的刀來自另一個批次，所以這個差異分不出是機台還是刀的關係。T2 比較換刀規則。全廠用同一個時間 53.5 分鐘，M2 每把刀會浪費 34 到 36% 的壽命。改成每台機台各訂時間；但用同一批刀訂時間、又用同一批刀評分會太樂觀，所以改用留一法：每次留一把刀測試，只用同機台另外兩把來訂時間。平均誤差 1.7 分鐘，3 次超過門檻、最多 2 分鐘，沒有漏報。這是計分板上的虛線基準，後面的訊號規則都跟它比。

**English**: We start with the basic practice, a fixed replacement time. T1 is an overview of the wear curves, one row per machine. M2's middle phase is flatter, so it reaches the limit after 83 minutes instead of 54 to 56, while the three end mills on one machine almost overlap. Note that M2's end mills come from another batch, so machine and batch cannot be separated. T2 compares rules. One time for all machines, 53.5 minutes, wastes 34 to 36 percent of every M2 end mill. We then set one time per machine; fitting and scoring it on the same tools would be optimistic, so we use leave-one-out: each end mill is tested with a time set from the other two on its machine. Mean error 1.7 minutes, three overruns of at most 2 minutes, no miss. This is the dashed baseline in the scoreboard that the signal rules are compared with.

## 1:35–2:30 Q2：扭矩會跟著磨耗上升嗎？（CH2 → T3、T4；檢驗假設）
- **操作**：
  1. 點上方分頁 **Q2**。中間變成 V3 和 V4，V1 縮到左邊。
  2. 在 **V3** 把滑鼠停在「Spindle torque, mean |T|」那列的 **E1** 格子上，tooltip 顯示 ρ；再停在同一列最右邊的 **All** 格子上（0.95）。
  3. 上方 **Norm.**（正規化）下拉選單改成 **raw**（原始值），V3 的列會用動畫重新排序；停在 Spindle torque 的 All 格子上（0.57）。再改回 **× own first 3–6 min**。
  4. 停在 V3 下方灰底區的「Force X, mean」All 格子上（0.98）。
  5. 指 **V4**：三種顏色都往右上升，再指灰色帶和上方標籤「at VB 140 µm: 1.24 – 1.37 (9 tools)」。
  6. 指右下的**結論框**。
- **畫面重點**：V3 每列是一個特徵、每欄是一把刀，顏色是 ρ（藍－灰－紅，0 為中點），預設依「最差那把刀的 ρ」排序。測力計那組是灰底，表示只作參考。
- **回答**：C3、C4（矩陣的理由）、C5（轉場動畫是為了讓人追得到列的位置）、C6（A1 正規化、A2 排名）。

**中文**：接下來檢驗假設：刀越鈍，維持同樣轉速和進給需要越大的力，所以機台扭矩應該跟著磨耗上升。T3 用 Spearman 相關替特徵排名。主軸扭矩在每一把刀都有 0.97 以上，九把合併是 0.95，接近測力計 Force X 的 0.98。改用原始值的話，合併只剩 0.57，因為三台機台的起始水準不同；所以我們把扭矩除以每把新刀前 3 到 6 分鐘的中位數，這在產線上做得到，不需要顯微鏡。T4 看 V4：三台機台的扭矩都隨磨耗上升，磨到門檻時約為新刀的 1.24 到 1.37 倍。所以扭矩看得到磨耗趨勢；但相關高只代表趨勢一致，還不代表能決定什麼時候換刀。

**English**: Next we test the hypothesis: a worn tool needs more force to keep the same speed and feed, so machine torque should rise with wear. T3 ranks features by Spearman correlation. Spindle torque exceeds 0.97 in every end mill and reaches 0.95 pooled, close to the dynamometer's Force X at 0.98. With raw values the pooled value drops to 0.57, because the machines start at different levels, so we divide torque by each new tool's median over its first 3 to 6 minutes, which works in production without a microscope. T4: in V4 torque rises with wear on all three machines and reaches 1.24 to 1.37 times the new-tool level at the limit. So torque shows the wear trend; but a high correlation only shows a shared trend, not when to replace the tool.

## 2:30–3:15 Q3：能用訊號設定警報嗎？（CH2、CH1 → T7）
- **操作**：
  1. 點上方分頁 **Q3**。V2 會自動切到 **signal alarm**，校正方式是 **calibrated on the other machines**（用其他機台校正）。
  2. 指 **V2**：M1、M2 的 ▼ 警示都在長條末端之前，標「… min early」；M3 三列寫「no alarm」。
  3. 指中間 **V4** 的灰色帶：M3 的綠色點線在 VB 140 µm 處比較低。
  4. 點計分板的 **Signal · same machine**（訊號 · 同機台（留一））那列。V2 的校正會切到 leave-one-out，指它的長條（4.7 min）和 baseline 虛線（1.7 min）的距離。
  5. 指右下的**結論框**。
- **畫面重點**：計分板四條規則用同一個測試比平均誤差，長條都從 0 開始，漏報用文字另外列出。
- **回答**：C6（A3：校正方式、persistence、同一個測試）、C7（回答 CH1 和 CH2）。

**中文**：換刀需要一條警示線：扭矩超過多少就換。T7 先用兩台機台訂警示線，拿到第三台測試。M1、M2 提早 6 到 15 分鐘警示，M3 三把完全沒響。V4 可以看到原因：磨到門檻時，M3 的扭矩倍數比較低，用另外兩台訂的線，M3 碰不到。所以趨勢可以跨機台，警示線不行。改成每台機台各自校正、用同樣的留一法測試：平均誤差 4.7 分鐘，一次晚報、一次漏報，比固定時間的 1.7 分鐘差。原因是同一台機台的刀壽命本來就很一致，固定時間已經很準。

**English**: A replacement needs an alarm level: replace when torque exceeds it. In T7 the level is set on two machines and tested on the third. M1 and M2 alarm 6 to 15 minutes early, and M3 never alarms. V4 shows why: at the limit M3's torque ratio is lower, so a level set on the other two machines is never reached. The trend transfers between machines; the alarm level does not. Calibrated per machine with the same leave-one-out test, the mean error is 4.7 minutes with one late and one missed alarm, worse than 1.7 minutes for the fixed time, because tool lives on one machine are already very similar.

## 3:15–4:15 Q4：這個跳升真的是磨耗嗎？（CH3 → T5、T6）
- **操作**：
  1. 點上方分頁 **Q4**（會自動選 E1）。中間變成 V5 和 V6。
  2. 指 **V5**：第 15 層上方的洋紅色 **J** 標記、▼ 標籤「alarm: run 443, VB 103 µm」，以及標記層數「Flagged layers: 2 of 222」。
  3. 在 V5 第 14 層（J 左邊那一段）把滑鼠移到 tooltip 顯示 **run 420** 左右，點下去，再點 V6 的 **pin as comparison**（釘選比較）。
  4. 在 J 底下第 15 層點 **run 443**（停在 tooltip 顯示 run 443 再點）。
  5. 指 **V6**：彩色線（第 15 層）的 spindle torque 和 |Fxy| reference 都比灰色線（第 14 層）高，feed axis 幾乎一樣。
  6. 回到 V5，指第 16 層扭矩掉回來。
  7. ⊕ 在 V2 的 persistence 輸入框（「runs. Level:」左邊）輸入 **30** 按 Enter：E1 變成「0.5 min early · VB 137」。再點 **same machine incl. itself (in-sample)**，計分板和摘要出現 **5 missed**。把輸入框改回 **1**，校正點回 **calibrated on the other machines**。
  8. 指右下的**結論框**。
- **畫面重點**：V5 的橫軸是第幾個 run；淡色帶是層；洋紅色只用在警示、標記和選取。V6 不同單位分成上下面板，共用時間軸，沒有雙 y 軸。
- **回答**：C5（點 run 開啟細節、釘選對照）、C6（A4 層級診斷）、C1「為什麼自動化不夠」、C7。

**中文**：最大的警示誤差是 E1，提早 12.3 分鐘，我們追查原因。T5：V5 是 E1 每個 run 的扭矩，淡色帶代表層，刀每 1 到 2 層會被拆下來量磨耗。第 15 層整層跳高 19%，系統標上 J，警示就在這裡響；全部 222 層只有 2 層被標記。T6：我把第 14 層的 run 420 釘住當對照，再點第 15 層的 run 443。V6 裡主軸扭矩和測力計整段都變高，進給軸幾乎沒變；兩套獨立量測一起變，不太像感測器故障。但第 16 層扭矩又回落，磨耗不會倒退，所以這也不是磨耗。⊕ 把延續條件拉長到 30 個 run，E1 只提早 0.5 分鐘；但同樣的設定在同機台、樣本內校正時，九把刀有五把漏報，所以延續條件是誤報和漏報之間的取捨。判斷這種事件要看兩套訊號和層的結構，所以我們的規則是：警示落在被標記的層，先檢查刀，不直接換刀。

**English**: The largest alarm error is E1, 12.3 minutes early, so we trace its cause. T5: V5 shows E1's torque run by run; bands are layers, and the tool is removed for measurement every one or two layers. Layer 15 jumps by 19 percent and is flagged J, exactly where the alarm fires; only 2 of 222 layers are flagged. T6: I pin run 420 of layer 14 and open run 443 of layer 15. In V6, spindle torque and dynamometer force are higher over the whole run, while the feed axis barely changes. Two independent chains agree, so a sensor fault is unlikely. But torque falls back in layer 16, and wear never goes back, so it is not wear either. ⊕ A persistence of 30 runs moves E1 to 0.5 minutes early, but under in-sample calibration the same setting leaves five of nine end mills without an alarm, so persistence trades false alarms against missed ones. Judging such an event needs both signal chains and the layer structure, so our rule is: an alarm in a flagged layer triggers an inspection, not a replacement.

## ⊕ 4:15–4:35 連動展示（C5）
- **操作**：
  1. 點上方分頁 **ALL**（全部視圖）。
  2. 在 **V1** 任一張小圖上水平拖曳，選 20–50 分鐘：V3 的 ρ 重算、列用動畫重排，V4 範圍外的點變淡。在 V1 空白處點一下取消。
  3. 在 **V4** 拖一個框：V1 和 V5 會標出被框選的 run。
  4. 按 **Reset**。
- **畫面重點**：三個視圖的橫軸刻意不同（時間、VB、第幾個 run），是同一群 run 的三個角度，靠高亮串起來。

**中文**：最後展示連動。在 V1 選一段時間，V3 會即時重算相關、列跟著重排，V4 只留下這段的點；在 V4 框一群點，V1 和 V5 會同步標出來。三個視圖的橫軸不同，是同一群資料的三個角度。

**English**: Finally, the views are linked. Brushing a time range in V1 recomputes V3 and re-sorts its rows, and V4 fades the other runs; brushing in V4 highlights the same runs in V1 and V5. The three views use different x-axes on purpose: three angles on the same runs.

## 4:35–5:00 總結（Insight 回到挑戰與假設）
- **操作**：點回 **Q3**，讓計分板四條長條和結論框一起出現在畫面上。

**中文**：回到開場的問題，三個結論。第一，在這組資料裡，每台機台各訂固定時間最準，誤差 1.7 分鐘。第二，主軸扭矩看得到磨耗趨勢，但警示線不能跨機台，同機台校正也只有 4.7 分鐘，所以只適合當安全網。第三，最大的誤差來自換層事件，警示落在被標記的層就先檢查。限制是每台只有 3 把刀、切削條件固定、磨耗多半是內插值；條件會變的產線，結果可能不同。謝謝，這是 WearLens。

**English**: Back to our question, three takeaways. First, in this dataset a fixed time per machine is the most accurate rule, with an error of 1.7 minutes. Second, spindle torque shows the wear trend, but its alarm level does not transfer between machines, and per-machine calibration reaches only 4.7 minutes, so it suits a safety net. Third, the largest error comes from a layer event; an alarm in a flagged layer triggers an inspection first. Limitations: three end mills per machine, constant cutting conditions and mostly interpolated wear; on lines where conditions vary, the result may differ. Thank you, this was WearLens.

---

## 預想問題（依評分項目整理）

| 評分項目 | 可能的問題 | 回答重點 |
|---|---|---|
| C1 | 這些使用者真的會有這份資料嗎？ | 導入監控前本來就要做試驗：顯微鏡量磨耗、機台記錄訊號；測力計只在試驗時加裝。這份資料就是這種試驗。 |
| C1 | 為什麼不用一個查詢或一張靜態圖？ | 結果由特徵、正規化、校正方式、警示線、延續條件、VB 門檻 6 個參數一起決定，每改一個，早報、晚報、漏報會一起變，需要即時看結果才能取捨。 |
| C1 | 為什麼不用自動演算法？ | 只有 9 把刀，一個事件（E1）就決定設定看起來好不好；要判斷事件是感測器故障、製程改變還是磨耗，得比對兩套訊號，這是領域判斷，不是可以最佳化的目標。早報和漏報之間的取捨也牽涉成本。 |
| C1 | 新穎性？ | 資料是第一份公開的多機台刀具壽命資料，課程作業沒有用過；計分板用同一個留一法測試比較兩類規則，是我們自己的設計。 |
| C2 | 任務可以在系統裡測試嗎？ | 每個任務都有明確的視圖、操作和輸出，例如 T7 的輸出就是計分板上的 MAE 和漏報數。 |
| C3 | 每個視圖都有任務嗎？ | 見報告的 Task–design 表：V1→T1、T2；V2→T2、T6、T7；V3→T3；V4→T4、T7；V5→T5、T6；V6→T6。 |
| C4 | 為什麼 V3 用矩陣，不用一欄排名？ | 一欄排名看不到機台差異，例如 Tooth-pass 在 M3 是負相關；色階藍－灰－紅以 0 為中點，飽和度降低，數值 hover 才顯示。 |
| C4 | V4 有 6,418 個點，不會重疊嗎？ | 降低透明度，再加每把刀的滑動中位數線；考慮過 hexbin，但會失去機台身分。 |
| C4 | 顏色怎麼選？ | 顏色只代表 3 台機台，已用色盲模擬驗證（ΔE ≥ 8.5）；9 把刀不用 9 種顏色，用位置和文字區分；只有一個強調色給警示和選取。 |
| C4 | V6 為什麼不用雙 y 軸？ | 雙軸的比例可以任意調，容易誤導；不同單位分成上下面板、共用時間軸。 |
| C5 | 縮圖不能操作，這樣算連動嗎？ | 縮圖就是真的視圖縮小，每次選取都會同步更新；要操作就切到用它的問題，或用 ALL 分頁看全部放大的視圖。 |
| C5 | 轉場動畫有什麼用？ | 只用在 V3 換正規化或時間範圍時的列重排，讓使用者追得到同一個特徵的位置。 |
| C6 | 分析元件怎麼幫助形成假設？ | A2 先提出「扭矩跟著磨耗」，A3 用同一個留一法測試能不能換刀，A4 再找出誤差來源；參數都能即時改、立即驗證。 |
| C7 | Insight 會不會是編出來的？ | 所有數字都由 `scripts/verify.py` 重算，介面顯示的值由 `scripts/verify_app.js` 自動核對；結論框的文字是即時從分析結果產生的。 |
| C7 | 結論是固定時間比較好，那 VA 的價值在哪？ | VA 讓我們發現「趨勢對但警示線不能跨機台」、「最大誤差是換層事件」，這兩點看單一相關係數或單一張圖都看不出來；工程師因此知道訊號該怎麼用（每台校正、當安全網）。 |
| 資料 | 為什麼門檻是 140，不是 150？ | 作者定 150 µm，但 M2 三把刀最大只到 147–149 µm，用 150 會沒有壽命終點；介面上可以調。 |
| 資料 | 新刀沒有完整壽命，怎麼正規化？ | 用自己前 3–6 分鐘的中位數，不需要顯微鏡也不用未來的資料；滑動中位數也只看過去 15 個 run。 |
| 限制 | 這個結論能推廣嗎？ | 不能直接推廣：每台只有 3 把刀、單一刀具和切削參數；條件會變的產線，固定時間會變差，訊號監控的價值會更高。 |
| 技術 | 有沒有後端？能離線跑嗎？ | 沒有後端或資料庫；Python 離線前處理成 9.6 MB 的檔案，瀏覽器直接讀，D3 放在本機 `lib/`，不需要網路。 |
| 結論 | 說固定時間浪費，結論卻推固定時間？ | 浪費來自「全廠同一個時間」；每台機台各訂時間，平均浪費從 34–36% 降到約 2%。 |
| 結論 | 依機台訂時間，可能其實是批次的影響？ | 同意，分不開；但結論只需要「同機台的刀壽命一致」，與原因無關。M1、M3 同批次也成立。 |
| 結論 | 為什麼固定時間這麼準？ | 同機台、同批次、同切削條件，三把刀到門檻最多差 3.4 分鐘；條件會變時固定時間就不準。 |
| 結論 | 為什麼警示線不能跨機台？ | V4：VB 140 時 M3 的扭矩倍數較低；可能是驅動方式（滾珠螺桿 vs 線性馬達）或批次，資料分不開。 |
| 結論 | E1 以外的提早警示呢？ | 都不在被標記的層，是警示值本身不準；排除 E1 後留一法誤差仍 3.6 分鐘，高於 1.7。 |
| 結論 | 0.95 的相關不就夠了？ | 相關高只代表趨勢一致；用其他機台校正的測試誤差 6–15 分鐘、M3 全漏報。 |
| 結論 | 有沒有直接證明「越鈍越費力」？ | V4 九把刀都上升、門檻時 1.24–1.37 倍；V6 釘住新刀 run 對照鈍刀 run，扭矩整段變高。 |
| 結論 | 只有機台訊號看得出 E9 的鋸齒嗎？ | 扭矩每層升 5–7%，和 VB 100–140 間的訊號差（約 0.06–0.09 倍）相當，會影響警示。 |
| 結論 | MAE 怎麼處理漏報？ | 只算有警示的刀，漏報另外列出；摘要同時顯示早、晚、漏報數量。 |
