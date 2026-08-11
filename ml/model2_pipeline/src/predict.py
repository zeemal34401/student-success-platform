import os
import joblib
import pandas as pd

from preprocessing import MODELS_DIR, engineer_features

_ARTIFACT_PATH = os.path.join(MODELS_DIR, "dropout_binary_xgb_model.pkl")
_artifact = joblib.load(_ARTIFACT_PATH)

# Support both new artifact dict and legacy bare estimator
if isinstance(_artifact, dict):
    model = _artifact["model"]
    THRESHOLD = float(_artifact.get("threshold", 0.5))
    FEATURE_COLUMNS = list(_artifact.get("feature_columns", []))
    USE_ENGINEERING = bool(_artifact.get("engineered", True))
else:
    model = _artifact
    THRESHOLD = 0.5
    FEATURE_COLUMNS = []
    USE_ENGINEERING = True

BASE_FEATURE_COLUMNS = [
    "Marital status", "Application mode", "Application order", "Course",
    "Daytime/evening attendance", "Previous qualification", "Previous qualification (grade)",
    "Nacionality", "Mother's qualification", "Father's qualification",
    "Mother's occupation", "Father's occupation", "Admission grade",
    "Displaced", "Educational special needs", "Debtor", "Tuition fees up to date",
    "Gender", "Scholarship holder", "Age at enrollment", "International",
    "Curricular units 1st sem (credited)", "Curricular units 1st sem (enrolled)",
    "Curricular units 1st sem (evaluations)", "Curricular units 1st sem (approved)",
    "Curricular units 1st sem (grade)", "Curricular units 1st sem (without evaluations)",
    "Curricular units 2nd sem (credited)", "Curricular units 2nd sem (enrolled)",
    "Curricular units 2nd sem (evaluations)", "Curricular units 2nd sem (approved)",
    "Curricular units 2nd sem (grade)", "Curricular units 2nd sem (without evaluations)",
    "Unemployment rate", "Inflation rate", "GDP",
]


def predict_dropout_risk(student_data: dict) -> dict:
    """
    student_data: dict with keys matching BASE_FEATURE_COLUMNS (all numeric/coded per UCI codebook).
    Returns: {"risk_label": "At-Risk" | "Not At-Risk", "dropout_probability": float, "retention_probability": float}
    """
    row = pd.DataFrame([student_data])[BASE_FEATURE_COLUMNS].fillna(0)
    if USE_ENGINEERING:
        row = engineer_features(row)

    if FEATURE_COLUMNS:
        # Align to training column order; fill any missing engineered cols with 0
        for col in FEATURE_COLUMNS:
            if col not in row.columns:
                row[col] = 0
        row = row[FEATURE_COLUMNS]

    prob_dropout = float(model.predict_proba(row)[0][1])
    prob_retain = 1.0 - prob_dropout
    label = "At-Risk" if prob_dropout >= THRESHOLD else "Not At-Risk"

    return {
        "risk_label": label,
        "dropout_probability": round(prob_dropout, 4),
        "retention_probability": round(prob_retain, 4),
    }


if __name__ == "__main__":
    sample_student = {
        "Marital status": 1, "Application mode": 17, "Application order": 5, "Course": 171,
        "Daytime/evening attendance": 1, "Previous qualification": 1, "Previous qualification (grade)": 122.0,
        "Nacionality": 1, "Mother's qualification": 19, "Father's qualification": 12,
        "Mother's occupation": 5, "Father's occupation": 9, "Admission grade": 127.3,
        "Displaced": 1, "Educational special needs": 0, "Debtor": 1, "Tuition fees up to date": 0,
        "Gender": 1, "Scholarship holder": 0, "Age at enrollment": 20, "International": 0,
        "Curricular units 1st sem (credited)": 0, "Curricular units 1st sem (enrolled)": 6,
        "Curricular units 1st sem (evaluations)": 6, "Curricular units 1st sem (approved)": 1,
        "Curricular units 1st sem (grade)": 8.5, "Curricular units 1st sem (without evaluations)": 0,
        "Curricular units 2nd sem (credited)": 0, "Curricular units 2nd sem (enrolled)": 6,
        "Curricular units 2nd sem (evaluations)": 5, "Curricular units 2nd sem (approved)": 0,
        "Curricular units 2nd sem (grade)": 0.0, "Curricular units 2nd sem (without evaluations)": 0,
        "Unemployment rate": 10.8, "Inflation rate": 1.4, "GDP": 1.74,
    }

    result = predict_dropout_risk(sample_student)
    print("Prediction result:", result)
