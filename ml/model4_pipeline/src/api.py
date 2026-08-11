from fastapi import FastAPI, HTTPException
import os
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from predict import get_student_cluster, classify_new_student, get_cluster_summary

app = FastAPI(title="Multi-Source Learning Analytics API", version="1.0")

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


class StudentFeatures(BaseModel):
    num_of_prev_attempts: int
    studied_credits: int
    total_clicks: float
    avg_clicks: float
    active_days: float
    avg_score: float
    num_assessments: float


@app.get("/")
def root():
    return {"status": "running", "model": "K-Means Student Clustering (k=4)"}


@app.get("/health")
def health():
    return {"status": "ok", "model": "K-Means Student Clustering (k=4)", "version": "1.0"}


@app.get("/cluster/student/{id_student}")
def student_cluster(id_student: int):
    result = get_student_cluster(id_student)
    if not result["found"]:
        raise HTTPException(status_code=404, detail=result["message"])
    return result


@app.post("/cluster/classify")
def classify(student: StudentFeatures):
    try:
        return classify_new_student(student.dict())
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/cluster/summary")
def summary():
    return get_cluster_summary()
