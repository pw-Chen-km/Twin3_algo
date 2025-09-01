#!/usr/bin/env python3
"""
DADEE 演進分析執行腳本
分析用戶Meta-Tag記錄，發現新興概念並提出維度演進建議
"""

import sys
import os
import argparse

# 添加當前目錄到Python路徑
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from dadee import DADEEProcessor

def parse_arguments():
    """解析命令行參數"""
    parser = argparse.ArgumentParser(description='DADEE 維度演進分析')
    parser.add_argument('--use-files', action='store_true', help='使用舊版journey文件而非Meta-Tag記錄')
    parser.add_argument('--trend-analysis', action='store_true', help='執行用戶趨勢分析')
    parser.add_argument('--records-path', type=str, default=None, help='指定Meta-Tag記錄文件路徑（默認自動偵測）')
    
    return parser.parse_args()

def main():
    """主函數"""
    args = parse_arguments()
    
    print("=== DADEE 維度演進引擎 ===")
    print("分析用戶Meta-Tag記錄，發現新興概念並提出維度演進建議\n")
    
    # 創建DADEE處理器
    dadee = DADEEProcessor()
    
    if args.trend_analysis:
        # 執行趨勢分析
        print("📊 執行用戶趨勢分析...")
        trend_results = dadee.run_user_trend_analysis()
        
        if trend_results:
            print("\n=== 趨勢分析完成 ===")
        else:
            print("❌ 趨勢分析失敗")
            return
    
    # 執行演進分析
    print("🔍 執行維度演進分析...")
    use_records = not args.use_files
    
    if use_records:
        print("📝 使用用戶Meta-Tag記錄作為數據源")
    else:
        print("📄 使用傳統journey文件作為數據源")
    
    # 傳遞記錄路徑給DADEE處理器（如果有指定的話）
    analysis_results = dadee.run_evolution_analysis(
        use_records=use_records, 
        records_path=args.records_path
    )
    
    # 顯示結果
    print(f"\n=== 分析結果 ===")
    status = analysis_results.get('status', 'unknown')
    
    if status == 'success':
        print(f"✅ 分析成功完成")
        print(f"🔬 發現聚類: {analysis_results.get('clusters_found', 0)} 個")
        print(f"🌟 新穎概念: {analysis_results.get('novel_concepts_found', 0)} 個")
        
        # 打印提案
        dadee.print_proposals(analysis_results)
        
        print(f"\n💡 建議：")
        print(f"  - 檢視提案的合理性")
        print(f"  - 考慮社群需求和技術可行性")
        print(f"  - 手動治理維度系統的演進")
        
    elif status == 'no_data':
        print("❌ 沒有找到可分析的數據")
        if use_records:
            print("💡 建議：")
            print("  1. 先運行 main.py 處理一些用戶內容")
            print("  2. 例如：python main.py --user 1 '我參加了環保活動'")
            print("  3. 或者使用 --use-files 參數嘗試舊版數據")
    elif status == 'no_clusters':
        print("❌ 沒有發現有意義的語意聚類")
        print("💡 建議：需要更多樣化的用戶數據")
    elif status == 'no_novel_concepts':
        print("❌ 沒有發現新穎概念")
        print("💡 建議：當前概念都已被現有維度覆蓋")
    else:
        print(f"❌ 分析失敗: {status}")
    
    print(f"\n{'='*60}")

if __name__ == "__main__":
    main() 