import os
import joblib
import pandas as pd
from paths import MODELS_DIR


model = joblib.load(os.path.join(MODELS_DIR, "xapi_xgb_model.pkl"))
encoders = joblib.load(os.path.join(MODELS_DIR, "xapi_encoders.pkl"))

FEATURE_COLUMNS = [
    "gender", "NationalITy", "PlaceofBirth", "StageID", "GradeID", "SectionID",
    "Topic", "Semester", "Relation", "raisedhands", "VisITedResources",
    "AnnouncementsView", "Discussion", "ParentAnsweringSurvey",
    "ParentschoolSatisfaction", "StudentAbsenceDays"
]


def predict_xapi_risk(student_data: dict) -> dict:
    """
    student_data: dict with keys matching FEATURE_COLUMNS.
    Categorical fields (gender, NationalITy, etc.) must be passed as raw strings
    matching the original dataset's values (e.g. "M"/"F", "Under-7"/"Above-7").
    Returns: {"risk_label": "At-Risk" | "On-Track", "success_probability": float, "risk_probability": float}
    """
    row = pd.DataFrame([student_data])[FEATURE_COLUMNS]

    for col, le in encoders.items():
        if col in row.columns:
            value = str(row[col].iloc[0])
            if value not in le.classes_:
                value = le.classes_[0]  # unseen category fallback
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
    # High-engagement sample student
    sample_good = {
        "gender": "M", "NationalITy": "KW", "PlaceofBirth": "KuwaIT",
        "StageID": "MiddleSchool", "GradeID": "G-08", "SectionID": "A",
        "Topic": "Math", "Semester": "F", "Relation": "Father",
        "raisedhands": 80, "VisITedResources": 90, "AnnouncementsView": 60,
        "Discussion": 70, "ParentAnsweringSurvey": "Yes",
        "ParentschoolSatisfaction": "Good", "StudentAbsenceDays": "Under-7"
    }
    print("High engagement student:", predict_xapi_risk(sample_good))

    # Low-engagement sample student
    sample_risk = {
        "gender": "M", "NationalITy": "KW", "PlaceofBirth": "KuwaIT",
        "StageID": "MiddleSchool", "GradeID": "G-08", "SectionID": "A",
        "Topic": "Math", "Semester": "F", "Relation": "Father",
        "raisedhands": 5, "VisITedResources": 10, "AnnouncementsView": 2,
        "Discussion": 3, "ParentAnsweringSurvey": "No",
        "ParentschoolSatisfaction": "Bad", "StudentAbsenceDays": "Above-7"
    }
    print("Low engagement student:", predict_xapi_risk(sample_risk))
