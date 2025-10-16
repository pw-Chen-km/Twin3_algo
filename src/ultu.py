"""
ULTU (Universal Life-Twin Update)
負責為匹配到的維度生成精確 HEX 值，並動態更新整個矩陣
Gemini 2.5 Flash 多模態輸入已全面支援
"""

import json, math, random, re, warnings, io, os, mimetypes
import base64
from datetime import datetime, timezone
from typing import Dict, List, Tuple, Optional

import requests
from PIL import Image

# Google Gemini SDK
from google import genai
from google.genai import types


# ---------------------------  主類別  --------------------------- #
class ULTUProcessor:
    def __init__(
        self,
        metadata_path: str = "metadata/attribute_metadata.json",
        state_file: str = "state/user_matrix_state.json",
        gemini_model_name: str = "gemini-2.5-flash",
        alpha: float = 0.3,       # 分數平滑係數
        lambda_decay: float = 0.1 # 時間衰減係數
    ):
        self.metadata_path = metadata_path
        self.state_file = state_file
        self.alpha = alpha
        self.lambda_decay = lambda_decay

        self.metadata = self._load_metadata()

        # Google Gemini Client
        self.gemini_client = genai.Client(api_key="AIzaSyDTZhjS_V4HNFbWWcDoBb_VFbVf_W_Mvlc")
        self.gemini_model_name = gemini_model_name

    # ---------------------------------------------------------- #
    #                       基礎 I/O
    # ---------------------------------------------------------- #
    def _load_metadata(self) -> Dict:
        try:
            with open(self.metadata_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except FileNotFoundError:
            warnings.warn(f"❌ 找不到 {self.metadata_path}")
            return {}

    def _load_user_state(self) -> Dict:
        try:
            with open(self.state_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except FileNotFoundError:
            return {}

    def _save_user_state(self, user_state: Dict):
        os.makedirs(os.path.dirname(self.state_file), exist_ok=True)
        with open(self.state_file, "w", encoding="utf-8") as f:
            json.dump(user_state, f, indent=2, ensure_ascii=False)

    # ---------------------------------------------------------- #
    #                 Gemini 評分訊息建構 (多模態)
    # ---------------------------------------------------------- #
    def _build_scoring_prompt(
        self,
        attribute_id: str,
        user_content: str,
        current_score: int,
    ) -> str:
        """產生 Gemini 評分 prompt"""
        attr = self.metadata.get(attribute_id, {})
        attr_name = attr.get("attribute_name", "Unknown")

        prompt = f"""
你是 Twin Matrix 系統的專業評分 AI，需要為用戶的生活體驗內容在指定維度進行 0-255 分評分。

維度 ID：{attribute_id}
維度名稱：{attr_name}

維度定義：{attr.get('definition', '未定義')}
評分規則：{attr.get('encoding_rules', '無特定規則')}
AI 解析指導：{attr.get('ai_parsing_guidelines', '基於內容相關性評分')}

用戶內容：「{user_content}」

評分要求：
1. 0 = 完全無關 / 負面；128 = 中等；255 = 最強體現
2. 當前用戶此維度分數：{current_score}
3. 若有圖片，需結合圖片內容
4. 僅輸出 0-255 的整數，無其他文字
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
            # raw base64 字串（無 data: 前綴）
            if re.fullmatch(r"[A-Za-z0-9+/=\r\n]+", image_url) and len(image_url) > 100:
                try:
                    img_bytes = base64.b64decode(image_url)
                except Exception:
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

    # ---------------------------------------------------------- #
    #                 Gemini 端到端評分 (含圖片)
    # ---------------------------------------------------------- #
    def _gemini_score(
        self,
        attribute_id: str,
        user_content: str,
        prev_score: int,
        image_url: Optional[str],
    ) -> int:
        prompt = self._build_scoring_prompt(attribute_id, user_content, prev_score)
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
            )
            resp_text = response.text.strip()
        except Exception as e:
            warnings.warn(f"⚠️ Gemini API 失敗：{e}")
            return self._fallback_scoring(attribute_id, user_content)

        # 解析回應中的數字
        m = re.search(r"\b(\d{1,3})\b", resp_text)
        if m:
            val = int(m.group(1))
            return max(0, min(255, val))
        warnings.warn("⚠️ 無法解析 Gemini 回應，改用回退評分")
        return self._fallback_scoring(attribute_id, user_content)

    # ---------------------------------------------------------- #
    #                回退：關鍵詞啟發式模擬分數
    # ---------------------------------------------------------- #
    def _fallback_scoring(self, attribute_id: str, user_content: str) -> int:
        attr = self.metadata.get(attribute_id, {})
        keywords = attr.get("attribute_meta_tags", [])
        hits = sum(1 for kw in keywords if kw.lower() in user_content.lower())
        base = 100
        if hits:
            score = base + 50 + min(hits * 20, 70) + random.randint(-10, 10)
        else:
            score = base + random.randint(-30, 30)
        return max(0, min(255, score))

    # ---------------------------------------------------------- #
    #       外部調用：產生新分數（Gemini → 回退）
    # ---------------------------------------------------------- #
    def _generate_attribute_score(
        self,
        attribute_id: str,
        user_content: str,
        user_state: Dict,
        image_url: Optional[str],
    ) -> int:
        prev = user_state.get(attribute_id, {}).get("stored_value_decimal", 128)
        try:
            return self._gemini_score(attribute_id, user_content, prev, image_url)
        except Exception as e:
            warnings.warn(f"Gemini 評分錯誤：{e}，使用回退")
            return self._fallback_scoring(attribute_id, user_content)

    # ---------------------------------------------------------- #
    #                  智能分數更新策略
    # ---------------------------------------------------------- #
    def _calculate_smart_score_update(
        self, new_raw: int, prev: int, update_count: int, attribute_id: str
    ) -> Tuple[int, str]:
        """智能分數更新策略"""
        if update_count == 0:
            return new_raw, "initial"

        # 平滑更新
        smooth = int(self.alpha * new_raw + (1 - self.alpha) * prev)
        
        # 根據更新次數調整策略
        if update_count < 3:
            strategy = "aggressive"
            smooth = int(0.7 * new_raw + 0.3 * prev)
        elif update_count < 10:
            strategy = "balanced"
            smooth = int(self.alpha * new_raw + (1 - self.alpha) * prev)
        else:
            strategy = "conservative"
            smooth = int(0.2 * new_raw + 0.8 * prev)

        return smooth, strategy

    def _calculate_time_decay(self, last_update: str, current_score: int) -> int:
        """時間衰減計算"""
        try:
            last_time = datetime.fromisoformat(last_update.replace('Z', '+00:00'))
            now = datetime.now(timezone.utc)
            days_diff = (now - last_time).days
            
            if days_diff > 30:
                decay_factor = math.exp(-self.lambda_decay * (days_diff - 30) / 30)
                decayed_score = int(current_score * decay_factor)
                return max(0, decayed_score)
        except Exception:
            pass
        return current_score

    def apply_time_decay(self, attribute_ids: List[str], user_state: Dict) -> Tuple[Dict, Dict]:
        """對指定維度應用時間衰減"""
        decay_log = {}
        now_iso = datetime.now(timezone.utc).isoformat()
        
        for aid in attribute_ids:
            if aid in user_state:
                attr_data = user_state[aid]
                prev_score = attr_data.get("stored_value_decimal", 128)
                last_update = attr_data.get("last_updated_timestamp", now_iso)
                
                decayed_score = self._calculate_time_decay(last_update, prev_score)
                if decayed_score != prev_score:
                    user_state[aid]["stored_value_decimal"] = decayed_score
                    user_state[aid]["last_updated_timestamp"] = now_iso
                    decay_log[aid] = {
                        "previous_score": prev_score,
                        "decayed_score": decayed_score,
                        "change": decayed_score - prev_score,
                    }
        
        return decay_log, user_state

    # ---------------------------------------------------------- #
    #        對外 API：更新匹配維度分數
    # ---------------------------------------------------------- #
    def update_matched_attributes(
        self,
        matched_attrs: List[Dict],
        user_content: str,
        user_state: Dict,
        image_url: Optional[str],
    ) -> Tuple[Dict, Dict]:
        """為匹配到的維度產生新分數並寫回狀態"""
        now_iso = datetime.now(timezone.utc).isoformat()
        update_log = {}

        for m in matched_attrs:
            aid, aname = m["attribute_id"], m["attribute_name"]
            prev = user_state.get(aid, {}).get("stored_value_decimal", 128)
            cnt = user_state.get(aid, {}).get("update_count", 0)

            new_raw = self._generate_attribute_score(aid, user_content, user_state, image_url)
            smooth, strat = self._calculate_smart_score_update(new_raw, prev, cnt, aid)

            user_state[aid] = {
                "stored_value_decimal": smooth,
                "last_updated_timestamp": now_iso,
                "update_count": cnt + 1,
            }
            update_log[aid] = {
                "attribute_name": aname,
                "previous_score": prev,
                "new_raw_score": new_raw,
                "smoothed_score": smooth,
                "change": smooth - prev,
                "strategy_used": strat,
                "update_count": cnt + 1,
            }
            print(f"✅ {aid}-{aname} : {prev} ➜ {smooth}  (Raw {new_raw}, {strat})")

        return update_log, user_state

    def process_attribute_updates(
        self,
        matched_attributes: List[Dict],
        user_content: str,
        image_url: Optional[str] = None,
    ) -> Dict:
        print(f"\n🚀 ULTU: 准備對 {len(matched_attributes)} 個維度打分 (含圖片: {bool(image_url)})")

        state = self._load_user_state()

        updates, state = self.update_matched_attributes(
            matched_attributes, user_content, state, image_url
        )
        matched_ids = [m["attribute_id"] for m in matched_attributes]
        decays, state = self.apply_time_decay(matched_ids, state)

        self._save_user_state(state)
        return {"updates": updates, "decays": decays, "timestamp": datetime.now(timezone.utc).isoformat()}


# --------------------  快速測試  -------------------- #
def test_ultu():
    ultu = ULTUProcessor()

    matched = [
        {"attribute_id": "0071", "attribute_name": "Social Achievements", "similarity_score": 0.85},
        {"attribute_id": "0048", "attribute_name": "Leadership Ability", "similarity_score": 0.72},
        {"attribute_id": "0008", "attribute_name": "Dietary Habits", "similarity_score": 0.45},
    ]
    text = "我今天帶領學弟妹完成了一篇論文，還順便去吃了有名的台式早餐慶祝。"

    res = ultu.process_attribute_updates(matched, text)
    print(f"\n更新完成，影響 {len(res['updates']) + len(res['decays'])} 個維度")
    return res


if __name__ == "__main__":
    test_ultu()