# 01 資料與前處理

來源：Denkena, Klemme, Stiehl (2023), *Data in Brief* 50, 109574, doi:10.1016/j.dib.2023.109574（CC BY 4.0）
資料：Mendeley Data doi:10.17632/zpxs87bjt8（v3，6,418 個 .h5，約 10.6 GB）
圖：`docs/figs/walk_1_anatomy.png`（由 `scripts/walkthrough_figs.py` 產生）

> 刀具命名：本檔沿用原始檔名 **T1–T9**；系統、報告與 demo 改稱 **E1–E9**（避免和任務 T1–T7 混淆）。

## 1. 實驗結構

```
3 台機台 (M1, M2, M3)，跑同一支 NC 程式、同樣參數
 └─ 每台磨 3 把新刀 (T1–T9)，每把刀用自己的一塊工件（鑄鐵 600-3/S，100×80×170 mm）
     └─ 一層一層往下切，每層深 2 mm (ap)
         └─ 一層 = 44 刀直線側銑，每刀往 +X 平移 4 mm (ae)
             └─ 一刀 = 一個 run = 一個 .h5 檔；刀沿 +Y 走過工件，約 4 s 在吃刀
```

- 刀具：Gühring 實心碳化鎢端銑刀，D8 mm，4 刃，TiN-TiAlN 鍍層；型號相同、批次不同。
- 參數全程固定：側銑，vf = 1,592 mm/min，vc = 200 m/min，ae = 4 mm，ap = 2 mm。
- 每秒去除體積固定 ≈ 4 × 2 × 26.5 ≈ 212 mm³/s；**沒有感測器量「切了多少」**，量的是切削時的反應（力、扭矩、位置誤差）。
- 每層頭尾、碰到安裝孔（x = 39–55、115–131 mm）和毀損的 run 都被刪掉，每層實際剩 **29 個 run**（約 142 s 切削）。

| 機台 | 型號 | 控制器 | 進給驅動 | 主軸 | 刀具 | 批次 |
|---|---|---|---|---|---|---|
| M1 | DMG Mori Milltap 700 | Siemens 840D sl | 滾珠螺桿 | 4 kW / 8 Nm | T1–T3 | A |
| M2 | DMG Mori HSC 30 linear | Siemens 840D sl | 線性直驅 | 15 kW / 12 Nm | T4–T6 | **B** |
| M3 | DMG Mori HSC 55 linear | Heidenhain iTNC 530 | 線性直驅 | 55 kW / 19 Nm | T7–T9 | A |

> ⚠️ 每把刀只在一台機台上跑過，且 M2 的刀全是批次 B → 「M2 壽命較長」**無法區分**是機台還是批次造成。

## 2. 時間軸、磨耗 VB 與壽命

- **R（run 編號）不是時間**：刪掉的 run 不計號。時間軸用 **C（累計接觸時間，s）**，相鄰 run 差中位數 4 s，刪除處約 24 s。
- **VB**：刀腹磨耗帶寬度（ISO 8688-2），Keyence 顯微鏡 100× 量 4 刃取平均，不確定度約 5 µm。要停機量，**每 1–2 層（約 40 run）才量一次**，其餘依 C **線性內插** → 層內 VB 是人為直線。
- **壽命終點**：作者自訂 VB ≈ 150 µm（未說明理由）。但 **M2 三把最大只到 147–149 µm**，門檻寫死 150 會讓 M2 沒有終點 → 本專案預設 **140 µm**。
- 典型曲線：快速磨到約 50 µm → 線性段 → 加速；大多數 run 落在 50–100 µm。

| 刀 | 機台 | run 數 | C 範圍 (s) | VB 範圍 (µm) | 首次 VB≥100 的 C (s) | 首次 VB≥150 的 C (s) |
|---|---|---|---|---|---|---|
| T1 | M1 | 609 | 11–3458 | 3–158 | 2446 | 3376 |
| T2 | M1 | 609 | 12–3418 | 3–145 | 2787 | 未達 |
| T3 | M1 | 638 | 12–3646 | 3–152 | 2640 | 3619 |
| T4 | M2 | 928 | 11–5171 | 3–149 | 4009 | 未達 |
| T5 | M2 | 928 | 11–5172 | 3–148 | 4125 | 未達 |
| T6 | M2 | 928 | 11–5181 | 3–147 | 4137 | 未達 |
| T7 | M3 | 609 | 11–3439 | 3–153 | 2495 | 3354 |
| T8 | M3 | 560 | 177–3473 | 34–150 | 2380 | 3446 |
| T9 | M3 | 609 | 12–3449 | 3–160 | 2413 | 3323 |

## 3. 訊號

HDF5 三個 group：`labels/`、`signals_machine/`、`signals_sensor/`；每個訊號 shape (1, N) float32。

| 訊號 | 物理意義 | 來源 / 取樣 | 機台 |
|---|---|---|---|
| force_sensor_x/y/z | 刀推工件的力（X 橫向、Y 進給、Z 垂直） | Kistler 9257B 壓電測力計 → 電荷放大器（10 kHz 低通）→ NI 9215，25 kHz | 全部 |
| torque_spindle | 主軸扭矩（一般由馬達電流換算） | 控制器，500 Hz | 全部 |
| torque_axis_x/y/z | 進給軸扭矩（滾珠螺桿為旋轉馬達） | 控制器 | M1 |
| force_axis_x/y/z | 進給軸推力（線性馬達） | 控制器 | M2、M3 |
| position_control_deviation_x/y | 跟隨誤差（命令 − 實際） | 控制器 + 編碼器 | 全部 |
| tool_position_x/y/z | 刀具中心位置（三次保形插值） | 控制器 + 編碼器 | 全部 |

- **座標**：y 在 run 內由 −8 等速走到 108 mm（26.5 mm/s）；x 在 run 內固定、每刀 +4 mm、換層歸零 → 用來切「層」與層內位置；z 切削時固定 −2 mm（每層重新歸零的相對座標，推論）。
- **兩套獨立量測**：測力計與機台訊號同時看到的變化，比單邊可信得多。
- **刀齒頻率 530 Hz > 機台訊號上限 250 Hz**：單一刀刃脈衝只有測力計看得到；這也是 M2 關掉濾波器會混疊的原因。

## 4. 資料限制與檔案勘誤

論文列出的限制：
1. 測力計與控制器以互相關對齊，可能殘留約 100 ms 偏差 → 不分析進出刀時間點。
2. M2 控制器低通濾波關閉 → force_axis、torque_spindle 可能混疊。
3. T7、T8 XY 座標旋轉約 1–2° → 影響 position、position_control_deviation、force_axis。
4. T8 缺初期資料：第一個 run 已是 C = 177 s、VB = 34 µm；另有一處 117 s 缺口（run 10）。

開檔核對（`scripts/inspect_h5.py`）：

| 項目 | 檔案實際內容 | 處理 |
|---|---|---|
| 取樣率 | 500 Hz / 25 kHz | ✅ 與論文一致 |
| C 的 attr | 寫 `min`，數值顯然是秒 | 視為秒 |
| position_control_deviation 單位 | attr 寫 `mm`（≈0.001 mm） | 以 mm 為準 |
| force_axis 單位 | attr 寫 `Nm` | 應為 N |
| force_axis key | `force_axis_x/y/z`（論文 Table 2 誤植三次 `_x`） | ✅ |
| torque_spindle 正負號 | M1 負、M2 正 | 取絕對值 |
| run 長度 | 檔案約 4.4 s，真正吃刀較短；tool_position_z 比吃刀早下降 | 用力的門檻切段 |

## 5. 特徵萃取（`scripts/extract_features.py`）

每個 run：
1. 只讀不改 h5。
2. **切削區段**：測力計 XY 合力 50 ms 移動 RMS > 其 95 百分位數的 30%。
3. **頭尾各裁 0.15 s**：避開進出刀衝擊與約 100 ms 時間偏移。偵測到的切削長度 3.91–4.05 s，與「每 run 約 4 s」吻合。
4. 在區段內算統計量：

| 類別 | 特徵 |
|---|---|
| 力的大小 | Fx/Fy/Fz_mean、Fxy_mean、Fxy_rms、F3_mean、Fxy_p99 |
| 力的波動 | Fx/Fy/Fz_std |
| 頻率 | A_tooth（530 Hz）、A_spindle（133 Hz）、runout_ratio = A_spindle / A_tooth |
| 進出刀 | entry_peak、exit_peak |
| 主軸 | Tsp_mean、Tsp_std（取絕對值） |
| 進給軸 | ax_x/y/z_mean、ax_y_std（M1 為 Nm，M2/M3 為 N） |
| 位置誤差 | pcd_x_std、pcd_y_std |
| 背景 | x_pos_mm、cut_s、layer |

5. 標籤與 filelist.csv 逐列比對，6,418 列全部一致。

`scripts/eda.py` 的衍生欄位：
- `layer`：由 tool_position_x 歸零切出層號；`x_pass_mm`：層內第幾刀（對齊 4 mm 網格）。
- `<feature>__ratio`：除以該刀 VB 50–60 µm 的中位數（9 把刀都有這段，含 T8）。只能用在試驗資料。
- `<feature>__z`：機台內 z-score。
- `<feature>__resid`：相對於 29 run 滑動中位數的偏差（看層內效應與異常）。
- 系統另提供**產線可用的正規化**：除以新刀前 3–6 分鐘的中位數（不需要顯微鏡或未來資料）。
