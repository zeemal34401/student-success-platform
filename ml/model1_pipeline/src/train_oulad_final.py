import sys
import os
sys.path.append(os.path.dirname(__file__))

from preprocessing import load_oulad, encode_and_prepare, MODELS_DIR

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, roc_auc_score, confusion_matrix, RocCurveDisplay
from xgboost import XGBClassifier
import matplotlib.pyplot as plt
import seaborn as sns
import joblib
from paths import OUTPUTS_DIR

os.makedirs(OUTPUTS_DIR, exist_ok=True)

# ===== Load and prepare data =====
df = load_oulad()
df["target"] = df["final_result"].apply(lambda x: 1 if x in ["Pass", "Distinction"] else 0)

X, y = encode_and_prepare(
    df,
    target_col="target",
    drop_cols=["final_result", "id_student", "code_module", "code_presentation"],
    dataset_name="oulad"
)

print("Final feature set:", X.shape)
print("Target distribution:\n", y.value_counts())

# ===== Train/test split =====
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# ===== 5-fold cross-validation (on training data only) =====
xgb = XGBClassifier(
    n_estimators=300,
    max_depth=6,
    learning_rate=0.05,
    eval_metric="logloss",
    random_state=42
)

skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
cv_scores = cross_val_score(xgb, X_train, y_train, cv=skf, scoring="roc_auc")
print(f"\n5-Fold CV ROC-AUC: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
print("Individual fold scores:", np.round(cv_scores, 4))

# ===== Final fit on full training set =====
xgb.fit(X_train, y_train)
xgb_preds = xgb.predict(X_test)
xgb_probs = xgb.predict_proba(X_test)[:, 1]

rf = RandomForestClassifier(n_estimators=200, random_state=42, n_jobs=-1)
rf.fit(X_train, y_train)
rf_preds = rf.predict(X_test)

print("\n=== Random Forest (held-out test set) ===")
print(classification_report(y_test, rf_preds))

print("\n=== XGBoost (held-out test set) ===")
print(classification_report(y_test, xgb_preds))
test_auc = roc_auc_score(y_test, xgb_probs)
print("Test ROC-AUC:", test_auc)

# ===== Save confusion matrix plot =====
cm = confusion_matrix(y_test, xgb_preds)
plt.figure(figsize=(6, 5))
sns.heatmap(cm, annot=True, fmt="d", cmap="Blues", xticklabels=["At-Risk", "Success"], yticklabels=["At-Risk", "Success"])
plt.xlabel("Predicted")
plt.ylabel("Actual")
plt.title("OULAD Model - Confusion Matrix (XGBoost)")
plt.tight_layout()
plt.savefig(os.path.join(OUTPUTS_DIR, "oulad_confusion_matrix.png"), dpi=150)
plt.close()

# ===== Save ROC curve plot =====
plt.figure(figsize=(6, 5))
RocCurveDisplay.from_estimator(xgb, X_test, y_test)
plt.title("OULAD Model - ROC Curve")
plt.tight_layout()
plt.savefig(os.path.join(OUTPUTS_DIR, "oulad_roc_curve.png"), dpi=150)
plt.close()

print(f"\nSaved plots to {OUTPUTS_DIR}")

# ===== Save model =====
model_path = os.path.join(MODELS_DIR, "oulad_xgb_model.pkl")
joblib.dump(xgb, model_path)
print(f"Saved model: {model_path}")

# ===== Save a text summary report =====
report_path = os.path.join(OUTPUTS_DIR, "oulad_report.txt")
with open(report_path, "w") as f:
    f.write("=== OULAD Model 1 - Final Report ===\n\n")
    f.write(f"5-Fold CV ROC-AUC: {cv_scores.mean():.4f} +/- {cv_scores.std():.4f}\n")
    f.write(f"Held-out Test ROC-AUC: {test_auc:.4f}\n\n")
    f.write("XGBoost Classification Report:\n")
    f.write(classification_report(y_test, xgb_preds))
    f.write("\nConfusion Matrix:\n")
    f.write(str(cm))
print(f"Saved report: {report_path}")
