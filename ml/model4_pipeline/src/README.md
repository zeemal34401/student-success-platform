# Model 4: Multi-Source Learning Analytics Framework

Part of the AI-Based Academic Performance Prediction & Student Success Intelligence Platform.

## Overview
Segments students into behavioral/performance clusters using unsupervised learning (K-Means + PCA) on multi-source OULAD data (demographics, VLE engagement, assessment performance), enabling institutional-level analytics beyond individual risk scores.

## Approach
1. Merge demographics + engagement + assessment features (same multi-source pipeline as Model 1).
2. Standardize features and reduce dimensionality via PCA for visualization.
3. Fit K-Means (k=4, selected via silhouette score) to segment students into behavioral profiles.
4. Profile each cluster's outcome distribution (Pass/Fail/Withdrawn/Distinction rates) to validate that clusters correspond to meaningfully different trajectories.

## Dataset
OULAD (Open University Learning Analytics Dataset) — same merged dataset as Model 1, 32,593 student-course records.
Source: https://archive.ics.uci.edu/dataset/349/open+university+learning+analytics+dataset

## Results

| Cluster | Label | Size | Pass | Distinction | Fail | Withdrawn |
|---|---|---|---|---|---|---|
| 0 | Disengaged / High Withdrawal Risk | 7,427 (22.8%) | 0.1% | 0.0% | 21.3% | 78.6% |
| 1 | High Achiever | 5,831 (17.9%) | 67.6% | 24.1% | 6.7% | 1.6% |
| 2 | Moderate Engagement / Mixed Outcome | 16,282 (50.0%) | 45.8% | 9.3% | 24.5% | 20.5% |
| 3 | Repeat Attempter / Struggling | 3,053 (9.4%) | 31.5% | 3.4% | 35.9% | 29.1% |

- Silhouette score: 0.315 (moderate — clusters are meaningful but overlapping, reflecting the continuous nature of student engagement data)
- PCA explained variance: 47.3% (PC1) + 16.6% (PC2) = ~64% in 2D

**Note:** Clusters show substantially different outcome distributions despite being formed using only behavioral/engagement features (no outcome labels used during training), confirming genuine signal. However, PCA visualization shows overlapping cluster boundaries — cluster assignments are best used as a probabilistic risk indicator rather than a hard categorical label.

## Pipeline
src/
├── preprocessing.py     # OULAD merge + feature scaling for clustering
├── train_clustering.py  # K selection (elbow + silhouette), K-Means fit, PCA, cluster profiling
├── predict.py            # Lookup existing student cluster, classify new student, get institutional summary
└── api.py                # FastAPI endpoints
## How to run
```bash
pip install -r requirements.txt
python src/train_clustering.py

cd src
uvicorn api:app --reload --port 8003
```

## API Usage
- `GET /cluster/student/{id_student}` — cluster assignment for an existing student
- `POST /cluster/classify` — classify a new student given their features
- `GET /cluster/summary` — institutional-level cluster size and outcome breakdown

## Models
Saved to `models/`: `kmeans_model.pkl`, `pca_model.pkl`, `cluster_scaler.pkl`