import os
import joblib
import pandas as pd
from paths import MODELS_DIR


# Load model + encoders ONCE (not on every prediction — expensive to reload)
model = joblib.load(os.path.join(MODELS_DIR, "oulad_early_warning_model.pkl"))
encoders = joblib.load(os.path.join(MODELS_DIR, "oulad_early_warning_encoders.pkl"))

# The exact feature order the model expects
FEATURE_COLUMNS = [
    "gender", "region", "highest_education", "imd_band", "age_band",
    "num_of_prev_attempts", "studied_credits", "disability",
    "total_clicks", "avg_clicks", "active_days", "avg_score", "num_assessments"
]


def predict_student_risk(student_data: dict) -> dict:
    """
    student_data: dict with keys matching FEATURE_COLUMNS, e.g.:
    {
        "gender": "M", "region": "East Anglian Region", "highest_education": "HE Qualification",
        "imd_band": "20-30%", "age_band": "0-35", "num_of_prev_attempts": 0,
        "studied_credits": 60, "disability": "N",
        "total_clicks": 320, "avg_clicks": 11.4, "active_days": 18,
        "avg_score": 68.5, "num_assessments": 3
    }

    Returns: {"risk_label": "At-Risk" | "On-Track", "success_probability": float, "risk_probability": float}
    """
    row = pd.DataFrame([student_data])[FEATURE_COLUMNS]

    # Apply the SAME encoders used in training — critical for correctness
    for col, le in encoders.items():
        if col in row.columns:
            value = str(row[col].iloc[0])
            if value not in le.classes_:
                # Unseen category — fall back to the most common known class
                # rather than crashing. Flag this for logging/monitoring in production.
                value = le.classes_[0]
            row[col] = le.transform([value])

    prob_success = model.predict_proba(row)[0][1]
    prob_risk = 1 - prob_success
    label = "On-Track" if prob_success >= 0.5 else "At-Risk"

    return {
        "risk_label": label,
        "success_probability": round(float(prob_success), 4),
        "risk_probability": round(float(prob_risk), 4)
    }


if __name__ == "__main__":
    # Quick test with a sample student
    sample_student = {
        "gender": "M",
        "region": "East Anglian Region",
        "highest_education": "HE Qualification",
        "imd_band": "20-30%",
        "age_band": "0-35",
        "num_of_prev_attempts": 0,
        "studied_credits": 60,
        "disability": "N",
        "total_clicks": 45,
        "avg_clicks": 2.1,
        "active_days": 5,
        "avg_score": 40.0,
        "num_assessments": 1
    }

    result = predict_student_risk(sample_student)
    print("Prediction result:", result)
