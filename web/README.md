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

## 版面(依敘事排列)
- 上方固定列:①–④ 導覽按鈕、全域控制(特徵、正規化、VB 門檻、測力計參考、機台圖例)。
- 左邊依步驟排成三列:① 壽命(V1)、②③ 訊號是否跟著磨耗、能否訂警示線(V3 + V4)、④ 訊號變化是不是磨耗(V5 + V6)。
- 右邊固定 **V2 計分板**:四種換刀規則在同一個測試下的平均誤差(長條從 0 開始),虛線 = 基準(每台機台固定時間・留一法);點一列切換下方的詳細圖。
- 寬度 < 1200 px 時改成單欄,計分板排在 ① 之後。
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
| `js/analysis.js` | 分析元件:正規化、Spearman、壽命/門檻、滑動中位數、層級診斷 |
| `js/v1_wear.js` … `js/v6_detail.js` | 六個視圖 |
