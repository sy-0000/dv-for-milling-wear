# WearLens web app(D3.js v7,純靜態)

## 執行方式(離線可用)
D3 已放在 `lib/`,不需要網路。因為瀏覽器會阻擋 `file://` 讀取資料檔,請用本機伺服器開啟:

- **VS Code Live Server**:在 `web/index.html` 上按右鍵,選 *Open with Live Server*。
- 或在 `web/` 資料夾執行:

```bash
python -m http.server 8000
```

  然後開啟 http://localhost:8000

建議使用 Chrome 或 Edge,視窗寬 ≥ 1280 px。

## 資料檔(由 `scripts/build_web_data.py` 產生,請勿手動修改)
| 檔案 | 內容 |
|---|---|
| `data/runs.csv` | 每個 run 一列:標籤、層、層內位置、21 個特徵 |
| `data/meta.json` | 機台、刀具、特徵說明、資料限制 |
| `data/envelopes.bin` | 每個 run 的訊號包絡(Uint16,6418 × 3 × 200) |
| `data/snippets.json` | 代表性 run 的 20 ms 原始力波形 |

重建網頁資料:
```bash
python scripts/build_web_data.py
```

## 版面(折衷版:問題分頁 + 縮圖)
- 頂部:品牌、**Q1–Q4 問題分頁**(另有「全部視圖」)、全域控制(特徵、正規化、VB 門檻、測力計參考)、**中 / EN 切換**。
- 每個問題的主視圖放大在中間:Q1 = V1;Q2 = V3 + V4;Q3 = V4 + V5;Q4 = V5 + V6。其他視圖縮成左側縮圖,選取仍即時連動;點縮圖會切到使用它的問題。
- 右側固定 **V2 計分板**與**結論框**;結論框的文字依目前設定、由既有分析結果即時產生(`js/concl.js`)。
- 「全部視圖」分頁:六個視圖全部放大(不套用問題設定),供自由探索。
- 網址參數:`?lang=en|zh` 指定語言(否則沿用上次選擇,預設中文);`?step=1..4|all` 直接開某個問題(1–4 會套用該問題的設定)。
- 寬度 < 1200 px 時改成單欄,縮圖排成一列。
- 配色預算:結構元素一律灰階;機台用低飽和、色盲友善的三色(M1 `#4a76b8`、M2 `#c4862e`、M3 `#3f9b78`,已用 dataviz 的 `validate_palette.js` 驗證:CVD ΔE ≥ 8.5、一般視覺 ΔE ≥ 16.9、對比 ≥ 3:1);**唯一的強調色** `#b0306f` 只給警報(▼、J/R 標記)與被選取的物件。
- V3 熱圖:8 個機台控制特徵全列;測力計 13 個特徵只顯示 2 個代表(Force X mean、Tooth-pass amplitude 530 Hz),整組淡灰底退後,其餘仍可從 Feature 選單選取。色階為降低飽和度的藍–灰–磚紅,格子不顯示數字(hover 才顯示 ρ 與 n)。
- 各 panel 的長說明收在標題旁的 ⓘ(點擊展開);數字結果(計分板、V2 摘要、V5 標記層數)保留在畫面上。資料限制收在頁尾可展開區塊。
- 選擇導覽步驟後,與該步驟無關的 panel 會變淡(滑鼠移上去恢復);再按一次同一步驟、✕ 或 Reset 即離開。
- 字級三種:panel 標題 13 px、內文/軸標籤 11 px、註解/刻度 10 px。
- V3 預設依「九把刀中最低的 ρ」排序(是否每把刀都跟著磨耗),可切換成依合併 ρ 排序。

## 程式結構
| 檔案 | 功能 |
|---|---|
| `js/main.js` | 載入資料、全域控制、導覽按鈕、連動 |
| `js/state.js` | 共用狀態(publish/subscribe) |
| `js/i18n.js` | 中英文字(`tr()`、`data-i18n`) |
| `js/concl.js` | 各問題的即時結論文字 |
| `js/analysis.js` | 分析元件:正規化、Spearman、壽命/門檻、滑動中位數、層級診斷 |
| `js/v1_wear.js` … `js/v6_detail.js` | 六個視圖 |
