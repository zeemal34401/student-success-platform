import { getDb } from '../db/connection.js'
import { getCurrentTerm } from './auth.service.js'
import { listStudents, ROLES } from './students.service.js'

export function getInterventions() {
  const db = getDb()
  const rows = db
    .prepare(
      `
      SELECT risk_level AS riskLevel, action_text AS actionText
      FROM intervention_templates
      WHERE is_active = 1
      ORDER BY sort_order
    `,
    )
    .all()

  return rows.reduce((acc, row) => {
    if (!acc[row.riskLevel]) acc[row.riskLevel] = []
    acc[row.riskLevel].push(row.actionText)
    return acc
  }, {})
}

export function getInstitutionalReports(user) {
  const db = getDb()
  const { id: termId, name: term } = getCurrentTerm()
  const students = listStudents(user)

  const retentionRates = db
    .prepare(
      `SELECT term, retention_rate AS retentionRate FROM retention_rates ORDER BY sort_order`,
    )
    .all()

  const latestRetention = retentionRates[retentionRates.length - 1]?.retentionRate ?? 0

  let departmentQuery = `
    SELECT
      d.name AS department,
      drs.critical_pct AS critical,
      drs.high_pct AS high,
      drs.medium_pct AS medium,
      drs.low_pct AS low,
      drs.total_students AS totalStudents
    FROM department_risk_snapshots drs
    JOIN departments d ON d.id = drs.department_id
    WHERE drs.term_id = ?
  `
  const deptParams = [termId]

  if (user.role === ROLES.DEPARTMENT_HEAD) {
    departmentQuery += ' AND d.name = ?'
    deptParams.push(user.department)
  }

  departmentQuery += ' ORDER BY d.name'
  const departmentRisk = db.prepare(departmentQuery).all(...deptParams)

  const totals = { Critical: 0, High: 0, Medium: 0, Low: 0 }
  students.forEach((s) => {
    totals[s.riskLevel] += 1
  })

  const riskDistribution = Object.entries(totals).map(([name, value]) => ({ name, value }))

  const totalStudents =
    user.role === ROLES.DEPARTMENT_HEAD
      ? students.length
      : departmentRisk.reduce((sum, d) => sum + d.totalStudents, 0)

  const criticalRiskCount =
    user.role === ROLES.DEPARTMENT_HEAD
      ? students.filter((s) => s.riskLevel === 'Critical').length
      : departmentRisk.reduce(
          (sum, d) => sum + Math.round((d.critical / 100) * d.totalStudents),
          0,
        )

  const coursesTracked = new Set(students.map((s) => s.course)).size

  return {
    stats: {
      totalStudents,
      latestRetention,
      criticalRiskCount,
      coursesTracked,
    },
    retentionRates,
    riskDistribution,
    departmentRisk,
    meta: { term },
  }
}

export function getEngagementMeta() {
  const { name: term } = getCurrentTerm()
  return { term }
}
