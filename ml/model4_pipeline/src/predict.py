import os
import joblib
import pandas as pd
from paths import MODELS_DIR, OUTPUTS_DIR


kmeans = joblib.load(os.path.join(MODELS_DIR, "kmeans_model.pkl"))
scaler = joblib.load(os.path.join(MODELS_DIR, "cluster_scaler.pkl"))
clusters_df = pd.read_csv(os.path.join(OUTPUTS_DIR, "student_clusters.csv"))
profiles_df = pd.read_csv(os.path.join(OUTPUTS_DIR, "cluster_profiles.csv"), index_col=0)
outcomes_df = pd.read_csv(os.path.join(OUTPUTS_DIR, "cluster_outcome_distribution.csv"), index_col=0)

FEATURES = ["num_of_prev_attempts", "studied_credits", "total_clicks",
            "avg_clicks", "active_days", "avg_score", "num_assessments"]

CLUSTER_LABELS = {
    0: "Disengaged / High Withdrawal Risk",
    1: "High Achiever",
    2: "Moderate Engagement / Mixed Outcome",
    3: "Repeat Attempter / Struggling"
}


def get_student_cluster(id_student: int) -> dict:
    """Returns the cluster assignment and profile for an existing student in the dataset."""
    match = clusters_df[clusters_df["id_student"] == id_student]
    if match.empty:
        return {"found": False, "message": "Student not found in clustering dataset."}

    row = match.iloc[0]
    cluster_id = int(row["cluster"])

    return {
        "found": True,
        "id_student": id_student,
        "cluster_id": cluster_id,
        "cluster_label": CLUSTER_LABELS.get(cluster_id, f"Cluster {cluster_id}"),
        "final_result": row["final_result"]
    }


def classify_new_student(feature_dict: dict) -> dict:
    """
    Assigns a NEW student (not in training data) to the nearest cluster,
    given their raw engagement/performance features.
    """
    X = pd.DataFrame([feature_dict])[FEATURES]
    X_scaled = scaler.transform(X)  # keep as DataFrame so column names match what the scaler was fit on
    cluster_id = int(kmeans.predict(X_scaled)[0])

    return {
        "cluster_id": cluster_id,
        "cluster_label": CLUSTER_LABELS.get(cluster_id, f"Cluster {cluster_id}"),
        "cluster_outcome_distribution": outcomes_df.loc[cluster_id].to_dict()
    }


def get_cluster_summary() -> dict:
    """Returns overall cluster statistics for institutional dashboard reporting."""
    sizes = clusters_df["cluster"].value_counts().sort_index()
    return {
        "total_students": len(clusters_df),
        "clusters": [
            {
                "cluster_id": int(cid),
                "label": CLUSTER_LABELS.get(int(cid), f"Cluster {cid}"),
                "student_count": int(count),
                "percentage": round(count / len(clusters_df) * 100, 1),
                "outcome_distribution": outcomes_df.loc[cid].to_dict()
            }
            for cid, count in sizes.items()
        ]
    }


if __name__ == "__main__":
    # Test 1: existing student
    sample_id = int(clusters_df["id_student"].iloc[0])
    print("Existing student lookup:", get_student_cluster(sample_id))

    # Test 2: new student classification
    new_student = {
        "num_of_prev_attempts": 0, "studied_credits": 60,
        "total_clicks": 1200, "avg_clicks": 25, "active_days": 150,
        "avg_score": 85, "num_assessments": 8
    }
    print("\nNew student classification:", classify_new_student(new_student))

    # Test 3: institutional summary
    print("\nCluster summary:")
    summary = get_cluster_summary()
    for c in summary["clusters"]:
        print(f"  {c['label']}: {c['student_count']} students ({c['percentage']}%)")
