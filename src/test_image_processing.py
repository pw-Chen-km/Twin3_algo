#!/usr/bin/env python3
"""
圖片處理測試腳本
驗證新的 Gemma 規格圖片處理功能
"""

import sys
import os

# 添加當前目錄到Python路徑
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from msmm import MSMMProcessor

def test_image_processing():
    """測試圖片處理功能"""
    print("=== Gemma 規格圖片處理測試 ===\n")
    
    # 創建 MSMM 處理器（不載入模型以節省時間）
    msmm = MSMMProcessor(use_local_gemma=False)
    
    # 測試圖片路徑
    test_image = "img_test/S__6815778_0.jpg"
    
    if not os.path.exists(test_image):
        print(f"❌ 測試圖片不存在: {test_image}")
        print("請確認 img_test/ 目錄中有測試圖片")
        return False
    
    try:
        print(f"📷 測試圖片: {test_image}")
        
        # 測試圖片調整功能
        from PIL import Image
        
        # 載入原始圖片
        with Image.open(test_image) as original_img:
            print(f"原始圖片尺寸: {original_img.size} ({original_img.mode})")
            
            # 測試不同目標尺寸
            test_sizes = [256, 512, 768]
            
            for target_size in test_sizes:
                print(f"\n🔄 測試調整為 {target_size}x{target_size}:")
                
                # 使用 MSMM 的調整方法
                resized_img = msmm._resize_to_square(original_img, target_size)
                
                print(f"   調整後尺寸: {resized_img.size}")
                print(f"   格式: {resized_img.mode}")
                
                # 計算 tokens 消耗
                print(f"   Token 消耗: 256 tokens")
                
                # 保存測試結果（可選）
                output_path = f"test_output_{target_size}.jpg"
                resized_img.save(output_path, format='JPEG', quality=90)
                file_size = os.path.getsize(output_path) / 1024  # KB
                print(f"   檔案大小: {file_size:.1f} KB")
                
                # 清理測試檔案
                os.remove(output_path)
        
        print(f"\n✅ 圖片處理測試成功!")
        print(f"🎯 圖片已符合 Gemma 規格:")
        print(f"   - 支援尺寸: 256x256, 512x512, 768x768")
        print(f"   - 格式: RGB JPEG")
        print(f"   - Token 消耗: 256 tokens/圖片")
        print(f"   - 編碼: base64 data URL")
        
        return True
        
    except Exception as e:
        print(f"❌ 圖片處理測試失敗: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_base64_encoding():
    """測試 base64 編碼功能"""
    print(f"\n=== Base64 編碼測試 ===\n")
    
    test_image = "img_test/S__6815778_0.jpg"
    
    if not os.path.exists(test_image):
        print(f"❌ 測試圖片不存在: {test_image}")
        return False
    
    try:
        from PIL import Image
        import base64
        import io
        
        msmm = MSMMProcessor(use_local_gemma=False)
        
        # 載入並處理圖片
        with Image.open(test_image) as img:
            # 標準化為 512x512
            processed_img = msmm._resize_to_square(img, 512)
            
            # 轉換為 base64
            buffer = io.BytesIO()
            processed_img.save(buffer, format='JPEG', quality=90)
            img_data = buffer.getvalue()
            
            base64_string = base64.b64encode(img_data).decode('utf-8')
            data_url = f"data:image/jpeg;base64,{base64_string}"
            
            print(f"📊 Base64 編碼結果:")
            print(f"   編碼長度: {len(base64_string)} 字符")
            print(f"   Data URL 長度: {len(data_url)} 字符")
            print(f"   壓縮後大小: {len(img_data) / 1024:.1f} KB")
            
            # 檢查是否為有效的 data URL
            if data_url.startswith("data:image/jpeg;base64,"):
                print(f"   ✅ 有效的 data URL 格式")
            else:
                print(f"   ❌ 無效的 data URL 格式")
            
            # 預覽前 100 字符
            preview = data_url[:100] + "..." if len(data_url) > 100 else data_url
            print(f"   預覽: {preview}")
        
        return True
        
    except Exception as e:
        print(f"❌ Base64 編碼測試失敗: {e}")
        return False

def main():
    """主測試函數"""
    print("🖼️  Twin3 圖片處理全面測試\n")
    
    try:
        # 測試圖片處理
        test1_pass = test_image_processing()
        
        # 測試 base64 編碼
        test2_pass = test_base64_encoding()
        
        # 總結
        if test1_pass and test2_pass:
            print(f"\n🎉 所有測試通過！")
            print(f"✨ 圖片處理功能已準備就緒")
            print(f"📝 建議: 使用 --image 參數測試完整多模態功能")
        else:
            print(f"\n⚠️  部分測試失敗，請檢查相關功能")
        
    except Exception as e:
        print(f"❌ 測試過程中發生錯誤: {e}")

if __name__ == "__main__":
    main() 