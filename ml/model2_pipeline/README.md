# Model 2: Dropout Risk Detection

Part of the AI-Based Academic Performance Prediction & Student Success Intelligence Platform.

## Overview
Predicts student dropout risk using the UCI "Predict Students' Dropout and Academic Success" dataset. Two model framings are provided:
- **Binary (primary, deployed)**: Dropout vs. Graduate — used for real-time risk flagging. Students still marked *Enrolled* are excluded because their final outcome is unresolved (including them as "not dropout" injects label noise and caps accuracy near ~88%).
- **3-Class (secondary, analytical)**: Dropout / Enrolled / Graduate — used for institutional-level reporting on student trajectories.

## Dataset
UCI: Predict Students' Dropout and Academic Success — 4,424 students, 36 features (demographics, socio-economic factors, academic performance per semester).
Source: https://archive.ics.uci.edu/dataset/697/predict+students+dropout+and+academic+success
Citation: Realinho, V., et al. (2021). DOI: 10.24432/C5MC89

## Pipeline
src/
├── preprocessing.py           # Data loading, binary/multiclass target framing, encoding
├── train_binary_final.py      # Primary model: binary dropout classifier (5-fold CV)
├── train_multiclass_final.py  # Secondary model: 3-class classifier (5-fold CV, macro-F1)
├── explain_binary.py          # SHAP explainability for the binary model
├── predict.py                 # Inference function for a single student
└── api.py                     # FastAPI endpoint serving /predict
## How to run
```bash
pip install -r requirements.txt
python src/train_binary_final.py
python src/train_multiclass_final.py
python src/explain_binary.py

# Start API server
cd src
uvicorn api:app --reload --port 8001
```

## Results

| Model | Metric | Score |
|---|---|---|
| Binary (Stacking ensemble) | 5-Fold CV ROC-AUC | 0.947 ± 0.011 |
| Binary (Stacking ensemble) | Held-out Test ROC-AUC | 0.973 |
| Binary (Stacking ensemble) | Test Accuracy | **94.1%** (Dropout vs Graduate) |
| 3-Class (XGBoost) | 5-Fold CV Macro-F1 | 0.705 ± 0.016 |
| 3-Class (XGBoost) | Dropout F1 / Enrolled F1 / Graduate F1 | 0.78 / 0.51 / 0.87 |

**Note:** The 3-class model struggles specifically with the "Enrolled" category (F1=0.51), reflecting the inherent ambiguity of predicting outcomes for students whose trajectory hasn't concluded. That same ambiguity is why the binary deployed model uses Dropout vs Graduate only.

## Explainability
SHAP analysis identifies `Curricular units 2nd/1st sem (approved)` and `Tuition fees up to date` as the dominant predictors — combining academic performance with a genuinely actionable financial signal that institutions can intervene on directly.

## API Usage
`POST http://127.0.0.1:8001/predict` with a JSON body matching the `StudentInput` schema (see `/docs` for interactive testing). Returns:
```json
{
  "risk_label": "At-Risk" | "Not At-Risk",
  "dropout_probability": 0.0-1.0,
  "retention_probability": 0.0-1.0
}
```

## Models
Saved to `models/`:
- `dropout_binary_xgb_model.pkl` — primary deployed model
- `dropout_multiclass_xgb_model.pkl` — secondary analytical model
- `multiclass_target_encoder.pkl` — target label encoder for the 3-class model