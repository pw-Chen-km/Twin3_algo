"""
ULTU (Universal Life-Twin Update)
負責為匹配到的維度生成精確的HEX值，並動態更新整個矩陣
"""

import json
import math
import random
import os
from datetime import datetime, timezone
from typing import Dict, List, Tuple
import re

# Gemma-3 多模態 LLM 整合
try:
    from transformers import AutoProcessor, AutoModelForImageTextToText
    import torch
    GEMMA_AVAILABLE = True
except ImportError:
    print("警告：transformers未安裝，ULTU將使用模擬評分模式")
    GEMMA_AVAILABLE = False

class ULTUProcessor:
    def __init__(self, 
                 metadata_path: str = "../metadata/attribute_metadata.json",
                 state_file: str = "../state/user_matrix_state.json",  # 改名為state_file更明確
                 gemma_model_name: str = "google/gemma-3n-E4B-it",  # 升級到Gemma-3n-E4B
                 local_model_path: str = None,  # 默認從HF下載
                 use_local_gemma: bool = True,
                 alpha: float = 0.3,  # 平滑係數
                 lambda_decay: float = 0.1):  # 時間衰減係數
        """初始化ULTU處理器"""
        self.metadata_path = metadata_path
        self.state_file = state_file  # 可動態修改的狀態文件路徑
        self.alpha = alpha
        self.lambda_decay = lambda_decay
        self.use_local_gemma = use_local_gemma and GEMMA_AVAILABLE
        self.local_model_path = local_model_path
        
        self.metadata = self._load_metadata()
        # 初始化時不載入用戶狀態，而是在需要時動態載入
        
        # 初始化Gemma模型
        if self.use_local_gemma:
            self._initialize_gemma(gemma_model_name, local_model_path)
        else:
            print("警告：ULTU使用模擬評分模式")
    
    def _initialize_gemma(self, model_name: str, local_path: str = None):
        """初始化Gemma模型（優先使用本地路徑）"""
        try:
            # 優先使用本地路徑，如果不存在則報錯而不是回到線上
            if local_path and os.path.exists(local_path):
                model_path = local_path
                print(f"ULTU正在載入本地Gemma模型: {model_path}")
                print("🏠 ULTU使用本地模型")
            elif local_path:
                print(f"❌ ULTU找不到本地模型: {local_path}")
                print("請確認模型已下載到正確位置，或使用 --no-gemma 模式")
                raise FileNotFoundError(f"本地模型不存在: {local_path}")
            else:
                # 如果沒有指定本地路徑，使用線上模型
                model_path = model_name
                print(f"ULTU正在載入線上Gemma模型: {model_path}")
                print("🌐 ULTU使用在線模型")
            
            # 使用Gemma-3的Processor（支持多模態）
            self.gemma_processor = AutoProcessor.from_pretrained(model_path)
            
            # 檢查可用的設備
            if torch.backends.mps.is_available():
                device = "mps"
                dtype = torch.float16
                print("🚀 ULTU 檢測到 Apple Silicon，使用 MPS 加速")
            elif torch.cuda.is_available():
                device = "cuda"
                dtype = torch.float16
                print("🚀 ULTU 檢測到 CUDA，使用 GPU 加速")
            else:
                device = "cpu"
                dtype = torch.float32
                print("💻 ULTU 使用 CPU 運算")
            
            # 使用Gemma-3的多模態模型
            self.gemma_model = AutoModelForImageTextToText.from_pretrained(
                model_path,
                torch_dtype=dtype,
                low_cpu_mem_usage=True
            )
            
            # 手動移動模型到目標設備，包含錯誤處理
            try:
                self.gemma_model = self.gemma_model.to(device)
                self.device = device
                print(f"✅ ULTU Gemma-3模型已移動到 {device} 設備")
            except Exception as device_error:
                print(f"⚠️ ULTU 無法移動到 {device} 設備: {device_error}")
                print("💻 ULTU 回退至 CPU 運算")
                self.device = "cpu"
                self.gemma_model = self.gemma_model.to("cpu")
            
            print(f"✅ ULTU Gemma-3多模態模型載入成功")
            
        except Exception as e:
            print(f"❌ ULTU Gemma-3模型載入失敗: {e}")
            print("將回退至模擬評分模式")
            self.use_local_gemma = False
    
    def _load_metadata(self) -> Dict:
        """載入維度元數據"""
        try:
            with open(self.metadata_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"錯誤：找不到元數據文件 {self.metadata_path}")
            return {}
    
    def _load_user_state(self) -> Dict:
        """載入用戶狀態（使用當前設定的state_file路徑）"""
        try:
            with open(self.state_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            # 用戶狀態文件不存在時，從空狀態開始（不報錯）
            return {}
    
    def _save_user_state(self, user_state: Dict):
        """保存用戶狀態（使用當前設定的state_file路徑）"""
        try:
            with open(self.state_file, 'w', encoding='utf-8') as f:
                json.dump(user_state, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"錯誤：無法保存狀態文件 {e}")
    
    def _construct_gemma_scoring_messages(self, attribute_id: str, user_content: str, user_state: Dict, image_url: str = None) -> List[Dict]:
        """為特定維度建構Gemma-3評分消息（支持多模態）"""
        attr_data = self.metadata.get(attribute_id, {})
        
        # 獲取當前分數作為參考
        current_score = user_state.get(attribute_id, {}).get('stored_value_decimal', 128)
        
        # 構建文本內容
        text_content = f"""你是Twin Matrix系統的專業評分AI，需要為用戶的生活體驗內容在特定維度上進行精確評分。

**評分維度資訊：**
維度ID：{attribute_id}
維度名稱：{attr_data.get('attribute_name', 'Unknown')}

維度定義：{attr_data.get('definition', '未定義')}

評分規則：{attr_data.get('encoding_rules', '無特定規則')}

AI解析指導：{attr_data.get('ai_parsing_guidelines', '基於內容相關性評分')}

**用戶內容：**
"{user_content}"

**評分要求：**
1. 評分範圍：0-255（整數）
2. 0分表示完全無關或負面影響
3. 128分表示中等程度
4. 255分表示該維度的最高體現
5. 當前用戶在此維度的分數為：{current_score}
6. 如果有圖片，請結合圖片內容進行評分

**評分策略：**
- 仔細分析用戶內容與該維度的相關程度
- 考慮行為的強度、積極性和影響程度
- 結合維度定義和評分規則
- 給出合理且一致的評分

請僅返回一個0-255之間的整數分數，不要任何其他文字說明。"""
        
        # 構建消息內容
        content = []
        
        # 如果有圖片，先添加圖片
        if image_url:
            content.append({"type": "image", "url": image_url})
        
        # 添加文本
        content.append({"type": "text", "text": text_content})
        
        messages = [
            {
                "role": "user",
                "content": content
            }
        ]
        
        return messages
    
    def _call_gemma_for_scoring(self, attribute_id: str, user_content: str, user_state: Dict, image_url: str = None) -> int:
        """使用Gemma-3多模態模型進行維度評分"""
        try:
            # 1. 構建多模態消息格式
            messages = self._construct_gemma_scoring_messages(attribute_id, user_content, user_state, image_url)

            # 2. 使用Processor處理多模態輸入
            inputs = self.gemma_processor.apply_chat_template(
                messages,
                add_generation_prompt=True,
                tokenize=True,
                return_dict=True,
                return_tensors="pt"
            ).to(self.device)

            # 3. 生成回應
            with torch.no_grad():
                outputs = self.gemma_model.generate(
                    **inputs,
                    max_new_tokens=10,  # 只需要一個數字
                    temperature=0.1,   # 降低溫度以獲得更一致的結果
                    do_sample=True
                )

            # 4. 解碼新內容
            response = self.gemma_processor.decode(
                outputs[0][inputs["input_ids"].shape[-1]:],
                skip_special_tokens=True
            ).strip()
            
            print(f"  Gemma-3評分回應 ({attribute_id}): {response}")
            if image_url:
                print(f"    (包含圖片分析)")
            
            # 提取數字分數
            score_match = re.search(r'\b(\d{1,3})\b', response)
            if score_match:
                score = int(score_match.group(1))
                # 確保分數在有效範圍內
                score = max(0, min(255, score))
                return score
            else:
                print(f"  ⚠️  無法解析Gemma-3回應，使用回退評分")
                return self._fallback_scoring(attribute_id, user_content)
                
        except Exception as e:
            print(f"  ❌ Gemma-3評分錯誤: {e}")
            return self._fallback_scoring(attribute_id, user_content)
    
    def _fallback_scoring(self, attribute_id: str, user_content: str) -> int:
        """回退的模擬評分邏輯"""
        attr_data = self.metadata.get(attribute_id, {})
        content_lower = user_content.lower()
        
        # 基於關鍵詞匹配的簡化評分邏輯
        base_score = 100  # 基礎分數
        
        # 計算關鍵詞匹配度
        meta_tags = attr_data.get('attribute_meta_tags', [])
        matches = 0
        
        for tag in meta_tags:
            if tag.lower() in content_lower:
                matches += 1
        
        # 根據匹配數量調整分數
        if matches > 0:
            # 有匹配的情況下，分數在 150-220 之間
            match_bonus = min(matches * 20, 70)
            score = base_score + 50 + match_bonus + random.randint(-10, 10)
        else:
            # 沒有直接匹配，但可能有語意相關性
            score = base_score + random.randint(-30, 30)
        
        # 特殊邏輯調整
        if attribute_id == "0071":  # Social Achievements
            if any(word in content_lower for word in ["完成", "成就", "成功", "論文"]):
                score = max(score, 180)
        
        elif attribute_id == "0048":  # Leadership Ability
            if any(word in content_lower for word in ["帶領", "領導", "指導"]):
                score = max(score, 160)
        
        elif attribute_id == "0008":  # Dietary Habits
            if any(word in content_lower for word in ["吃", "早餐", "食物", "餐廳"]):
                score = max(score, 140)
        
        elif attribute_id == "SP088":  # Social Responsibility
            if any(word in content_lower for word in ["環保", "永續", "減碳", "社區"]):
                score = max(score, 170)
        
        # 確保分數在有效範圍內
        return max(0, min(255, score))
    
    def _generate_attribute_score(self, attribute_id: str, user_content: str, user_state: Dict, image_url: str = None) -> int:
        """生成維度分數（整合Gemma-3和回退邏輯）"""
        if self.use_local_gemma:
            try:
                return self._call_gemma_for_scoring(attribute_id, user_content, user_state, image_url)
            except Exception as e:
                print(f"  ⚠️  Gemma-3評分失敗，使用回退邏輯: {e}")
                return self._fallback_scoring(attribute_id, user_content)
        else:
            return self._fallback_scoring(attribute_id, user_content)
    
    def _generate_llm_messages(self, attribute_id: str, user_content: str, user_state: Dict = None, image_url: str = None) -> List[Dict]:
        """為特定維度建構LLM消息（保持向後兼容，支持多模態）"""
        if user_state is None:
            user_state = {}
        return self._construct_gemma_scoring_messages(attribute_id, user_content, user_state, image_url)
    
    def _simulate_llm_scoring(self, attribute_id: str, user_content: str) -> int:
        """
        模擬LLM評分（現在整合真實Gemma調用）
        """
        return self._generate_attribute_score(attribute_id, user_content)
    
    def _calculate_time_decay(self, last_updated: str) -> float:
        """計算時間衰減係數"""
        try:
            last_time = datetime.fromisoformat(last_updated.replace('Z', '+00:00'))
            current_time = datetime.now(timezone.utc)
            
            # 計算時間差（小時）
            time_diff_hours = (current_time - last_time).total_seconds() / 3600
            
            # 計算衰減係數
            decay_factor = math.exp(-self.lambda_decay * time_diff_hours)
            
            return decay_factor
        
        except Exception as e:
            print(f"時間衰減計算錯誤：{e}")
            return 1.0  # 默認不衰減
    
    def update_matched_attributes(self, matched_attributes: List[Dict], user_content: str, user_state: Dict, image_url: str = None) -> Tuple[Dict, Dict]:
        """更新匹配到的維度分數，返回更新結果和新的用戶狀態（支持多模態）"""
        current_time = datetime.now(timezone.utc).isoformat()
        update_results = {}
        
        print(f"\n=== ULTU 動態評分更新 ===")
        if image_url:
            print(f"包含圖片分析: {image_url[:50]}...")
        
        for match in matched_attributes:
            attr_id = match['attribute_id']
            attr_name = match['attribute_name']
            
            print(f"正在為維度 {attr_id}-{attr_name} 生成評分...")
            
            # 生成新分數（支持圖片）
            new_score = self._generate_attribute_score(attr_id, user_content, user_state, image_url)
            
            # 獲取前一個分數
            prev_data = user_state.get(attr_id, {})
            prev_score = prev_data.get('stored_value_decimal', 128)  # 默認中間值
            
            # 應用分數平滑
            smoothed_score = int(self.alpha * new_score + (1 - self.alpha) * prev_score)
            
            # 更新狀態
            user_state[attr_id] = {
                'stored_value_decimal': smoothed_score,
                'last_updated_timestamp': current_time
            }
            
            update_results[attr_id] = {
                'attribute_name': attr_name,
                'previous_score': prev_score,
                'new_raw_score': new_score,
                'smoothed_score': smoothed_score,
                'change': smoothed_score - prev_score
            }
            
            print(f"  ✅ {attr_id}-{attr_name}: {prev_score} -> {smoothed_score} (Gemma-3原始分數: {new_score})")
        
        return update_results, user_state
    
    def apply_time_decay(self, matched_attribute_ids: List[str], user_state: Dict) -> Tuple[Dict, Dict]:
        """對未匹配到的維度應用時間衰減，返回衰減結果和新的用戶狀態"""
        current_time = datetime.now(timezone.utc).isoformat()
        decay_results = {}
        
        print(f"\n=== 時間衰減處理 ===")
        
        for attr_id, attr_data in user_state.items():
            if attr_id not in matched_attribute_ids:
                # 計算時間衰減
                last_updated = attr_data.get('last_updated_timestamp', current_time)
                decay_factor = self._calculate_time_decay(last_updated)
                
                prev_score = attr_data['stored_value_decimal']
                decayed_score = int(decay_factor * prev_score)
                
                # 更新狀態（但不更新時間戳，保持原有的更新時間）
                user_state[attr_id]['stored_value_decimal'] = decayed_score
                
                decay_results[attr_id] = {
                    'attribute_name': self.metadata.get(attr_id, {}).get('attribute_name', 'Unknown'),
                    'previous_score': prev_score,
                    'decay_factor': decay_factor,
                    'decayed_score': decayed_score,
                    'change': decayed_score - prev_score
                }
                
                if decayed_score != prev_score:
                    print(f"  ⏳ {attr_id}: {prev_score} -> {decayed_score} (衰減係數: {decay_factor:.3f})")
        
        if not decay_results:
            print("  沒有維度需要時間衰減處理")
        
        return decay_results, user_state
    
    def process_attribute_updates(self, matched_attributes: List[Dict], user_content: str, image_url: str = None) -> Dict:
        """處理維度更新的完整流程（支持多模態）"""
        print(f"開始處理 {len(matched_attributes)} 個匹配維度的更新...")
        
        # 載入當前用戶狀態
        user_state = self._load_user_state()
        
        # 更新匹配到的維度（支持圖片）
        update_results, user_state = self.update_matched_attributes(matched_attributes, user_content, user_state, image_url)
        
        # 對未匹配到的維度應用時間衰減
        matched_ids = [match['attribute_id'] for match in matched_attributes]
        decay_results, user_state = self.apply_time_decay(matched_ids, user_state)
        
        # 保存更新後的狀態
        self._save_user_state(user_state)
        
        return {
            'updates': update_results,
            'decays': decay_results,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }

# 測試函數
def test_ultu():
    """測試ULTU模組"""
    ultu = ULTUProcessor()
    
    # 模擬匹配到的維度
    matched_attributes = [
        {"attribute_id": "0071", "attribute_name": "Social Achievements", "similarity_score": 0.85},
        {"attribute_id": "0048", "attribute_name": "Leadership Ability", "similarity_score": 0.72},
        {"attribute_id": "0008", "attribute_name": "Dietary Habits", "similarity_score": 0.45}
    ]
    
    user_content = "我今天帶領學弟妹完成了一篇論文，還順便去吃了有名的台式早餐慶祝。"
    
    results = ultu.process_attribute_updates(matched_attributes, user_content)
    print(f"\n更新完成，影響了 {len(results['updates']) + len(results['decays'])} 個維度")
    
    return results

if __name__ == "__main__":
    test_ultu() 