import { useState } from "react";
import { predictDropoutRisk } from "../services/dropoutRiskApi";

function DropoutRiskCard({ student }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const checkRisk = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await predictDropoutRisk({
        marital_status: student.maritalStatus,
        application_mode: student.applicationMode,
        application_order: student.applicationOrder,
        course: student.course,
        daytime_evening_attendance: student.attendance,
        previous_qualification: student.prevQualification,
        previous_qualification_grade: student.prevQualificationGrade,
        nacionality: student.nationality,
        mothers_qualification: student.mothersQualification,
        fathers_qualification: student.fathersQualification,
        mothers_occupation: student.mothersOccupation,
        fathers_occupation: student.fathersOccupation,
        admission_grade: student.admissionGrade,
        displaced: student.displaced,
        educational_special_needs: student.specialNeeds,
        debtor: student.debtor,
        tuition_fees_up_to_date: student.tuitionUpToDate,
        gender: student.gender,
        scholarship_holder: student.scholarshipHolder,
        age_at_enrollment: student.ageAtEnrollment,
        international: student.international,
        curricular_units_1st_sem_credited: student.units1Credited,
        curricular_units_1st_sem_enrolled: student.units1Enrolled,
        curricular_units_1st_sem_evaluations: student.units1Evaluations,
        curricular_units_1st_sem_approved: student.units1Approved,
        curricular_units_1st_sem_grade: student.units1Grade,
        curricular_units_1st_sem_without_evaluations: student.units1NoEval,
        curricular_units_2nd_sem_credited: student.units2Credited,
        curricular_units_2nd_sem_enrolled: student.units2Enrolled,
        curricular_units_2nd_sem_evaluations: student.units2Evaluations,
        curricular_units_2nd_sem_approved: student.units2Approved,
        curricular_units_2nd_sem_grade: student.units2Grade,
        curricular_units_2nd_sem_without_evaluations: student.units2NoEval,
        unemployment_rate: student.unemploymentRate,
        inflation_rate: student.inflationRate,
        gdp: student.gdp,
      });
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dropout-risk-card">
      <button onClick={checkRisk} disabled={loading}>
        {loading ? "Checking..." : "Check Dropout Risk"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {result && (
        <div className={result.risk_label === "At-Risk" ? "risk-high" : "risk-low"}>
          <h3>{result.risk_label}</h3>
          <p>Dropout probability: {(result.dropout_probability * 100).toFixed(1)}%</p>
          <p>Retention probability: {(result.retention_probability * 100).toFixed(1)}%</p>
        </div>
      )}
    </div>
  );
}

export default DropoutRiskCard;