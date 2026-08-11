from fastapi import FastAPI, HTTPException
import os
from fastapi.middleware.cors import CORSMiddleware
from predict import get_recommendations

app = FastAPI(title="Academic Intervention Recommender API", version="1.0")

_cors_origins = os.environ.get(
    "ML_CORS_ORIGINS", "http://localhost:5173,http://localhost:3001"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"status": "running", "model": "KC Mastery-Based Intervention Recommender"}


@app.get("/health")
def health():
    return {"status": "ok", "model": "KC Mastery-Based Intervention Recommender", "version": "1.0"}


@app.get("/recommend/{student_id}")
def recommend(student_id: str, top_n: int = 5):
    try:
        result = get_recommendations(student_id, top_n=top_n)
        if not result["found"]:
            raise HTTPException(status_code=404, detail=result["message"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
@app.get("/students")
def list_students():
    from predict import _df
    ids = _df["student_id"].unique().tolist()
    return {"student_ids": ids[:200]}