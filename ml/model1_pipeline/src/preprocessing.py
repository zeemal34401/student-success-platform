import pandas as pd
from sklearn.preprocessing import LabelEncoder
import joblib
import os
from paths import MODELS_DIR, OULAD_BASE, STUDENT_BASE


os.makedirs(MODELS_DIR, exist_ok=True)


def load_oulad():
    """Merge all OULAD tables into one student-level dataframe."""
    studentInfo = pd.read_csv(os.path.join(OULAD_BASE, "studentInfo.csv"))
    studentVle = pd.read_csv(os.path.join(OULAD_BASE, "studentVle.csv"))
    studentAssessment = pd.read_csv(os.path.join(OULAD_BASE, "studentAssessment.csv"))
    assessments = pd.read_csv(OULAD_BASE + r"\assessments.csv")

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


def load_student_performance():
    """Combine math + Portuguese UCI datasets."""
    df_mat = pd.read_csv(STUDENT_BASE + r"\student-mat.csv", sep=";")
    df_por = pd.read_csv(STUDENT_BASE + r"\student-por.csv", sep=";")
    df_mat["subject"] = "math"
    df_por["subject"] = "portuguese"
    df = pd.concat([df_mat, df_por], ignore_index=True)
    return df


def encode_and_prepare(df, target_col, drop_cols, dataset_name):
    """
    Encodes categorical columns, saves the fitted encoders to disk
    (critical: without this, you can't correctly transform new data later),
    and returns X, y.
    """
    df = df.drop(columns=drop_cols)
    df = df.fillna(0)

    cat_cols = df.select_dtypes(include="object").columns.tolist()
    encoders = {}

    for col in cat_cols:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col].astype(str))
        encoders[col] = le

    # Save encoders so future predictions use the SAME encoding
    encoder_path = os.path.join(MODELS_DIR, f"{dataset_name}_encoders.pkl")
    joblib.dump(encoders, encoder_path)
    print(f"Saved encoders: {encoder_path}")

    X = df.drop(columns=[target_col])
    y = df[target_col]
    return X, y
