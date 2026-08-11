# Model 1: Academic Performance Prediction Engine

Part of the AI-Based Academic Performance Prediction & Student Success Intelligence Platform.

## Overview
Predicts whether a student will pass/succeed or fail/withdraw, using two independent datasets to validate performance across different data scales and structures.

## Datasets
1. **OULAD (Open University Learning Analytics Dataset)** — 32,593 students, demographics + VLE engagement + assessment scores.
   Source: https://archive.ics.uci.edu/dataset/349/open+university+learning+analytics+dataset
2. **UCI Student Performance Dataset** — 1,044 students (Math + Portuguese), demographics + academic history.
   Source: https://archive.ics.uci.edu/dataset/320/student+performance

## Pipeline
src/
├── preprocessing.py       # Shared data loading, merging, encoding (encoders saved to disk)
├── train_oulad_final.py   # Trains + evaluates OULAD model (5-fold CV + held-out test)
├── train_student_final.py # Trains + evaluates UCI model (class-weighted for imbalance)
└── explain_final.py       # SHAP explainability for both models

## How to run
```bash
pip install -r requirements.txt
python src/train_oulad_final.py
python src/train_student_final.py
python src/explain_final.py
```

## Results

| Dataset | Model | 5-Fold CV ROC-AUC | Test ROC-AUC | Test Accuracy |
|---|---|---|---|---|
| OULAD | XGBoost | 0.967 ± 0.001 | 0.971 | 91% |
| UCI Student Performance | XGBoost (class-weighted) | 0.805 ± 0.046 | 0.754 | 77% |

**Note:** The UCI dataset's smaller sample size (1,044 vs 32,593) and stronger class imbalance (78%/22%) result in higher variance across CV folds. This is a genuine data limitation, not a modeling defect, and is discussed as a comparative finding.

## Explainability
SHAP analysis confirms both models rely primarily on behavioral/performance features (assessment completion, average scores, engagement for OULAD; prior failures and absences for UCI) rather than demographic attributes — supporting fairness and interpretability of the risk-detection approach.

## Outputs
All plots and text reports saved to `outputs/`:
- Confusion matrices, ROC curves, SHAP summary plots
- Text-based classification reports per dataset

## Models
Trained models and their fitted label encoders saved to `models/` as `.pkl` files, ready for inference on new student data (encoders must be reused, not refit, to preserve consistent category mappings).