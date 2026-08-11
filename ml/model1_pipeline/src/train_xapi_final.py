import sys, os
sys.path.append(os.path.dirname(__file__))

from preprocessing_xapi import load_xapi_data, encode_and_prepare_xapi, MODELS_DIR

import numpy as np
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score, GridSearchCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    classification_report, roc_auc_score, confusion_matrix,
    RocCurveDisplay, f1_score
)
from xgboost import XGBClassifier
import matplotlib.pyplot as plt
import seaborn as sns
import joblib
from paths import OUTPUTS_DIR

os.makedirs(OUTPUTS_DIR, exist_ok=True)

# ===== Load and prepare =====
df = load_xapi_data()
X, y = encode_and_prepare_xapi(df)

print("Feature set:", X.shape)
print("Target distribution (1 = not-Low-performer):\n", y.value_counts())

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

scale_pos_weight = (y_train == 0).sum() / (y_train == 1).sum()

# ===== Grid search =====
print("\nRunning grid search...")
param_grid = {
    'max_depth': [3, 4, 5, 6],
    'learning_rate': [0.01, 0.05, 0.1],
    'n_estimators': [100, 200, 300],
}

base_model = XGBClassifier(eval_metric="logloss", random_state=42, scale_pos_weight=scale_pos_weight)
skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
grid = GridSearchCV(base_model, param_grid, scoring='roc_auc', cv=skf, n_jobs=-1, verbose=1)
grid.fit(X_train, y_train)

print(f"\nBest params: {grid.best_params_}")
print(f"Best CV ROC-AUC: {grid.best_score_:.4f}")

best_xgb = grid.best_estimator_

# ===== Full 5-fold CV report on best model =====
cv_scores = cross_val_score(best_xgb, X_train, y_train, cv=skf, scoring="roc_auc")
print(f"\n5-Fold CV ROC-AUC (best model): {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

# ===== Final fit and evaluation =====
best_xgb.fit(X_train, y_train)
xgb_preds = best_xgb.predict(X_test)
xgb_probs = best_xgb.predict_proba(X_test)[:, 1]

rf = RandomForestClassifier(n_estimators=200, random_state=42, n_jobs=-1, class_weight="balanced")
rf.fit(X_train, y_train)
rf_preds = rf.predict(X_test)

print("\n=== Random Forest ===")
print(classification_report(y_test, rf_preds))

print("\n=== XGBoost (tuned) ===")
print(classification_report(y_test, xgb_preds))
test_auc = roc_auc_score(y_test, xgb_probs)
print(f"Test ROC-AUC: {test_auc:.4f}")

# ===== Save plots =====
cm = confusion_matrix(y_test, xgb_preds)
plt.figure(figsize=(6, 5))
sns.heatmap(cm, annot=True, fmt="d", cmap="Greens", xticklabels=["Low", "Not-Low"], yticklabels=["Low", "Not-Low"])
plt.xlabel("Predicted"); plt.ylabel("Actual")
plt.title("xAPI Model - Confusion Matrix (XGBoost)")
plt.tight_layout()
plt.savefig(os.path.join(OUTPUTS_DIR, "xapi_confusion_matrix.png"), dpi=150)
plt.close()

plt.figure(figsize=(6, 5))
RocCurveDisplay.from_estimator(best_xgb, X_test, y_test)
plt.title("xAPI Model - ROC Curve")
plt.tight_layout()
plt.savefig(os.path.join(OUTPUTS_DIR, "xapi_roc_curve.png"), dpi=150)
plt.close()

# ===== Save model + report =====
joblib.dump(best_xgb, os.path.join(MODELS_DIR, "xapi_xgb_model.pkl"))

report_path = os.path.join(OUTPUTS_DIR, "xapi_report.txt")
with open(report_path, "w") as f:
    f.write("=== xAPI-Edu-Data Model - Final Report ===\n\n")
    f.write(f"Best hyperparameters: {grid.best_params_}\n")
    f.write(f"5-Fold CV ROC-AUC: {cv_scores.mean():.4f} +/- {cv_scores.std():.4f}\n")
    f.write(f"Held-out Test ROC-AUC: {test_auc:.4f}\n\n")
    f.write("XGBoost Classification Report:\n")
    f.write(classification_report(y_test, xgb_preds))
    f.write("\nConfusion Matrix:\n")
    f.write(str(cm))

print(f"\nSaved model, plots, and report to outputs/models folders.")
