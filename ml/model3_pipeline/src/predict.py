import os
from recommender import load_mastery_table, compute_skill_difficulty, recommend_for_student

# Load once at import time (not on every request — this data doesn't change per-request)
_df = load_mastery_table()
_skill_stats = compute_skill_difficulty(_df)


def get_recommendations(student_id: str, top_n: int = 5) -> dict:
    """
    Returns intervention recommendations for a given student_id.
    If the student isn't found in the dataset, returns an empty list with a note.
    """
    if student_id not in _df["student_id"].values:
        return {
            "student_id": student_id,
            "found": False,
            "recommendations": [],
            "message": "Student not found in training data. This function currently only supports students present in the KDD Cup dataset used for training."
        }

    recs = recommend_for_student(student_id, _df, _skill_stats, top_n=top_n)

    return {
        "student_id": student_id,
        "found": True,
        "recommendations": [
            {
                "skill": r["kc"],
                "student_mastery": round(r["mastery_rate"], 3),
                "class_average_mastery": round(r["avg_mastery"], 3),
                "priority_score": round(r["priority_score"], 3)
            }
            for r in recs
        ]
    }


if __name__ == "__main__":
    sample_student = _df["student_id"].iloc[0]
    result = get_recommendations(sample_student)
    print(result)