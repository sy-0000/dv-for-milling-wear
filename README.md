# WearLens — Visual analytics of end-mill wear across three machine tools

資料視覺化期末專題(D3.js VA 系統)。系統名稱 WearLens 為暫定名稱。

- **目標使用者**:要在多台機台導入刀具狀態監控的製程/設備工程師。設定為產線上**沒有測力計**,只有機台控制器訊號;測力計只是試驗時的參考。
- **資料**:Denkena, Klemme & Stiehl (2023), *Data in Brief* 50:109574;Mendeley Data doi:10.17632/zpxs87bjt8(CC BY 4.0)。9 把端銑刀(本專案稱 E1–E9,原始檔名中為 T1–T9)× 3 台機台,共 6,418 個 run。

## 快速開始(看系統)
1. 用 VS Code Live Server 開啟 `web/index.html`,或在 `web/` 資料夾執行下面的指令,再開啟 http://localhost:8000:

```bash
python -m http.server 8000
```

2. 完全離線可用,D3 v7.9.0 已放在 `web/lib/`。

## 重現資料處理(可重跑,不會修改原始資料)
需要 Python 3.10 以上,以及 `h5py`、`numpy`、`pandas`、`scipy`、`matplotlib`:

```bash
pip install h5py numpy pandas scipy matplotlib
```

依序執行(下載約 10.6 GB,存到 `data/raw/`,這個資料夾不進 git):

```bash
python scripts/download_data.py
```

```bash
python scripts/extract_features.py
```

```bash
python scripts/eda.py
```

```bash
python scripts/build_web_data.py
```

```bash
python scripts/verify.py
```

| 腳本 | 功能 | 輸出 |
|---|---|---|
| `download_data.py` | 用 curl 下載並驗證 sha256 | `data/raw/*.h5` |
| `inspect_h5.py` | 列出 h5 結構 | 終端機輸出 |
| `feasibility_check.py` | 階段 3 可行性試算 | `data/feasibility_*.csv`、可行性散佈圖(未收錄於 docs) |
| `extract_features.py` | 每個 run 萃取特徵、envelope、代表性波形 | `data/features.csv`、`data/signals/` |
| `eda.py` | 階段 5 探索分析 | `data/eda_*.csv`、`docs/figs/eda_*.png` |
| `walkthrough_figs.py` | 資料導覽說明圖 | `docs/figs/walk_*.png` |
| `build_web_data.py` | 產生網頁用的精簡資料 | `web/data/` |
| `verify.py` / `verify_app.js` | 數字核對(資料端 / 網頁端) | 終端機輸出、`data/verify_expected.json` |

## 文件(`docs/`)
| 檔案 | 內容 |
|---|---|
| `01_data.md` | 論文與資料:實驗結構、VB 與壽命、訊號、限制與勘誤、特徵萃取 |
| `02_findings.md` | 探索分析發現 F1–F8 |
| `03_logic_and_design.md` | VA 邏輯鏈(使用者、CH、任務、分析元件、洞察)與視覺設計 |
| `04_verification.md` | 驗證紀錄(數字核對、無障礙) |
| `05_demo_script.md` | Demo 講稿與預想問題 |

## 資料限制(系統和報告中都要標註)
- VB 每 1–2 層(約 40 個 run)才用顯微鏡量一次,其餘為線性內插。
- 測力計和控制器訊號之間可能有約 100 ms 的時間偏移。
- M2 的主軸扭矩和進給軸訊號可能混疊。
- T7、T8 的座標系旋轉約 1–2°。
- T8 缺少早期磨耗資料。
- M2 的刀全為批次 B,機台和批次的效應混淆。
- 每把刀只在一台機台上跑過。
