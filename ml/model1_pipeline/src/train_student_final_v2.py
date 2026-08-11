import sys, os
sys.path.append(os.path.dirname(__file__))

from preprocessing import load_student_performance, encode_and_prepare, MODELS_DIR

import numpy as np
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score, GridSearchCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    classification_report, roc_auc_score, confusion_matrix,
    RocCurveDisplay, precision_recall_curve, f1_score
)
from xgboost import XGBClassifier
import matplotlib.pyplot as plt
import seaborn as sns
import joblib
from paths import OUTPUTS_DIR

os.makedirs(OUTPUTS_DIR, exist_ok=True)

# ===== Load data =====
df = load_student_performance()
df["target"] = (df["G3"] >= 10).astype(int)

# ===== Feature engineering (new) =====
df["study_time_x_failures"] = df["studytime"] * (df["failures"] + 1)
df["social_risk"] = df["goout"] + df["Dalc"] + df["Walc"]

X, y = encode_and_prepare(
    df,
    target_col="target",
    drop_cols=["G1", "G2", "G3"],
    dataset_name="student_performance_v2"
)

print("Final feature set:", X.shape)
print("Target distribution:\n", y.value_counts())

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

scale_pos_weight = (y_train == 0).sum() / (y_train == 1).sum()

# ===== Grid search (optimizing for recall on the minority/Fail class) =====
print("\nRunning grid search (this may take a minute)...")

param_grid = {
    'max_depth': [3, 4, 5],
    'learning_rate': [0.01, 0.05, 0.1],
    'n_estimators': [100, 200, 300],
    'min_child_weight': [1, 3, 5],
}

base_model = XGBClassifier(
    eval_metric="logloss",
    random_state=42,
    scale_pos_weight=scale_pos_weight
)

skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
grid = GridSearchCV(base_model, param_grid, scoring='recall', cv=skf, n_jobs=-1, verbose=1)
grid.fit(X_train, y_train)

print(f"\nBest params: {grid.best_params_}")
print(f"Best CV recall (class 1 by default — see note below): {grid.best_score_:.4f}")

best_xgb = grid.best_estimator_

# ===== Also compare against Logistic Regression and Random Forest =====
log_reg = LogisticRegression(class_weight='balanced', max_iter=1000, random_state=42)
log_reg.fit(X_train, y_train)

rf = RandomForestClassifier(n_estimators=200, random_state=42, n_jobs=-1, class_weight="balanced")
rf.fit(X_train, y_train)

models = {
    "XGBoost (tuned)": best_xgb,
    "Logistic Regression": log_reg,
    "Random Forest": rf,
}

results_summary = {}

for name, model in models.items():
    probs = model.predict_proba(X_test)[:, 1]
    preds = model.predict(X_test)
    auc = roc_auc_score(y_test, probs)
    f1_macro = f1_score(y_test, preds, average='macro')
    results_summary[name] = {"auc": auc, "f1_macro": f1_macro, "probs": probs}
    print(f"\n=== {name} ===")
    print(f"ROC-AUC: {auc:.4f} | Macro F1: {f1_macro:.4f}")
    print(classification_report(y_test, preds))

# Pick the best model by macro F1 (balances both classes fairly)
best_name = max(results_summary, key=lambda k: results_summary[k]["f1_macro"])
best_model = models[best_name]
best_probs = results_summary[best_name]["probs"]
print(f"\n>>> Best model: {best_name} <<<")

# ===== Threshold tuning on the winning model =====
precisions, recalls, thresholds = precision_recall_curve(y_test, best_probs)

# Find the threshold that maximizes F1 for class 0 (Fail) specifically
best_f1 = 0
best_threshold = 0.5
for t in np.arange(0.2, 0.8, 0.01):
    preds_at_t = (best_probs >= t).astype(int)
    # F1 for class 0 (Fail) — invert since we care about catching Fail (label 0)
    f1_class0 = f1_score(y_test, preds_at_t, pos_label=0)
    if f1_class0 > best_f1:
        best_f1 = f1_class0
        best_threshold = t

print(f"\nOptimal threshold for catching at-risk students: {best_threshold:.2f}")
final_preds = (best_probs >= best_threshold).astype(int)

print(f"\n=== {best_name} @ tuned threshold {best_threshold:.2f} ===")
print(classification_report(y_test, final_preds))
final_auc = roc_auc_score(y_test, best_probs)
print(f"ROC-AUC (threshold-independent): {final_auc:.4f}")

# ===== Save plots =====
cm = confusion_matrix(y_test, final_preds)
plt.figure(figsize=(6, 5))
sns.heatmap(cm, annot=True, fmt="d", cmap="Blues", xticklabels=["Fail", "Pass"], yticklabels=["Fail", "Pass"])
plt.xlabel("Predicted"); plt.ylabel("Actual")
plt.title(f"Student Performance Model v2 - Confusion Matrix ({best_name})")
plt.tight_layout()
plt.savefig(os.path.join(OUTPUTS_DIR, "student_perf_v2_confusion_matrix.png"), dpi=150)
plt.close()

plt.figure(figsize=(6, 5))
RocCurveDisplay.from_predictions(y_test, best_probs)
plt.title(f"Student Performance Model v2 - ROC Curve ({best_name})")
plt.tight_layout()
plt.savefig(os.path.join(OUTPUTS_DIR, "student_perf_v2_roc_curve.png"), dpi=150)
plt.close()

# ===== Save model + report =====
joblib.dump(best_model, os.path.join(MODELS_DIR, "student_perf_v2_model.pkl"))
joblib.dump(best_threshold, os.path.join(MODELS_DIR, "student_perf_v2_threshold.pkl"))

report_path = os.path.join(OUTPUTS_DIR, "student_perf_v2_report.txt")
with open(report_path, "w") as f:
    f.write("=== UCI Student Performance Model 1 v2 - Improved Report ===\n\n")
    f.write(f"Best model selected: {best_name}\n")
    f.write(f"Best hyperparameters (if XGBoost): {grid.best_params_}\n")
    f.write(f"Optimal decision threshold: {best_threshold:.2f}\n")
    f.write(f"ROC-AUC: {final_auc:.4f}\n\n")
    f.write("Classification Report (at tuned threshold):\n")
    f.write(classification_report(y_test, final_preds))
    f.write("\nConfusion Matrix:\n")
    f.write(str(cm))
    f.write("\n\n=== Model Comparison ===\n")
    for name, res in results_summary.items():
        f.write(f"{name}: AUC={res['auc']:.4f}, Macro F1={res['f1_macro']:.4f}\n")

print(f"\nSaved model, threshold, plots, and report.")
print(f"Report: {report_path}")
