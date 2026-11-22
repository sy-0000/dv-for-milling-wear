# WearLens 報告(課程 VGTC 模板)

## 上傳到 Overleaf
把整個 `report/` 資料夾上傳(或壓縮成 zip 上傳),編譯器選 **pdfLaTeX**,主檔為 `main.tex`。

| 檔案 | 用途 |
|---|---|
| `main.tex` | 報告本文(依課程模板的章節順序) |
| `refs.bib` | 參考文獻 |
| `vgtc.cls`、`abbrv-doi*.bst` | 課程模板的版型和文獻格式(原樣複製) |
| `figs/` | 圖片:`teaser.png`、`motivation.pdf`、`closeup_v1_v3_v4.png`、`scenario1_col.png`、`scenario2_col.png` |

## 交件前必改(TODO)
1. 作者、學號、email、組別(`\author`、`\affiliation`)。
2. 第 9 節 Team Contributions。
3. (已完成)測力計的引用已改為 Mohamed et al. (2022), Sensors 22(6):2206,依據該文 Sec. 2.1.1 與 2.1.4。

## 重新產生圖片
在 `web/` 啟動本機伺服器(port 8765)後:

```bash
node scripts/report_figs.js
```

```bash
python scripts/compose_report_figs.py
```
