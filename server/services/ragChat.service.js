import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getDb } from '../db/connection.js'
import { AppError } from '../utils/response.js'
import { getStudentById } from './students.service.js'
import { getInterventions } from './reports.service.js'
import { buildTfidfIndex } from '../rag/retriever.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const knowledgePath = path.join(__dirname, '../rag/dataset-student-success.json')

let knowledgeDocs = []
let knowledgeIndex = null

function loadKnowledge() {
  if (knowledgeIndex) return knowledgeIndex
  const raw = JSON.parse(fs.readFileSync(knowledgePath, 'utf8'))
  knowledgeDocs = raw.map((row) => ({
    question: row.question,
    answer: row.answer,
    source: 'playbook',
  }))
  knowledgeIndex = buildTfidfIndex(knowledgeDocs)
  return knowledgeIndex
}

function studentSnapshot(student) {
  const courses = student.courses?.length ? student.courses.join(', ') : student.course
  return {
    id: student.id,
    name: student.name,
    course: courses,
    department: student.department,
    attendance: student.attendance,
    gpa: student.gpa,
    lmsActivity: student.lmsActivity,
    lateAssignments: student.lateAssignments,
    riskScore: student.riskScore,
    riskLevel: student.riskLevel,
    trend: student.trend,
  }
}

function listMessages(studentId, userId) {
  const db = getDb()
  return db
    .prepare(
      `
      SELECT id, role, content, created_at AS createdAt
      FROM rag_chat_messages
      WHERE student_id = ? AND user_id = ?
      ORDER BY created_at ASC, id ASC
    `,
    )
    .all(studentId, userId)
}

function summarizeText(text, maxLen = 160) {
  const cleaned = String(text ?? '').replace(/\s+/g, ' ').trim()
  if (!cleaned) return ''
  const sentence = cleaned.split(/(?<=[.!?])\s+/)[0] ?? cleaned
  if (sentence.length <= maxLen) return sentence
  return `${sentence.slice(0, maxLen - 1).trim()}…`
}

function detectIntent(query) {
  const q = query.toLowerCase()
  if (/(draft|write|message|email|outreach|text)/.test(q)) return 'outreach'
  if (/(summarize|summary|recap|prior|previous|history|what (have|did) we)/.test(q)) return 'summary'
  if (/(why.*(risk|at risk)|explain.*risk|what.*(risk|wrong)|concern)/.test(q)) return 'risk'
  if (/(this week|weekly|plan|next step|what should i do|try next|action)/.test(q)) return 'weekly'
  if (/(attendance|absent|missed class|lab)/.test(q)) return 'attendance'
  if (/(late|assignment|submit|deadline)/.test(q)) return 'assignments'
  if (/(lms|activity|login|engagement)/.test(q)) return 'lms'
  if (/(tutor|tutoring|office hours|help with)/.test(q)) return 'support'
  if (/(gpa|grade|exam|test)/.test(q)) return 'academic'
  return 'general'
}

function recentUserTopics(history, limit = 4) {
  return history
    .filter((row) => row.role === 'user')
    .slice(-limit)
    .map((row) => summarizeText(row.content, 120))
}

function normalizeQuery(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function isSimilarQuestion(a, b) {
  const left = normalizeQuery(a)
  const right = normalizeQuery(b)
  if (!left || !right) return false
  if (left === right) return true
  const leftTokens = new Set(left.split(' ').filter((token) => token.length > 3))
  const rightTokens = new Set(right.split(' ').filter((token) => token.length > 3))
  if (!leftTokens.size || !rightTokens.size) return false
  let overlap = 0
  for (const token of leftTokens) {
    if (rightTokens.has(token)) overlap += 1
  }
  const ratio = overlap / Math.min(leftTokens.size, rightTokens.size)
  return ratio >= 0.7
}

function countSimilarQuestions(query, history) {
  return history.filter((row) => row.role === 'user' && isSimilarQuestion(row.content, query)).length
}

function extractActionLines(content) {
  return String(content ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^(\d+\.|[-*])/.test(line) || /^(Try next|This week|Immediate|Priority)/i.test(line))
    .slice(0, 3)
}

function recentAssistantSnippets(history, limit = 3) {
  const snippets = []
  for (const row of history.filter((entry) => entry.role === 'assistant').slice(-limit)) {
    const actions = extractActionLines(row.content)
    if (actions.length) snippets.push(...actions)
    else snippets.push(summarizeText(row.content, 140))
  }
  return [...new Set(snippets)].slice(-limit)
}

function studentMemoryDocs(student, messages, interventions) {
  const snapshot = studentSnapshot(student)
  const docs = [
    {
      question: `Profile for ${snapshot.name}`,
      answer: `${snapshot.name} in ${snapshot.course}: attendance ${snapshot.attendance}%, GPA ${snapshot.gpa}, LMS ${snapshot.lmsActivity}%, ${snapshot.lateAssignments} late, ${snapshot.riskLevel} risk.`,
      source: 'profile',
    },
  ]

  if (interventions.length) {
    docs.push({
      question: `Interventions for ${snapshot.name}`,
      answer: interventions.slice(0, 3).join('; '),
      source: 'profile',
    })
  }

  for (let i = 0; i < messages.length; i += 1) {
    const msg = messages[i]
    if (msg.role !== 'user') continue
    const reply = messages.slice(i + 1).find((row) => row.role === 'assistant')
    docs.push({
      question: msg.content,
      answer: reply ? summarizeText(reply.content, 140) : 'No recorded follow-up yet.',
      source: 'history',
    })
  }

  return docs
}

function pickPlaybookHits(query, student, history, limit = 3) {
  loadKnowledge()
  const intent = detectIntent(query)
  const intentBoost =
    {
      outreach: 'outreach message personalize',
      weekly: 'weekly plan at-risk check-in',
      summary: 'prior conversations continuity advising',
      risk: 'risk score disengagement warning signs',
      attendance: 'attendance low missed class',
      assignments: 'late assignments deadline',
      lms: 'LMS activity login',
      support: 'tutoring office hours',
      academic: 'GPA exam grade recovery',
    }[intent] ?? ''

  const hits = knowledgeIndex.search(`${query} ${intentBoost}`.trim(), 8)
  const used = new Set(
    history
      .filter((row) => row.role === 'assistant')
      .flatMap((row) => summarizeText(row.content, 220).toLowerCase().split(/\W+/))
      .filter((token) => token.length > 4),
  )

  const fresh = []
  for (const hit of hits) {
    const overlap = hit.answer
      .toLowerCase()
      .split(/\W+/)
      .filter((token) => token.length > 4 && used.has(token)).length
    if (overlap >= 4) continue
    fresh.push(hit)
    if (fresh.length >= limit) break
  }

  return fresh.length ? fresh : hits.slice(0, limit)
}

function rankedMetrics(snapshot) {
  return [
    { key: 'attendance', value: snapshot.attendance, label: 'attendance' },
    { key: 'gpa', value: snapshot.gpa * 25, label: 'GPA' },
    { key: 'lmsActivity', value: snapshot.lmsActivity, label: 'LMS activity' },
    { key: 'lateAssignments', value: Math.max(0, 100 - snapshot.lateAssignments * 10), label: 'assignment timeliness' },
  ].sort((a, b) => a.value - b.value)
}

function weakestMetric(snapshot) {
  return rankedMetrics(snapshot)[0]
}

function actionForMetric(snapshot, metric) {
  switch (metric.key) {
    case 'attendance':
      return `Confirm why classes were missed and secure attendance at the next two ${snapshot.course} sessions.`
    case 'lateAssignments':
      return `Triage late work: pick one overdue item in ${snapshot.course} and set a 48-hour completion deadline.`
    case 'lmsActivity':
      return `Assign one concrete LMS task and verify login during your check-in.`
    case 'gpa':
      return `Identify the weakest graded topic in ${snapshot.course} and book tutoring before the next assessment.`
    default:
      return `Schedule a 15-minute check-in focused on one measurable win this week.`
  }
}

function primaryAction(snapshot, intent, interventions, repeatCount = 0) {
  const metrics = rankedMetrics(snapshot)
  const metric = metrics[Math.min(repeatCount, metrics.length - 1)]
  const metricAction = actionForMetric(snapshot, metric)

  if (repeatCount > 0) return metricAction

  if (intent === 'attendance' || snapshot.attendance < 70) {
    return actionForMetric(snapshot, metrics.find((row) => row.key === 'attendance') ?? metric)
  }
  if (intent === 'assignments' || snapshot.lateAssignments >= 4) {
    return actionForMetric(snapshot, metrics.find((row) => row.key === 'lateAssignments') ?? metric)
  }
  if (intent === 'lms' || snapshot.lmsActivity < 55) {
    return actionForMetric(snapshot, metrics.find((row) => row.key === 'lmsActivity') ?? metric)
  }
  if (intent === 'academic' || snapshot.gpa < 2.3) {
    return actionForMetric(snapshot, metrics.find((row) => row.key === 'gpa') ?? metric)
  }
  return interventions[repeatCount] ?? metricAction
}

function concerningMetrics(snapshot) {
  const flags = []
  if (snapshot.attendance < 80) flags.push({ key: 'attendance', label: 'attendance', display: `${snapshot.attendance}% attendance` })
  if (snapshot.gpa < 2.5) flags.push({ key: 'gpa', label: 'GPA', display: `GPA ${snapshot.gpa}` })
  if (snapshot.lmsActivity < 65) flags.push({ key: 'lmsActivity', label: 'LMS activity', display: `${snapshot.lmsActivity}% LMS activity` })
  if (snapshot.lateAssignments >= 2) {
    flags.push({
      key: 'lateAssignments',
      label: 'assignment timeliness',
      display: `${snapshot.lateAssignments} late assignment${snapshot.lateAssignments === 1 ? '' : 's'}`,
    })
  }
  return flags
}

function outreachFocus(snapshot) {
  const flags = concerningMetrics(snapshot)
  if (flags.length) return flags[0]
  if (snapshot.riskLevel === 'Low') {
    return { key: 'stretch', label: 'next challenge', display: 'staying ahead before midterms' }
  }
  return { key: 'engagement', label: 'engagement', display: 'keeping momentum in the course' }
}

function buildOutreachAnswer(snapshot, history, playbookHit) {
  const prior = recentUserTopics(history, 2)
  const focus = outreachFocus(snapshot)
  const supportLine =
    focus.key === 'stretch'
      ? `You're doing well in ${snapshot.course}, and I'd like to check in about ${focus.display}.`
      : `I noticed ${focus.display} in ${snapshot.course} and want to help you get back on track.`
  const lines = [
    `Draft outreach for ${snapshot.name}:`,
    '',
    `Hi ${snapshot.name.split(' ')[0]},`,
    '',
    supportLine,
    prior.length
      ? `We previously discussed ${prior[prior.length - 1].replace(/\.$/, '')}; I'd like to follow up on that.`
      : `Let's pick one small step you can finish before our next class.`,
    '',
    `Could you reply with two times that work, or stop by office hours?`,
    '',
    playbookHit ? `Tip: ${playbookHit.answer}` : null,
  ]
  return lines.filter(Boolean).join('\n')
}

function buildSummaryAnswer(snapshot, history, retrieved, interventions) {
  const userTurns = history.filter((row) => row.role === 'user')
  const priorActions = recentAssistantSnippets(history, 3)
  const historyNotes = retrieved.filter((row) => row.source === 'history')

  const lines = [`Advising summary for ${snapshot.name}:`, '']
  if (userTurns.length === 0) {
    lines.push('No prior chat yet for this student in your thread.')
  } else {
    lines.push('Topics already raised:')
    userTurns.slice(-4).forEach((turn, index) => {
      lines.push(`${index + 1}. ${turn.content}`)
    })
  }

  if (historyNotes.length || priorActions.length) {
    lines.push('', 'What was already tried or suggested:')
    const notes = [...new Set([...historyNotes.map((row) => row.answer), ...priorActions])]
    notes.slice(0, 3).forEach((note) => lines.push(`- ${note}`))
  }

  lines.push(
    '',
    `Current standing: ${snapshot.riskLevel} risk, attendance ${snapshot.attendance}%, GPA ${snapshot.gpa}, LMS ${snapshot.lmsActivity}%, ${snapshot.lateAssignments} late.`,
    '',
    `Try next (new): ${primaryAction(snapshot, 'weekly', interventions, 0)}`,
  )
  return lines.join('\n')
}

function buildRiskAnswer(snapshot, playbookHits) {
  const drivers = []
  if (snapshot.attendance < 75) drivers.push(`attendance at ${snapshot.attendance}%`)
  if (snapshot.gpa < 2.5) drivers.push(`GPA at ${snapshot.gpa}`)
  if (snapshot.lmsActivity < 60) drivers.push(`LMS activity at ${snapshot.lmsActivity}%`)
  if (snapshot.lateAssignments >= 3) drivers.push(`${snapshot.lateAssignments} late assignments`)

  const lines = [
    `${snapshot.name} is flagged ${snapshot.riskLevel} (${snapshot.riskScore}/100, trend ${snapshot.trend}).`,
    drivers.length
      ? `Main drivers: ${drivers.join('; ')}.`
      : 'Risk is elevated despite mixed metrics — review recent engagement changes.',
    playbookHits[0] ? playbookHits[0].answer : null,
    playbookHits[1] ? `Also consider: ${playbookHits[1].answer}` : null,
  ]
  return lines.filter(Boolean).join('\n\n')
}

function buildWeeklyAnswer(snapshot, history, interventions, playbookHits, intent, query) {
  const repeatCount = countSimilarQuestions(query, history)
  const prior = recentAssistantSnippets(history, 2)
  const action = primaryAction(snapshot, intent, interventions, repeatCount)
  const secondary =
    repeatCount > 0
      ? `Shift focus to ${rankedMetrics(snapshot)[Math.min(repeatCount, rankedMetrics(snapshot).length - 1)].label} this time.`
      : intent === 'attendance'
        ? `Submit one overdue item in ${snapshot.course}.`
        : intent === 'assignments'
          ? `Attend the next scheduled class without exception.`
          : `Send a brief progress update after completing the first action.`

  const lines = [`Weekly plan for ${snapshot.name}:`, '']
  if (repeatCount > 1) {
    lines.push('You asked something similar recently, so here is a different angle:')
    lines.push('')
  } else if (prior.length) {
    lines.push(`Building on prior notes (${prior[prior.length - 1]}), move forward with:`)
    lines.push('')
  }

  lines.push(`1. ${action}`)
  lines.push(`2. ${secondary}`)
  const playbook = playbookHits[Math.min(repeatCount, Math.max(playbookHits.length - 1, 0))]
  if (playbook) lines.push(`3. ${playbook.answer}`)
  else if (interventions[repeatCount + 1]) lines.push(`3. ${interventions[repeatCount + 1]}`)

  return lines.join('\n')
}

function buildFocusedAnswer(snapshot, intent, history, playbookHits, interventions, query) {
  const repeatCount = countSimilarQuestions(query, history)
  const priorTopic = recentUserTopics(history, 1)[0]
  const hit = playbookHits[Math.min(repeatCount, Math.max(playbookHits.length - 1, 0))]
  const lines = []

  if (repeatCount > 1) {
    lines.push(`You asked about this before for ${snapshot.name}. Here is a fresh recommendation:`)
  } else if (priorTopic && !isSimilarQuestion(priorTopic, query)) {
    lines.push(`Following up on “${priorTopic}” for ${snapshot.name}:`)
  } else {
    lines.push(`For ${snapshot.name} in ${snapshot.course}:`)
  }

  lines.push(hit?.answer ?? primaryAction(snapshot, intent, interventions, repeatCount))

  if (playbookHits[repeatCount + 1] && playbookHits[repeatCount + 1].answer !== hit?.answer) {
    lines.push('', `Additional angle: ${playbookHits[repeatCount + 1].answer}`)
  }

  if (intent !== 'general' && intent !== 'weekly') {
    lines.push('', `This week's priority: ${primaryAction(snapshot, intent, interventions, repeatCount)}`)
  }

  return lines.join('\n')
}

function generateAnswer({ student, query, retrieved, history, interventions }) {
  const snapshot = studentSnapshot(student)
  const intent = detectIntent(query)
  const playbookHits = retrieved.filter((row) => row.source === 'playbook')

  switch (intent) {
    case 'outreach':
      return buildOutreachAnswer(snapshot, history, playbookHits[countSimilarQuestions(query, history) % Math.max(playbookHits.length, 1)] ?? playbookHits[0])
    case 'summary':
      return buildSummaryAnswer(snapshot, history, retrieved, interventions)
    case 'risk':
      return buildRiskAnswer(snapshot, playbookHits)
    case 'weekly':
      return buildWeeklyAnswer(snapshot, history, interventions, playbookHits, intent, query)
    case 'attendance':
    case 'assignments':
    case 'lms':
    case 'support':
    case 'academic':
      return buildFocusedAnswer(snapshot, intent, history, playbookHits, interventions, query)
    default:
      return buildFocusedAnswer(snapshot, intent, history, playbookHits, interventions, query)
  }
}

export function getRagChat(studentId, user) {
  const student = getStudentById(studentId, user)
  if (!student) throw new AppError('Student not found', 404, 'STUDENT_NOT_FOUND')
  const messages = listMessages(studentId, user.id)
  return {
    student: studentSnapshot(student),
    messages,
  }
}

export function askRagChat(studentId, question, user) {
  const query = String(question ?? '').trim()
  if (!query) throw new AppError('Enter a question', 400, 'VALIDATION_ERROR')

  const student = getStudentById(studentId, user)
  if (!student) throw new AppError('Student not found', 404, 'STUDENT_NOT_FOUND')

  loadKnowledge()
  const history = listMessages(studentId, user.id)
  const interventions = getInterventions()[student.riskLevel] ?? []
  const memoryDocs = studentMemoryDocs(student, history, interventions)
  const memoryIndex = memoryDocs.length ? buildTfidfIndex(memoryDocs) : null

  const memoryHits = memoryIndex ? memoryIndex.search(query, 3) : []
  const playbookHits = pickPlaybookHits(query, student, history, 3)

  const seen = new Set()
  const uniqueRetrieved = []
  for (const row of [...memoryHits, ...playbookHits]) {
    const key = `${row.source}:${row.question}:${row.answer}`
    if (seen.has(key)) continue
    seen.add(key)
    uniqueRetrieved.push(row)
  }

  const answer = generateAnswer({
    student,
    query,
    retrieved: uniqueRetrieved,
    history,
    interventions,
  })

  const db = getDb()
  const insert = db.prepare(
    `INSERT INTO rag_chat_messages (student_id, user_id, role, content) VALUES (?, ?, ?, ?)`,
  )
  const save = db.transaction(() => {
    insert.run(studentId, user.id, 'user', query)
    insert.run(studentId, user.id, 'assistant', answer)
  })
  save()

  return {
    student: studentSnapshot(student),
    messages: listMessages(studentId, user.id),
    retrieved: uniqueRetrieved.slice(0, 5).map((row) => ({
      source: row.source,
      question: row.question,
      score: row.score,
    })),
  }
}
