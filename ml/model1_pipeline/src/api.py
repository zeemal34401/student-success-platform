from predict_xapi import predict_xapi_risk
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from predict import predict_student_risk

app = FastAPI(title="Student Success Prediction API", version="1.0")

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


class StudentInput(BaseModel):
    gender: str
    region: str
    highest_education: str
    imd_band: str
    age_band: str
    num_of_prev_attempts: int
    studied_credits: int
    disability: str
    total_clicks: float
    avg_clicks: float
    active_days: float
    avg_score: float
    num_assessments: float


@app.get("/")
def root():
    return {"status": "running", "model": "OULAD Early-Warning Risk Model"}


@app.get("/health")
def health():
    return {"status": "ok", "model": "OULAD Early-Warning Risk Model", "version": "1.0"}


@app.post("/predict")
def predict(student: StudentInput):
    try:
        result = predict_student_risk(student.dict())
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
class XapiStudentInput(BaseModel):
    gender: str
    NationalITy: str
    PlaceofBirth: str
    StageID: str
    GradeID: str
    SectionID: str
    Topic: str
    Semester: str
    Relation: str
    raisedhands: int
    VisITedResources: int
    AnnouncementsView: int
    Discussion: int
    ParentAnsweringSurvey: str
    ParentschoolSatisfaction: str
    StudentAbsenceDays: str
    
@app.post("/predict-xapi")
def predict_xapi(student: XapiStudentInput):
    try:
        result = predict_xapi_risk(student.dict())
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))