import sys, os
sys.path.append(os.path.dirname(__file__))

from preprocessing import MODELS_DIR, OULAD_BASE
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.metrics import classification_report, roc_auc_score
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBClassifier
import joblib
from paths import OUTPUTS_DIR


# ===== Load raw tables =====
studentInfo = pd.read_csv(OULAD_BASE + r"\studentInfo.csv")
studentVle = pd.read_csv(OULAD_BASE + r"\studentVle.csv")
studentAssessment = pd.read_csv(OULAD_BASE + r"\studentAssessment.csv")
assessments = pd.read_csv(OULAD_BASE + r"\assessments.csv")

CUTOFF_DAY = 28  # first 4 weeks only — this is the "early warning" window

# Only use VLE clicks up to the cutoff day
early_vle = studentVle[studentVle["date"] <= CUTOFF_DAY]
vle_agg = early_vle.groupby(
    ["id_student", "code_module", "code_presentation"]
).agg(
    total_clicks=("sum_click", "sum"),
    avg_clicks=("sum_click", "mean"),
    active_days=("date", "nunique")
).reset_index()

# Only use assessments that were DUE by the cutoff day
assess_merged = studentAssessment.merge(assessments, on="id_assessment", how="left")
early_assess = assess_merged[assess_merged["date_submitted"] <= CUTOFF_DAY]
assess_agg = early_assess.groupby(
    ["id_student", "code_module", "code_presentation"]
).agg(
    avg_score=("score", "mean"),
    num_assessments=("score", "count")
).reset_index()

df = studentInfo.merge(vle_agg, on=["id_student", "code_module", "code_presentation"], how="left")
df = df.merge(assess_agg, on=["id_student", "code_module", "code_presentation"], how="left")

for col in ["total_clicks", "avg_clicks", "active_days", "avg_score", "num_assessments"]:
    df[col] = df[col].fillna(0)

df["target"] = df["final_result"].apply(lambda x: 1 if x in ["Pass", "Distinction"] else 0)
df = df.drop(columns=["final_result", "id_student", "code_module", "code_presentation"])
df = df.fillna(0)

cat_cols = df.select_dtypes(include="object").columns.tolist()
encoders = {}
for col in cat_cols:
    le = LabelEncoder()
    df[col] = le.fit_transform(df[col].astype(str))
    encoders[col] = le

X = df.drop(columns=["target"])
y = df["target"]

print(f"Early-warning feature set (day <= {CUTOFF_DAY}):", X.shape)

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

xgb = XGBClassifier(
    n_estimators=300, max_depth=6, learning_rate=0.05,
    eval_metric="logloss", random_state=42
)

skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
cv_scores = cross_val_score(xgb, X_train, y_train, cv=skf, scoring="roc_auc")
print(f"5-Fold CV ROC-AUC (early-warning): {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

xgb.fit(X_train, y_train)
probs = xgb.predict_proba(X_test)[:, 1]
preds = xgb.predict(X_test)

print("\nTest ROC-AUC (early-warning):", roc_auc_score(y_test, probs))
print(classification_report(y_test, preds))

joblib.dump(xgb, os.path.join(MODELS_DIR, "oulad_early_warning_model.pkl"))
joblib.dump(encoders, os.path.join(MODELS_DIR, "oulad_early_warning_encoders.pkl"))
print("\nSaved early-warning model + encoders.")
