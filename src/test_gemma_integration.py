#!/usr/bin/env python3
"""
Gemma整合測試腳本
測試MSMM和ULTU模組的Gemma整合效果
"""

import sys
import os
import json
from datetime import datetime

# 添加當前目錄到Python路徑
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from msmm import MSMMProcessor
from ultu import ULTUProcessor

def test_msmm_gemma_vs_fallback():
    """測試MSMM的Gemma提取 vs 規則引擎提取"""
    print("=== MSMM Meta-Tag提取比較測試 ===")
    
    test_cases = [
        "我今天帶領學弟妹完成了一篇論文，還順便去吃了有名的台式早餐慶祝。",
        "參加了環保市集，學習如何減少碳足跡，買了一些永續產品。",
        "在健身房進行了高強度間歇訓練，然後和朋友們一起享用健康晚餐。",
        "學習了新的程式設計技巧，開發了一個AI應用，感覺很有成就感。"
    ]
    
    for i, content in enumerate(test_cases, 1):
        print(f"\n--- 測試案例 {i} ---")
        print(f"用戶內容: {content}")
        
        # 測試Gemma版本
        print(f"\n🤖 Gemma提取結果:")
        try:
            msmm_gemma = MSMMProcessor(use_local_gemma=True)
            gemma_tags = msmm_gemma.extract_content_meta_tags(content)
            print(f"  Meta-Tags: {gemma_tags}")
        except Exception as e:
            print(f"  ❌ Gemma提取失敗: {e}")
            gemma_tags = []
        
        # 測試規則引擎版本
        print(f"\n⚙️  規則引擎結果:")
        msmm_fallback = MSMMProcessor(use_local_gemma=False)
        fallback_tags = msmm_fallback.extract_content_meta_tags(content)
        print(f"  Meta-Tags: {fallback_tags}")
        
        # 比較結果
        if gemma_tags:
            print(f"\n📊 比較分析:")
            print(f"  Gemma標籤數量: {len(gemma_tags)}")
            print(f"  規則引擎標籤數量: {len(fallback_tags)}")
            
            common_tags = set(gemma_tags) & set(fallback_tags)
            if common_tags:
                print(f"  共同標籤: {list(common_tags)}")
            
            gemma_unique = set(gemma_tags) - set(fallback_tags)
            if gemma_unique:
                print(f"  Gemma獨有: {list(gemma_unique)}")
            
            fallback_unique = set(fallback_tags) - set(gemma_tags)
            if fallback_unique:
                print(f"  規則引擎獨有: {list(fallback_unique)}")
        
        print("-" * 60)

def test_ultu_gemma_scoring():
    """測試ULTU的Gemma評分效果"""
    print("\n=== ULTU Gemma評分測試 ===")
    
    # 模擬匹配到的維度
    test_attributes = [
        {"attribute_id": "0071", "attribute_name": "Social Achievements", "similarity_score": 0.85},
        {"attribute_id": "0048", "attribute_name": "Leadership Ability", "similarity_score": 0.72},
        {"attribute_id": "SP088", "attribute_name": "Social Responsibility", "similarity_score": 0.60}
    ]
    
    test_cases = [
        {
            "content": "我今天帶領學弟妹完成了一篇重要的研究論文，獲得了教授的高度讚賞。",
            "expected_high": ["0071", "0048"]  # 期望這些維度得到較高分數
        },
        {
            "content": "參加了社區的淨灘活動，清理了大量海洋垃圾，為環境保護盡一份力。",
            "expected_high": ["SP088"]  # 期望社會責任維度得到較高分數
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n--- 評分測試案例 {i} ---")
        print(f"用戶內容: {test_case['content']}")
        print(f"期望高分維度: {test_case['expected_high']}")
        
        # 測試Gemma評分
        print(f"\n🤖 Gemma評分結果:")
        try:
            ultu_gemma = ULTUProcessor(use_local_gemma=True)
            
            for attr in test_attributes:
                attr_id = attr['attribute_id']
                attr_name = attr['attribute_name']
                
                # 直接測試評分功能
                score = ultu_gemma._generate_attribute_score(attr_id, test_case['content'])
                is_expected_high = attr_id in test_case['expected_high']
                status = "✅ 符合期望" if (is_expected_high and score > 150) or (not is_expected_high and score <= 150) else "⚠️  可能需要調整"
                
                print(f"  {attr_id}-{attr_name}: {score}/255 {status}")
                
        except Exception as e:
            print(f"  ❌ Gemma評分失敗: {e}")
        
        # 測試回退評分
        print(f"\n⚙️  回退評分結果:")
        ultu_fallback = ULTUProcessor(use_local_gemma=False)
        
        for attr in test_attributes:
            attr_id = attr['attribute_id']
            attr_name = attr['attribute_name']
            
            score = ultu_fallback._generate_attribute_score(attr_id, test_case['content'])
            is_expected_high = attr_id in test_case['expected_high']
            status = "✅ 符合期望" if (is_expected_high and score > 150) or (not is_expected_high and score <= 150) else "⚠️  可能需要調整"
            
            print(f"  {attr_id}-{attr_name}: {score}/255 {status}")
        
        print("-" * 60)

def test_full_pipeline_comparison():
    """測試完整流程的比較"""
    print("\n=== 完整流程比較測試 ===")
    
    test_content = "我今天組織了一個環保志工活動，帶領20多位同學一起清理河岸垃圾，還學習了垃圾分類和回收的知識。活動結束後大家一起享用了有機素食便當，討論如何在日常生活中實踐更多環保行為。"
    
    print(f"測試內容: {test_content}")
    
    # Gemma版本完整流程
    print(f"\n🤖 Gemma版本完整流程:")
    try:
        msmm_gemma = MSMMProcessor(use_local_gemma=True)
        ultu_gemma = ULTUProcessor(use_local_gemma=True)
        
        # MSMM處理
        matched_attrs_gemma = msmm_gemma.process_user_content(test_content, threshold=0.1)
        
        if matched_attrs_gemma:
            # ULTU處理
            results_gemma = ultu_gemma.process_attribute_updates(matched_attrs_gemma, test_content)
            
            print(f"\n📊 Gemma版本更新摘要:")
            for attr_id, update_info in results_gemma['updates'].items():
                change = update_info['change']
                print(f"  {attr_id}: {update_info['previous_score']} → {update_info['smoothed_score']} ({change:+d})")
    
    except Exception as e:
        print(f"  ❌ Gemma版本執行失敗: {e}")
    
    # 規則引擎版本完整流程
    print(f"\n⚙️  規則引擎版本完整流程:")
    msmm_fallback = MSMMProcessor(use_local_gemma=False)
    ultu_fallback = ULTUProcessor(use_local_gemma=False)
    
    # MSMM處理
    matched_attrs_fallback = msmm_fallback.process_user_content(test_content, threshold=0.1)
    
    if matched_attrs_fallback:
        # ULTU處理
        results_fallback = ultu_fallback.process_attribute_updates(matched_attrs_fallback, test_content)
        
        print(f"\n📊 規則引擎版本更新摘要:")
        for attr_id, update_info in results_fallback['updates'].items():
            change = update_info['change']
            print(f"  {attr_id}: {update_info['previous_score']} → {update_info['smoothed_score']} ({change:+d})")

def performance_analysis():
    """性能分析"""
    print("\n=== 性能分析 ===")
    
    print("🔧 系統配置檢查:")
    
    # 檢查transformers是否安裝
    try:
        import transformers
        print(f"  ✅ Transformers版本: {transformers.__version__}")
    except ImportError:
        print(f"  ❌ Transformers未安裝")
    
    # 檢查PyTorch和CUDA
    try:
        import torch
        print(f"  ✅ PyTorch版本: {torch.__version__}")
        print(f"  🖥️  CUDA可用: {torch.cuda.is_available()}")
        if torch.cuda.is_available():
            print(f"  🚀 GPU數量: {torch.cuda.device_count()}")
            print(f"  💾 GPU記憶體: {torch.cuda.get_device_properties(0).total_memory // 1024**3}GB")
    except ImportError:
        print(f"  ❌ PyTorch未安裝")
    
    print(f"\n💡 建議:")
    print(f"  - 如果有GPU，Gemma模型載入和推理會更快")
    print(f"  - 建議使用gemma-2b-it模型以平衡效能和品質")
    print(f"  - 若記憶體不足，可以使用規則引擎模式")

def main():
    """主函數"""
    print("🧪 Twin3 Gemma整合測試")
    print("=" * 60)
    
    # 檢查系統配置
    performance_analysis()
    
    # 測試Meta-Tag提取
    test_msmm_gemma_vs_fallback()
    
    # 測試維度評分
    test_ultu_gemma_scoring()
    
    # 測試完整流程
    test_full_pipeline_comparison()
    
    print(f"\n🎯 測試完成")
    print(f"💡 如果Gemma模型載入失敗，系統會自動回退至規則引擎模式")
    print(f"🔄 您可以在main.py中正常使用改進後的系統")

if __name__ == "__main__":
    main() 