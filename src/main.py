#!/usr/bin/env python3
"""
Twin3 主更新循環 (Real-time Update Cycle)
整合 MSMM 和 ULTU 模組，實現用戶內容的實時處理和Twin Matrix更新
支持多用戶處理和Meta-Tag記錄
"""

import sys
import os
import json
import argparse
from datetime import datetime
from typing import Dict, List, Optional

# 添加當前目錄到Python路徑
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from msmm import MSMMProcessor
from ultu import ULTUProcessor

class Twin3MainProcessor:
    def __init__(self, user_id: int = 1):
        """初始化Twin3主處理器"""
        self.user_id = user_id
        print(f"=== Twin3 演算法框架 - 主更新循環 (用戶 {user_id}) ===")
        print("正在初始化系統組件...")
        
        # 顯示配置信息
        print("🤖 啟用 Gemini 2.5 Flash 模式")
        print("📝 將使用AI進行Meta-Tag提取和精確評分")
        
        # 初始化各個模組
        try:
            self.msmm = MSMMProcessor()
            self.ultu = ULTUProcessor()
            print("✅ 系統初始化完成！\n")
        except Exception as e:
            print(f"⚠️  初始化警告: {e}")
            print("🔄 系統將自動使用可用的模式\n")
    
    def get_user_state_file(self) -> str:
        """獲取用戶專屬的狀態文件路徑"""
        return f"state/user_{self.user_id}_matrix_state.json"
    
    def get_metatags_record_file(self) -> str:
        """獲取Meta-Tag記錄文件路徑"""
        return "state/user_metatags_records.json"
    
    def load_user_state(self) -> Dict:
        """讀取用戶專屬的Twin Matrix狀態"""
        state_file = self.get_user_state_file()
        try:
            with open(state_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            # 新用戶從空狀態開始，不複製其他用戶的數據
            print(f"✅ 用戶 {self.user_id} 首次使用，將從空狀態開始")
            return {}
    
    def save_user_state(self, state_data: Dict) -> None:
        """保存用戶專屬的Twin Matrix狀態"""
        state_file = self.get_user_state_file()
        with open(state_file, 'w', encoding='utf-8') as f:
            json.dump(state_data, f, ensure_ascii=False, indent=2)
    
    def load_metatags_records(self) -> Dict:
        """讀取Meta-Tag記錄"""
        record_file = self.get_metatags_record_file()
        try:
            with open(record_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            # 如果記錄文件不存在，創建空記錄
            return {}
    
    def save_metatags_records(self, records_data: Dict) -> None:
        """保存Meta-Tag記錄"""
        record_file = self.get_metatags_record_file()
        with open(record_file, 'w', encoding='utf-8') as f:
            json.dump(records_data, f, ensure_ascii=False, indent=2)
    
    def update_user_metatags(self, extracted_metatags: List[str]) -> None:
        """更新用戶的Meta-Tag記錄"""
        records = self.load_metatags_records()
        user_key = f"user_{self.user_id}"
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # 如果用戶記錄不存在，創建新記錄
        if user_key not in records:
            records[user_key] = {}
        
        # 更新每個meta-tag的計數和時間戳
        for tag in extracted_metatags:
            if tag in records[user_key]:
                # 更新現有記錄
                records[user_key][tag]["count"] += 1
                records[user_key][tag]["last_seen"] = current_time
            else:
                # 創建新記錄
                records[user_key][tag] = {
                    "count": 1,
                    "first_seen": current_time,
                    "last_seen": current_time
                }
        
        # 保存更新後的記錄
        self.save_metatags_records(records)
        print(f"📝 已更新用戶 {self.user_id} 的Meta-Tag記錄：{extracted_metatags}")
    
    def display_current_state(self):
        """顯示當前用戶Twin Matrix狀態"""
        print(f"=== 用戶 {self.user_id} 當前 Twin Matrix 狀態 ===")
        
        try:
            current_state = self.load_user_state()
            
            if not current_state:
                print("  錯誤：無法讀取用戶狀態")
                return
            
            # 按分數排序顯示
            sorted_attributes = sorted(
                current_state.items(),
                key=lambda x: x[1]['stored_value_decimal'],
                reverse=True
            )
            
            for attr_id, attr_data in sorted_attributes:
                attr_name = self.msmm.metadata.get(attr_id, {}).get('attribute_name', 'Unknown')
                score = attr_data['stored_value_decimal']
                last_updated = attr_data['last_updated_timestamp']
                
                # 轉換為HEX顯示
                hex_value = f"{score:02X}"
                
                print(f"  {attr_id}-{attr_name}: {score} (0x{hex_value}) - 更新於 {last_updated[:19]}")
            
        except Exception as e:
            print(f"  錯誤：無法讀取狀態文件 - {e}")
    
    def display_user_metatags_summary(self):
        """顯示用戶Meta-Tag摘要"""
        records = self.load_metatags_records()
        user_key = f"user_{self.user_id}"
        
        if user_key not in records or not records[user_key]:
            print(f"📝 用戶 {self.user_id} 尚無Meta-Tag記錄")
            return
        
        user_tags = records[user_key]
        print(f"\n📝 用戶 {self.user_id} Meta-Tag 摘要 (共 {len(user_tags)} 個概念):")
        
        # 按出現次數排序
        sorted_tags = sorted(user_tags.items(), key=lambda x: x[1]["count"], reverse=True)
        
        for tag, info in sorted_tags[:10]:  # 只顯示前10個
            print(f"  🏷️  {tag}: {info['count']} 次 (首次: {info['first_seen'][:10]}, 最近: {info['last_seen'][:10]})")
        
        if len(sorted_tags) > 10:
            print(f"  ... 還有 {len(sorted_tags) - 10} 個Meta-Tag")
    
    def process_user_content(self, user_content: str, image_url: str = None, similarity_threshold: float = 0.1):
        """處理用戶內容的完整流程（支持多模態）"""
        print(f"\n{'='*60}")
        print(f"用戶 {self.user_id} - 開始處理內容：{user_content}")
        if image_url:
            print(f"包含圖片：{image_url}")
            print(f"📊 圖片將消耗 256 tokens (總上下文限制: 32K tokens)")
        print(f"{'='*60}")
        
        # 步驟1：MSMM 語意匹配（會自動提取Meta-Tags，支持圖片）
        print("\n🔍 步驟1：執行 MSMM 語意匹配...")
        matched_attributes = self.msmm.process_user_content(user_content, image_url, similarity_threshold)
        
        # 步驟1.5：記錄已提取的Meta-Tags
        print("\n📝 步驟1.5：記錄 Meta-Tags...")
        # 從 MSMM 的內部狀態獲取已提取的 Meta-Tags
        if hasattr(self.msmm, '_last_extracted_tags'):
            extracted_metatags = self.msmm._last_extracted_tags
            if extracted_metatags:
                self.update_user_metatags(extracted_metatags)
        
        if not matched_attributes:
            print("⚠️  沒有找到匹配的維度，處理結束")
            return None
        
        # 修改ULTU處理器以使用用戶專屬狀態
        self.ultu.state_file = self.get_user_state_file()
        
        # 步驟3：ULTU 動態評分更新（支持圖片）
        print(f"\n⚡ 步驟3：執行 ULTU 動態評分更新...")
        update_results = self.ultu.process_attribute_updates(matched_attributes, user_content, image_url)
        
        # 步驟4：顯示更新摘要
        self._display_update_summary(update_results)
        
        return update_results
    
    def _display_update_summary(self, update_results):
        """顯示更新摘要"""
        print(f"\n📊 用戶 {self.user_id} 更新摘要")
        print(f"處理時間：{update_results['timestamp'][:19]}")
        
        updates = update_results.get('updates', {})
        decays = update_results.get('decays', {})
        
        print(f"\n✅ 直接更新的維度 ({len(updates)} 個):")
        for attr_id, update_info in updates.items():
            change = update_info['change']
            direction = "↗️" if change > 0 else "↘️" if change < 0 else "➡️"
            strategy = update_info.get('strategy_used', '標準更新')
            update_count = update_info.get('update_count', 1)
            print(f"  {direction} {attr_id}-{update_info['attribute_name']}: {update_info['previous_score']} → {update_info['smoothed_score']} ({change:+d})")
            print(f"      📊 原始分數: {update_info['new_raw_score']}, 策略: {strategy}, 第{update_count}次更新")
        
        # 只顯示有顯著衰減的維度
        significant_decays = {k: v for k, v in decays.items() if v['change'] < -5}
        if significant_decays:
            print(f"\n⏰ 時間衰減的維度 ({len(significant_decays)} 個):")
            for attr_id, decay_info in significant_decays.items():
                change = decay_info['change']
                print(f"  ⏳ {attr_id}-{decay_info['attribute_name']}: {decay_info['previous_score']} → {decay_info['decayed_score']} ({change:+d})")
        
        total_affected = len(updates) + len(significant_decays)
        print(f"\n總計影響 {total_affected} 個維度")

def parse_arguments():
    """解析命令行參數"""
    parser = argparse.ArgumentParser(description='Twin3 多用戶處理系統（支持多模態）')
    parser.add_argument('--user', type=int, default=1, help='指定用戶ID (默認: 1)')
    parser.add_argument('--environmental-demo', action='store_true', help='運行環保主題演示')
    parser.add_argument('--image', type=str, help='圖片URL或本地路徑（支持多模態分析）')
    parser.add_argument('content', nargs='*', help='要處理的用戶內容')
    
    return parser.parse_args()

def main():
    """主函數"""
    args = parse_arguments()
    
    # 檢查是否是環保演示模式
    if args.environmental_demo:
        run_environmental_demo(args.user, args.image)
        return
    
    # 顯示配置
    print(f"🤖 Gemini 2.5 Flash 多模態模式")
    if args.image:
        print(f"🖼️  圖片輸入: {args.image}")
    
    # 創建處理器
    processor = Twin3MainProcessor(user_id=args.user)
    
    # 顯示處理前的狀態
    print("處理前的狀態：")
    processor.display_current_state()
    processor.display_user_metatags_summary()
    
    # 獲取用戶輸入內容
    if args.content:
        user_input = " ".join(args.content)
    else:
        # 默認演示內容
        user_input = "我今天帶領學弟妹完成了一篇論文，還順便去吃了有名的台式早餐慶祝。"
    
    # 處理用戶內容（支持圖片）
    results = processor.process_user_content(user_input, args.image)
    
    if results:
        # 顯示處理後的狀態
        print(f"\n{'='*60}")
        print("處理後的狀態：")
        processor.display_current_state()
        processor.display_user_metatags_summary()
        
        print(f"\n🎉 處理完成！用戶 {args.user} 的Twin Matrix 已更新")
        print(f"💡 提示：您可以檢查 state/user_{args.user}_matrix_state.json 和 state/user_metatags_records.json 文件查看詳細變化")
    
    print(f"\n{'='*60}")

def run_environmental_demo(user_id: int = 1, image_url: str = None):
    """運行環保主題的演示（支持多模態）"""
    processor = Twin3MainProcessor(user_id=user_id)
    
    print(f"=== 用戶 {user_id} 環保主題演示 ===")
    
    # 環保相關的用戶輸入
    environmental_input = "我參加了一個環保市集，學習如何減少碳足跡。"
    
    print("處理前的狀態：")
    processor.display_current_state()
    processor.display_user_metatags_summary()
    
    # 處理環保內容（支持圖片）
    results = processor.process_user_content(environmental_input, image_url)
    
    if results:
        print(f"\n{'='*60}")
        print("處理後的狀態：")
        processor.display_current_state()
        processor.display_user_metatags_summary()
        
        print(f"\n🌱 用戶 {user_id} 環保主題處理完成！")

if __name__ == "__main__":
    main() 