#!/usr/bin/env python3
"""
智能評分策略測試腳本
演示 ULTU 新的智能評分更新機制在不同情況下的表現
"""

import sys
import os

# 添加當前目錄到Python路徑
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ultu import ULTUProcessor

def test_smart_scoring_scenarios():
    """測試不同的評分場景"""
    print("=== 智能評分策略測試 ===\n")
    
    # 創建 ULTU 處理器
    ultu = ULTUProcessor(use_local_gemma=False)  # 使用模擬模式以加快測試
    
    # 測試場景
    test_scenarios = [
        # (new_score, prev_score, update_count, expected_strategy, description)
        (180, 128, 0, "首次評分", "首次評分 - 直接使用新分數"),
        (200, 150, 3, "積極提升", "積極提升 - 新分數明顯高於舊分數"),
        (160, 150, 5, "正常更新", "正常波動 - 差異在合理範圍內"),
        (120, 150, 3, "輕微下降", "輕微下降 - 小幅下降但仍反映變化"),
        (80, 180, 2, "謹慎下調", "新維度異常下降 - 謹慎下調"),
        (60, 200, 8, "異常保護", "頻繁更新維度異常暴跌 - 啟用保護機制"),
        (220, 150, 5, "重大進步", "有歷史維度的重大進步"),
        (240, 120, 1, "新維度進步", "新維度的大幅提升"),
        (155, 150, 10, "標準更新", "默認策略")
    ]
    
    print("📊 評分策略測試結果：\n")
    
    for i, (new_score, prev_score, update_count, expected_strategy, description) in enumerate(test_scenarios, 1):
        print(f"🧪 場景 {i}: {description}")
        print(f"   輸入: 新分數={new_score}, 舊分數={prev_score}, 更新次數={update_count}")
        
        # 調用智能評分策略
        updated_score, strategy_used = ultu._calculate_smart_score_update(
            new_score, prev_score, update_count, f"TEST_{i:03d}"
        )
        
        # 計算差異
        change = updated_score - prev_score
        score_diff_ratio = abs(new_score - prev_score) / max(prev_score, 1)
        
        # 顯示結果
        direction = "↗️" if change > 0 else "↘️" if change < 0 else "➡️"
        print(f"   結果: {prev_score} → {updated_score} ({change:+d}) {direction}")
        print(f"   策略: {strategy_used}")
        print(f"   分析: 原始變化 {new_score-prev_score:+d} ({score_diff_ratio:.1%})")
        
        # 檢查是否符合預期
        if strategy_used == expected_strategy:
            print(f"   ✅ 策略符合預期")
        else:
            print(f"   ⚠️  策略不符合預期 (期望: {expected_strategy})")
        
        print()
    
    # 展示策略效果對比
    print("📈 策略效果對比：\n")
    
    comparison_scenarios = [
        (50, 200, "異常暴跌場景"),
        (180, 100, "大幅提升場景"),
        (155, 150, "微小變化場景")
    ]
    
    for new_score, prev_score, scenario_name in comparison_scenarios:
        print(f"🔍 {scenario_name}:")
        print(f"   新分數: {new_score}, 舊分數: {prev_score}")
        
        # 舊的簡單加權平均 (alpha = 0.3)
        old_method = int(0.3 * new_score + 0.7 * prev_score)
        old_change = old_method - prev_score
        
        # 新的智能策略
        smart_score, strategy = ultu._calculate_smart_score_update(new_score, prev_score, 5, "COMP")
        smart_change = smart_score - prev_score
        
        print(f"   舊方法: {prev_score} → {old_method} ({old_change:+d})")
        print(f"   新方法: {prev_score} → {smart_score} ({smart_change:+d}) [{strategy}]")
        print(f"   差異: {smart_score - old_method:+d} 分")
        print()

def simulate_user_journey():
    """模擬用戶在某個維度上的評分歷程"""
    print("=== 用戶維度評分歷程模擬 ===\n")
    
    ultu = ULTUProcessor(use_local_gemma=False)
    
    # 模擬一個用戶在「學習能力」維度上的評分歷程
    journey = [
        (128, "初始狀態"),
        (160, "第一次學習活動 - 看書"),
        (180, "持續學習 - 上課程"),
        (170, "輕微下降 - 忙碌期"),
        (200, "重大突破 - 完成項目"),
        (90, "意外低分 - 可能是系統錯誤"),
        (190, "恢復狀態 - 正常學習"),
        (210, "持續進步"),
        (205, "穩定狀態"),
        (220, "新的成就")
    ]
    
    current_score = 128
    update_count = 0
    
    print("📚 學習能力維度評分歷程：\n")
    
    for new_score, activity in journey:
        if update_count == 0:
            # 首次評分
            updated_score = new_score
            strategy = "首次評分"
        else:
            updated_score, strategy = ultu._calculate_smart_score_update(
                new_score, current_score, update_count, "LEARNING"
            )
        
        change = updated_score - current_score
        direction = "↗️" if change > 0 else "↘️" if change < 0 else "➡️"
        
        print(f"第 {update_count + 1} 次更新: {activity}")
        print(f"  原始分數: {new_score}")
        print(f"  {current_score} → {updated_score} ({change:+d}) {direction}")
        print(f"  策略: {strategy}")
        print()
        
        current_score = updated_score
        update_count += 1

def main():
    """主測試函數"""
    print("🎯 Twin3 智能評分策略全面測試\n")
    
    try:
        # 測試各種評分場景
        test_smart_scoring_scenarios()
        
        # 模擬用戶歷程
        simulate_user_journey()
        
        print("🎉 智能評分策略測試完成！")
        print("\n💡 新策略的優勢：")
        print("  ✅ 防止異常低分影響長期表現")
        print("  ✅ 鼓勵積極提升和進步")
        print("  ✅ 根據更新頻次調整策略")
        print("  ✅ 更合理地處理分數波動")
        
    except Exception as e:
        print(f"❌ 測試過程中發生錯誤: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main() 