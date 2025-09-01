import argparse
import json
import os

from hwam import (
    HWAMapper,
    TextEmbeddingModel,
    load_attribute_library,
    load_google_ads_taxonomy,
    save_json,
)


def main() -> None:
    parser = argparse.ArgumentParser(description="Run HWAM mapping")
    parser.add_argument(
        "--attributes",
        type=str,
        default=os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "metadata", "attribute_metadata.json")),
        help="Path to attribute_metadata.json",
    )
    parser.add_argument(
        "--google_ads",
        type=str,
        default=os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "metadata", "google_ads.json")),
        help="Path to google_ads.json",
    )
    parser.add_argument(
        "--model",
        type=str,
        default="sentence-transformers/all-MiniLM-L6-v2",
        help="Sentence-Transformers model name",
    )
    parser.add_argument("--alpha", type=float, default=0.5, help="bottom-up enhancement weight [0-1]")
    parser.add_argument("--beta", type=float, default=0.7, help="top-down constraint weight [0-1]")
    parser.add_argument("--top_k", type=int, default=10, help="top-K results per attribute")
    parser.add_argument(
        "--use_ads_full_path",
        action="store_true",
        help="use full taxonomy path for ads embedding",
    )
    parser.add_argument(
        "--meta_tag_weights",
        type=str,
        default=None,
        help="Optional JSON file mapping meta_tag -> weight (float)",
    )
    parser.add_argument(
        "--output",
        type=str,
        default=os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "state", "hwam_results.json")),
        help="Output JSON file path",
    )
    parser.add_argument(
        "--save_full_matrix",
        type=str,
        default=os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "state", "hwam_matrix.npz")),
        help="Optional path to save full calibrated mapping matrix (npz)",
    )
    parser.add_argument(
        "--evidence_driven_parents",
        action="store_true",
        help="Set non-leaf nodes' base scores to 0 (purely evidence-driven)",
    )
    parser.add_argument(
        "--boost_from_parents",
        action="store_true",
        help="Boost children scores from their parents' base scores (top-down)",
    )
    parser.add_argument(
        "--gamma",
        type=float,
        default=0.2,
        help="Coefficient for parent-to-child boost (0-1)",
    )
    parser.add_argument(
        "--leaf_only_output",
        action="store_true",
        help="Only output leaf nodes in Top-K results",
    )
    parser.add_argument(
        "--per_meta_similarity",
        action="store_true",
        help="Compute per-meta similarity then aggregate per attribute",
    )

    args = parser.parse_args()

    attr_lib = load_attribute_library(args.attributes)
    ads_tax = load_google_ads_taxonomy(args.google_ads)
    embedder = TextEmbeddingModel(model_name=args.model)

    mapper = HWAMapper(attribute_lib=attr_lib, ads_taxonomy=ads_tax, embedder=embedder)

    weights = None
    if args.meta_tag_weights:
        with open(args.meta_tag_weights, "r", encoding="utf-8") as f:
            weights = json.load(f)
    out = mapper.run(
        use_ads_full_path=args.use_ads_full_path,
        meta_tag_weights=weights,
        alpha=args.alpha,
        beta=args.beta,
        top_k=args.top_k,
        evidence_driven_parents=args.evidence_driven_parents,
        boost_from_parents=args.boost_from_parents,
        gamma=args.gamma,
        leaf_only_output=args.leaf_only_output,
        save_full_matrix_path=args.save_full_matrix,
        per_meta_similarity=args.per_meta_similarity,
    )

    save_json(args.output, out)
    print(f"Saved: {args.output}")


if __name__ == "__main__":
    main()


