# Demo 講稿（最終版：Q1–Q4 介面）

> 取代 `09_demo_script_v2.md`。對應的報告是 `report/main.tex`（合併版）。數字都來自 `data/verify_expected.json`，或是介面即時算出的值，並已用 `scripts/verify_app.js` 核對。
> **長度**：現場 demo 5 分鐘，標 ⊕ 的段落可跳過，跳過後約 3 分 30 秒；影片 4–6 分鐘，介面切成 **EN**，旁白用 English 欄。
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

## 0:00–0:35 開場：資料、使用者、假設（Data → Users → Challenges）
- **操作**：停在 Q1 畫面。滑鼠依序指：左上「WearLens」→ 上方 Q1–Q4 分頁 → 右上 Feature 和 VB limit → 右上 中 / EN。
- **畫面重點**：介面分成四個問題分頁。每個問題的主視圖放大在中間，其他視圖縮在左邊，右邊固定是計分板和結論框。
- **回答**：C1（使用者合理嗎？為什麼要 VA？）、邏輯鏈的第 1、2 環。

**中文**：這是 WearLens。使用者是要在多台機台導入刀具監控的製程工程師。導入前他們會先做試驗：在每台機台把刀用到壽命結束，用顯微鏡量磨耗，同時記錄機台訊號。我們用的就是這種公開資料：三台機台、九把刀、6,418 次切削，作者說這是第一份多機台的刀具壽命資料，課程作業沒有用過。產線上不會裝測力計，所以工程師的假設是：刀越鈍，維持同樣轉速和進給要越大力，那**只靠機台本身的扭矩，能不能知道什麼時候該換刀？**上面四個分頁就是這個問題拆成的四步。

**English**: This is WearLens. Our users are process engineers who introduce tool monitoring on several machines. Before deployment they run trials: tools are worn out on each machine, wear is measured with a microscope, and machine signals are recorded. We use such an open dataset, three machines, nine end mills and 6,418 runs, the first public multi-machine tool-life dataset. Production has no dynamometer, so the engineer's hypothesis is: a worn tool needs more force to keep the same speed and feed, so **can the machine's own torque tell when to replace the tool?** The four tabs break this question into four steps.

## 0:35–1:30 Q1：全廠用同一個換刀時間好嗎？（CH1 → T1、T2）
- **操作**：
  1. 點上方分頁 **Q1**。
  2. 指中間 **V1**：三列從上到下分別是 M1、M2、M3，再指虛線（VB 140 µm）。
  3. 指右邊 **V2**：規則停在 **fixed · all**（固定 · 全廠），指 M2 三條的淺色段「unused 34–36 %」。
  4. ⊕ 拖曳 V2 上的黑色虛線往右，出現斜線段（超過門檻），再按 **Reset**。
  5. 點 V2 的規則按鈕 **per machine · LOO**（每台 · 留一法），指 V2 底下的摘要「mean |error| 1.7 min · 3 overrun(s)」。
  6. 指計分板裡的虛線 **baseline**，再指右下的**結論框**。
- **畫面重點**：V1 同一列的三把刀幾乎重疊，M2 中段特別平。V2 的長條從 0 開始：深色是用掉的壽命、淺色是浪費的壽命、斜線是超過門檻。
- **回答**：C2（T1 總覽、T2 比較）、C6（A3 規則評估、留一法）、C7。

**中文**：第一個問題是 T1：先看磨耗曲線總覽。一列一台機台，M2 的中段特別平，要 83 分鐘才到門檻，另外兩台大約 54 到 56 分鐘；同一列的三把刀幾乎重疊。T2：比較換刀規則。全廠用同一個時間 53.5 分鐘，M2 每把刀浪費 34 到 36% 的壽命。改成每台機台各訂一個時間，但這個時間又是用同一批刀訂、同一批刀評分，太樂觀，所以切到留一法：每把刀只用同機台另外兩把來訂。平均誤差 1.7 分鐘，3 次稍微太晚、最多 2 分鐘，沒有漏報。這條就是計分板上的虛線基準，後面的訊號規則要打贏它。

**English**: Q1 starts with T1, an overview of the wear curves: one row per machine. M2's middle phase is flat, so it reaches the limit after 83 minutes instead of 54 to 56, and the three end mills in a row almost overlap. T2 compares rules. One time for all machines, 53.5 minutes, wastes 34 to 36 percent of every M2 end mill. One time per machine is fitted and scored on the same tools, so we switch to leave-one-out: each end mill's time comes from the other two on its machine. Mean error 1.7 minutes, three small overruns, no miss. This is the dashed baseline in the scoreboard that a signal rule must beat.

## 1:30–2:30 Q2：扭矩會跟著磨耗上升嗎？（CH2 → T3、T4；檢驗假設）
- **操作**：
  1. 點上方分頁 **Q2**。中間變成 V3 和 V4，V1 縮到左邊。
  2. 在 **V3** 把滑鼠停在「Spindle torque, mean |T|」那列的 **E1** 格子上，tooltip 顯示 ρ；再停在同一列最右邊的 **All** 格子上（0.95）。
  3. 上方 **Norm.**（正規化）下拉選單改成 **raw**（原始值），V3 的列會用動畫重新排序；停在 Spindle torque 的 All 格子上（0.57）。再改回 **× own first 3–6 min**。
  4. 停在 V3 下方灰底區的「Force X, mean」All 格子上（0.98）。
  5. 指 **V4**：三種顏色都往右上升，再指灰色帶和上方標籤「at VB 140 µm: 1.24 – 1.37 (9 tools)」。
  6. 指右下的**結論框**。
- **畫面重點**：V3 每列是一個特徵、每欄是一把刀，顏色是 ρ（藍－灰－紅，0 為中點），預設依「最差那把刀的 ρ」排序。測力計那組是灰底，表示只作參考。
- **回答**：C3、C4（矩陣的理由）、C5（轉場動畫是為了讓人追得到列的位置）、C6（A1 正規化、A2 排名）。

**中文**：第二個問題檢驗我們的假設。T3：用 Spearman 相關替特徵排名。主軸扭矩在每一把刀都有 0.97 以上，九把合併 0.95。這裡用的正規化是除以新刀前 3 到 6 分鐘的水準，產線上做得到、不需要顯微鏡。如果改回原始值，合併只剩 0.57，列也會用動畫重新排，因為三台機台的起點不同。下面灰底的是測力計，Force X 是 0.98，所以機台扭矩和測力計差不多。T4：看 V4，三台機台都往右上升；磨到門檻時，扭矩大約是新刀的 1.24 到 1.37 倍。結論框寫的是：假設在「趨勢」上成立，但趨勢對還不代表能決定什麼時候換刀。

**English**: Q2 tests the hypothesis. T3 ranks features by Spearman correlation: spindle torque exceeds 0.97 in every end mill and 0.95 pooled, with a normalization by each new tool's first 3 to 6 minutes, which works in production without a microscope. With raw values the pooled value drops to 0.57 and the rows re-sort with an animation, because the machines start at different levels. The dynamometer's Force X reaches 0.98, so machine torque is close to it. T4: in V4 all three machines rise, and at the wear limit torque is 1.24 to 1.37 times the new-tool level. The conclusion box says: the hypothesis holds for the trend, but a trend does not yet set a replacement time.

## 2:30–3:20 Q3：能用訊號設定警報嗎？（CH2、CH1 → T7）
- **操作**：
  1. 點上方分頁 **Q3**。V2 會自動切到 **signal alarm**，校正方式是 **calibrated on the other machines**（用其他機台校正）。
  2. 指 **V2**：M1、M2 的 ▼ 警示都在長條末端之前，標「… min early」；M3 三列寫「no alarm」。
  3. 指中間 **V4** 的灰色帶：M3 的綠色點線在 VB 140 µm 處比較低。
  4. 點計分板的 **Signal · same machine**（訊號 · 同機台（留一））那列。V2 的校正會切到 leave-one-out，指它的長條（4.7 min）和 baseline 虛線（1.7 min）的距離。
  5. 指右下的**結論框**。
- **畫面重點**：計分板四條規則用同一個測試比平均誤差，長條都從 0 開始，漏報用文字另外列出。
- **回答**：C6（A3：校正方式、persistence、同一個測試）、C7（回答 CH1 和 CH2）。

**中文**：第三個問題 T7：換刀需要一條警示線，扭矩超過多少就換。先用另外兩台機台訂警示線，拿到第三台測試：M1、M2 提早 6 到 15 分鐘，M3 三把完全沒響。為什麼？看 V4：到了門檻，M3 的扭矩倍數比較低，用 M1、M2 訂的線，M3 永遠碰不到。所以**趨勢可以跨機台，警示線不行**。改成每台機台自己訂、而且用留一法公平測試：平均誤差 4.7 分鐘，一次晚、一次漏報，還是輸給虛線的 1.7 分鐘。原因是同一台機台的刀壽命本來就很一致。

**English**: Q3 is T7. A replacement needs an alarm level. Set on the other two machines and tested on the third, it alarms 6 to 15 minutes early on M1 and M2 and never on M3. Why? In V4, M3's torque ratio at the limit is lower, so a level set at M1 and M2's height is never reached: **the trend transfers, the alarm level does not.** Calibrated per machine with the same leave-one-out test, the error is 4.7 minutes with one late and one missed alarm, still worse than the 1.7-minute baseline, because tools on one machine already last almost equally long.

## 3:20–4:20 Q4：這個跳升真的是磨耗嗎？（CH3 → T5、T6）
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

**中文**：最後一個問題：最大的誤差從哪來？是 E1，提早 12.3 分鐘。T5：V5 是 E1 每一個 run 的扭矩，淡色帶是層，每 1 到 2 層刀會被拆下來量磨耗。第 15 層整層跳高 19%，系統標上 J，警示就在這裡響。全部 222 層只有 2 層被標記。T6：我把第 14 層的一個 run 釘住當對照，再點第 15 層。V6 裡扭矩和測力計整段都變高，兩套獨立的量測一起變，所以不是感測器壞了；但第 16 層又掉回來，磨耗不會倒退，所以也不是磨耗。要用延續條件濾掉，得超過一整層、30 個 run，但這樣在同機台校正時九把刀有五把會漏報。這就是為什麼不能全自動：要判斷這是什麼事件，得看兩套訊號和層的結構。我們的規則是：警示落在被標記的層就先檢查，不直接換刀。

**English**: Last question: where does the largest error come from? E1, 12.3 minutes early. T5: V5 shows E1's torque run by run; bands are layers, and the tool is removed for measurement every one or two layers. Layer 15 jumps by 19 percent and is flagged J, exactly where the alarm fires; only 2 of 222 layers are flagged. T6: I pin a run of layer 14 and open one of layer 15. In V6, torque and dynamometer force are higher over the whole run. Two independent chains agree, so it is no sensor fault; but layer 16 falls back, and wear never goes back, so it is not wear either. Filtering it needs a persistence longer than a layer, 30 runs, which leaves five of nine end mills without an alarm under in-sample calibration. This is why full automation is not enough: judging the event needs both signal chains and the layer structure. Our rule: an alarm in a flagged layer triggers an inspection, not a replacement.

## ⊕ 4:20–4:40 連動展示（C5）
- **操作**：
  1. 點上方分頁 **ALL**（全部視圖）。
  2. 在 **V1** 任一張小圖上水平拖曳，選 20–50 分鐘：V3 的 ρ 重算、列用動畫重排，V4 範圍外的點變淡。在 V1 空白處點一下取消。
  3. 在 **V4** 拖一個框：V1 和 V5 會標出被框選的 run。
  4. 按 **Reset**。
- **畫面重點**：三個視圖的橫軸刻意不同（時間、VB、第幾個 run），是同一群 run 的三個角度，靠高亮串起來。

**中文**：最後展示連動。在 V1 選一段時間，V3 會即時重算相關、列跟著重排，V4 只留下這段的點；在 V4 框一群點，V1 和 V5 會同步標出來。三個視圖的橫軸不同，是同一群資料的三個角度。

**English**: Finally, the views are linked. Brushing a time range in V1 recomputes V3 and re-sorts its rows, and V4 fades the other runs; brushing in V4 highlights the same runs in V1 and V5. The three views use different x-axes on purpose: three angles on the same runs.

## 4:40–5:00 總結（Insight 回到挑戰與假設）
- **操作**：點回 **Q3**，讓計分板四條長條和結論框一起出現在畫面上。

**中文**：回到開場的假設，三個結論。第一（CH1）：每台機台各訂固定時間最準，1.7 分鐘。第二（CH2）：不用測力計，機台扭矩就看得到磨耗趨勢，和測力計差不多；但警示線不能跨機台，同機台也輸給固定時間，所以只能當每台各自校正的安全網。第三（CH3）：最大的誤差是換層事件，用「被標記就檢查」處理。限制是每台只有 3 把刀、切削條件固定、磨耗多半是內插值。謝謝，這是 WearLens。

**English**: Back to our hypothesis, three takeaways. First (CH1): a fixed time per machine is the most accurate rule, 1.7 minutes. Second (CH2): without a dynamometer, machine torque shows the wear trend about as well as the dynamometer, but its alarm level does not transfer between machines and even per machine it loses to a fixed time, so it is a per-machine safety net. Third (CH3): the largest error is a layer event, handled by inspecting flagged layers. Limitations: three end mills per machine, constant cutting conditions and mostly interpolated wear. Thank you, this was WearLens.

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
