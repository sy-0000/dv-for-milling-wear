# Demo 腳本(詳細版)

> 老師規定:現場 demo 約 **5 分鐘 + 5 分鐘問答**;影片 **4–6 分鐘,需英文旁白或字幕**。
> **5 分鐘完整版** = 全部段落。**3 分鐘核心版** = 跳過標 ⊕ 的段落(V1、V3、連動),V1 只用一句話帶過「同機台很一致、跨機台差 1.5 倍」。
> 數字來自 `data/verify_expected.json`,網頁顯示已由 `scripts/verify_app.js` 核對。刀具名稱為 **E1–E9**。

每一步有六個部分:**操作**、**呈現什麼**、**為什麼這樣設計**、**邏輯鏈**、**中文講稿**、**English**。「呈現」和「為什麼」是備註(也是口試被問「為什麼不用 X」的答案),現場只念講稿。

## 邏輯鏈對照

主線:**EDA 發現 → 問題(CH)→ 任務(T)→ 視圖(V)→ 答案**。Demo 依 CH1 → CH2 → CH3 的順序走。

| 問題 | 來自哪個發現 | 任務 | 視圖 | Demo 時間 | 答案 |
|---|---|---|---|---|---|
| CH1 用哪種換刀規則 | F1、F2:機台間壽命差 1.5 倍,同機台只差幾分鐘 | T1 看曲線、T2 比規則 | V1、V2 | 0:30–2:05 | 每台機台固定時間,誤差 1.7 分 |
| CH2 訊號能不能用、能不能跨機台 | F3–F5:扭矩跟著磨耗上升,但各機台起點不同 | T3 排名、T4 跨機台比較、T7 校正警示 | V3、V4、V2 | 2:05–3:15 | 趨勢可跨、警示值不行,誤差 4.7 分 |
| CH3 訊號變化是不是磨耗 | F6、F7:有些跳動和換層同步 | T5 找可疑層、T6 驗證 | V5、V6 | 3:15–4:25 | E1 是誤報,被標記就檢查 |

事前準備:瀏覽器縮放 110%;按 **Reset selections**;正規化選 **× own first 3–6 min**;VB 門檻 140 µm。

---

## 0:00–0:30 開場與介面總覽

- **操作**:停在全頁畫面,滑鼠由上到下指:上方控制列 → ①②③ 按鈕 → V1–V6。
- **呈現什麼**:一頁式儀表板。上方是全域控制(特徵、正規化、VB 門檻、層標記門檻),下方六個視圖互相連動。
- **為什麼這樣設計**:
  - 一頁放完六個視圖而不是分頁:連動效果可以同時看到,符合「總覽 → 篩選 → 細節」的原則。分頁的敘事優點用 ①②③ 導覽按鈕補回來。
  - **顏色只代表機台**(藍 M1、橘 M2、青綠 M3)。9 把刀用 9 種顏色會分不清楚,所以刀用位置和文字標籤區分。三色已用色盲模擬檢查過。
  - 測力計特徵一律變灰並標「reference only」:提醒使用者產線上沒有這個訊號。
- **邏輯鏈**:對應「使用者」這一環:在多台機台導入監控、產線只有機台訊號的工程師。

**中文**:這是 WearLens。使用者是要在多台機台導入刀具監控的工程師,產線上只有機台自己的訊號。畫面上六個視圖互相連動,顏色只代表機台:藍色 M1、橘色 M2、青綠色 M3。上面三個按鈕對應工程師的三個問題:該用哪種換刀規則、訊號能不能跨機台、訊號變了是不是磨耗。我們照這個順序走。

**English**: This is WearLens. Our users are engineers who introduce tool monitoring on several machines and only have machine signals in production. Six views are linked, and colour encodes only the machine: blue M1, orange M2, teal M3. The three buttons follow the engineer's three questions: which replacement rule, whether a signal transfers between machines, and whether a signal change is really wear. We go through them in order.

## ⊕ 0:30–1:15 V1 磨耗曲線(CH1、T1)

- **操作**:按 ①。指 V1 三列,從 M1 指到 M2,再指 M2 的曲線中段和虛線門檻。
- **呈現什麼**:9 張小圖,每張是一把刀的磨耗量 VB 對累計切削時間。一列是一台機台,虛線是 VB 140 µm 門檻。看得到三件事:每把刀都是「快→慢→快」三階段;M2 的曲線中段特別平,所以比較晚碰到門檻;同一列的 3 把刀幾乎一樣。
- **為什麼這樣設計**:
  - 時間趨勢用「位置」編碼(x = 時間、y = VB),是人眼判讀最準的方式。
  - 用小倍數圖、不把 9 條線疊在一張:疊在一起會互相遮擋,而且每張小圖可以單獨點選和刷選。
  - 同一列 = 同一台機台,而且所有小圖共用同一個座標範圍,上下對齊就能比較「差在哪個階段」。
  - 只畫實際有的 run,E8 開頭標註「缺資料」,誠實呈現資料限制。
- **邏輯鏈**:EDA 發現 F1、F2(壽命差 1.5 倍、差在穩定期)→ CH1「該用哪種換刀規則」→ T1 總覽磨耗曲線。這一步建立了下一步的前提:**同機台很一致、跨機台差很多**。

**中文**:第一個問題是該用什麼換刀規則。V1 是 9 把刀的磨耗曲線,一列是一台機台。每把刀都是一開始磨很快、中間很慢、最後又加速。M2 這一列的中段特別平,所以要 83 分鐘才碰到虛線門檻,另外兩台只要 54 到 56 分鐘。另一個重點是,同一列的三把刀幾乎重疊。所以差異在機台之間,不在同一台機台裡面。不過 M2 的刀是另一個批次,這個差異分不出是機台還是刀的關係。

**English**: The first question is which replacement rule to use. V1 shows the nine wear curves, one row per machine. Every end mill wears fast, then slowly, then fast again. M2's middle phase is especially flat, so it reaches the dashed limit after 83 minutes instead of 54 to 56. And the three end mills in one row almost overlap: the difference lies between machines, not within one. Note that M2's end mills come from another batch, so machine and batch cannot be separated.

## 1:15–2:05 V2 固定時間規則(CH1、T2)

- **操作**:V2 先看 **fixed time · fleet**(全廠一個時間)→ 切 **per machine** → 再切 **per machine · leave-one-out**,指下方摘要的 MAE。
- **呈現什麼**:每把刀一條橫向長條,長度是「磨到門檻花了多久」;虛線是規則說要換刀的時間。長條分成三種樣式:深色 = 換刀前用掉的壽命、淺色 = 浪費的壽命(太早換)、斜線 = 超過門檻還在切(太晚換)。摘要列出平均誤差和早、晚、漏報的刀數。
- **為什麼這樣設計**:
  - 比較「長度」最準的是對齊同一個起點的長條;若用點圖,只看得到終點,看不到「浪費了多少」這段。
  - 浪費和超限用淺色和斜線區分,不另加新顏色,顏色仍然只代表機台。
  - **留一法**:每把刀的換刀時間只用同機台另外兩把刀來訂,等於「用舊刀經驗預測新刀」。否則用同一批刀訂規則又拿來評分,等於先看答案再考試。
  - 摘要把漏報另外列出、不算進平均:漏報最危險,不能被平均蓋過去。
- **邏輯鏈**:CH1 → T2「在選定的 VB 門檻下,比較不同規則的浪費和超限」。得到第一個答案:**每台機台固定時間,誤差 1.7 分鐘**。這個數字是後面訊號規則要打贏的基準。

**中文**:V2 比較換刀規則。每把刀一條長條,長度是磨到門檻花了多久,虛線是規則說要換刀的時間;淺色是浪費的壽命,斜線是超過門檻還在切。如果全廠用同一個時間 53.5 分鐘,M2 的刀會浪費 34 到 36%。改成每台機台各自訂時間,平均只浪費約 2%。但這樣是用同一批刀訂規則又拿來評分,會太樂觀。所以我們改用留一法:每把刀只用同機台另外兩把來訂時間。結果平均誤差 1.7 分鐘,3 次稍微太晚、最多 2 分鐘,沒有漏報。這是訊號規則要打贏的基準。

**English**: V2 compares replacement rules. Each end mill is a bar up to the time it reaches the limit, and the dashed tick is the rule's replacement time; light means unused life, hatched means an overrun. One time for all machines, 53.5 minutes, wastes 34 to 36 percent of every M2 end mill. One time per machine wastes about 2 percent, but that rule is fitted and judged on the same tools. So we use leave-one-out: each end mill's time comes from the other two on its machine. The mean error is 1.7 minutes, three overruns of at most 2 minutes, and no missed tool. This is the baseline a signal rule must beat.

## ⊕ 2:05–2:35 V3 特徵排名熱圖(CH2、T3)

- **操作**:按 ②。正規化先切 **raw** 再切回 **× own first 3–6 min**,讓大家看到列重新排序;指「主軸扭矩」那一列和「All」欄。
- **呈現什麼**:列是特徵、欄是 E1–E9 和「All」(9 把合併),格子顏色是 Spearman ρ:紅 = 磨耗越大特徵越大、灰 = 無關、藍 = 反向。主軸扭矩每把刀都 ≥ 0.97;不正規化時「All」只有 0.57,正規化後 0.95。
- **為什麼這樣設計**:
  - 用矩陣熱圖,不用一欄排名長條:矩陣一眼看得出「機台區塊」,例如刀齒振幅在 M3 三把刀全變藍,只有一欄會被平均掉。
  - 發散色階(藍–灰–紅)以 0 為中點,對應「反向 / 無關 / 正向」,格子上另印數字。
  - 切換正規化或在 V1 刷選時間時,ρ 即時重算、列用動畫重排,讓人追得到同一個特徵的位置變化。
  - 注意:ρ 只用來「篩選」。磨耗量是照時間內插的,隨時間漂移的量 ρ 也會高,所以還要跨機台測試(下一步)。
- **邏輯鏈**:EDA 發現 F3–F5(扭矩跟著磨耗走、要正規化、因特徵而異)→ CH2「哪個訊號能用、能不能跨機台」→ T3 特徵排名。這一步選出候選人:主軸扭矩。

**中文**:第二個問題:能不能改用訊號換刀?V3 是每個特徵和磨耗的相關係數,紅色代表磨耗越大、訊號越大。主軸扭矩在每把刀都超過 0.97。但不正規化的話,九把合併只有 0.57,因為三台機台的起點不同;除以新刀前 3 到 6 分鐘的水準後,升到 0.95。這種正規化不需要顯微鏡,產線上做得到。不過相關高只代表趨勢一致,真正的考驗是換一台機台還準不準。

**English**: The second question: can a signal replace fixed times? V3 shows each feature's correlation with wear; red means the signal grows with wear. Spindle torque exceeds 0.97 in every end mill. Pooled without normalization it is only 0.57, because the machines start at different levels; divided by each new tool's first 3 to 6 minutes, which needs no microscope, it rises to 0.95. But a high correlation only shows a shared trend. The real test is another machine.

## 2:35–3:15 V4 散佈圖與 V2 訊號警示(CH2、T4、T7)

- **操作**:指 V4 三樣顏色的中位數線和門檻帶 → V2 切到 **signal alarm**,校正選 **other machines** → 再選 **same machine, other end mills**(留一法),指摘要。
- **呈現什麼**:
  - V4:6,418 刀全部畫上,x = 磨耗量、y = 正規化後的扭矩。三台機台都往右上升(趨勢一致),但在 VB 140 的帶狀區高度不同(M3 較低)。警示值就是從這個帶的高度校正出來的。
  - V2 訊號模式:三角形是警示響的時間。用別台校正:M1、M2 提早 6–15 分鐘,M3 三把沒有三角形(漏報)。同機台留一法:平均誤差 4.7 分鐘,1 晚、1 漏報。
- **為什麼這樣設計**:
  - 散佈圖保留每個點的機台身分;六角分箱雖然不重疊,但會失去機台顏色。點太多會重疊,所以降低透明度,再加每把刀的滑動中位數線。
  - 中位數線除了顏色另加線型,色盲也分得出三台。
  - x 軸用 VB 而不是時間:這樣三台機台在「磨耗程度相同」的位置對齊,才能比較訊號是否重疊。
  - V2 的固定時間和訊號警示用**同一個留一法測試、同一個摘要格式**,兩種規則才能公平比較。
- **邏輯鏈**:CH2 → T4 跨機台比較、T7 用其他刀校正警示再測試。得到第二個答案:**趨勢可以跨機台,警示值不行;就算同機台校正,4.7 分鐘仍輸給固定時間的 1.7 分鐘**。同時留下一個問題:最大的誤差從哪來?→ 接 CH3。

**中文**:V4 把所有刀的扭矩對磨耗畫出來。三台機台都往上升,趨勢一致;但到了 140 微米門檻這個帶,M3 的高度比較低。警示值就是從這個高度訂的。所以如果用另外兩台訂警示值、拿到第三台用,M1、M2 會提早 6 到 15 分鐘警示,M3 三把全部沒響。改成同機台校正,用跟剛剛一樣的留一法,平均誤差是 4.7 分鐘,還是輸給固定時間的 1.7 分鐘。原因是同機台的刀壽命本來就很一致,固定時間已經很準。那最大的誤差從哪裡來?

**English**: V4 plots torque against wear for all runs. All machines rise, so the trend transfers, but at the 140-micrometre band M3 sits lower, and that band sets the alarm level. A level from the other two machines alarms 6 to 15 minutes early on M1 and M2 and never fires on M3. Calibrated on the same machine, with the same leave-one-out test, the error is 4.7 minutes, still worse than 1.7 for the fixed time, because tools on one machine already last almost equally long. So where does the largest error come from?

## 3:15–4:25 V5 時序與 V6 下鑽(CH3、T5、T6)

- **操作**:按 ③(自動選 E1)→ 指 V5 第 15 層的 **J** 標記、三角形警示、標題上「222 層中 2 層被標記」→ 點第 14 層的一刀(run 420)按 **pin** → 點第 15 層的一刀(run 443)→ 指 V6 三個面板。
- **呈現什麼**:
  - V5:E1 每一刀的扭矩,橫軸是第幾刀,背景交替底色是層。第 15 層整層跳高 19%,被標上 J(換層跳動),警示剛好在這裡響,比應該換刀早了 12 分鐘;第 16 層又回落。下方小條是 VB,是平滑上升的。
  - V6:上下疊三個面板:主軸扭矩、進給軸出力、測力計。彩色是第 15 層那刀,灰色是釘住的第 14 層。扭矩和測力計整段都比較高,進給軸幾乎沒變。
- **為什麼這樣設計**:
  - V5 橫軸用「第幾刀」而不是 VB:只有時序看得出層的結構;對 VB 畫的話,共用同一個內插 VB 的刀會擠在一起。
  - 層用交替底色標出,換層跳動一眼就看得到。標記門檻可調,標題同時顯示「被標記幾層」,讓人知道門檻設太鬆會標太多。
  - V6 不同單位的訊號分成上下面板、共用時間軸,而不是用雙 y 軸:雙 y 軸可以隨意調比例,容易誤導。
  - 「釘住」比較、且用灰色:不加新顏色,又能直接對比「正常層 vs 可疑層」。
  - 放測力計當參考:兩套獨立的量測系統一起變,就不是感測器壞了。
- **邏輯鏈**:EDA 發現 F6、F7(層內鋸齒、換層跳動)→ CH3「訊號變化是不是磨耗」→ T5 找可疑的層、T6 驗證。得到第三個答案:**E1 是誤報;警示落在被標記的層就去檢查,不直接換刀**。這也回頭解釋了 CH2 的最大誤差,把三個問題串在一起。

**中文**:第三個問題:訊號變了,一定是磨耗嗎?最大的誤差是 E1,早了 12 分鐘。V5 是 E1 每一刀的扭矩,底色交替代表不同層。第 15 層整層跳高 19%,系統標上 J,警示就是在這裡響的。全部 222 層裡只有 2 層被標記。我把第 14 層一刀釘住當對照,再點第 15 層。V6 裡,扭矩和測力計整段都變高;兩套獨立的系統一起變,所以不是感測器壞了。但第 16 層又回落,磨耗不會倒退,所以也不是磨耗。我們的規則是:警示落在被標記的層就去檢查刀,不直接換刀。只有 2 層被標記,現場做得到。

**English**: The third question: is a signal change always wear? The largest error, E1, alarms 12 minutes early. V5 shows E1's torque run by run, with alternating bands for layers. Layer 15 jumps by 19 percent and is flagged J, exactly where the alarm fires; only 2 of 222 layers are flagged. I pin a run from layer 14 and open one from layer 15. In V6, torque and dynamometer force are higher over the whole run. Two independent chains agree, so it is no sensor fault. But they fall back in layer 16, and wear never goes back, so it is not wear either. Our rule: an alarm in a flagged layer triggers an inspection, not a replacement. With two flagged layers, that is practical.

## 4:25–5:00 連動(⊕)與總結

- **操作**:⊕ 在 V1 拖曳一段時間範圍 → 指 V3 重新排序、V4 範圍外的點變淡;在 V4 框選一群點 → 指 V1、V5 同步高亮。然後停下來總結。
- **呈現什麼**:一個視圖的操作會即時更新其他視圖。
- **為什麼這樣設計**:三個視圖的橫軸不同(V1 時間、V4 磨耗量、V5 第幾刀),是故意的:同一群 run 從三個角度看,靠高亮串起來。例如在 V1 只選穩定期,V3 就會顯示「只看穩定期時哪個特徵最好」。
- **邏輯鏈**:把三個答案收成結論,並誠實說出限制,回到開場的使用者問題。

**中文**:最後展示連動:在 V1 選一段時間,V3 會重算排名、V4 只留下這段的點;在 V4 框一群點,V1 和 V5 會同步標出來。總結三點。第一,在公平的留一法測試下,每台機台各自訂固定時間比主軸扭矩警示準,1.7 分鐘對 4.7 分鐘。第二,趨勢可以跨機台,但警示值不行,訊號警示只適合當每台各自校正的安全網。第三,換層事件很少,用「被標記就檢查」處理。限制是每台只有 3 把刀、磨耗量多是內插、M2 機台和刀具批次分不開。謝謝。

**English**: Finally, the views are linked: brushing a time range in V1 recomputes V3 and fades V4; brushing in V4 highlights the runs in V1 and V5. Three takeaways. First, under a fair leave-one-out test, a fixed time per machine beats the spindle-torque alarm, 1.7 versus 4.7 minutes. Second, the trend transfers between machines but alarm levels do not, so an alarm is at most a calibrated safety net. Third, layer events are rare and are handled by inspecting flagged layers. Limitations: three end mills per machine, mostly interpolated wear, and machine and batch confounded on M2. Thank you.

---

## 預想問題
| 問題 | 回答重點 |
|---|---|
| 你們說固定時間浪費,結論卻推固定時間? | 浪費來自「全廠同一個時間」;每台機台各自訂時間,平均浪費從 34–36% 降到約 2% |
| 為什麼是 140 µm,不是 150? | 作者定 150,但 M2 三把刀都停在 147–149,用 150 會沒有壽命終點;系統中門檻可以調 |
| 新刀不知道全壽命,怎麼正規化? | 用前 3–6 分鐘的水準,不需要顯微鏡,也不用未來的資料;滑動中位數也只看過去 15 個 run |
| 為什麼依機台訂時間?可能是批次的原因 | 同意,機台和批次分不開。但結論只需要「同一台機台的刀壽命一致」,這點和原因無關;M1、M3 同批次,也同樣成立 |
| 系統能做到什麼是靜態報告做不到的? | 規則、校正方式、延續條件、門檻的組合很多,每改一個,誤報和漏報都會一起變,需要即時看結果才能取捨 |
| 只有機台訊號,看得出 E9 的鋸齒嗎? | 扭矩每層上升 5–7%,幅度小,但和 VB 100–140 之間的訊號差(約 0.06–0.09 倍)相當,所以會影響警示 |
| 為什麼不用自動模型? | 只有 9 把刀;用其他機台校正的測試已經顯示警示值無法跨機台;規則的取捨需要人決定 |
| MAE 怎麼處理漏報? | MAE 只算有警示的刀,漏報一律另外列出,系統的摘要也會同時顯示早、晚、漏報的數量 |
| 為什麼不拉長延續條件濾掉 E1? | 延續要超過一整層(30 個 run)才濾得掉,但同機台校正時會讓 9 把裡 5 把漏報,所以改用「被標記就檢查」 |
| E1 以外的提早警示呢? | 都不在被標記的層,是警示值本身不準;排除 E1 後平均誤差仍有 3.6 分鐘,高於固定時間的 1.7 分鐘 |
| 0.95 的相關不就夠了嗎? | 相關高只代表趨勢一致。用其他機台校正的測試才是真正的考驗,結果是誤差 6–15 分鐘,M3 全部漏報 |
