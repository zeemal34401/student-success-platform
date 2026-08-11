from fastapi import FastAPI, HTTPException
import os
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from predict import predict_dropout_risk

app = FastAPI(title="Dropout Risk Prediction API", version="1.0")

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
    marital_status: int
    application_mode: int
    application_order: int
    course: int
    daytime_evening_attendance: int
    previous_qualification: int
    previous_qualification_grade: float
    nacionality: int
    mothers_qualification: int
    fathers_qualification: int
    mothers_occupation: int
    fathers_occupation: int
    admission_grade: float
    displaced: int
    educational_special_needs: int
    debtor: int
    tuition_fees_up_to_date: int
    gender: int
    scholarship_holder: int
    age_at_enrollment: int
    international: int
    curricular_units_1st_sem_credited: int
    curricular_units_1st_sem_enrolled: int
    curricular_units_1st_sem_evaluations: int
    curricular_units_1st_sem_approved: int
    curricular_units_1st_sem_grade: float
    curricular_units_1st_sem_without_evaluations: int
    curricular_units_2nd_sem_credited: int
    curricular_units_2nd_sem_enrolled: int
    curricular_units_2nd_sem_evaluations: int
    curricular_units_2nd_sem_approved: int
    curricular_units_2nd_sem_grade: float
    curricular_units_2nd_sem_without_evaluations: int
    unemployment_rate: float
    inflation_rate: float
    gdp: float


@app.get("/")
def root():
    return {"status": "running", "model": "Dropout Binary Risk Model"}


@app.get("/health")
def health():
    return {"status": "ok", "model": "Dropout Binary Risk Model", "version": "1.0"}


@app.post("/predict")
def predict(student: StudentInput):
    try:
        # Map camelCase/snake_case Pydantic fields back to the exact
        # original UCI column names the model was trained on
        data = student.dict()
        mapped = {
            "Marital status": data["marital_status"],
            "Application mode": data["application_mode"],
            "Application order": data["application_order"],
            "Course": data["course"],
            "Daytime/evening attendance": data["daytime_evening_attendance"],
            "Previous qualification": data["previous_qualification"],
            "Previous qualification (grade)": data["previous_qualification_grade"],
            "Nacionality": data["nacionality"],
            "Mother's qualification": data["mothers_qualification"],
            "Father's qualification": data["fathers_qualification"],
            "Mother's occupation": data["mothers_occupation"],
            "Father's occupation": data["fathers_occupation"],
            "Admission grade": data["admission_grade"],
            "Displaced": data["displaced"],
            "Educational special needs": data["educational_special_needs"],
            "Debtor": data["debtor"],
            "Tuition fees up to date": data["tuition_fees_up_to_date"],
            "Gender": data["gender"],
            "Scholarship holder": data["scholarship_holder"],
            "Age at enrollment": data["age_at_enrollment"],
            "International": data["international"],
            "Curricular units 1st sem (credited)": data["curricular_units_1st_sem_credited"],
            "Curricular units 1st sem (enrolled)": data["curricular_units_1st_sem_enrolled"],
            "Curricular units 1st sem (evaluations)": data["curricular_units_1st_sem_evaluations"],
            "Curricular units 1st sem (approved)": data["curricular_units_1st_sem_approved"],
            "Curricular units 1st sem (grade)": data["curricular_units_1st_sem_grade"],
            "Curricular units 1st sem (without evaluations)": data["curricular_units_1st_sem_without_evaluations"],
            "Curricular units 2nd sem (credited)": data["curricular_units_2nd_sem_credited"],
            "Curricular units 2nd sem (enrolled)": data["curricular_units_2nd_sem_enrolled"],
            "Curricular units 2nd sem (evaluations)": data["curricular_units_2nd_sem_evaluations"],
            "Curricular units 2nd sem (approved)": data["curricular_units_2nd_sem_approved"],
            "Curricular units 2nd sem (grade)": data["curricular_units_2nd_sem_grade"],
            "Curricular units 2nd sem (without evaluations)": data["curricular_units_2nd_sem_without_evaluations"],
            "Unemployment rate": data["unemployment_rate"],
            "Inflation rate": data["inflation_rate"],
            "GDP": data["gdp"],
        }
        result = predict_dropout_risk(mapped)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))