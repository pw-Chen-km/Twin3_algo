"""
DADEE (Dynamic Attribute Development & Evolution Engine)
促進Twin Matrix的動態演進，反映社群的共識變化
"""

import json
import os
import re
from typing import List, Dict, Set, Tuple
from collections import Counter
import numpy as np
from sklearn.cluster import DBSCAN
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer

class DADEEProcessor:
    def __init__(self, 
                 data_path: str = None,
                 metadata_path: str = None,
                 similarity_threshold: float = 0.6,
                 min_cluster_size: int = 2):
        """初始化DADEE處理器"""
        # 自動偵測正確的路徑
        current_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(current_dir)  # 假設 src/ 在專案根目錄下
        
        if data_path is None:
            # 嘗試找到 data 目錄
            if os.path.exists(os.path.join(project_root, "data")):
                self.data_path = os.path.join(project_root, "data") + "/"
            elif os.path.exists("data"):
                self.data_path = "data/"
            else:
                self.data_path = "../data/"
        else:
            self.data_path = data_path
            
        if metadata_path is None:
            # 嘗試找到 metadata 目錄
            if os.path.exists(os.path.join(project_root, "metadata", "attribute_metadata.json")):
                self.metadata_path = os.path.join(project_root, "metadata", "attribute_metadata.json")
            elif os.path.exists("metadata/attribute_metadata.json"):
                self.metadata_path = "metadata/attribute_metadata.json"
            else:
                self.metadata_path = "../metadata/attribute_metadata.json"
        else:
            self.metadata_path = metadata_path
            
        self.similarity_threshold = similarity_threshold
        self.min_cluster_size = min_cluster_size
        
        self.metadata = self._load_metadata()
        
        # 初始化Sentence-BERT模型
        try:
            self.sentence_model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
        except:
            print("警告：無法載入多語言模型，使用基礎英文模型")
            self.sentence_model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # 預先計算現有維度的向量
        self._precompute_existing_vectors()
    
    def _load_metadata(self) -> Dict:
        """載入維度元數據"""
        try:
            with open(self.metadata_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"錯誤：找不到元數據文件 {self.metadata_path}")
            return {}
    
    def _precompute_existing_vectors(self):
        """預先計算所有現有維度的向量表示"""
        self.existing_vectors = {}
        self.existing_meta_tags = []
        
        for attr_id, attr_data in self.metadata.items():
            meta_tags = attr_data.get("attribute_meta_tags", [])
            self.existing_meta_tags.extend(meta_tags)
            
            # 為整個維度計算向量
            combined_text = " ".join([
                attr_data.get("attribute_name", ""),
                " ".join(meta_tags),
                attr_data.get("definition", "")
            ])
            
            vector = self.sentence_model.encode([combined_text])
            self.existing_vectors[attr_id] = vector[0]
        
        # 去重現有Meta-Tags
        self.existing_meta_tags = list(set(self.existing_meta_tags))
        print(f"已載入 {len(self.metadata)} 個現有維度，包含 {len(self.existing_meta_tags)} 個Meta-Tags")
    
    def extract_content_meta_tags_from_files(self) -> List[str]:
        """從所有數據文件中提取內容Meta-Tags（舊版方法，保留向後兼容）"""
        all_meta_tags = []
        
        # 遍歷data目錄下的所有txt文件
        if not os.path.exists(self.data_path):
            print(f"錯誤：數據目錄 {self.data_path} 不存在")
            return []
        
        txt_files = [f for f in os.listdir(self.data_path) if f.endswith('.txt')]
        print(f"找到 {len(txt_files)} 個數據文件")
        
        for filename in txt_files:
            filepath = os.path.join(self.data_path, filename)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read().strip()
                    
                # 提取Meta-Tags（使用簡化的關鍵詞提取）
                meta_tags = self._extract_meta_tags_from_content(content)
                all_meta_tags.extend(meta_tags)
                
            except Exception as e:
                print(f"讀取文件 {filename} 時發生錯誤：{e}")
        
        print(f"總共提取了 {len(all_meta_tags)} 個Meta-Tags")
        return all_meta_tags
    
    def extract_meta_tags_from_records(self, records_path: str = None) -> List[str]:
        """從用戶Meta-Tag記錄中提取所有Meta-Tags（新版主要方法）"""
        all_meta_tags = []
        
        # 如果沒有指定路徑，自動偵測
        if records_path is None:
            current_dir = os.path.dirname(os.path.abspath(__file__))
            project_root = os.path.dirname(current_dir)
            
            # 嘗試不同的可能路徑
            possible_paths = [
                os.path.join(project_root, "state", "user_metatags_records.json"),
                "state/user_metatags_records.json",
                "../state/user_metatags_records.json"
            ]
            
            records_path = None
            for path in possible_paths:
                if os.path.exists(path):
                    records_path = path
                    break
            
            if records_path is None:
                print("❌ 找不到Meta-Tag記錄文件，嘗試過的路徑：")
                for path in possible_paths:
                    print(f"  - {path}")
                print("⚠️  請先運行main.py處理一些用戶內容以生成記錄")
                return []
        
        try:
            with open(records_path, 'r', encoding='utf-8') as f:
                records = json.load(f)
            
            print(f"載入了 {len(records)} 個用戶的Meta-Tag記錄")
            
            # 統計所有用戶的meta-tag
            tag_frequency = {}
            total_tags = 0
            
            for user_id, user_tags in records.items():
                print(f"  {user_id}: {len(user_tags)} 個不同概念")
                
                for tag, info in user_tags.items():
                    count = info.get('count', 1)
                    total_tags += count
                    
                    # 累積每個tag的總出現次數
                    if tag in tag_frequency:
                        tag_frequency[tag] += count
                    else:
                        tag_frequency[tag] = count
                    
                    # 將tag按出現次數添加到列表中（用於聚類分析）
                    all_meta_tags.extend([tag] * count)
            
            print(f"總共發現 {len(tag_frequency)} 個不同的Meta-Tag概念")
            print(f"總計 {total_tags} 次Meta-Tag出現")
            
            # 顯示最頻繁的概念
            top_tags = sorted(tag_frequency.items(), key=lambda x: x[1], reverse=True)[:10]
            print("最常出現的概念：")
            for tag, freq in top_tags:
                print(f"  🏷️  {tag}: {freq} 次")
            
            return all_meta_tags
            
        except FileNotFoundError:
            print(f"❌ 找不到Meta-Tag記錄文件: {records_path}")
            print("⚠️  請先運行main.py處理一些用戶內容以生成記錄")
            return []
        except json.JSONDecodeError:
            print(f"❌ Meta-Tag記錄文件格式錯誤: {records_path}")
            return []
        except Exception as e:
            print(f"❌ 讀取Meta-Tag記錄時發生錯誤: {e}")
            return []
    
    def analyze_user_metatag_trends(self, records_path: str = None) -> Dict:
        """分析用戶Meta-Tag趨勢和分佈"""
        # 如果沒有指定路徑，自動偵測
        if records_path is None:
            current_dir = os.path.dirname(os.path.abspath(__file__))
            project_root = os.path.dirname(current_dir)
            
            # 嘗試不同的可能路徑
            possible_paths = [
                os.path.join(project_root, "state", "user_metatags_records.json"),
                "state/user_metatags_records.json",
                "../state/user_metatags_records.json"
            ]
            
            records_path = None
            for path in possible_paths:
                if os.path.exists(path):
                    records_path = path
                    break
            
            if records_path is None:
                print("❌ 找不到Meta-Tag記錄文件進行趨勢分析")
                return {}
        
        try:
            with open(records_path, 'r', encoding='utf-8') as f:
                records = json.load(f)
            
            analysis = {
                "total_users": len(records),
                "concept_distribution": {},
                "user_activity": {},
                "temporal_trends": {},
                "emerging_concepts": []
            }
            
            # 分析概念分佈
            concept_freq = {}
            user_concept_counts = {}
            
            for user_id, user_tags in records.items():
                user_concept_counts[user_id] = len(user_tags)
                
                for tag, info in user_tags.items():
                    count = info.get('count', 1)
                    if tag in concept_freq:
                        concept_freq[tag] += count
                    else:
                        concept_freq[tag] = count
            
            analysis["concept_distribution"] = dict(sorted(concept_freq.items(), key=lambda x: x[1], reverse=True))
            analysis["user_activity"] = user_concept_counts
            
            # 識別新興概念（頻次高但用戶分散度也高的概念）
            for tag, total_freq in concept_freq.items():
                user_count = sum(1 for user_tags in records.values() if tag in user_tags)
                if total_freq >= 3 and user_count >= 2:  # 至少3次出現且至少2個用戶
                    analysis["emerging_concepts"].append({
                        "tag": tag,
                        "frequency": total_freq,
                        "user_count": user_count,
                        "diversity_score": user_count / len(records)
                    })
            
            # 按多樣性分數排序新興概念
            analysis["emerging_concepts"].sort(key=lambda x: x["diversity_score"], reverse=True)
            
            return analysis
            
        except Exception as e:
            print(f"分析用戶Meta-Tag趨勢時發生錯誤: {e}")
            return {}
    
    def _extract_meta_tags_from_content(self, content: str) -> List[str]:
        """從單個內容中提取Meta-Tags"""
        content_lower = content.lower()
        
        # 環保相關關鍵詞
        environmental_keywords = [
            "永續", "環保", "減碳", "綠色", "生態", "氣候", "垃圾分類", 
            "有機", "再生能源", "太陽能", "風力", "清潔能源", "淨灘",
            "污染", "保護", "零廢棄", "可重複利用", "生物多樣性",
            "永續發展", "碳足跡", "環境保護", "綠色科技"
        ]
        
        # 其他類別關鍵詞
        other_keywords = {
            "social": ["社區", "志工", "慈善", "幫助", "社會", "公益"],
            "learning": ["學習", "研究", "閱讀", "課程", "技巧", "知識", "講座"],
            "technology": ["程式", "科技", "軟體", "電腦", "AI", "數位", "創新"],
            "food": ["吃", "食物", "餐廳", "料理", "早餐", "火鍋", "市集"],
            "leadership": ["帶領", "領導", "指導", "管理", "組織"],
            "achievement": ["完成", "成就", "成功", "獲得", "實現"]
        }
        
        extracted_tags = []
        
        # 檢查環保相關關鍵詞
        for keyword in environmental_keywords:
            if keyword in content_lower:
                extracted_tags.append(keyword)
        
        # 檢查其他類別關鍵詞
        for category, keywords in other_keywords.items():
            for keyword in keywords:
                if keyword in content_lower:
                    extracted_tags.append(keyword)
        
        # 提取中文詞彙
        chinese_words = re.findall(r'[\u4e00-\u9fff]+', content)
        for word in chinese_words:
            if len(word) >= 2 and word not in extracted_tags:
                extracted_tags.append(word)
        
        return extracted_tags
    
    def perform_clustering_analysis(self, meta_tags: List[str]) -> List[List[str]]:
        """對Meta-Tags進行聚類分析"""
        if len(meta_tags) < self.min_cluster_size:
            print("Meta-Tags數量不足，無法進行聚類分析")
            return []
        
        # 統計詞頻，過濾低頻詞
        tag_counts = Counter(meta_tags)
        frequent_tags = [tag for tag, count in tag_counts.items() if count >= 2]
        
        if len(frequent_tags) < self.min_cluster_size:
            print("高頻Meta-Tags數量不足，無法進行聚類分析")
            return []
        
        print(f"使用 {len(frequent_tags)} 個高頻Meta-Tags進行聚類分析")
        
        # 向量化
        tag_vectors = self.sentence_model.encode(frequent_tags)
        
        # 使用DBSCAN進行聚類
        clustering = DBSCAN(
            eps=0.3,  # 較小的eps值以獲得更緊密的聚類
            min_samples=self.min_cluster_size,
            metric='cosine'
        ).fit(tag_vectors)
        
        # 組織聚類結果
        clusters = {}
        for i, label in enumerate(clustering.labels_):
            if label != -1:  # 忽略噪點
                if label not in clusters:
                    clusters[label] = []
                clusters[label].append(frequent_tags[i])
        
        cluster_list = list(clusters.values())
        print(f"發現 {len(cluster_list)} 個語意聚類")
        
        return cluster_list
    
    def evaluate_novelty(self, clusters: List[List[str]]) -> List[Dict]:
        """評估新概念的新穎性"""
        novel_concepts = []
        
        for i, cluster in enumerate(clusters):
            cluster_text = " ".join(cluster)
            cluster_vector = self.sentence_model.encode([cluster_text])[0]
            
            # 計算與所有現有維度的相似度
            max_similarity = 0.0
            most_similar_attr = ""
            
            for attr_id, existing_vector in self.existing_vectors.items():
                similarity = cosine_similarity([cluster_vector], [existing_vector])[0][0]
                if similarity > max_similarity:
                    max_similarity = similarity
                    most_similar_attr = attr_id
            
            # 判斷是否為新穎概念
            if max_similarity < self.similarity_threshold:
                novel_concepts.append({
                    'cluster_id': i,
                    'meta_tags': cluster,
                    'max_similarity': max_similarity,
                    'most_similar_attribute': most_similar_attr,
                    'novelty_score': 1.0 - max_similarity
                })
        
        # 按新穎性評分排序
        novel_concepts.sort(key=lambda x: x['novelty_score'], reverse=True)
        
        return novel_concepts
    
    def generate_evolution_proposals(self, novel_concepts: List[Dict]) -> List[Dict]:
        """生成維度演進提案"""
        proposals = []
        
        for concept in novel_concepts:
            meta_tags = concept['meta_tags']
            novelty_score = concept['novelty_score']
            most_similar_attr = concept['most_similar_attribute']
            
            # 分析概念主題
            concept_theme = self._analyze_concept_theme(meta_tags)
            
            # 生成建議
            if novelty_score > 0.6:  # 高新穎性，建議創建新維度
                proposal = {
                    'type': 'create_new_attribute',
                    'concept_theme': concept_theme,
                    'suggested_name': self._suggest_attribute_name(meta_tags),
                    'meta_tags': meta_tags,
                    'novelty_score': novelty_score,
                    'rationale': f"發現高新穎性概念（評分: {novelty_score:.3f}），建議創建新維度"
                }
            else:  # 中等新穎性，建議擴展現有維度
                similar_attr_name = self.metadata.get(most_similar_attr, {}).get('attribute_name', 'Unknown')
                proposal = {
                    'type': 'enhance_existing_attribute',
                    'target_attribute_id': most_similar_attr,
                    'target_attribute_name': similar_attr_name,
                    'concept_theme': concept_theme,
                    'suggested_additional_tags': meta_tags,
                    'novelty_score': novelty_score,
                    'rationale': f"與維度 {most_similar_attr} 相似度為 {concept['max_similarity']:.3f}，建議擴展其Meta-Tags"
                }
            
            proposals.append(proposal)
        
        return proposals
    
    def _analyze_concept_theme(self, meta_tags: List[str]) -> str:
        """分析概念主題"""
        # 環保主題檢測
        environmental_tags = ["永續", "環保", "減碳", "綠色", "生態", "氣候", "有機", "再生能源"]
        if any(tag in meta_tags for tag in environmental_tags):
            return "環境保護與永續發展"
        
        # 社會責任主題檢測
        social_tags = ["社區", "志工", "慈善", "幫助", "公益"]
        if any(tag in meta_tags for tag in social_tags):
            return "社會責任與公民參與"
        
        # 科技主題檢測
        tech_tags = ["科技", "數位", "AI", "創新", "程式"]
        if any(tag in meta_tags for tag in tech_tags):
            return "科技應用與創新"
        
        return "其他新興概念"
    
    def _suggest_attribute_name(self, meta_tags: List[str]) -> str:
        """建議維度名稱"""
        # 基於Meta-Tags建議名稱
        if any(tag in ["永續", "環保", "減碳", "綠色"] for tag in meta_tags):
            return "Environmental Consciousness"
        elif any(tag in ["社區", "志工", "慈善"] for tag in meta_tags):
            return "Community Engagement"
        elif any(tag in ["科技", "創新", "數位"] for tag in meta_tags):
            return "Digital Innovation"
        else:
            return "Emerging Life Dimension"
    
    def run_evolution_analysis(self, use_records: bool = True, records_path: str = None) -> Dict:
        """執行完整的維度演進分析"""
        print("\n=== DADEE 維度演進分析 ===")
        
        # 1. 數據聚合
        if use_records:
            print("步驟1: 從用戶Meta-Tag記錄中提取資料...")
            all_meta_tags = self.extract_meta_tags_from_records(records_path)
            
            if not all_meta_tags:
                print("⚠️  沒有找到Meta-Tag記錄，嘗試從舊版文件讀取...")
                all_meta_tags = self.extract_content_meta_tags_from_files()
        else:
            print("步驟1: 從用戶數據文件中提取Meta-Tags...")
            all_meta_tags = self.extract_content_meta_tags_from_files()
        
        if not all_meta_tags:
            print("沒有找到可分析的數據")
            return {'proposals': [], 'status': 'no_data'}
        
        # 2. 聚類分析
        print("步驟2: 執行聚類分析...")
        clusters = self.perform_clustering_analysis(all_meta_tags)
        
        if not clusters:
            print("沒有發現語意聚類")
            return {'proposals': [], 'status': 'no_clusters'}
        
        # 3. 新穎性評估
        print("步驟3: 評估概念新穎性...")
        novel_concepts = self.evaluate_novelty(clusters)
        
        if not novel_concepts:
            print("沒有發現新穎概念")
            return {'proposals': [], 'status': 'no_novel_concepts'}
        
        # 4. 生成提案
        print("步驟4: 生成演進提案...")
        proposals = self.generate_evolution_proposals(novel_concepts)
        
        return {
            'proposals': proposals,
            'clusters_found': len(clusters),
            'novel_concepts_found': len(novel_concepts),
            'status': 'success'
        }
    
    def run_user_trend_analysis(self) -> Dict:
        """執行用戶趨勢分析（基於Meta-Tag記錄）"""
        print("\n=== DADEE 用戶趨勢分析 ===")
        
        analysis = self.analyze_user_metatag_trends()
        
        if not analysis:
            print("無法執行趨勢分析")
            return {}
        
        print(f"分析了 {analysis['total_users']} 個用戶的Meta-Tag記錄")
        
        # 顯示新興概念
        emerging = analysis.get('emerging_concepts', [])
        if emerging:
            print(f"\n發現 {len(emerging)} 個新興概念：")
            for concept in emerging[:5]:  # 顯示前5個
                print(f"  🌱 {concept['tag']}: {concept['frequency']} 次, {concept['user_count']} 用戶, 多樣性 {concept['diversity_score']:.3f}")
        
        # 顯示用戶活躍度
        activity = analysis.get('user_activity', {})
        if activity:
            avg_concepts = sum(activity.values()) / len(activity)
            print(f"\n用戶平均概念數量: {avg_concepts:.1f}")
            most_active = max(activity.items(), key=lambda x: x[1])
            print(f"最活躍用戶: {most_active[0]} ({most_active[1]} 個概念)")
        
        return analysis
    
    def print_proposals(self, analysis_results: Dict):
        """格式化打印提案"""
        proposals = analysis_results.get('proposals', [])
        
        if not proposals:
            print("沒有生成任何演進提案")
            return
        
        print(f"\n=== DADEE 演進提案報告 ===")
        print(f"發現 {len(proposals)} 個演進機會\n")
        
        for i, proposal in enumerate(proposals, 1):
            print(f"提案 {i}: {proposal['type']}")
            print(f"概念主題: {proposal['concept_theme']}")
            print(f"新穎性評分: {proposal['novelty_score']:.3f}")
            
            if proposal['type'] == 'create_new_attribute':
                print(f"建議新維度名稱: {proposal['suggested_name']}")
                print(f"建議Meta-Tags: {proposal['meta_tags']}")
            else:
                print(f"目標維度: {proposal['target_attribute_id']}-{proposal['target_attribute_name']}")
                print(f"建議新增Meta-Tags: {proposal['suggested_additional_tags']}")
            
            print(f"理由: {proposal['rationale']}")
            print("-" * 60)

# 測試函數
def test_dadee():
    """測試DADEE模組"""
    dadee = DADEEProcessor()
    results = dadee.run_evolution_analysis()
    dadee.print_proposals(results)
    return results

if __name__ == "__main__":
    test_dadee() 