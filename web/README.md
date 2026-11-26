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
- 顏色只代表機台;紫色只用於 V5 的層標記;門檻帶與選取一律用中性灰/黑。
- V3 預設依「九把刀中最低的 ρ」排序(是否每把刀都跟著磨耗),可切換成依合併 ρ 排序。

## 程式結構
| 檔案 | 功能 |
|---|---|
| `js/main.js` | 載入資料、全域控制、導覽按鈕、連動 |
| `js/state.js` | 共用狀態(publish/subscribe) |
| `js/analysis.js` | 分析元件:正規化、Spearman、壽命/門檻、滑動中位數、層級診斷 |
| `js/v1_wear.js` … `js/v6_detail.js` | 六個視圖 |
