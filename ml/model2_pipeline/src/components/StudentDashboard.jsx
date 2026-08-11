import { useState } from "react";
import { predictStudentRisk } from "../services/riskPredictionApi";
import { predictDropoutRisk } from "../services/dropoutRiskApi";

function StudentDashboard({ student }) {
  const [academicResult, setAcademicResult] = useState(null);
  const [dropoutResult, setDropoutResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runFullAssessment = async () => {
    setLoading(true);
    setError(null);
    setAcademicResult(null);
    setDropoutResult(null);

    try {
      // Run both model calls in parallel — faster than sequential awaits
      const [academic, dropout] = await Promise.all([
        predictStudentRisk({
          gender: student.gender,
          region: student.region,
          highest_education: student.highestEducation,
          imd_band: student.imdBand,
          age_band: student.ageBand,
          num_of_prev_attempts: student.numPrevAttempts,
          studied_credits: student.studiedCredits,
          disability: student.disability,
          total_clicks: student.totalClicks,
          avg_clicks: student.avgClicks,
          active_days: student.activeDays,
          avg_score: student.avgScore,
          num_assessments: student.numAssessments,
        }),
        predictDropoutRisk({
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
          gender: student.gender2,
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
        }),
      ]);

      setAcademicResult(academic);
      setDropoutResult(dropout);
    } catch (err) {
      setError(err.message || "One or both predictions failed. Ensure both API servers are running (ports 8000 and 8001).");
    } finally {
      setLoading(false);
    }
  };

  // Combine both signals into one overall risk tier for a quick at-a-glance view
  const getOverallRisk = () => {
    if (!academicResult || !dropoutResult) return null;

    const academicRisk = academicResult.risk_label === "At-Risk";
    const dropoutRisk = dropoutResult.risk_label === "At-Risk";

    if (academicRisk && dropoutRisk) return { level: "Critical", color: "#c0392b" };
    if (academicRisk || dropoutRisk) return { level: "Elevated", color: "#e67e22" };
    return { level: "Low", color: "#27ae60" };
  };

  const overall = getOverallRisk();

  return (
    <div className="student-dashboard">
      <h2>Student Success Assessment{student.name ? `: ${student.name}` : ""}</h2>

      <button onClick={runFullAssessment} disabled={loading}>
        {loading ? "Running assessment..." : "Run Full Risk Assessment"}
      </button>

      {error && <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>}

      {overall && (
        <div
          style={{
            marginTop: "1rem",
            padding: "1rem",
            borderRadius: "8px",
            backgroundColor: overall.color,
            color: "white",
            fontWeight: "bold",
          }}
        >
          Overall Risk Level: {overall.level}
        </div>
      )}

      <div style={{ display: "flex", gap: "1.5rem", marginTop: "1.5rem" }}>
        {academicResult && (
          <div className="risk-panel" style={{ flex: 1, border: "1px solid #ddd", borderRadius: "8px", padding: "1rem" }}>
            <h3>Academic Performance (Model 1)</h3>
            <p style={{ fontWeight: "bold", color: academicResult.risk_label === "At-Risk" ? "#c0392b" : "#27ae60" }}>
              {academicResult.risk_label}
            </p>
            <p>Success probability: {(academicResult.success_probability * 100).toFixed(1)}%</p>
            <p>Risk probability: {(academicResult.risk_probability * 100).toFixed(1)}%</p>
          </div>
        )}

        {dropoutResult && (
          <div className="risk-panel" style={{ flex: 1, border: "1px solid #ddd", borderRadius: "8px", padding: "1rem" }}>
            <h3>Dropout Risk (Model 2)</h3>
            <p style={{ fontWeight: "bold", color: dropoutResult.risk_label === "At-Risk" ? "#c0392b" : "#27ae60" }}>
              {dropoutResult.risk_label}
            </p>
            <p>Dropout probability: {(dropoutResult.dropout_probability * 100).toFixed(1)}%</p>
            <p>Retention probability: {(dropoutResult.retention_probability * 100).toFixed(1)}%</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentDashboard;