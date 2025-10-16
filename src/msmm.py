"""
MSMM (Multi-Semantic Matching Module) - Gemini 2.5 Flash 版本
------------------------------------------------------------
主要改動
▸ 移除 Gemma 本地模型，改用 Google Gemini 2.5 Flash 線上 API
▸ 保留 Sentence-BERT 向量比對流程與回退規則
▸ 支援文字 / 圖片（inline bytes 或 URL）多模態輸入
依賴套件
    pip install -U google-genai sentence-transformers scikit-learn pillow requests numpy
環境變數
    export GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
"""

from __future__ import annotations
import os, json, re, io, warnings, mimetypes
from typing import List, Dict, Tuple
import base64
import requests
from PIL import Image

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer

# Google Gemini SDK
from google import genai
from google.genai import types


# ---------------------------  主類別  --------------------------- #
class MSMMProcessor:
    def __init__(
        self,
        metadata_path: str = "metadata/attribute_metadata.json",
        gemini_model_name: str = "gemini-2.5-flash",
    ):
        """初始化 MSMM 處理器（Gemini 版）"""
        # 1) 載入屬性維度定義
        self.metadata_path = metadata_path
        self.metadata = self._load_metadata()

        # 2) 多語 Sentence-BERT
        try:
            self.sentence_model = SentenceTransformer(
                "paraphrase-multilingual-MiniLM-L12-v2"
            )
        except Exception:
            warnings.warn("⚠️ 無法載入多語 MiniLM，改用英文模型")
            self.sentence_model = SentenceTransformer("all-MiniLM-L6-v2")

        # 3) Google Gemini Client
        self.gemini_client = genai.Client(api_key="AIzaSyDTZhjS_V4HNFbWWcDoBb_VFbVf_W_Mvlc")
        self.gemini_model_name = gemini_model_name

        # 4) 預先計算 attribute 向量
        self._precompute_attribute_vectors()

        # 5) 標籤向量快取（tag -> vector）並預先編碼所有 attribute_meta_tags
        self.tag_vector_cache: Dict[str, np.ndarray] = {}
        self._precompute_tag_vectors()

    # ---------------------------------------------------------- #
    #                         輔助函式
    # ---------------------------------------------------------- #
    def _load_metadata(self) -> Dict:
        try:
            with open(self.metadata_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except FileNotFoundError:
            warnings.warn(f"❌ 找不到 {self.metadata_path}")
            return {}

    def _precompute_attribute_vectors(self):
        self.attribute_vectors = {}
        for attr_id, attr_data in self.metadata.items():
            vec = self.sentence_model.encode(
                [" ".join(attr_data["attribute_meta_tags"])]
            )[0]
            self.attribute_vectors[attr_id] = vec
        print(f"✅ 已預計算 {len(self.attribute_vectors)} 個維度向量")

    def _precompute_tag_vectors(self):
        """預先將所有出現於 metadata 的 attribute_meta_tags 逐一向量化並快取。"""
        try:
            all_tags = sorted({tag for v in self.metadata.values() for tag in v.get("attribute_meta_tags", [])})
            if not all_tags:
                return
            tag_vecs = self.sentence_model.encode(all_tags)
            for tag, vec in zip(all_tags, tag_vecs):
                self.tag_vector_cache[tag] = vec
            print(f"✅ 已快取 {len(self.tag_vector_cache)} 個標籤向量")
        except Exception as e:
            warnings.warn(f"⚠️ 標籤向量預先編碼失敗：{e}")

    def _get_tag_vector_cached(self, tag: str):
        """從快取取得標籤向量；若不存在則即時編碼並寫入快取。"""
        if tag in self.tag_vector_cache:
            return self.tag_vector_cache[tag]
        try:
            vec = self.sentence_model.encode([tag])[0]
            self.tag_vector_cache[tag] = vec
            return vec
        except Exception as e:
            warnings.warn(f"⚠️ 單一標籤向量編碼失敗（{tag}）：{e}")
            # 回傳零向量以避免流程中斷
            return np.zeros_like(next(iter(self.tag_vector_cache.values()))) if self.tag_vector_cache else np.zeros(384)

    # ------------------------ Gemini 萃取 ----------------------- #
    def _build_prompt(self, user_content: str) -> str:
        # 系統 + 任務指令合併為單一文字 prompt
        #all_tags = {tag for v in self.metadata.values() for tag in v["attribute_meta_tags"]}
        #sample_tags = ", ".join(list(all_tags)[:30])

        prompt = f"""
你現在的任務是從用戶的生活體驗內容中，萃取出最具代表性的關鍵字(hash tag)，作為語意特徵。這些 hash tag將用於後續與一組已定義的 attribute hash tag 進行語意向量比對，以判斷內容與各 attribute 的相關性。因此你提取的hash tag 必須能夠最佳反映原始內容的行為、情緒、場景或核心價值，並利於向量語意匹配。

分析下方用戶內容，依據指引萃取”最多”10個(也可以0個）最適合進行語意比對的高層次 Meta-Tags：
用戶內容：「{user_content}」

萃取指引：
1. 每個 Meta-Tag 為簡潔且具備通用意義的中文或英文詞彙
2. 盡量涵蓋行為、情緒、場景、技能、價值觀等核心語意，非僅具體角色/地點/事件名詞
3. 如果有配圖，請將圖片內容一併納入考量
5. 避免極度專有或描述性名詞，優先抽取可跨場景語意比對的概念型詞彙
6.如果內容並沒有涉及任何核心語意，請輸出空字串。

**只輸出以逗號分隔的 Meta-Tags，不要有其他說明或格式。**
例如：學習, 成就感, 團隊合作, 食物, 慶祝
""".strip()
        return prompt

    def _image_part_from_url_or_path(self, image_url: str) -> types.Part | None:
        try:
            # data URL (data:image/...;base64,XXXX)
            if image_url.startswith("data:"):
                header, b64data = image_url.split(",", 1)
                mime = header.split(";")[0].split(":")[1] if ";" in header else "image/jpeg"
                img_bytes = base64.b64decode(b64data)
                return types.Part.from_bytes(data=img_bytes, mime_type=mime)
            # raw base64（無 data: 前綴）
            if re.fullmatch(r"[A-Za-z0-9+/=\r\n]+", image_url) and len(image_url) > 100:
                try:
                    img_bytes = base64.b64decode(image_url)
                except Exception:
                    # 嘗試補齊 padding
                    padding = '=' * ((4 - len(image_url) % 4) % 4)
                    img_bytes = base64.b64decode(image_url + padding)
                return types.Part.from_bytes(data=img_bytes, mime_type="image/jpeg")
            if image_url.startswith(("http://", "https://")):
                img_bytes = requests.get(image_url, timeout=10).content
                mime = requests.head(image_url, timeout=10).headers.get("Content-Type", "image/jpeg")
            else:
                with open(image_url, "rb") as f:
                    img_bytes = f.read()
                mime, _ = mimetypes.guess_type(image_url)
                mime = mime or "image/jpeg"
            return types.Part.from_bytes(data=img_bytes, mime_type=mime)
        except Exception as e:
            warnings.warn(f"⚠️ 圖片讀取失敗：{repr(e)}")
            return None

    def _gemini_extract_tags(self, user_content: str, image_url: str | None) -> List[str]:
        prompt = self._build_prompt(user_content)
        parts: List[types.Part | str] = []

        # 圖片若有成功轉為 Part，採用「圖片 + prompt」排列
        if image_url:
            img_part = self._image_part_from_url_or_path(image_url)
            if img_part:
                parts.append(img_part)
        parts.append(prompt)

        try:
            response = self.gemini_client.models.generate_content(
                model=self.gemini_model_name,
                contents=parts if len(parts) > 1 else parts[0],
                # 關閉 thinking 以節省成本/延遲（可自行調整）
                config=types.GenerateContentConfig(
                    thinking_config=types.ThinkingConfig(thinking_budget=0)
                ),
            )  #  [oai_citation:0‡Google AI for Developers](https://ai.google.dev/gemini-api/docs/quickstart)
            resp_text = response.text.strip() if response.text else ""
        except Exception as e:
            warnings.warn(f"⚠️ Gemini API 失敗：{e}")
            return self._fallback_meta_tag_extraction(user_content)

        # 逗號 / 頓號切分；允許空結果（不做規則回退）
        tags = re.split(r"[,\s、]+", resp_text)
        tags = [t.strip() for t in tags if 1 < len(t) < 20][:8]
        return tags

    # ---------------------------------------------------------- #
    #                   回退：簡易規則萃取
    # ---------------------------------------------------------- #
    def _fallback_meta_tag_extraction(self, text: str) -> List[str]:
        text_l = text.lower()
        rule = {
            "achievement": ["完成", "成就", "成功", "達成", "獲得"],
            "leadership": ["帶領", "領導", "指導", "主持"],
            "food": ["吃", "食物", "餐廳", "料理", "早餐", "午餐", "晚餐"],
            "learning": ["學習", "研究", "閱讀", "課程", "知識"],
            "creative": ["創作", "設計", "藝術", "音樂", "攝影"],
            "exercise": ["運動", "健身", "跑步", "游泳", "瑜伽"],
            "social": ["朋友", "聚會", "社交", "團體", "志工"],
            "technology": ["程式", "科技", "軟體", "電腦", "ai"],
            "environment": ["永續", "環保", "減碳", "綠色", "生態"],
        }
        hits = [k for k, kw in rule.items() if any(w in text_l for w in kw)]
        if hits:
            return list(set(hits))
        # 沒命中 → 回傳空陣列，讓前端終止流程
        return []

    # ---------------------------------------------------------- #
    #        對外 API：提取 Meta-Tags + 找匹配維度
    # ---------------------------------------------------------- #
    def extract_meta_tags(self, user_content: str, image_url: str | None = None) -> List[str]:
        tags = self._gemini_extract_tags(user_content, image_url)
        # 保存最後提取的 Meta-Tags 供重用
        self._last_extracted_tags = tags
        return tags

    def find_matching_attributes(
        self, user_content: str, image_url: str | None = None, top_n: int | None = None
    ) -> List[Tuple[str, float, str]]:
        """以『任一 user_tag 與任一 attribute_meta_tag 的最大相似度』作為該 attribute 的分數；若未提供 top_n 則不截斷。"""
        user_tags = self.extract_meta_tags(user_content, image_url)
        print("🎯 萃取 Meta-Tags:", user_tags)
        if not user_tags:
            return []

        # 批次組 pair
        user_batch, attr_batch, mapping = [], [], []
        for ut in user_tags:
            for aid, adata in self.metadata.items():
                for at in adata["attribute_meta_tags"]:
                    user_batch.append(ut)
                    attr_batch.append(at)
                    mapping.append(aid)

        # 向量化與 cos 相似度（使用屬性標籤向量快取）
        u_vecs = self.sentence_model.encode(user_batch)
        try:
            a_vecs = np.stack([self._get_tag_vector_cached(t) for t in attr_batch])
        except Exception as e:
            warnings.warn(f"⚠️ 組裝屬性標籤向量失敗：{e}")
            a_vecs = self.sentence_model.encode(attr_batch)
        sims = cosine_similarity(u_vecs, a_vecs).diagonal()

        # 聚合為『最大相似度』到 attribute
        max_scores: Dict[str, float] = {}
        for aid, s in zip(mapping, sims):
            prev = max_scores.get(aid)
            if prev is None or s > prev:
                max_scores[aid] = float(s)

        ranked = sorted(
            ((aid, sc, self.metadata[aid]["attribute_name"]) for aid, sc in max_scores.items()),
            key=lambda x: x[1],
            reverse=True,
        )
        return ranked[:top_n] if top_n else ranked

    def process_user_content(
        self, user_content: str, image_url: str | None = None, threshold: float = 0.75
    ) -> List[Dict]:
        """主入口：返回『最大標籤相似度』≥ threshold 的匹配維度"""
        top_attrs = self.find_matching_attributes(user_content, image_url)
        res = [
            {
                "attribute_id": aid,
                "attribute_name": name,
                "similarity_score": score,
            }
            for aid, score, name in top_attrs
            if score >= threshold
        ]
        print("✅ 匹配結果:", res or "無")
        return res


# ---------------------------  快速測試  --------------------------- #
def _quick_test():
    msmm = MSMMProcessor()
    text = "我今天帶領學弟妹完成了一篇論文，然後去吃了台式早餐慶祝！"
    return msmm.process_user_content(text)


if __name__ == "__main__":
    _quick_test()