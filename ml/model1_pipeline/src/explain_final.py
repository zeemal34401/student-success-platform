import sys
import os
sys.path.append(os.path.dirname(__file__))

from preprocessing import load_oulad, load_student_performance, encode_and_prepare, MODELS_DIR

import joblib
import shap
import matplotlib.pyplot as plt
from paths import OUTPUTS_DIR

os.makedirs(OUTPUTS_DIR, exist_ok=True)

# ===== SHAP for OULAD model =====
print("Generating SHAP plot for OULAD model...")

df1 = load_oulad()
df1["target"] = df1["final_result"].apply(lambda x: 1 if x in ["Pass", "Distinction"] else 0)

encoders1 = joblib.load(os.path.join(MODELS_DIR, "oulad_encoders.pkl"))
df1 = df1.drop(columns=["final_result", "id_student", "code_module", "code_presentation"])
df1 = df1.fillna(0)
for col, le in encoders1.items():
    df1[col] = le.transform(df1[col].astype(str))

X1 = df1.drop(columns=["target"])

oulad_model = joblib.load(os.path.join(MODELS_DIR, "oulad_xgb_model.pkl"))
explainer1 = shap.TreeExplainer(oulad_model)
shap_values1 = explainer1.shap_values(X1)

plt.figure()
shap.summary_plot(shap_values1, X1, show=False)
plt.tight_layout()
plt.savefig(os.path.join(OUTPUTS_DIR, "shap_oulad.png"), dpi=150)
plt.close()
print("Saved shap_oulad.png")

# ===== SHAP for Student Performance model =====
print("\nGenerating SHAP plot for Student Performance model...")

df2 = load_student_performance()
df2["target"] = (df2["G3"] >= 10).astype(int)

encoders2 = joblib.load(os.path.join(MODELS_DIR, "student_performance_encoders.pkl"))
df2 = df2.drop(columns=["G1", "G2", "G3"])
df2 = df2.fillna(0)
for col, le in encoders2.items():
    df2[col] = le.transform(df2[col].astype(str))

X2 = df2.drop(columns=["target"])

student_model = joblib.load(os.path.join(MODELS_DIR, "student_perf_xgb_model.pkl"))
explainer2 = shap.TreeExplainer(student_model)
shap_values2 = explainer2.shap_values(X2)

plt.figure()
shap.summary_plot(shap_values2, X2, show=False)
plt.tight_layout()
plt.savefig(os.path.join(OUTPUTS_DIR, "shap_student_performance.png"), dpi=150)
plt.close()
print("Saved shap_student_performance.png")

print("\nDone. Both SHAP plots saved to outputs folder.")
