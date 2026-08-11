"""Train Model 2 binary dropout classifier (Dropout vs Graduate) targeting >=90% accuracy."""
import sys
import os

sys.path.append(os.path.dirname(__file__))

from preprocessing import (
    load_dropout_data,
    prepare_binary,
    encode_features,
    MODELS_DIR,
    OUTPUTS_DIR,
)

import numpy as np
from sklearn.model_selection import train_test_split, StratifiedKFold
from sklearn.ensemble import (
    RandomForestClassifier,
    HistGradientBoostingClassifier,
    ExtraTreesClassifier,
    StackingClassifier,
)
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    classification_report,
    roc_auc_score,
    confusion_matrix,
    accuracy_score,
    RocCurveDisplay,
)
from xgboost import XGBClassifier
import matplotlib.pyplot as plt
import seaborn as sns
import joblib

os.makedirs(OUTPUTS_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)

RANDOM_STATE = 42
TARGET_ACCURACY = 0.90


def best_threshold(y_true, probs):
    """Pick decision threshold that maximizes accuracy on the given set."""
    best_t, best_acc = 0.5, 0.0
    for t in np.linspace(0.05, 0.95, 91):
        acc = accuracy_score(y_true, (probs >= t).astype(int))
        if acc > best_acc:
            best_acc, best_t = acc, float(t)
    return best_t, best_acc


def make_stack(scale_pos_weight):
    xgb = XGBClassifier(
        n_estimators=300,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.9,
        colsample_bytree=0.8,
        min_child_weight=5,
        gamma=0.2,
        reg_lambda=0.5,
        eval_metric="logloss",
        random_state=RANDOM_STATE,
        n_jobs=-1,
        scale_pos_weight=scale_pos_weight,
    )
    rf = RandomForestClassifier(
        n_estimators=500,
        max_depth=14,
        min_samples_leaf=2,
        class_weight="balanced",
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )
    et = ExtraTreesClassifier(
        n_estimators=500,
        max_depth=14,
        min_samples_leaf=2,
        class_weight="balanced",
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )
    hgb = HistGradientBoostingClassifier(
        max_depth=6,
        learning_rate=0.05,
        max_iter=400,
        l2_regularization=1.0,
        random_state=RANDOM_STATE,
    )
    return StackingClassifier(
        estimators=[("xgb", xgb), ("rf", rf), ("et", et), ("hgb", hgb)],
        final_estimator=LogisticRegression(max_iter=2000, class_weight="balanced"),
        stack_method="predict_proba",
        n_jobs=-1,
    )


# ===== Load and prepare =====
df = load_dropout_data()
df = prepare_binary(df)
X, y = encode_features(df, target_col="target", dataset_name="binary", engineer=True)

print("Framing: Dropout vs Graduate (Enrolled excluded)")
print("Feature set:", X.shape)
print("Target distribution (1 = Dropout):\n", y.value_counts())

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=RANDOM_STATE, stratify=y
)
X_fit, X_val, y_fit, y_val = train_test_split(
    X_train, y_train, test_size=0.2, random_state=RANDOM_STATE, stratify=y_train
)

scale_pos_weight_fit = (y_fit == 0).sum() / max((y_fit == 1).sum(), 1)
print(f"scale_pos_weight (fit): {scale_pos_weight_fit:.3f}")

# ===== Threshold on validation =====
print("\nFitting stack on fit split for threshold selection...")
stack_fit = make_stack(scale_pos_weight_fit)
stack_fit.fit(X_fit, y_fit)
threshold, val_acc = best_threshold(y_val, stack_fit.predict_proba(X_val)[:, 1])
print(f"Validation-optimal threshold: {threshold:.2f} (val acc={val_acc:.4f})")

# ===== Refit on full training set =====
scale_pos_weight = (y_train == 0).sum() / max((y_train == 1).sum(), 1)
print("\nRefitting stack on full training set...")
final_model = make_stack(scale_pos_weight)
final_model.fit(X_train, y_train)

# CV AUC using tuned XGB alone (stable, fast to report)
skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
cv_scores = []
for train_idx, val_idx in skf.split(X_train, y_train):
    spw = (y_train.iloc[train_idx] == 0).sum() / max((y_train.iloc[train_idx] == 1).sum(), 1)
    m = XGBClassifier(
        n_estimators=300,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.9,
        colsample_bytree=0.8,
        min_child_weight=5,
        gamma=0.2,
        reg_lambda=0.5,
        eval_metric="logloss",
        random_state=RANDOM_STATE,
        n_jobs=-1,
        scale_pos_weight=spw,
    )
    m.fit(X_train.iloc[train_idx], y_train.iloc[train_idx])
    probs = m.predict_proba(X_train.iloc[val_idx])[:, 1]
    cv_scores.append(roc_auc_score(y_train.iloc[val_idx], probs))
cv_scores = np.array(cv_scores)
print(f"\n5-Fold CV ROC-AUC (tuned XGB): {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

# ===== Held-out test =====
test_probs = final_model.predict_proba(X_test)[:, 1]
test_preds = (test_probs >= threshold).astype(int)
test_acc = accuracy_score(y_test, test_preds)
test_auc = roc_auc_score(y_test, test_probs)

print("\n=== Stacking ensemble (held-out test) ===")
print(classification_report(y_test, test_preds))
print(f"Test accuracy: {test_acc:.4f}")
print(f"Test ROC-AUC: {test_auc:.4f}")
print(f"Decision threshold: {threshold:.2f}")
print(f"\nFINAL test accuracy: {test_acc:.4f} ({'PASS' if test_acc >= TARGET_ACCURACY else 'BELOW TARGET'})")

# ===== Plots =====
cm = confusion_matrix(y_test, test_preds)
plt.figure(figsize=(6, 5))
sns.heatmap(
    cm,
    annot=True,
    fmt="d",
    cmap="Reds",
    xticklabels=["Graduate", "Dropout"],
    yticklabels=["Graduate", "Dropout"],
)
plt.xlabel("Predicted")
plt.ylabel("Actual")
plt.title("Dropout Risk Model - Confusion Matrix (Dropout vs Graduate)")
plt.tight_layout()
plt.savefig(os.path.join(OUTPUTS_DIR, "binary_confusion_matrix.png"), dpi=150)
plt.close()

plt.figure(figsize=(6, 5))
RocCurveDisplay.from_predictions(y_test, test_probs)
plt.title("Dropout Risk Model - ROC Curve")
plt.tight_layout()
plt.savefig(os.path.join(OUTPUTS_DIR, "binary_roc_curve.png"), dpi=150)
plt.close()

# ===== Persist =====
artifact = {
    "model": final_model,
    "threshold": threshold,
    "feature_columns": list(X.columns),
    "engineered": True,
    "framing": "dropout_vs_graduate",
}
joblib.dump(artifact, os.path.join(MODELS_DIR, "dropout_binary_xgb_model.pkl"))
joblib.dump(final_model, os.path.join(MODELS_DIR, "dropout_binary_estimator.pkl"))

with open(os.path.join(OUTPUTS_DIR, "binary_report.txt"), "w", encoding="utf-8") as f:
    f.write("=== Model 2 (Binary Dropout Risk) - Final Report ===\n\n")
    f.write("Framing: Dropout vs Graduate (Enrolled excluded — unresolved outcomes)\n")
    f.write(f"Train/test size: {len(X_train)} / {len(X_test)}  (total n={len(X)})\n")
    f.write(f"5-Fold CV ROC-AUC (tuned XGB): {cv_scores.mean():.4f} +/- {cv_scores.std():.4f}\n")
    f.write(f"Held-out Test ROC-AUC: {test_auc:.4f}\n")
    f.write(f"Held-out Test Accuracy: {test_acc:.4f}\n")
    f.write(f"Decision threshold: {threshold:.2f}\n")
    f.write("Model: Stacking (XGB + RF + ExtraTrees + HistGB -> LogisticRegression)\n\n")
    f.write("Classification Report:\n")
    f.write(classification_report(y_test, test_preds))
    f.write("\nConfusion Matrix (rows=actual, cols=predicted):\n")
    f.write("Order: [Graduate=0, Dropout=1]\n")
    f.write(str(cm))
    f.write("\n")

print(f"\nSaved model and reports to {MODELS_DIR} / {OUTPUTS_DIR}")
if test_acc < TARGET_ACCURACY:
    raise SystemExit(f"Accuracy {test_acc:.4f} is below the {TARGET_ACCURACY:.0%} target.")
