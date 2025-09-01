"""
HWAM (Hierarchical Weighted Affinity Model)

功能概述：
- 讀取 Twin Matrix 屬性（attribute_metadata.json）與 Google Ads 標籤樹（google_ads.json）
- 使用 Sentence-Transformers 對文字向量化
- 以「Google 標籤名稱」對「Twin 屬性 meta_tags」的語意相似度為基礎，計算加權平均相似度
- 應用層級動態校準（自下而上增強、由上而下約束）
- 產出最終的映射矩陣（每個屬性對所有標籤的權重），並可抽取 Top-K 結果

注意：
- 預設 meta_tags 權重為等權。可透過參數自訂。
- 基礎相似度採用 cosine similarity，並線性映射至 [0, 1]。
"""

from __future__ import annotations

import json
import math
import os
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple

import numpy as np
from sentence_transformers import SentenceTransformer


# ===============
# 資料模型
# ===============


@dataclass
class GoogleTagNode:
    tag_id: str
    name: str
    parent_id: Optional[str]
    children: List[str] = field(default_factory=list)
    depth: int = 0


class GoogleAdsTaxonomy:
    """Google Ads 標籤樹建模與工具函式。"""

    def __init__(self, tags: List[Dict[str, Optional[str]]]):
        self.nodes: Dict[str, GoogleTagNode] = {}
        self.roots: List[str] = []

        for item in tags:
            node = GoogleTagNode(
                tag_id=item["id"],
                name=item["name"],
                parent_id=item.get("parent_id"),
            )
            self.nodes[node.tag_id] = node

        for node in self.nodes.values():
            if node.parent_id is None:
                self.roots.append(node.tag_id)
            else:
                parent = self.nodes.get(node.parent_id)
                if parent is not None:
                    parent.children.append(node.tag_id)

        # 計算 depth
        for root_id in self.roots:
            self._assign_depths(root_id, 0)

    def _assign_depths(self, node_id: str, depth: int) -> None:
        node = self.nodes[node_id]
        node.depth = depth
        for child_id in node.children:
            self._assign_depths(child_id, depth + 1)

    def list_nodes_by_depth(self, reverse: bool = False) -> List[str]:
        """依 depth 排序後回傳節點 id 列表。

        reverse=False: root -> leaves
        reverse=True: leaves -> root
        """
        return [
            node_id
            for node_id, _ in sorted(
                self.nodes.items(), key=lambda kv: kv[1].depth, reverse=reverse
            )
        ]

    def get_full_path(self, node_id: str) -> List[str]:
        """回傳從 root 到該節點的名稱路徑。"""
        path: List[str] = []
        cur = self.nodes[node_id]
        while cur is not None:
            path.append(cur.name)
            if cur.parent_id is None:
                break
            cur = self.nodes.get(cur.parent_id)  # type: ignore[assignment]
        path.reverse()
        return path


class TwinAttributeLibrary:
    """載入 Twin Matrix 屬性定義。"""

    def __init__(self, attributes: Dict[str, Dict]):
        self.attributes = attributes

    @classmethod
    def from_json_file(cls, path: str) -> "TwinAttributeLibrary":
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        if not isinstance(data, dict):
            raise ValueError("attribute_metadata.json 應為物件 (dict)")
        return cls(attributes=data)

    def iter_attributes(self) -> List[Tuple[str, Dict]]:
        return list(self.attributes.items())


# ===============
# 向量模型
# ===============


class TextEmbeddingModel:
    """Sentence-Transformers 包裝。"""

    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        self.model = SentenceTransformer(model_name)

    def encode(self, texts: List[str], normalize: bool = True, batch_size: int = 64) -> np.ndarray:
        vectors = self.model.encode(
            texts, batch_size=batch_size, convert_to_numpy=True, normalize_embeddings=normalize
        )
        return vectors.astype(np.float32)


# ===============
# HWAM 核心
# ===============


def cosine_to_unit_interval(similarities: np.ndarray) -> np.ndarray:
    """將 cosine 相似度 [-1, 1] 線性映射到 [0, 1]。"""
    return (similarities + 1.0) / 2.0


class HWAMapper:
    """Hierarchical Weighted Affinity Model 主引擎。"""

    def __init__(
        self,
        attribute_lib: TwinAttributeLibrary,
        ads_taxonomy: GoogleAdsTaxonomy,
        embedder: TextEmbeddingModel,
    ):
        self.attr_lib = attribute_lib
        self.taxonomy = ads_taxonomy
        self.embedder = embedder

    def _prepare_embeddings(
        self,
        use_ads_full_path: bool = False,
        meta_tag_weights: Optional[Dict[str, float]] = None,
    ) -> Tuple[List[str], np.ndarray, List[str], np.ndarray, List[List[str]]]:
        """
        準備：
        - Google 標籤文字（name 或 full_path string）與其向量
        - Twin 屬性以 meta_tags 聚合後的向量（加權平均）

        回傳：
        (ads_ids, ads_vecs, attr_ids, attr_meta_agg_vecs, ads_paths)
        """

        # 準備 Google 標籤文本
        ads_ids = list(self.taxonomy.nodes.keys())
        ads_texts: List[str] = []
        ads_paths: List[List[str]] = []
        for tag_id in ads_ids:
            if use_ads_full_path:
                path = self.taxonomy.get_full_path(tag_id)
                ads_paths.append(path)
                ads_texts.append(" > ".join(path))
            else:
                node = self.taxonomy.nodes[tag_id]
                ads_paths.append(self.taxonomy.get_full_path(tag_id))
                ads_texts.append(node.name)

        ads_vecs = self.embedder.encode(ads_texts, normalize=True)

        # 準備屬性 meta_tags 聚合向量
        attr_items = self.attr_lib.iter_attributes()
        attr_ids: List[str] = [aid for aid, _ in attr_items]

        # 將所有 meta_tags 扁平化以便批次嵌入
        meta_tag_texts: List[str] = []
        meta_tag_index_map: List[List[int]] = []  # 每個屬性對應 meta_tag_texts 的索引列表
        for _, adef in attr_items:
            tags: List[str] = adef.get("attribute_meta_tags", []) or []
            if not isinstance(tags, list):
                tags = []
            idxs: List[int] = []
            for t in tags:
                idxs.append(len(meta_tag_texts))
                meta_tag_texts.append(str(t))
            meta_tag_index_map.append(idxs)

        if len(meta_tag_texts) == 0:
            raise ValueError("attribute_meta_tags 為空，無法進行語意比對。")

        meta_tag_vecs = self.embedder.encode(meta_tag_texts, normalize=True)

        # 聚合成每個屬性一個向量：加權平均 (sum w_i * v_i)
        attr_meta_agg_vecs: List[np.ndarray] = []
        for idxs in meta_tag_index_map:
            if not idxs:
                # 沒有 meta tags 就給一個零向量（避免影響）
                attr_meta_agg_vecs.append(np.zeros((ads_vecs.shape[1],), dtype=np.float32))
                continue
            weights = []
            for i in idxs:
                token = meta_tag_texts[i]
                w = 1.0
                if meta_tag_weights and token in meta_tag_weights:
                    w = float(meta_tag_weights[token])
                weights.append(w)
            w_arr = np.asarray(weights, dtype=np.float32)
            w_arr = w_arr / (w_arr.sum() if w_arr.sum() > 0 else 1.0)
            vec_stack = meta_tag_vecs[np.asarray(idxs, dtype=np.int64)]
            agg_vec = (w_arr[:, None] * vec_stack).sum(axis=0)
            # 注意：聚合向量不再正規化，保持可線性組合出加權平均的 cosine 值
            attr_meta_agg_vecs.append(agg_vec.astype(np.float32))

        attr_meta_agg_mat = np.vstack(attr_meta_agg_vecs)  # [A, D]

        return ads_ids, ads_vecs, attr_ids, attr_meta_agg_mat, ads_paths

    def compute_base_affinity(
        self,
        use_ads_full_path: bool = False,
        meta_tag_weights: Optional[Dict[str, float]] = None,
    ) -> Tuple[List[str], List[str], np.ndarray, List[List[str]]]:
        """計算基礎關聯度矩陣（A x G），數值範圍 [0, 1]。

        基礎相似度：cosine(ads_name, meta_tags 加權平均)。
        """
        ads_ids, ads_vecs, attr_ids, attr_meta_agg_mat, ads_paths = self._prepare_embeddings(
            use_ads_full_path=use_ads_full_path, meta_tag_weights=meta_tag_weights
        )

        # base_cos[i_attr, j_ads] = dot(ads_vec[j], attr_agg[i])
        # ads_vec 已單位化、attr_agg 為加權和 -> dot 即為加權平均 cosine
        base_cos = np.matmul(attr_meta_agg_mat, ads_vecs.T)  # [A, G]
        base_affinity = cosine_to_unit_interval(base_cos)  # 映射到 [0, 1]
        base_affinity = np.clip(base_affinity, 0.0, 1.0)
        return attr_ids, ads_ids, base_affinity, ads_paths

    def compute_base_affinity_per_meta(
        self,
        use_ads_full_path: bool = False,
        meta_tag_weights: Optional[Dict[str, float]] = None,
    ) -> Tuple[List[str], List[str], np.ndarray, List[List[str]]]:
        """以『每個 meta tag 個別與廣告標籤計算相似度，最後依屬性做加權聚合』的方式，
        計算基礎關聯度矩陣（A x G），數值範圍 [0, 1]。

        與 compute_base_affinity 在理論上（於向量單位化與線性加總條件下）等價，
        但本函式保留顯式的 per-meta 聚合計算流程以符合分析偏好。
        """

        # 準備 Google 標籤文本與向量
        ads_ids = list(self.taxonomy.nodes.keys())
        ads_texts: List[str] = []
        ads_paths: List[List[str]] = []
        for tag_id in ads_ids:
            if use_ads_full_path:
                path = self.taxonomy.get_full_path(tag_id)
                ads_paths.append(path)
                ads_texts.append(" > ".join(path))
            else:
                node = self.taxonomy.nodes[tag_id]
                ads_paths.append(self.taxonomy.get_full_path(tag_id))
                ads_texts.append(node.name)

        ads_vecs = self.embedder.encode(ads_texts, normalize=True)  # [G, D]

        # 準備屬性與其 meta tags
        attr_items = self.attr_lib.iter_attributes()
        attr_ids: List[str] = [aid for aid, _ in attr_items]

        meta_tag_texts: List[str] = []
        meta_tag_index_map: List[List[int]] = []
        for _, adef in attr_items:
            tags: List[str] = adef.get("attribute_meta_tags", []) or []
            if not isinstance(tags, list):
                tags = []
            idxs: List[int] = []
            for t in tags:
                idxs.append(len(meta_tag_texts))
                meta_tag_texts.append(str(t))
            meta_tag_index_map.append(idxs)

        if len(meta_tag_texts) == 0:
            raise ValueError("attribute_meta_tags 為空，無法進行語意比對。")

        meta_tag_vecs = self.embedder.encode(meta_tag_texts, normalize=True)  # [T, D]

        # 先算每個 meta tag 對每個廣告標籤的 cosine（因向量單位化，內積即 cosine）
        # sim_meta_ads: [T, G]
        sim_meta_ads = np.matmul(meta_tag_vecs, ads_vecs.T)

        # 對每個屬性，依其 meta tags 做加權平均 -> [G]
        A = len(attr_ids)
        G = len(ads_ids)
        base_cos = np.zeros((A, G), dtype=np.float32)

        for ai, idxs in enumerate(meta_tag_index_map):
            if not idxs:
                continue
            weights: List[float] = []
            for mi in idxs:
                token = meta_tag_texts[mi]
                w = 1.0
                if meta_tag_weights and token in meta_tag_weights:
                    w = float(meta_tag_weights[token])
                weights.append(w)
            w_arr = np.asarray(weights, dtype=np.float32)
            w_arr = w_arr / (w_arr.sum() if w_arr.sum() > 0 else 1.0)
            # 聚合此屬性的 meta-tag 相似度
            base_cos[ai] = np.sum((w_arr[:, None] * sim_meta_ads[np.asarray(idxs, dtype=np.int64)]), axis=0)

        base_affinity = cosine_to_unit_interval(base_cos)
        np.clip(base_affinity, 0.0, 1.0, out=base_affinity)
        return attr_ids, ads_ids, base_affinity, ads_paths

    def hierarchical_dynamic_calibration(
        self,
        base_affinity: np.ndarray,
        alpha: float = 0.5,
        beta: float = 0.7,
    ) -> np.ndarray:
        """層級動態校準。

        - Bottom-up 增強（參數 alpha）：
          s_tmp[n] = (1-alpha) * s_base[n] + alpha * max_child(s_tmp)

        - Top-down 約束（參數 beta）：
          s_final[child] = s_tmp[child] * (beta * s_final[parent] + (1 - beta))

        參數：
        - base_affinity: [A, G]
        - alpha: 子節點對父節點的增強權重 (0~1)
        - beta: 父節點對子節點的約束強度 (0~1)
        回傳：
        - calibrated: [A, G]
        """

        attr_count, tag_count = base_affinity.shape
        calibrated = np.empty_like(base_affinity, dtype=np.float32)

        # 預先建立一些結構以加速查詢
        children_map: Dict[int, List[int]] = {}
        parent_idx: Dict[int, Optional[int]] = {}
        index_by_order = {tag_id: idx for idx, tag_id in enumerate(self.taxonomy.nodes.keys())}
        ads_ids_in_order = list(self.taxonomy.nodes.keys())

        for j, tag_id in enumerate(ads_ids_in_order):
            node = self.taxonomy.nodes[tag_id]
            children_map[j] = [index_by_order[cid] for cid in node.children]
            parent_idx[j] = index_by_order[node.parent_id] if node.parent_id else None

        # 深度順序
        order_bu = [index_by_order[i] for i in self.taxonomy.list_nodes_by_depth(reverse=True)]  # leaves->root
        order_td = [index_by_order[i] for i in self.taxonomy.list_nodes_by_depth(reverse=False)]  # root->leaves

        # 針對每個屬性個別做層級校準，避免跨屬性的干擾
        for ai in range(attr_count):
            base = base_affinity[ai]  # [G]

            # Bottom-up
            s_tmp = base.copy()
            for j in order_bu:
                childs = children_map[j]
                if not childs:
                    continue
                max_child = float(np.max(s_tmp[childs]))
                s_tmp[j] = (1.0 - alpha) * s_tmp[j] + alpha * max_child

            # Top-down
            s_final = s_tmp.copy()
            for j in order_td:
                p = parent_idx[j]
                if p is None:
                    continue
                gate = beta * s_final[p] + (1.0 - beta)
                s_final[j] = s_final[j] * gate

            calibrated[ai] = np.clip(s_final, 0.0, 1.0)

        return calibrated

    def apply_topdown_boost(
        self,
        base_affinity: np.ndarray,
        gamma: float = 0.2,
    ) -> np.ndarray:
        """Top-down 父節點加分：以父節點基礎分數對子節點加分。

        boosted[:, child] += gamma * base[:, parent]

        - base_affinity: [A, G]
        - gamma: 父到子的加分係數 (0~1)
        回傳：
        - boosted: [A, G]
        """
        attr_count, tag_count = base_affinity.shape
        boosted = base_affinity.copy()

        # 建立索引映射與階層次序（root->leaves）
        index_by_order = {tag_id: idx for idx, tag_id in enumerate(self.taxonomy.nodes.keys())}
        order_td = [index_by_order[i] for i in self.taxonomy.list_nodes_by_depth(reverse=False)]

        children_map: Dict[int, List[int]] = {}
        for j, tag_id in enumerate(self.taxonomy.nodes.keys()):
            children_map[j] = [index_by_order[cid] for cid in self.taxonomy.nodes[tag_id].children]

        # 以父節點的 base 分數對子節點加分（不連鎖使用子節點的加分，避免爆衝）
        for j in order_td:
            childs = children_map[j]
            if not childs:
                continue
            parent_scores = base_affinity[:, j][:, None]  # [A, 1]
            if len(childs) == 1:
                boosted[:, childs[0]] = boosted[:, childs[0]] + gamma * parent_scores[:, 0]
            else:
                boosted[:, np.asarray(childs, dtype=np.int64)] = (
                    boosted[:, np.asarray(childs, dtype=np.int64)] + gamma * parent_scores
                )

        np.clip(boosted, 0.0, 1.0, out=boosted)
        return boosted

    def compute_topk(
        self,
        calibrated_affinity: np.ndarray,
        ads_ids: List[str],
        ads_paths: List[List[str]],
        top_k: int = 10,
        leaf_only: bool = False,
    ) -> List[List[Tuple[str, str, float]]]:
        """對每個屬性取 Top-K 標籤。

        回傳每個屬性對應的 (tag_id, path_str, score)。
        """
        # 若只輸出葉節點，先建立可用索引
        candidate_indices: Optional[np.ndarray] = None
        if leaf_only:
            leaves: List[int] = []
            id_to_idx = {tid: j for j, tid in enumerate(ads_ids)}
            for j, tid in enumerate(ads_ids):
                if not self.taxonomy.nodes[tid].children:
                    leaves.append(j)
            if leaves:
                candidate_indices = np.asarray(leaves, dtype=np.int64)

        topk_all: List[List[Tuple[str, str, float]]] = []
        for scores in calibrated_affinity:
            if candidate_indices is not None:
                cand_scores = scores[candidate_indices]
                k = min(top_k, len(cand_scores))
                idxs_local = np.argpartition(-cand_scores, kth=k - 1)[:k]
                idxs_local = idxs_local[np.argsort(-cand_scores[idxs_local])]
                idxs = candidate_indices[idxs_local]
            else:
                k = min(top_k, len(scores))
                idxs = np.argpartition(-scores, kth=k - 1)[:k]
                idxs = idxs[np.argsort(-scores[idxs])]
            items: List[Tuple[str, str, float]] = []
            for j in idxs:
                items.append((ads_ids[j], " > ".join(ads_paths[j]), float(scores[j])))
            topk_all.append(items)
        return topk_all

    def run(
        self,
        use_ads_full_path: bool = False,
        meta_tag_weights: Optional[Dict[str, float]] = None,
        alpha: float = 0.5,
        beta: float = 0.7,
        top_k: int = 10,
        evidence_driven_parents: bool = False,
        boost_from_parents: bool = False,
        gamma: float = 0.2,
        leaf_only_output: bool = False,
        save_full_matrix_path: Optional[str] = None,
        per_meta_similarity: bool = False,
    ) -> Dict[str, Dict[str, List[Dict[str, float]]]]:
        """整體流程封裝，回傳可序列化結果：
        {
          "params": {...},
          "results": {
             attr_id: [{"tag_id":..., "path":..., "score":...}, ...]
          }
        }
        """
        if per_meta_similarity:
            attr_ids, ads_ids, base_affinity, ads_paths = self.compute_base_affinity_per_meta(
                use_ads_full_path=use_ads_full_path, meta_tag_weights=meta_tag_weights
            )
        else:
            attr_ids, ads_ids, base_affinity, ads_paths = self.compute_base_affinity(
                use_ads_full_path=use_ads_full_path, meta_tag_weights=meta_tag_weights
            )

        # 策略三：純證據父節點（非葉節點在基礎分數階段置零）
        # 若啟用 boost_from_parents，則不置零，避免父分數信息消失
        if evidence_driven_parents and not boost_from_parents:
            non_leaf_indices: List[int] = []
            for j, tid in enumerate(ads_ids):
                if self.taxonomy.nodes[tid].children:
                    non_leaf_indices.append(j)
            if non_leaf_indices:
                base_affinity[:, np.asarray(non_leaf_indices, dtype=np.int64)] = 0.0

        # 若開啟父節點向子節點加分，則使用 top-down boost；否則使用原層級校準
        if boost_from_parents:
            calibrated = self.apply_topdown_boost(base_affinity=base_affinity, gamma=gamma)
        else:
            calibrated = self.hierarchical_dynamic_calibration(
                base_affinity=base_affinity, alpha=alpha, beta=beta
            )

        # 儲存完整矩陣（供 UI 做 p^T · M + mask 計算）
        if save_full_matrix_path:
            save_full_matrix_npz(save_full_matrix_path, calibrated, attr_ids, ads_ids)

        topk = self.compute_topk(
            calibrated_affinity=calibrated,
            ads_ids=ads_ids,
            ads_paths=ads_paths,
            top_k=top_k,
            leaf_only=leaf_only_output,
        )

        results: Dict[str, List[Dict[str, float]]] = {}
        for ai, attr_id in enumerate(attr_ids):
            items = [
                {"tag_id": tid, "path": path, "score": round(score, 6)}
                for tid, path, score in topk[ai]
            ]
            results[attr_id] = items

        return {
            "params": {
                "use_ads_full_path": use_ads_full_path,
                "alpha": alpha,
                "beta": beta,
                "top_k": top_k,
                "model": getattr(self.embedder.model, "name_or_path", "unknown"),
                "evidence_driven_parents": evidence_driven_parents,
                "boost_from_parents": boost_from_parents,
                "gamma": gamma,
                "leaf_only_output": leaf_only_output,
                "save_full_matrix_path": save_full_matrix_path or "",
                "per_meta_similarity": per_meta_similarity,
            },
            "results": results,
        }


def load_attribute_library(path: str) -> TwinAttributeLibrary:
    return TwinAttributeLibrary.from_json_file(path)


def load_google_ads_taxonomy(path: str) -> GoogleAdsTaxonomy:
    with open(path, "r", encoding="utf-8") as f:
        tags = json.load(f)
    if not isinstance(tags, list):
        raise ValueError("google_ads.json 應為陣列 (list)")
    return GoogleAdsTaxonomy(tags=tags)


def save_json(path: str, data: Dict) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def save_full_matrix_npz(path: str, matrix: np.ndarray, attr_ids: List[str], ads_ids: List[str]) -> None:
    """儲存完整映射矩陣與索引（壓縮 npz）。

    - matrix: [A, G]
    - attr_ids: 長度 A 的屬性 ID 順序
    - ads_ids: 長度 G 的標籤 ID 順序
    """
    os.makedirs(os.path.dirname(path), exist_ok=True)
    np.savez_compressed(
        path,
        matrix=matrix.astype(np.float32),
        attr_ids=np.array(attr_ids, dtype=object),
        ads_ids=np.array(ads_ids, dtype=object),
    )


__all__ = [
    "GoogleAdsTaxonomy",
    "TwinAttributeLibrary",
    "TextEmbeddingModel",
    "HWAMapper",
    "load_attribute_library",
    "load_google_ads_taxonomy",
    "save_json",
    "save_full_matrix_npz",
]


