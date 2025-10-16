#!/usr/bin/env python3
from __future__ import annotations
import os, sys, json

# 確保可以匯入同目錄下的模組（msmm.py、ultu.py）
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.append(CURRENT_DIR)
from typing import List, Optional

from fastapi import FastAPI
from pydantic import BaseModel

from msmm import MSMMProcessor
from ultu import ULTUProcessor


class MSMMRequest(BaseModel):
    text: str
    image: Optional[str] = None  # URL 或本地路徑
    top_n: Optional[int] = None
    threshold: float = 0.6  # 以任一標籤對的最大相似度為判斷門檻


class MSMMResponse(BaseModel):
    meta_tags: List[str]
    matches: List[dict]


app = FastAPI(title="Twin3 MSMM API")
processor = MSMMProcessor()


@app.post("/msmm", response_model=MSMMResponse)
def msmm_endpoint(req: MSMMRequest):
    print("\n===== MSMM /msmm 請求 =====")
    print("text:", (req.text[:80] + "...") if len(req.text) > 80 else req.text)
    print("image:", req.image)
    # 先只抽 tags；允許空結果
    tags = processor.extract_meta_tags(req.text, req.image)
    if not tags:
        print("MSMM: 無 tags，直接回空")
        return MSMMResponse(meta_tags=[], matches=[])

    # 取得匹配（如未提供 top_n 則不截斷）
    ranked = processor.find_matching_attributes(req.text, req.image, top_n=req.top_n)
    # 轉成前端需要的格式
    matches = [
        {"attribute_id": aid, "similarity": float(score), "attribute_name": name}
        for (aid, score, name) in ranked
        if score >= req.threshold
    ]
    print("MSMM: tags=", tags)
    print("MSMM: matches=", matches)
    return MSMMResponse(meta_tags=tags, matches=matches)


@app.get("/metadata")
def get_metadata():
    with open("metadata/attribute_metadata.json", "r", encoding="utf-8") as f:
        return json.load(f)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))


# --------------------- ULTU API --------------------- #
class ULTUMatch(BaseModel):
    attribute_id: str
    attribute_name: str | None = None
    similarity_score: float | None = None


class ULTURequest(BaseModel):
    text: str
    image: Optional[str] = None
    matches: List[ULTUMatch]
    user_id: int = 1


@app.post("/ultu")
def ultu_endpoint(req: ULTURequest):
    print("\n===== ULTU /ultu 請求 =====")
    print("text:", (req.text[:80] + "...") if len(req.text) > 80 else req.text)
    print("user_id:", req.user_id)
    print("matches:", [m.dict() for m in req.matches])
    # 空匹配直接回空結果
    if not req.matches:
        print("ULTU: 無 matches，回空")
        return {"updates": {}, "decays": {}, "timestamp": None}

    state_file = f"state/user_{req.user_id}_matrix_state.json"
    ultu = ULTUProcessor(state_file=state_file)
    # 轉換為 ULTU 預期的結構（dict list）
    matched = [m.dict() for m in req.matches]
    res = ultu.process_attribute_updates(matched, req.text, req.image)
    print("ULTU: 回應 updates=", res.get("updates", {}))
    print("ULTU: 回應 decays=", res.get("decays", {}))
    return res


