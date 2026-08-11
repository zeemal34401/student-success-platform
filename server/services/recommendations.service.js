import { getDb } from '../db/connection.js'
import { getCurrentTerm } from './auth.service.js'
import { getInterventions } from './reports.service.js'
import { listStudents } from './students.service.js'
import { AppError } from '../utils/response.js'

export function getRecommendations(user) {
  const students = listStudents(user)
    .filter((s) => s.riskLevel !== 'Low')
    .sort((a, b) => b.riskScore - a.riskScore)

  const db = getDb()
  const { id: termId } = getCurrentTerm()

  const decisions = db
    .prepare(
      `
      SELECT student_id AS studentId, decision
      FROM recommendation_decisions
      WHERE user_id = ? AND term_id = ?
    `,
    )
    .all(user.id, termId)

  const decisionMap = Object.fromEntries(decisions.map((d) => [d.studentId, d.decision]))
  const interventions = getInterventions()

  const items = students.map((student) => ({
    ...student,
    decision: decisionMap[student.id] ?? null,
    interventions: interventions[student.riskLevel] ?? [],
  }))

  const pendingCount = items.filter((s) => !s.decision).length
  const acceptedCount = items.filter((s) => s.decision === 'accepted').length
  const dismissedCount = items.filter((s) => s.decision === 'dismissed').length

  return {
    items,
    summary: { pendingCount, acceptedCount, dismissedCount },
  }
}

export function saveRecommendationDecision(user, studentId, decision) {
  if (!['accepted', 'dismissed'].includes(decision)) {
    throw new AppError('Decision must be accepted or dismissed', 400, 'INVALID_DECISION')
  }

  const student = listStudents(user).find((s) => s.id === studentId)
  if (!student) throw new AppError('Student not found in your scope', 404, 'STUDENT_NOT_FOUND')

  const db = getDb()
  const { id: termId } = getCurrentTerm()

  db.prepare(
    `
    INSERT INTO recommendation_decisions (user_id, student_id, term_id, decision, updated_at)
    VALUES (?, ?, ?, ?, datetime('now'))
    ON CONFLICT(user_id, student_id, term_id) DO UPDATE SET
      decision = excluded.decision,
      updated_at = datetime('now')
  `,
  ).run(user.id, studentId, termId, decision)

  return {
    studentId,
    studentName: student.name,
    decision,
  }
}
