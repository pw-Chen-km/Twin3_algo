import json
import os
from typing import Dict, List, Tuple

import numpy as np
import pandas as pd
import streamlit as st


ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
META_ATTR_PATH = os.path.join(ROOT_DIR, "metadata", "attribute_metadata.json")
GOOGLE_TAGS_PATH = os.path.join(ROOT_DIR, "metadata", "google_ads.json")
HWAM_RESULTS_PATH = os.path.join(ROOT_DIR, "state", "hwam_results.json")
HWAM_MATRIX_PATH = os.path.join(ROOT_DIR, "state", "hwam_matrix.npz")
CAMPAIGNS_PATH = os.path.join(os.path.dirname(__file__), "campaigns.json")


def _do_refresh() -> None:
    # 清除所有 cache，重載資料並重繪畫面
    try:
        st.cache_data.clear()
    except Exception:
        pass
    # 清掉可能殘留的選擇狀態，避免不一致
    for k in ["selected_campaign_key", "selected_custom_tags"]:
        if k in st.session_state:
            st.session_state.pop(k)
    st.rerun()


@st.cache_data(show_spinner=False)
def load_attribute_metadata() -> Dict[str, Dict]:
    with open(META_ATTR_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


@st.cache_data(show_spinner=False)
def load_google_tags() -> List[Dict]:
    with open(GOOGLE_TAGS_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


@st.cache_data(show_spinner=False)
def load_hwam_results(path: str) -> Dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


@st.cache_data(show_spinner=False)
def load_hwam_matrix(path: str) -> Tuple[np.ndarray, List[str], List[str]]:
    data = np.load(path, allow_pickle=True)
    return data["matrix"], list(data["attr_ids"].tolist()), list(data["ads_ids"].tolist())


@st.cache_data(show_spinner=False)
def load_campaigns() -> Dict[str, Dict]:
    with open(CAMPAIGNS_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def get_attr_name_map(attr_meta: Dict[str, Dict]) -> Dict[str, str]:
    name_map = {}
    for aid, info in attr_meta.items():
        name_map[aid] = info.get("attribute_name", aid)
    return name_map


def build_taxonomy_helpers(tags: List[Dict]) -> Tuple[Dict[str, Dict], Dict[str, List[str]], Dict[str, str], List[str]]:
    # nodes[id] = {id, name, parent_id}
    nodes = {t["id"]: t for t in tags}
    children: Dict[str, List[str]] = {t["id"]: [] for t in tags}
    for t in tags:
        pid = t.get("parent_id")
        if pid is not None and pid in children:
            children[pid].append(t["id"])

    # full path name map
    def full_path_name(tid: str) -> str:
        path = []
        cur = nodes.get(tid)
        while cur is not None:
            path.append(cur["name"])
            pid = cur.get("parent_id")
            cur = nodes.get(pid) if pid else None
        return " > ".join(reversed(path))

    id_to_pathname: Dict[str, str] = {tid: full_path_name(tid) for tid in nodes.keys()}
    leaves = [tid for tid, ch in children.items() if len(ch) == 0]
    return nodes, children, id_to_pathname, leaves


def build_default_persona(attr_ids: List[str], base: int = 128) -> Dict[str, int]:
    return {aid: base for aid in attr_ids}


def persona_vector_from_sliders(
    default_vector: Dict[str, int],
    selected_ids: List[str],
    slider_values: Dict[str, int],
) -> Dict[str, int]:
    v = default_vector.copy()
    for aid in selected_ids:
        v[aid] = slider_values[aid]
    return v


def compute_attribute_scores_for_campaign(
    hwam_results: Dict,
    campaign_tag_ids: List[str],
) -> Dict[str, float]:
    # results: { attr_id: [ {tag_id, path, score}, ... ] }
    results = hwam_results.get("results", {})
    # 對每個屬性，平均取該屬性對於 campaign_tag_ids 的分數（若不存在則當 0）
    attr_to_avg: Dict[str, float] = {}
    for aid, tag_items in results.items():
        tag_score_map = {item["tag_id"]: float(item["score"]) for item in tag_items}
        scores = [tag_score_map.get(tid, 0.0) for tid in campaign_tag_ids]
        if len(scores) == 0:
            continue
        attr_to_avg[aid] = float(np.mean(scores))
    return attr_to_avg


def compute_persona_campaign_fit(
    hwam_results: Dict,
    persona_vector_0_255: Dict[str, int],
    campaign_tag_ids: List[str],
    full_matrix: Tuple[np.ndarray, List[str], List[str]] | None,
) -> float:
    # 僅允許矩陣模式：t = (p^T · M)[mask]
    if full_matrix is None:
        return 0.0
    M, attr_ids_order, tag_ids_order = full_matrix
    p = np.array([persona_vector_0_255.get(aid, 128) / 255.0 for aid in attr_ids_order], dtype=np.float32)
    denom = float(np.sum(p)) if float(np.sum(p)) > 0 else 1.0
    t = np.matmul(p, M) / denom  # [G]
    # mask 取出 campaign tags 的位置
    tag_index = {tid: i for i, tid in enumerate(tag_ids_order)}
    vals = [float(t[tag_index[tid]]) for tid in campaign_tag_ids if tid in tag_index]
    return float(np.mean(vals)) if vals else 0.0


def main() -> None:
    st.set_page_config(page_title="Twin3 HWAM Demo", layout="wide")
    st.title("Twin Matrix x Google Ads — HWAM Demo UI")

    # 載入資料
    attr_meta = load_attribute_metadata()
    name_map = get_attr_name_map(attr_meta)
    google_tags = load_google_tags()

    # 設定與載入結果/矩陣
    st.sidebar.markdown("**設定**")
    results_path = st.sidebar.text_input("HWAM 結果檔路徑", value=HWAM_RESULTS_PATH)
    matrix_path = st.sidebar.text_input("HWAM 矩陣路徑 (npz)", value=HWAM_MATRIX_PATH)
    # 原本使用 on_click callback，st.rerun() 會被視為 no-op；改為直接在主流程執行
    if st.sidebar.button("更新"):
        try:
            st.cache_data.clear()
        except Exception:
            pass
        for k in ["selected_campaign_key", "selected_custom_tags"]:
            if k in st.session_state:
                st.session_state.pop(k)
        st.rerun()

    hwam_results = load_hwam_results(results_path)
    matrix_ok = os.path.exists(matrix_path)
    if matrix_ok:
        try:
            M, A_ids, G_ids = load_hwam_matrix(matrix_path)
        except Exception:
            matrix_ok = False
    if matrix_ok:
        st.sidebar.success("模式：矩陣乘法 (p^T · M)")
    else:
        st.sidebar.error("未載入矩陣檔（將無法計算匹配度）。請產出並指定 hwam_matrix.npz 後按『更新』。")

    campaigns = load_campaigns()

    attr_ids_all = list(attr_meta.keys())
    default_persona = build_default_persona(attr_ids_all, base=128)

    # Google Ads taxonomy 輔助
    nodes, children, id_to_pathname, leaves = build_taxonomy_helpers(google_tags)

    # 代表性屬性（可依需求調整）
    # 生理
    physical_ids = [
        "0010", "0012", "0016", "0019", "0021", "0033", "0034", "0035",
    ]
    # 社交
    social_ids = [
        "0040", "0041", "0047", "004C", "004D", "0054", "0060", "006E",
    ]
    # 數位
    digital_ids = [
        "0081", "0088", "0093", "0094", "0096", "00B6", "00BC", "00BF",
    ]
    # 其他/精神（以社交情感近似）
    spirit_ids = [
        "0067", "0069", "006C", "006D", "0070", "0071",
    ]

    tabs = st.tabs(["步驟一：建立 Persona", "步驟二：選擇廣告活動", "步驟三：受眾洞察", "步驟四：匹配度"])

    # 步驟一：Persona 建立
    with tabs[0]:
        st.subheader("建立您的目標客群 Persona")
        persona_name = st.text_input("角色名稱", value="高潛力科技新貴")

        st.caption("請調整以下滑桿；未顯示之屬性預設為 128。")
        col_p1, col_p2 = st.columns(2)
        col_s1, col_s2 = st.columns(2)

        slider_vals: Dict[str, int] = {}

        with col_p1:
            st.markdown("**生理 (代表性屬性)**")
            for aid in physical_ids[: len(physical_ids)//2]:
                slider_vals[aid] = st.slider(name_map.get(aid, aid), 0, 255, 160)
        with col_p2:
            for aid in physical_ids[len(physical_ids)//2 : ]:
                slider_vals[aid] = st.slider(name_map.get(aid, aid), 0, 255, 160)

        with col_s1:
            st.markdown("**社交 (代表性屬性)**")
            for aid in social_ids[: len(social_ids)//2]:
                slider_vals[aid] = st.slider(name_map.get(aid, aid), 0, 255, 128)
        with col_s2:
            for aid in social_ids[len(social_ids)//2 : ]:
                slider_vals[aid] = st.slider(name_map.get(aid, aid), 0, 255, 128)

        col_d1, col_d2 = st.columns(2)
        with col_d1:
            st.markdown("**數位 (代表性屬性)**")
            for aid in digital_ids[: len(digital_ids)//2]:
                slider_vals[aid] = st.slider(name_map.get(aid, aid), 0, 255, 192)
        with col_d2:
            for aid in digital_ids[len(digital_ids)//2 : ]:
                slider_vals[aid] = st.slider(name_map.get(aid, aid), 0, 255, 192)

        st.markdown("**精神/情感 (代表性屬性)**")
        col_t1, col_t2 = st.columns(2)
        with col_t1:
            for aid in spirit_ids[: len(spirit_ids)//2]:
                slider_vals[aid] = st.slider(name_map.get(aid, aid), 0, 255, 140)
        with col_t2:
            for aid in spirit_ids[len(spirit_ids)//2 : ]:
                slider_vals[aid] = st.slider(name_map.get(aid, aid), 0, 255, 140)

        selected_ids = list(slider_vals.keys())
        # 進階：自訂新增屬性
        with st.expander("進階：新增更多屬性調整"):
            all_options = [f"{name_map.get(aid, aid)} ({aid})" for aid in attr_ids_all]
            picks = st.multiselect("搜尋並選擇屬性以加入滑桿", options=all_options)
            pick_ids = [s.split("(")[-1].rstrip(")") for s in picks]
            for aid in pick_ids:
                if aid not in slider_vals:
                    slider_vals[aid] = st.slider(name_map.get(aid, aid), 0, 255, 128, key=f"dyn_{aid}")
                    selected_ids.append(aid)
        persona_v = persona_vector_from_sliders(default_persona, selected_ids, slider_vals)

        st.success(f"Persona 已建立：{persona_name}")

    # 步驟二：選擇廣告活動
    with tabs[1]:
        st.subheader("選擇廣告活動場景")
        mode = st.radio("選擇模式", ["預設場景", "自訂標籤"], horizontal=True)
        selected_campaign_key = st.session_state.get("selected_campaign_key", None)
        selected_custom_tags: List[str] = st.session_state.get("selected_custom_tags", [])

        if mode == "預設場景":
            cols = st.columns(len(campaigns))
            for i, (ckey, cfg) in enumerate(campaigns.items()):
                with cols[i]:
                    st.markdown(f"### {cfg.get('advertiser', ckey)}")
                    st.markdown(f"目標：{cfg.get('goal', '')}")
                    st.caption("預設標籤：" + ", ".join(cfg.get("tags", [])))
                    if st.button("選擇", key=f"pick_{ckey}"):
                        st.session_state["selected_campaign_key"] = ckey
                        st.session_state.pop("selected_custom_tags", None)
                        selected_campaign_key = ckey

            if not selected_campaign_key:
                st.info("請選擇一個廣告活動或切換到『自訂標籤』模式。")
            else:
                st.success(f"已選擇：{selected_campaign_key} — {campaigns[selected_campaign_key].get('advertiser')}")
        else:
            # 自訂：從 taxonomy 選取葉節點（可搜尋）
            leaf_options = [f"{id_to_pathname[tid]} ({tid})" for tid in leaves]
            picks = st.multiselect("選擇葉節點標籤", options=leaf_options)
            selected_custom_tags = [s.split("(")[-1].rstrip(")") for s in picks]
            st.session_state["selected_custom_tags"] = selected_custom_tags
            if not selected_custom_tags:
                st.info("請至少選擇一個標籤。")
            else:
                st.success("已選擇標籤數量：{}".format(len(selected_custom_tags)))

    # 步驟三：受眾洞察（反向）
    with tabs[2]:
        st.subheader("受眾 DNA 洞察（依活動標籤反推最相關的 DNA → meta tags）")
        ckey = st.session_state.get("selected_campaign_key")
        custom = st.session_state.get("selected_custom_tags", [])
        if not ckey and not custom:
            st.info("請先於『選擇廣告活動』頁籤選擇活動或自訂標籤。")
        else:
            tag_ids = campaigns[ckey]["tag_ids"] if ckey else custom
            attr_scores = compute_attribute_scores_for_campaign(hwam_results, tag_ids)
            if not attr_scores:
                st.warning("目前無可用映射資料，請確認 HWAM 結果檔。")
            else:
                topN = sorted(attr_scores.items(), key=lambda kv: kv[1], reverse=True)[:5]
                rows = []
                for aid, s in topN:
                    meta_tags = attr_meta.get(aid, {}).get("attribute_meta_tags", []) or []
                    for mt in meta_tags:
                        rows.append({
                            "Attribute": name_map.get(aid, aid),
                            "Meta Tag": mt,
                            "Score": round(float(s) * 100.0, 1),  # 0-100 顯示
                        })
                if rows:
                    df = pd.DataFrame(rows)
                    st.table(df)
                else:
                    st.info("所選 DNA 無 meta tags 可顯示。")

    # 步驟四：Persona 與活動匹配度
    with tabs[3]:
        st.subheader("Persona 與活動匹配度")
        ckey = st.session_state.get("selected_campaign_key")
        custom = st.session_state.get("selected_custom_tags", [])
        if not ckey and not custom:
            st.info("請先於『選擇廣告活動』頁籤選擇活動或自訂標籤。")
        else:
            if ckey:
                tag_ids = campaigns[ckey]["tag_ids"]
                label = f"{persona_name} 與 {campaigns[ckey]['advertiser']} 的匹配度"
            else:
                tag_ids = custom
                label = f"{persona_name} 與 自訂標籤 的匹配度"
            full_matrix = (M, A_ids, G_ids) if matrix_ok else None
            if not matrix_ok:
                st.warning("尚未載入映射矩陣，無法計算匹配度。請在側邊欄設定 hwam_matrix.npz 並更新。")
            else:
                fit = compute_persona_campaign_fit(hwam_results, persona_v, tag_ids, full_matrix)
                st.metric(label=label, value=f"{int(round(fit*100))}%")

            st.caption("此結果僅以 Persona 向量與完整映射矩陣做矩陣乘法計算；未載入矩陣時不計算。")


if __name__ == "__main__":
    main()


