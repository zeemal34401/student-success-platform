import sys, os
sys.path.append(os.path.dirname(__file__))

from preprocessing import (
    load_dropout_data,
    prepare_multiclass,
    encode_features,
    MODELS_DIR,
    OUTPUTS_DIR,
)

import numpy as np
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.metrics import classification_report, confusion_matrix
from xgboost import XGBClassifier
import matplotlib.pyplot as plt
import seaborn as sns
import joblib

os.makedirs(OUTPUTS_DIR, exist_ok=True)

# ===== Load and prepare =====
df = load_dropout_data()
df, target_encoder = prepare_multiclass(df)
X, y = encode_features(df, target_col="target", dataset_name="multiclass")

class_names = target_encoder.classes_  # e.g. ['Dropout', 'Enrolled', 'Graduate']
print("Feature set:", X.shape)
print("Classes (in encoded order):", list(class_names))
print("Target distribution:\n", y.value_counts())

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# ===== 5-fold CV (macro-F1, appropriate for multiclass + imbalance) =====
xgb = XGBClassifier(
    n_estimators=300, max_depth=6, learning_rate=0.05,
    eval_metric="mlogloss", random_state=42,
    objective="multi:softprob", num_class=len(class_names)
)

skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
cv_scores = cross_val_score(xgb, X_train, y_train, cv=skf, scoring="f1_macro")
print(f"\n5-Fold CV Macro-F1: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
print("Fold scores:", np.round(cv_scores, 4))

# ===== Final fit =====
xgb.fit(X_train, y_train)
preds = xgb.predict(X_test)

print("\n=== XGBoost (held-out test) ===")
print(classification_report(y_test, preds, target_names=class_names))

# ===== Save confusion matrix =====
cm = confusion_matrix(y_test, preds)
plt.figure(figsize=(7, 6))
sns.heatmap(cm, annot=True, fmt="d", cmap="Purples",
            xticklabels=class_names, yticklabels=class_names)
plt.xlabel("Predicted"); plt.ylabel("Actual")
plt.title("Dropout Risk Model - Confusion Matrix (3-Class)")
plt.tight_layout()
plt.savefig(os.path.join(OUTPUTS_DIR, "multiclass_confusion_matrix.png"), dpi=150)
plt.close()

# ===== Save model + report =====
joblib.dump(xgb, os.path.join(MODELS_DIR, "dropout_multiclass_xgb_model.pkl"))

with open(os.path.join(OUTPUTS_DIR, "multiclass_report.txt"), "w") as f:
    f.write("=== Model 2 (3-Class: Dropout/Enrolled/Graduate) - Final Report ===\n\n")
    f.write(f"5-Fold CV Macro-F1: {cv_scores.mean():.4f} +/- {cv_scores.std():.4f}\n\n")
    f.write("Classification Report:\n")
    f.write(classification_report(y_test, preds, target_names=class_names))
    f.write("\nConfusion Matrix (rows=actual, cols=predicted):\n")
    f.write(f"Classes order: {list(class_names)}\n")
    f.write(str(cm))

print(f"\nSaved model and reports.")