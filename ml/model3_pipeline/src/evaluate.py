"""Evaluate Model 3 recommender quality on the mastery table."""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from recommender import (
    MASTERY_THRESHOLD,
    MIN_ATTEMPTS,
    OUTPUTS_DIR,
    compute_skill_difficulty,
    load_mastery_table,
    recommend_for_student,
)

TOP_N = 5


def evaluate(top_n: int = TOP_N) -> dict:
    df = load_mastery_table()
    skill_stats = compute_skill_difficulty(df)
    students = df["student_id"].unique()

    precision_at_k, recall_at_k, top1_hits = [], [], []
    students_with_weak = students_with_recs = 0

    for sid in students:
        student_df = df[(df["student_id"] == sid) & (df["attempts"] >= MIN_ATTEMPTS)]
        weak = set(student_df[student_df["mastery_rate"] < MASTERY_THRESHOLD]["kc"])
        if not weak:
            continue

        students_with_weak += 1
        recs = recommend_for_student(sid, df, skill_stats, top_n=top_n)
        if not recs:
            continue

        students_with_recs += 1
        rec_skills = [r["kc"] for r in recs]
        hit = len(set(rec_skills) & weak)
        precision_at_k.append(hit / len(rec_skills))
        recall_at_k.append(hit / len(weak))

        bottom_k = set(student_df.nsmallest(min(5, len(student_df)), "mastery_rate")["kc"])
        top1_hits.append(1 if rec_skills[0] in bottom_k else 0)

    return {
        "students_with_weak": students_with_weak,
        "students_with_recs": students_with_recs,
        "coverage_pct": 100 * students_with_recs / students_with_weak,
        f"precision_at_{top_n}": 100 * sum(precision_at_k) / len(precision_at_k),
        f"recall_at_{top_n}": 100 * sum(recall_at_k) / len(recall_at_k),
        "top1_ranking_accuracy": 100 * sum(top1_hits) / len(top1_hits),
    }


def write_report(metrics: dict, top_n: int = TOP_N) -> str:
    report_path = os.path.join(OUTPUTS_DIR, "evaluation_report.txt")
    lines = [
        "=== Model 3 (Intervention Recommender) - Evaluation Report ===",
        "",
        "Model type: Rule-based recommender (not a classifier)",
        "Note: Traditional classification accuracy does not apply. Metrics below measure",
        "how well top-5 skill recommendations match each student's weak skills.",
        "",
        "Dataset: student_kc_mastery.csv (KDD Cup Algebra 2006-2007, filtered KCs)",
        f"Weak-skill definition: mastery_rate < {MASTERY_THRESHOLD} and attempts >= {MIN_ATTEMPTS}",
        "Priority score: 0.7 × (1 − personal mastery) + 0.3 × (1 − class avg mastery)",
        "",
        f"Students with weak skills:     {metrics['students_with_weak']:,}",
        f"Students with recommendations: {metrics['students_with_recs']:,}",
        f"Coverage:                      {metrics['coverage_pct']:.1f}%",
        "",
        f"Precision@{top_n}:                   {metrics[f'precision_at_{top_n}']:.2f}%",
        f"Recall@{top_n}:                      {metrics[f'recall_at_{top_n}']:.2f}%",
        f"Top-1 ranking accuracy:        {metrics['top1_ranking_accuracy']:.2f}%",
        "",
    ]
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    return report_path


if __name__ == "__main__":
    results = evaluate()
    path = write_report(results)
    print(f"Wrote report to {path}")
    for key, value in results.items():
        if isinstance(value, float):
            print(f"{key}: {value:.2f}")
        else:
            print(f"{key}: {value}")
