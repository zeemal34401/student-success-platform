import pandas as pd
from sklearn.preprocessing import LabelEncoder, StandardScaler
import joblib
import os
from paths import MODELS_DIR, OULAD_BASE

os.makedirs(MODELS_DIR, exist_ok=True)


def load_and_merge_oulad():
    """Same merge logic as Model 1 — one row per student per course, with demographics + engagement + performance."""
    studentInfo = pd.read_csv(os.path.join(OULAD_BASE, "studentInfo.csv"))
    studentVle = pd.read_csv(os.path.join(OULAD_BASE, "studentVle.csv"))
    studentAssessment = pd.read_csv(os.path.join(OULAD_BASE, "studentAssessment.csv"))
    assessments = pd.read_csv(os.path.join(OULAD_BASE, "assessments.csv"))

    vle_agg = studentVle.groupby(
        ["id_student", "code_module", "code_presentation"]
    ).agg(
        total_clicks=("sum_click", "sum"),
        avg_clicks=("sum_click", "mean"),
        active_days=("date", "nunique")
    ).reset_index()

    assess_merged = studentAssessment.merge(assessments, on="id_assessment", how="left")
    assess_agg = assess_merged.groupby(
        ["id_student", "code_module", "code_presentation"]
    ).agg(
        avg_score=("score", "mean"),
        num_assessments=("score", "count")
    ).reset_index()

    df = studentInfo.merge(vle_agg, on=["id_student", "code_module", "code_presentation"], how="left")
    df = df.merge(assess_agg, on=["id_student", "code_module", "code_presentation"], how="left")

    for col in ["total_clicks", "avg_clicks", "active_days", "avg_score", "num_assessments"]:
        df[col] = df[col].fillna(0)

    return df


def prepare_for_clustering(df):
    """
    Selects and encodes features relevant for behavioral/performance clustering.
    Keeps id_student and final_result separately (not used as clustering inputs,
    but needed later for cluster profiling/validation).
    """
    df = df.copy()

    cluster_features = [
        "num_of_prev_attempts", "studied_credits",
        "total_clicks", "avg_clicks", "active_days",
        "avg_score", "num_assessments"
    ]

    meta = df[["id_student", "code_module", "code_presentation", "final_result",
               "gender", "age_band", "disability"]].copy()

    X = df[cluster_features].copy()
    X = X.fillna(0)

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    X_scaled = pd.DataFrame(X_scaled, columns=cluster_features, index=X.index)

    joblib.dump(scaler, os.path.join(MODELS_DIR, "cluster_scaler.pkl"))

    return X_scaled, meta, cluster_features
