# Model 3: Personalized Academic Intervention Recommender

Part of the AI-Based Academic Performance Prediction & Student Success Intelligence Platform.

## Overview
Recommends targeted skill-based interventions for students by identifying their weakest Knowledge Components (KCs) from tutoring interaction logs, ranked by a combination of individual weakness and broad skill difficulty.

## Approach
Unlike Models 1 and 2 (which classify new incoming student data), Model 3 uses a **mastery estimation + rule-based ranking** approach grounded in Educational Data Mining (EDM) research:
1. Aggregate per-student, per-skill mastery statistics from tutoring transaction logs (correct-first-attempt rate, hints used, error rate).
2. Compute broad skill difficulty across all students (skills with lower average mastery are higher intervention priority).
3. Rank each student's weak skills using a weighted priority score: `0.7 × (1 − personal mastery) + 0.3 × (1 − class average mastery)`.

**Architectural note:** This model operates on a pre-computed mastery table derived from historical tutoring logs, rather than accepting live, arbitrary student data at request-time (unlike Models 1/2). This reflects standard practice in EDM research, where mastery is estimated from accumulated interaction history rather than a single snapshot.

## Dataset
KDD Cup 2010 Educational Data Mining Challenge — Algebra 2006-2007 dataset. ~2.4 million tutoring transaction rows, 1,322 students, 300 human-readable Knowledge Components (after filtering internal system rule codes).
Source: https://pslcdatashop.web.cmu.edu/KDDCup/

## Pipeline
src/
├── preprocessing.py   # Chunked processing of large transaction log into per-student-KC mastery table
├── recommender.py     # Skill difficulty computation + priority-ranked recommendation logic
├── predict.py          # Inference function: get recommendations for a given student_id
└── api.py              # FastAPI endpoint serving GET /recommend/{student_id}
## How to run
```bash
pip install -r requirements.txt
python src/preprocessing.py      # Builds student_kc_mastery.csv (takes a few minutes, processes 533MB in chunks)
python src/recommender.py        # Test recommendation logic + save skill difficulty stats

# Start API server
cd src
uvicorn api:app --reload --port 8002
```

## API Usage
`GET http://127.0.0.1:8002/recommend/{student_id}?top_n=5`

Returns:
```json
{
  "student_id": "0I891Gg",
  "found": true,
  "recommendations": [
    {
      "skill": "Plot imperfect radical",
      "student_mastery": 0.0,
      "class_average_mastery": 0.369,
      "priority_score": 0.889
    }
  ]
}
```

## Known Limitations
- Only supports students present in the KDD Cup training dataset (no live mastery computation for new/arbitrary students yet).
- A small number of internal tutoring-system rule codes may still appear among skill names despite filtering (e.g. concatenated labels); these are rare and don't affect ranking correctness.

## Outputs
`outputs/skill_difficulty_stats.csv` — average mastery and student count per skill, usable for institutional curriculum-difficulty reporting.