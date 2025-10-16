twin3 HWAM Demo UI

快速啟動

1) 安裝 demo 依賴（建議在已安裝主專案依賴的環境）
```bash
pip install -r demo_ui/requirements.txt
```

2) 確保已產出 HWAM 結果檔
```bash
python src/run_hwam.py --use_ads_full_path --boost_from_parents --gamma 0.2 --leaf_only_output --top_k 15 --output state/hwam_results.json
```

3) 啟動 Streamlit App
```bash
streamlit run demo_ui/app.py
```

功能
- 步驟一：建立 Persona（代表性 DNA 使用滑桿，未顯示者預設 128）
- 步驟二：選擇廣告活動（預設三個範例）
- 步驟三：受眾洞察（依活動標籤反推最相關的 Top-5 DNA）
- 步驟四：Persona 與活動匹配度（以 HWAM Top-K 映射近似計算，輸出百分比）

檔案
- demo_ui/app.py：主程式
- demo_ui/campaigns.json：活動設定（顯示名稱與實際標籤 id）
- state/hwam_results.json：HWAM 映射結果（由主程式產出）
- metadata/*.json：原始資料


