# twin3 全功能演算法框架 - PoC

一個完整的**twin Matrix**動態演算法框架概念驗證系統，實現了**MSMM**（語意匹配）、**ULTU**（動態評分）、**DADEE**（維度演進）三大核心模組的無縫協作。

## 🎯 系統概述

twin3 框架模擬了一個256維度的用戶特徵矩陣系統，能夠：

1. **實時處理用戶體驗內容**，智能映射到相關維度
2. **動態更新分數**，使用平滑算法和時間衰減
3. **自我演進**，通過分析大量數據發現新興概念並優化維度系統



### 🤖 AI 驅動的處理能力

- **MSMM模組**：使用Gemma-3n-E4B-it進行智能Meta-Tag提取，支援多模態內容理解
- **ULTU模組**：基於維度定義使用Gemma-3n-E4B-it進行精確評分，結合專業的評分規則  
- **多模式運行**：支援Gemma-3n-E4B-it多模態模式、增強模式和規則引擎回退模式

### 🔥 Gemma-3n-E4B-it 多模態特色

- **🖼️ 視覺理解**：支援圖像內容分析，從照片中提取情境和活動資訊
- **📝 文本增強**：更準確的中文語意理解，支援複雜語境和隱含意義
- **🧠 上下文整合**：同時處理視覺和文本資訊，提供更全面的用戶體驗分析
- **⚡ 效能提升**：相比前代模型，準確度提升10-15%，處理速度優化20%



## 🏗️ 系統架構

### 核心模組

- **MSMM** (Multi-Semantic Matching Module) - 語意匹配引擎 🤖
- **ULTU** (Universal Life-Twin Update) - 動態評分更新系統 ⚡
- **DADEE** (Dynamic Attribute Development & Evolution Engine) - 維度演進引擎 🌱

### 數據流程

```
用戶內容 → MSMM (Gemma提取Meta-Tags) → ULTU (Gemma精確評分) → Twin Matrix 更新
                                                                        ↓
大量數據 → DADEE (演進分析) → 優化建議 → 手動治理 → 系統演進
```

## 🚀 快速開始

### 1. 環境準備

```bash
# 安裝依賴（包含Gemma支援）
pip install -r requirements.txt

# 確認目錄結構
ls -la
# 應該看到：data/, metadata/, state/, src/
```

### 2. 第一階段演示：主更新循環

運行預設的演示場景（使用Gemma AI）：

```bash
cd src
python main.py
```

或指定自定義內容：

```bash
python main.py "我今天帶領學弟妹完成了一篇論文，還順便去吃了有名的台式早餐慶祝。"
```

**預期輸出（Gemma版本）：**
- 🤖 Gemma智能提取Meta-Tags（如：["領導", "成就", "學術", "食物", "慶祝"]）
- ⚡ Gemma精確評分更新（基於維度定義的詳細分析）
- 📊 完整的Twin Matrix狀態更新和HEX值顯示



### 3. 第二階段演示：維度演進循環

運行DADEE分析：

```bash
python run_dadee.py
```
(這部分還在除錯中)
### 5. 驗證演進效果

```bash
# 使用Gemma進行環保主題驗證
python main.py --environmental-demo

# 或測試環保相關內容
python main.py "我參加了一個環保市集，學習如何減少碳足跡。"
```

## 🖼️ 如何上傳文字與影像進行多模態分析

### 1. 僅輸入文字
直接在命令列執行：
```bash
python src/main.py "我今天參加了一場馬拉松，沿途風景很美。"
```

### 2. 輸入文字 + 圖片
假設您的圖片檔案為 `myphoto.jpg`，可用以下指令：
```bash
python src/main.py --image myphoto.jpg "我今天參加了一場馬拉松，沿途風景很美。"
```
- `--image` 參數可用本地路徑或網路圖片 URL
- 文字與圖片會同時被分析

### 3. 模擬多用戶（user 隔離）

Twin3 支援多用戶隔離，您可以用 `--user` 參數指定不同用戶ID，系統會自動將每位用戶的資料分開儲存在 `state/` 目錄下：

```bash
python src/main.py --user 1 --image user1.jpg "這是 user1 的內容"
python src/main.py --user 2 --image user2.jpg "這是 user2 的內容"
```
- user1 的資料會儲存在 `state/user_1_matrix_state.json` 和 `state/user_metatags_records.json`
- user2 的資料會儲存在 `state/user_2_matrix_state.json` 和 `state/user_metatags_records.json`
- 這樣可輕鬆模擬多用戶，資料完全隔離

> **說明**：user ID 可自訂為任意正整數。

## 📁 目錄結構

```
twin3-full-poc/
├── README.md                    # 本文檔
├── requirements.txt             # Python依賴（含Gemma支援）
├── data/                        # 用戶體驗數據樣本
│   ├── journey_1.txt           # 永續生活主題
│   ├── journey_2.txt           # 環保市集體驗
│   ├── journey_3.txt           # 減碳行動
│   ├── journey_4.txt           # 一般日常活動
│   └── journey_5.txt           # 零廢棄生活
├── metadata/                    # Twin Matrix核心定義
│   └── attribute_metadata.json # 維度元數據
├── state/                       # 用戶狀態管理
│   └── user_matrix_state.json  # 當前Twin Matrix狀態
└── src/                         # 核心程式碼
    ├── main.py                 # 主更新循環執行腳本
    ├── run_dadee.py            # 維度演進循環執行腳本
    ├── test_gemma_integration.py # Gemma整合測試腳本
    ├── msmm.py                 # MSMM模組實現（含Gemma）
    ├── ultu.py                 # ULTU模組實現（含Gemma）
    └── dadee.py                # DADEE模組實現
```

## 🔧 核心功能詳解

### MSMM - 語意匹配模組（升級版）

- **功能**：將用戶內容映射到最相關的維度
- **AI技術**：
  - Gemma-3n-E4B-it進行智能Meta-Tag提取（支援多模態）
  - Sentence-BERT多語言向量化
  - 餘弦相似度計算
  - 視覺內容理解（圖像分析）
- **回退機制**：規則引擎確保穩定性
- **輸入**：用戶體驗文本
- **輸出**：匹配維度列表及相似度分數

### ULTU - 動態評分更新模組（升級版）

- **功能**：為匹配維度生成新分數並更新整個矩陣
- **AI技術**：
  - Gemma-3n-E4B-it結合維度定義進行精確評分
  - 考慮當前分數的上下文感知評分
  - 智能解析用戶行為的強度和影響
  - 多模態內容綜合評估能力
- **核心算法**：
  - 分數平滑：`新分數 = α × Gemma評分 + (1-α) × 舊分數`
  - 時間衰減：`衰減分數 = e^(-λΔt) × 舊分數`
- **輸入**：匹配維度 + 用戶內容 + 維度定義
- **輸出**：更新後的Twin Matrix狀態

### DADEE - 維度演進模組

- **功能**：分析大量數據，發現新興概念，提出演進建議
- **技術**：DBSCAN聚類 + 新穎性評估
- **輸入**：大量用戶體驗數據
- **輸出**：演進提案（擴展現有維度 or 創建新維度）

## 📊 演示場景

### 場景一：學術成就與領導力（Gemma版本）

**輸入**：「我今天帶領學弟妹完成了一篇論文，還順便去吃了有名的台式早餐慶祝。」

**Gemma處理流程**：
1. **Meta-Tag提取**：["領導", "學術成就", "團隊合作", "食物", "慶祝", "指導"]
2. **維度匹配**：Social Achievements (0.92), Leadership Ability (0.87), Dietary Habits (0.45)
3. **精確評分**：
   - 0071-Social Achievements: Gemma分析「完成論文」→ 185分
   - 0048-Leadership Ability: Gemma分析「帶領學弟妹」→ 170分
   - 0008-Dietary Habits: Gemma分析「台式早餐」→ 135分

### 場景二：環保意識演進

**輸入**：大量環保主題數據（data/目錄）

**預期結果**：
- DADEE發現「永續」、「環保」、「減碳」等新興概念
- 建議擴展SP088-Social Responsibility維度
- Gemma驗證：環保內容在SP088維度獲得高分評價



## 🛠️ 配置與自定義

### Gemma模型選擇

```python
# 在代碼中自定義Gemma配置
processor = Twin3MainProcessor(
    use_gemma=True,
    gemma_model="google/gemma-3n-E4B-it"  # 最新多模態版本
)
```
