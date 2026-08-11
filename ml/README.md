# AI-Based Academic Performance Prediction & Student Success Intelligence Platform

Internship Task 2 — AI/ML & Backend components.
Supervisor: Dr. Asad Ullah.

## Integration with this app

These pipelines live under `ml/` in the Student Success Platform repo. The Node API
(`server/services/mlPrediction.service.js`) calls them via env vars:

| Env var | Default | Pipeline |
|---|---|---|
| `ML_ACADEMIC_API_URL` | `http://localhost:8000` | model1_pipeline |
| `ML_DROPOUT_API_URL` | `http://localhost:8001` | model2_pipeline |
| `ML_RECOMMENDER_API_URL` | `http://localhost:8002` | model3_pipeline |
| `ML_ANALYTICS_API_URL` | `http://localhost:8003` | model4_pipeline |

Raw training datasets (~11 GB) were **not** copied into this repo. Keep them at the
original path or symlink as `ml/datasets` if you need to retrain.

## System overview

Four independent, production-structured ML services, each served via FastAPI and consumed by a shared React dashboard.

| # | Model | Purpose | Port | Key metric |
|---|---|---|---|---|
| 1 | Academic Performance Prediction | Early-warning pass/fail risk from engagement + grades | 8000 | AUC 0.83 (4-week early-warning) |
| 2 | Dropout Risk Detection | Binary dropout risk from enrollment/academic/financial data | 8001 | Accuracy 94.1%, AUC 0.973 |
| 3 | Intervention Recommender | Skill-level weak-area recommendations from tutoring logs | 8002 | Mastery-gap ranking |
| 4 | Multi-Source Learning Analytics | Behavioral clustering for institutional reporting | 8003 | Silhouette 0.315, k=4 |

## Repository structure

```
ml/
├── model1_pipeline/            # Academic performance prediction
├── model2_pipeline/            # Dropout risk detection
├── model3_pipeline/            # Intervention recommender
├── model4_pipeline/            # Learning analytics / clustering
└── README.md                   # This file
```

Each `modelN_pipeline/` follows the same internal convention:

```
modelN_pipeline/
├── data/                  # (if applicable) intermediate cached data
├── models/                # trained .pkl models + fitted encoders/scalers
├── outputs/               # plots, text reports, CSV exports
├── src/
│   ├── preprocessing.py
│   ├── train_*.py
│   ├── explain_*.py
│   ├── predict.py
│   └── api.py             # FastAPI service
├── requirements.txt
└── README.md
```

## Running the full system

Each model's API runs independently on its own port. Open four terminals from the repo root:

```bash
# Terminal 1
cd ml/model1_pipeline/src && uvicorn api:app --reload --port 8000

# Terminal 2
cd ml/model2_pipeline/src && uvicorn api:app --reload --port 8001

# Terminal 3
cd ml/model3_pipeline/src && uvicorn api:app --reload --port 8002

# Terminal 4
cd ml/model4_pipeline/src && uvicorn api:app --reload --port 8003
```

Then start the platform with `npm run app` (or `npm run dev`). Set the `ML_*_API_URL`
values in `.env` to `http://localhost:8000`–`8003` when running locally.

## Methodology notes (for the paper)

- **Cross-validation**: All classification models report 5-fold stratified CV alongside held-out test metrics, to avoid overstating performance from a single lucky split.
- **Class imbalance**: Addressed via class-weighting (compared against SMOTE where relevant; class-weighting performed better on the smaller UCI Student Performance dataset).
- **Explainability**: SHAP analysis confirms Models 1 and 2 rely primarily on behavioral/academic/financial signals rather than demographic attributes.
- **Early-warning validity**: Model 1's OULAD variant is evaluated using only the first 4 weeks of data (not full-course data), to honestly reflect real-world early-intervention constraints.
- **Architectural honesty**: Model 3 operates on a pre-computed mastery table (standard in EDM research) rather than live arbitrary input, unlike Models 1/2/4 — documented explicitly rather than glossed over.

## Datasets and citations

- OULAD: Kuzilek, J., Hlosta, M., Zdrahal, Z. (2017). Open University Learning Analytics dataset. Scientific Data. https://archive.ics.uci.edu/dataset/349
- UCI Student Performance: Cortez, P., Silva, A. (2008). https://archive.ics.uci.edu/dataset/320
- UCI Dropout: Realinho, V., et al. (2021). DOI: 10.24432/C5MC89. https://archive.ics.uci.edu/dataset/697
- KDD Cup 2010 EDM Challenge: https://pslcdatashop.web.cmu.edu/KDDCup/
