import pandas as pd
import os
import re

_PIPELINE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MASTERY_PATH = os.path.join(_PIPELINE_DIR, "student_kc_mastery.csv")
OUTPUTS_DIR = os.path.join(_PIPELINE_DIR, "outputs")
os.makedirs(OUTPUTS_DIR, exist_ok=True)

MASTERY_THRESHOLD = 0.6  # below this mastery_rate, a skill is considered "weak"
MIN_ATTEMPTS = 3         # ignore skills with too few attempts (not enough signal)


def is_readable_skill_name(kc_name: str) -> bool:
    """
    Filters out internal tutoring-system rule codes (contain brackets, semicolons,
    or excessive punctuation) and keeps plain, human-readable skill names.
    """
    if not isinstance(kc_name, str):
        return False
    if any(char in kc_name for char in ["[", "]", "{", "}", "~", ";"]):
        return False
    if len(kc_name) > 60:  # very long names are usually concatenated rule codes
        return False
    return True


def load_mastery_table():
    df = pd.read_csv(MASTERY_PATH)
    df = df[df["kc"].apply(is_readable_skill_name)].copy()
    return df


def compute_skill_difficulty(df):
    """
    Skills with lower average mastery across ALL students are more broadly difficult —
    these are higher priority to address since many students likely struggle with them.
    """
    skill_stats = df.groupby("kc").agg(
        avg_mastery=("mastery_rate", "mean"),
        num_students=("student_id", "nunique")
    ).reset_index()
    skill_stats = skill_stats[skill_stats["num_students"] >= 5]  # ignore rare/niche skills
    return skill_stats


def recommend_for_student(student_id, df, skill_stats, top_n=5):
    """
    Returns the top_n recommended intervention topics for a given student,
    ranked by (weakness for this student) x (broad difficulty of the skill).
    """
    student_df = df[df["student_id"] == student_id]
    student_df = student_df[student_df["attempts"] >= MIN_ATTEMPTS]

    weak_skills = student_df[student_df["mastery_rate"] < MASTERY_THRESHOLD].copy()

    if weak_skills.empty:
        return []

    weak_skills = weak_skills.merge(skill_stats, on="kc", how="left")
    weak_skills["avg_mastery"] = weak_skills["avg_mastery"].fillna(0.5)

    # Priority score: lower personal mastery + lower average mastery (broadly hard skill) = higher priority
    weak_skills["priority_score"] = (1 - weak_skills["mastery_rate"]) * 0.7 + (1 - weak_skills["avg_mastery"]) * 0.3

    weak_skills = weak_skills.sort_values("priority_score", ascending=False)

    recommendations = weak_skills[["kc", "mastery_rate", "avg_mastery", "priority_score", "attempts"]].head(top_n)
    return recommendations.to_dict(orient="records")


if __name__ == "__main__":
    df = load_mastery_table()
    skill_stats = compute_skill_difficulty(df)

    print("Total students:", df["student_id"].nunique())
    print("Total unique skills (KCs):", df["kc"].nunique())

    # Test on a real student from the data
    sample_student = df["student_id"].iloc[0]
    print(f"\nRecommendations for student {sample_student}:\n")

    recs = recommend_for_student(sample_student, df, skill_stats)
    for r in recs:
        print(f"  - Skill: {r['kc']}")
        print(f"    Your mastery: {r['mastery_rate']:.2f} | Class average: {r['avg_mastery']:.2f} | Priority score: {r['priority_score']:.3f}")
        print()

    skill_stats.to_csv(os.path.join(OUTPUTS_DIR, "skill_difficulty_stats.csv"), index=False)
    print(f"Saved skill difficulty stats to outputs folder.")