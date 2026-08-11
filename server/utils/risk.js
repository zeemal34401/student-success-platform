export function scoreToRiskLevel(avgScore) {
  if (avgScore >= 75) return 'Critical'
  if (avgScore >= 55) return 'High'
  if (avgScore >= 35) return 'Medium'
  return 'Low'
}

export function generateEngagementTrend(students) {
  if (students.length === 0) {
    return Array.from({ length: 8 }, (_, i) => ({
      week: i + 1,
      weekLabel: `Week ${i + 1}`,
      attendance: 0,
      lmsActivity: 0,
    }))
  }

  const currentAttendance = Math.round(
    students.reduce((sum, s) => sum + s.attendance, 0) / students.length,
  )
  const currentLms = Math.round(
    students.reduce((sum, s) => sum + s.lmsActivity, 0) / students.length,
  )

  return Array.from({ length: 8 }, (_, i) => {
    const progress = i / 7
    const attendance = Math.round(
      currentAttendance + (100 - currentAttendance) * (1 - progress) * 0.12,
    )
    const lmsActivity = Math.round(
      currentLms + (100 - currentLms) * (1 - progress) * 0.12,
    )

    return {
      week: i + 1,
      weekLabel: `Week ${i + 1}`,
      attendance: Math.min(100, Math.max(0, attendance)),
      lmsActivity: Math.min(100, Math.max(0, lmsActivity)),
    }
  })
}

export function generateRiskTrend(student) {
  const { riskScore, trend, id } = student
  const seed = Number(String(id).replace(/\D/g, '')) || 1

  return Array.from({ length: 8 }, (_, i) => {
    const week = i + 1
    let score

    if (trend === 'down') {
      const start = Math.max(riskScore - 16 - (seed % 10), 10)
      score = Math.round(start + ((riskScore - start) * i) / 7)
    } else if (trend === 'up') {
      const start = Math.min(riskScore + 16 + (seed % 10), 98)
      score = Math.round(start - ((start - riskScore) * i) / 7)
    } else {
      const drift = ((seed + i) % 5) - 2
      score = Math.round(riskScore + drift)
    }

    return {
      week,
      weekLabel: `Week ${week}`,
      riskScore: Math.min(100, Math.max(5, score)),
    }
  })
}
