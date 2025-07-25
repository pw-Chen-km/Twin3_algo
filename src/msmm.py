"""
MSMM (Multi-Semantic Matching Module)
負責將用戶內容映射到最相關的維度
"""

import json
import re
import os
from typing import List, Dict, Tuple
from sentence_transformers import SentenceTransformer
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

# Gemma-3 多模態 LLM 整合
try:
    from transformers import AutoProcessor, AutoModelForImageTextToText
    import torch
    GEMMA_AVAILABLE = True
except ImportError:
    print("警告：transformers未安裝，將使用模擬模式")
    GEMMA_AVAILABLE = False

class MSMMProcessor:
    def __init__(self, 
                 metadata_path: str = "../metadata/attribute_metadata.json",
                 gemma_model_name: str = "google/gemma-3n-E4B-it",  # 升級到Gemma-3n-E4B
                 local_model_path: str = None,  # 默認從HF下載
                 use_local_gemma: bool = True):
        """初始化MSMM處理器"""
        self.metadata_path = metadata_path
        self.metadata = self._load_metadata()
        self.use_local_gemma = use_local_gemma and GEMMA_AVAILABLE
        self.local_model_path = local_model_path
        
        # 初始化Sentence-BERT模型（使用多語言模型）
        try:
            self.sentence_model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
        except:
            print("警告：無法載入多語言模型，使用基礎英文模型")
            self.sentence_model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # 初始化Gemma模型
        if self.use_local_gemma:
            self._initialize_gemma(gemma_model_name, local_model_path)
        else:
            print("警告：使用規則引擎模擬Meta-Tag提取")
        
        # 預先計算所有維度的向量表示
        self._precompute_attribute_vectors()
    
    def _initialize_gemma(self, model_name: str, local_path: str = None):
        """初始化Gemma模型（優先使用本地路徑）"""
        try:
            # 優先使用本地路徑，如果不存在則報錯而不是回到線上
            if local_path and os.path.exists(local_path):
                model_path = local_path
                print(f"正在載入本地Gemma模型: {model_path}")
                print("使用本地模型")
            elif local_path:
                print(f"❌ 找不到本地模型: {local_path}")
                print("請確認模型已下載到正確位置，或使用 --no-gemma 模式")
                raise FileNotFoundError(f"本地模型不存在: {local_path}")
            else:
                # 如果沒有指定本地路徑，使用線上模型
                model_path = model_name
                print(f"正在載入線上Gemma模型: {model_path}")
                print("🌐 使用在線模型")
            
            # 使用Gemma-3的Processor（支持多模態）
            self.gemma_processor = AutoProcessor.from_pretrained(model_path)
            
            # 檢查可用的設備
            if torch.backends.mps.is_available():
                device = "mps"
                dtype = torch.float16
                print("🚀 檢測到 Apple Silicon，使用 MPS 加速")
            elif torch.cuda.is_available():
                device = "cuda"
                dtype = torch.float16
                print("🚀 檢測到 CUDA，使用 GPU 加速")
            else:
                device = "cpu"
                dtype = torch.float32
                print("💻 使用 CPU 運算")
            
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
                print(f"✅ Gemma-3模型已移動到 {device} 設備")
            except Exception as device_error:
                print(f"⚠️ 無法移動到 {device} 設備: {device_error}")
                print("💻 回退至 CPU 運算")
                self.device = "cpu"
                self.gemma_model = self.gemma_model.to("cpu")
            
            print(f"✅ Gemma-3多模態模型載入成功")
            
        except Exception as e:
            print(f"❌ Gemma-3模型載入失敗: {e}")
            print("將回退至規則引擎模式")
            self.use_local_gemma = False
    
    def _load_metadata(self) -> Dict:
        """載入維度元數據"""
        try:
            with open(self.metadata_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"錯誤：找不到元數據文件 {self.metadata_path}")
            return {}
    
    def _precompute_attribute_vectors(self):
        """預先計算所有維度的向量表示"""
        self.attribute_vectors = {}
        
        for attr_id, attr_data in self.metadata.items():
            # 將Meta-Tags組合成文本
            meta_tags_text = " ".join(attr_data["attribute_meta_tags"])
            
            # 計算向量
            vector = self.sentence_model.encode([meta_tags_text])
            self.attribute_vectors[attr_id] = vector[0]
            
        print(f"已預計算 {len(self.attribute_vectors)} 個維度的向量表示")
    
    def _construct_meta_tag_extraction_messages(self, user_content: str, image_url: str = None) -> List[Dict]:
        """建構Meta-Tag提取的Gemma-3 messages（支持多模態）"""
        
        # 收集所有現有的Meta-Tags作為參考
        all_existing_tags = set()
        for attr_data in self.metadata.values():
            all_existing_tags.update(attr_data["attribute_meta_tags"])
        
        existing_tags_sample = list(all_existing_tags)[:30]  # 取樣本避免prompt太長
        
        # 構建文本內容
        text_content = f"""你是一個專業的內容分析AI，需要從用戶的生活體驗內容中提取關鍵的Meta-Tags。

任務：分析以下用戶內容，提取3-8個最能代表其核心意義的Meta-Tags。

用戶內容："{user_content}"

提取指導：
1. Meta-Tags應該是簡潔的中文詞彙或英文單詞
2. 重點關注行為、情緒、場景、技能、價值觀等核心概念
3. 如果有圖片，請結合圖片內容進行分析
4. 可參考但不限於以下已知標籤：{', '.join(existing_tags_sample)}
5. 避免過於具體的名詞，傾向於可重複使用的概念標籤

請僅返回Meta-Tags列表，用逗號分隔，不要其他說明文字。

例如：學習, 成就感, 團隊合作, 食物, 慶祝"""
        
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
    
    def _call_gemma_for_meta_tags(self, user_content: str, image_url: str = None) -> List[str]:
        """使用Gemma-3多模態模型提取內容Meta-Tags"""
        try:
            # 1. 構建多模態消息格式
            messages = self._construct_meta_tag_extraction_messages(user_content, image_url)

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
                    max_new_tokens=50,
                    temperature=0.3,
                    do_sample=True
                )

            # 4. 解碼新內容
            response = self.gemma_processor.decode(
                outputs[0][inputs["input_ids"].shape[-1]:],
                skip_special_tokens=True
            ).strip()

            print(f"Gemma-3原始回應: {response}")
            if image_url:
                print(f"  (包含圖片分析: {image_url[:50]}...)")

            # 5. 解析Meta-Tags
            if ',' in response:
                meta_tags = [tag.strip() for tag in response.split(',')]
            else:
                meta_tags = [tag.strip() for tag in re.split(r'[、\s]+', response)]
            meta_tags = [tag for tag in meta_tags if tag and len(tag) > 1 and len(tag) < 20]
            return meta_tags[:8]
        except Exception as e:
            print(f"Gemma-3調用錯誤: {e}")
            return self._fallback_meta_tag_extraction(user_content)
    
    def _fallback_meta_tag_extraction(self, user_content: str) -> List[str]:
        """回退的規則引擎Meta-Tag提取"""
        content_lower = user_content.lower()
        
        # 定義關鍵詞映射
        keyword_mappings = {
            "achievement": ["完成", "成就", "成功", "達成", "獲得", "贏得", "實現"],
            "leadership": ["帶領", "領導", "指導", "管理", "主持", "統籌", "協調"],
            "food": ["吃", "食物", "餐廳", "料理", "早餐", "午餐", "晚餐", "火鍋", "小吃"],
            "learning": ["學習", "研究", "閱讀", "課程", "技巧", "知識", "書"],
            "creative": ["創作", "設計", "藝術", "音樂", "畫作", "攝影"],
            "exercise": ["運動", "健身", "跑步", "游泳", "瑜伽", "訓練"],
            "social": ["朋友", "聚會", "社交", "團體", "社區", "志工", "慈善"],
            "technology": ["程式", "科技", "軟體", "電腦", "AI", "數位"],
            "environment": ["永續", "環保", "減碳", "綠色", "生態", "氣候", "垃圾分類", "有機", "再生能源"]
        }
        
        extracted_tags = []
        
        for tag, keywords in keyword_mappings.items():
            for keyword in keywords:
                if keyword in content_lower:
                    extracted_tags.append(tag)
                    break
        
        # 如果沒有提取到標籤，返回原始內容的重要詞彙
        if not extracted_tags:
            words = re.findall(r'[\u4e00-\u9fff]+|[a-zA-Z]+', user_content)
            extracted_tags = [word for word in words if len(word) > 1][:5]
        
        return list(set(extracted_tags))  # 去重
    
    def extract_content_meta_tags(self, user_content: str, image_url: str = None) -> List[str]:
        """
        提取內容Meta-Tags（支持多模態）
        優先使用Gemma-3，失敗時回退至規則引擎
        """
        if self.use_local_gemma:
            try:
                return self._call_gemma_for_meta_tags(user_content, image_url)
            except Exception as e:
                print(f"Gemma-3提取失敗，使用規則引擎: {e}")
                return self._fallback_meta_tag_extraction(user_content)
        else:
            return self._fallback_meta_tag_extraction(user_content)
    
    def extract_meta_tags(self, user_content: str, image_url: str = None) -> List[str]:
        """
        提取Meta-Tags的統一接口（支持多模態）
        """
        return self.extract_content_meta_tags(user_content, image_url)
    
    def find_matching_attributes(self, user_content: str, image_url: str = None, top_n: int = 5) -> List[Tuple[str, float, str]]:
        """
        找到最匹配的維度（支持多模態）
        使用單個meta-tag與單個attribute meta-tag的批次比對
        返回：[(attribute_id, similarity_score, attribute_name), ...]
        """
        # 提取內容Meta-Tags（支持圖片）
        content_meta_tags = self.extract_content_meta_tags(user_content, image_url)
        
        print(f"提取到的內容Meta-Tags: {content_meta_tags}")
        
        if not content_meta_tags:
            return []
        
        # 準備所有需要比對的配對
        user_tags_for_batch = []
        attr_tags_for_batch = []
        attr_mapping = []  # 記錄每個配對屬於哪個維度
        
        for user_tag in content_meta_tags:
            for attr_id, attr_data in self.metadata.items():
                for attr_tag in attr_data["attribute_meta_tags"]:
                    user_tags_for_batch.append(user_tag)
                    attr_tags_for_batch.append(attr_tag)
                    attr_mapping.append(attr_id)
        
        print(f"準備進行 {len(user_tags_for_batch)} 個配對的batch比對")
        
        # 批次計算向量
        if user_tags_for_batch and attr_tags_for_batch:
            user_vectors = self.sentence_model.encode(user_tags_for_batch)
            attr_vectors = self.sentence_model.encode(attr_tags_for_batch)
            
            # 計算相似度
            similarities_batch = cosine_similarity(user_vectors, attr_vectors)
            
            # 提取對角線（每個配對的相似度）
            pair_similarities = similarities_batch.diagonal()
        else:
            pair_similarities = []
        
        # 聚合每個維度的得分
        attr_scores = {}
        attr_details = {}  # 記錄每個維度的詳細匹配情況
        
        for i, (user_tag, attr_tag, attr_id, similarity) in enumerate(zip(
            user_tags_for_batch, attr_tags_for_batch, attr_mapping, pair_similarities
        )):
            if attr_id not in attr_scores:
                attr_scores[attr_id] = 0
                attr_details[attr_id] = []
            
            # 累加相似度分數
            attr_scores[attr_id] += similarity
            
            # 記錄高相似度的配對（用於debug）
            if similarity > 0.8:
                attr_details[attr_id].append(f"{user_tag}↔{attr_tag}({similarity:.3f})")
        
        # 計算平均分數（避免維度meta-tag數量多的佔優勢）
        for attr_id in attr_scores:
            num_attr_tags = len(self.metadata[attr_id]["attribute_meta_tags"])
            num_user_tags = len(content_meta_tags)
            # 平均分數 = 總分數 / (維度標籤數 * 用戶標籤數)
            attr_scores[attr_id] = attr_scores[attr_id] / (num_attr_tags * num_user_tags)
        
        # 顯示詳細匹配情況
        print(f"\n高相似度配對詳情（>0.8）：")
        for attr_id, details in attr_details.items():
            if details:
                attr_name = self.metadata[attr_id]["attribute_name"]
                print(f"  {attr_id}-{attr_name}: {', '.join(details)}")
        
        # 排序並返回前N個
        similarities = [
            (attr_id, score, self.metadata[attr_id]["attribute_name"])
            for attr_id, score in attr_scores.items()
        ]
        similarities.sort(key=lambda x: x[1], reverse=True)
        
        return similarities[:top_n]
    
    def process_user_content(self, user_content: str, image_url: str = None, threshold: float = 0.1) -> List[Dict]:
        """
        處理用戶內容，返回匹配的維度信息（支持多模態）
        """
        print(f"\n=== MSMM 語意匹配分析 ===")
        print(f"用戶內容: {user_content}")
        if image_url:
            print(f"包含圖片: {image_url}")
        print(f"相似度閾值: {threshold}")
        
        matching_attributes = self.find_matching_attributes(user_content, image_url)
        
        # 過濾低於閾值的結果
        filtered_results = [
            {
                "attribute_id": attr_id,
                "attribute_name": attr_name,
                "similarity_score": score
            }
            for attr_id, score, attr_name in matching_attributes
            if score >= threshold
        ]
        
        print(f"\n匹配到的維度 (相似度 >= {threshold}):")
        for result in filtered_results:
            print(f"  {result['attribute_id']}-{result['attribute_name']}: {result['similarity_score']:.3f}")
        
        if not filtered_results:
            print("  沒有找到符合閾值的匹配維度")
        
        return filtered_results

# 測試函數
def test_msmm():
    """測試MSMM模組"""
    msmm = MSMMProcessor()
    
    test_content = "我今天帶領學弟妹完成了一篇論文，還順便去吃了有名的台式早餐慶祝。"
    results = msmm.process_user_content(test_content)
    
    return results

if __name__ == "__main__":
    test_msmm() 