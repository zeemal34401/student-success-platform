import { pathToFileURL } from 'node:url'
import bcrypt from 'bcryptjs'
import { getDb, withTransaction } from './connection.js'

const CURRENT_TERM = 'Spring 2026'

const ROLES = [
  { name: 'Director / Dean', slug: 'director_dean' },
  { name: 'Academic Admin', slug: 'academic_admin' },
  { name: 'Department Head', slug: 'department_head' },
  { name: 'Faculty', slug: 'faculty' },
  { name: 'Administrative Staff', slug: 'administrative_staff' },
]

const DEPARTMENTS = [
  'Computer Science',
  'Mathematics',
  'Biology',
  'English',
  'Psychology',
]

const STUDENTS = [
  { id: 'STU-1001', name: 'Aisha Rahman', course: 'CS-301 Data Structures', department: 'Computer Science', attendance: 62, gpa: 2.1, lmsActivity: 41, lateAssignments: 7, riskScore: 88, riskLevel: 'Critical', trend: 'down' },
  { id: 'STU-1002', name: 'Marcus Chen', course: 'MATH-220 Linear Algebra', department: 'Mathematics', attendance: 71, gpa: 2.4, lmsActivity: 55, lateAssignments: 5, riskScore: 79, riskLevel: 'High', trend: 'down' },
  { id: 'STU-1003', name: 'Elena Vasquez', course: 'BIO-150 Cell Biology', department: 'Biology', attendance: 78, gpa: 2.6, lmsActivity: 63, lateAssignments: 4, riskScore: 68, riskLevel: 'High', trend: 'flat' },
  { id: 'STU-1004', name: 'James Okafor', course: 'ENG-201 Technical Writing', department: 'English', attendance: 84, gpa: 2.8, lmsActivity: 72, lateAssignments: 3, riskScore: 54, riskLevel: 'Medium', trend: 'up' },
  { id: 'STU-1005', name: 'Sofia Petrov', course: 'PSY-110 Intro to Psychology', department: 'Psychology', attendance: 88, gpa: 3.0, lmsActivity: 76, lateAssignments: 2, riskScore: 42, riskLevel: 'Medium', trend: 'flat' },
  { id: 'STU-1006', name: 'David Kim', course: 'CS-210 Object-Oriented Programming', department: 'Computer Science', attendance: 58, gpa: 1.9, lmsActivity: 38, lateAssignments: 9, riskScore: 92, riskLevel: 'Critical', trend: 'down' },
  { id: 'STU-1007', name: 'Priya Sharma', course: 'MATH-310 Probability', department: 'Mathematics', attendance: 91, gpa: 3.4, lmsActivity: 85, lateAssignments: 1, riskScore: 22, riskLevel: 'Low', trend: 'up' },
  { id: 'STU-1008', name: 'Tyler Brooks', course: 'BIO-220 Genetics', department: 'Biology', attendance: 75, gpa: 2.5, lmsActivity: 58, lateAssignments: 4, riskScore: 65, riskLevel: 'High', trend: 'down' },
  { id: 'STU-1009', name: 'Nina Alvarez', course: 'ENG-305 American Literature', department: 'English', attendance: 93, gpa: 3.6, lmsActivity: 88, lateAssignments: 0, riskScore: 15, riskLevel: 'Low', trend: 'flat' },
  { id: 'STU-1010', name: 'Omar Hassan', course: 'PSY-250 Research Methods', department: 'Psychology', attendance: 82, gpa: 2.9, lmsActivity: 69, lateAssignments: 3, riskScore: 48, riskLevel: 'Medium', trend: 'up' },
  { id: 'STU-1011', name: 'Grace Liu', course: 'CS-340 Algorithms', department: 'Computer Science', attendance: 95, gpa: 3.7, lmsActivity: 91, lateAssignments: 0, riskScore: 12, riskLevel: 'Low', trend: 'up' },
  { id: 'STU-1012', name: 'Ryan Mitchell', course: 'MATH-150 Calculus II', department: 'Mathematics', attendance: 67, gpa: 2.2, lmsActivity: 47, lateAssignments: 6, riskScore: 81, riskLevel: 'Critical', trend: 'down' },
  { id: 'STU-1013', name: 'Hannah Wright', course: 'BIO-310 Ecology', department: 'Biology', attendance: 89, gpa: 3.2, lmsActivity: 80, lateAssignments: 1, riskScore: 28, riskLevel: 'Low', trend: 'flat' },
  { id: 'STU-1014', name: 'Carlos Mendez', course: 'ENG-220 Rhetoric', department: 'English', attendance: 80, gpa: 2.7, lmsActivity: 64, lateAssignments: 3, riskScore: 52, riskLevel: 'Medium', trend: 'down' },
  { id: 'STU-1015', name: 'Emily Foster', course: 'PSY-320 Cognitive Psychology', department: 'Psychology', attendance: 73, gpa: 2.3, lmsActivity: 52, lateAssignments: 5, riskScore: 74, riskLevel: 'High', trend: 'flat' },
]

const FACULTY = [
  // Demo faculty — teaches every Computer Science section that has enrolled students
  {
    id: 'FAC-001',
    userId: 'USR-001',
    name: 'Dr. Sarah Mitchell',
    email: 'faculty@university.edu',
    password: 'faculty123',
    role: 'Faculty',
    department: 'Computer Science',
    courses: [
      'CS-301 Data Structures',
      'CS-210 Object-Oriented Programming',
      'CS-340 Algorithms',
    ],
  },
  {
    id: 'FAC-002',
    name: 'Prof. Alan Reed',
    email: 'areed@university.edu',
    department: 'Computer Science',
    courses: ['CS-301 Data Structures', 'CS-210 Object-Oriented Programming'],
  },
  {
    id: 'FAC-MATH',
    name: 'Dr. Priya Kapoor',
    email: 'pkapoor@university.edu',
    department: 'Mathematics',
    courses: ['MATH-220 Linear Algebra', 'MATH-310 Probability', 'MATH-150 Calculus II'],
  },
  {
    id: 'FAC-BIO',
    name: 'Dr. Carlos Ortiz',
    email: 'cortiz@university.edu',
    department: 'Biology',
    courses: ['BIO-150 Cell Biology', 'BIO-220 Genetics', 'BIO-310 Ecology'],
  },
  {
    id: 'FAC-ENG',
    name: 'Prof. Nina Alvarez',
    email: 'nalvarez@university.edu',
    department: 'English',
    courses: ['ENG-201 Technical Writing', 'ENG-305 American Literature', 'ENG-220 Rhetoric'],
  },
  {
    id: 'FAC-PSY',
    name: 'Dr. Sam Okonkwo',
    email: 'sokonkwo@university.edu',
    department: 'Psychology',
    courses: ['PSY-110 Intro to Psychology', 'PSY-250 Research Methods', 'PSY-320 Cognitive Psychology'],
  },
]

const DEMO_USERS = [
  {
    id: 'USR-001',
    name: 'Dr. Sarah Mitchell',
    email: 'faculty@university.edu',
    password: 'faculty123',
    role: 'Faculty',
    department: 'Computer Science',
    courses: [
      'CS-301 Data Structures',
      'CS-210 Object-Oriented Programming',
      'CS-340 Algorithms',
    ],
  },
  { id: 'USR-002', name: 'James Porter', email: 'admin@university.edu', password: 'admin123', role: 'Academic Admin', department: null },
  { id: 'USR-003', name: 'Dr. Elena Vasquez', email: 'head@university.edu', password: 'head123', role: 'Department Head', department: 'Computer Science' },
  { id: 'USR-004', name: 'Dr. Amelia Cross', email: 'director@university.edu', password: 'director123', role: 'Director / Dean', department: null },
  { id: 'USR-005', name: 'Jordan Hale', email: 'staff@university.edu', password: 'staff123', role: 'Administrative Staff', department: null },
]

const ADMIN_USERS = [
  { id: 'ADM-001', name: 'Dr. Sarah Mitchell', email: 'faculty@university.edu', role: 'Faculty', department: 'Computer Science', status: 'Active' },
  { id: 'ADM-002', name: 'James Porter', email: 'admin@university.edu', role: 'Academic Admin', department: 'Institution-wide', status: 'Active' },
  { id: 'ADM-003', name: 'Dr. Elena Vasquez', email: 'head@university.edu', role: 'Department Head', department: 'Computer Science', status: 'Active' },
  { id: 'ADM-004', name: 'Prof. Alan Reed', email: 'areed@university.edu', role: 'Faculty', department: 'Computer Science', status: 'Active' },
  { id: 'ADM-005', name: 'Dr. Priya Kapoor', email: 'pkapoor@university.edu', role: 'Faculty', department: 'Mathematics', status: 'Active' },
  { id: 'ADM-006', name: 'Dr. Marcus Chen', email: 'mchen@university.edu', role: 'Department Head', department: 'Mathematics', status: 'Active' },
  { id: 'ADM-007', name: 'Prof. Nina Alvarez', email: 'nalvarez@university.edu', role: 'Faculty', department: 'English', status: 'Active' },
  { id: 'ADM-008', name: 'Dr. Carlos Ortiz', email: 'cortiz@university.edu', role: 'Faculty', department: 'Biology', status: 'Active' },
  { id: 'ADM-009', name: 'Dr. Sam Okonkwo', email: 'sokonkwo@university.edu', role: 'Faculty', department: 'Psychology', status: 'Active' },
  { id: 'ADM-010', name: 'Dr. Hannah Wright', email: 'hwright@university.edu', role: 'Department Head', department: 'Biology', status: 'Active' },
]

const INTERVENTIONS = {
  Critical: [
    'Schedule immediate one-on-one academic advising session',
    'Enroll in mandatory peer tutoring within 48 hours',
    'Notify department chair and student success coordinator',
  ],
  High: [
    'Assign dedicated academic mentor for weekly check-ins',
    'Recommend structured study group participation',
    'Send personalized LMS engagement reminders',
  ],
  Medium: [
    'Offer optional workshop on time management and study skills',
    'Monitor assignment submission patterns for two weeks',
    'Provide access to supplemental learning resources',
  ],
  Low: [
    'Continue standard progress monitoring',
    'Recognize positive engagement in monthly advisor report',
    'Invite to peer mentoring program as a mentor candidate',
  ],
}

const RETENTION = [
  { term: 'Fall 2023', retentionRate: 91.2, sortOrder: 1 },
  { term: 'Spring 2024', retentionRate: 89.8, sortOrder: 2 },
  { term: 'Fall 2024', retentionRate: 88.5, sortOrder: 3 },
  { term: 'Spring 2025', retentionRate: 87.1, sortOrder: 4 },
  { term: 'Fall 2025', retentionRate: 86.4, sortOrder: 5 },
  { term: 'Spring 2026', retentionRate: 85.9, sortOrder: 6 },
]

const DEPT_RISK = [
  { department: 'Computer Science', critical: 8, high: 14, medium: 22, low: 56, totalStudents: 100 },
  { department: 'Mathematics', critical: 5, high: 11, medium: 19, low: 48, totalStudents: 83 },
  { department: 'Biology', critical: 3, high: 9, medium: 24, low: 61, totalStudents: 97 },
  { department: 'English', critical: 2, high: 6, medium: 18, low: 68, totalStudents: 94 },
  { department: 'Psychology', critical: 4, high: 10, medium: 21, low: 58, totalStudents: 93 },
]

const INSTITUTION_ENGAGEMENT = [
  { week: 1, attendance: 89, lmsActivity: 82 },
  { week: 2, attendance: 87, lmsActivity: 79 },
  { week: 3, attendance: 85, lmsActivity: 76 },
  { week: 4, attendance: 83, lmsActivity: 74 },
  { week: 5, attendance: 81, lmsActivity: 71 },
  { week: 6, attendance: 79, lmsActivity: 68 },
  { week: 7, attendance: 77, lmsActivity: 65 },
  { week: 8, attendance: 75, lmsActivity: 62 },
]

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
}

function parseCourse(displayName) {
  const match = displayName.match(/^([A-Z]+-\d+)\s+(.+)$/)
  if (match) return { code: match[1], title: match[2], displayName }
  return { code: displayName.slice(0, 12), title: displayName, displayName }
}

function ensureCourse(db, displayName, departmentId, cache) {
  if (cache.has(displayName)) return cache.get(displayName)
  const parsed = parseCourse(displayName)
  const existing = db
    .prepare('SELECT id FROM courses WHERE display_name = ?')
    .get(displayName)
  if (existing) {
    cache.set(displayName, existing.id)
    return existing.id
  }
  const result = db
    .prepare(
      `INSERT INTO courses (code, title, display_name, department_id)
       VALUES (?, ?, ?, ?)`,
    )
    .run(parsed.code, parsed.title, parsed.displayName, departmentId)
  cache.set(displayName, result.lastInsertRowid)
  return result.lastInsertRowid
}

export function seedDatabase({ force = false } = {}) {
  const db = getDb()
  const userCount = db.prepare('SELECT COUNT(*) AS count FROM users').get().count

  if (userCount > 0 && !force) {
    console.log('Database already seeded. Use force=true to reseed.')
    return
  }

  if (force) {
    const tables = [
      'auth_sessions',
      'recommendation_decisions',
      'user_notification_preferences',
      'faculty_courses',
      'student_metrics',
      'students',
      'intervention_templates',
      'engagement_weekly_snapshots',
      'department_risk_snapshots',
      'retention_rates',
      'courses',
      'users',
      'terms',
      'departments',
      'roles',
    ]
    db.exec('PRAGMA foreign_keys = OFF')
    for (const table of tables) db.exec(`DELETE FROM ${table}`)
    db.exec('PRAGMA foreign_keys = ON')
  }

  withTransaction(() => {
    for (const role of ROLES) {
      db.prepare('INSERT INTO roles (name, slug) VALUES (?, ?)').run(role.name, role.slug)
    }

    const roleMap = Object.fromEntries(
      db.prepare('SELECT id, name FROM roles').all().map((r) => [r.name, r.id]),
    )

    for (const name of DEPARTMENTS) {
      db.prepare('INSERT INTO departments (name, slug) VALUES (?, ?)').run(name, slugify(name))
    }

    const deptMap = Object.fromEntries(
      db.prepare('SELECT id, name FROM departments').all().map((d) => [d.name, d.id]),
    )

    db.prepare('INSERT INTO terms (name, is_current) VALUES (?, 1)').run(CURRENT_TERM)
    const termId = db.prepare('SELECT id FROM terms WHERE name = ?').get(CURRENT_TERM).id

    const courseCache = new Map()
    const allCourseNames = new Set([
      ...STUDENTS.map((s) => s.course),
      ...FACULTY.flatMap((f) => f.courses),
      ...DEMO_USERS.flatMap((u) => u.courses ?? []),
    ])

    for (const courseName of allCourseNames) {
      const student = STUDENTS.find((s) => s.course === courseName)
      const facultyMember = FACULTY.find((f) => f.courses.includes(courseName))
      const deptName = student?.department ?? facultyMember?.department ?? 'Computer Science'
      ensureCourse(db, courseName, deptMap[deptName], courseCache)
    }

    const insertUser = db.prepare(`
      INSERT INTO users (id, email, password_hash, name, role_id, department_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    const insertNotificationPrefs = db.prepare(`
      INSERT INTO user_notification_preferences (user_id, critical_alerts, weekly_digest, intervention_updates)
      VALUES (?, 1, 1, 0)
    `)

    for (const user of DEMO_USERS) {
      const hash = bcrypt.hashSync(user.password, 10)
      insertUser.run(
        user.id,
        user.email,
        hash,
        user.name,
        roleMap[user.role],
        user.department ? deptMap[user.department] : null,
        'Active',
      )
      insertNotificationPrefs.run(user.id)

      if (user.courses?.length) {
        for (const courseName of user.courses) {
          db.prepare(
            `INSERT INTO faculty_courses (user_id, course_id, term_id) VALUES (?, ?, ?)`,
          ).run(user.id, courseCache.get(courseName), termId)
        }
      }
    }

    for (const faculty of FACULTY) {
      if (faculty.userId) continue
      const userId = faculty.id.replace('FAC', 'USR-FAC')
      const hash = bcrypt.hashSync('changeme123', 10)
      insertUser.run(
        userId,
        faculty.email,
        hash,
        faculty.name,
        roleMap.Faculty,
        deptMap[faculty.department],
        'Active',
      )
      insertNotificationPrefs.run(userId)
      for (const courseName of faculty.courses) {
        db.prepare(
          `INSERT INTO faculty_courses (user_id, course_id, term_id) VALUES (?, ?, ?)`,
        ).run(userId, courseCache.get(courseName), termId)
      }
    }

    for (const adminUser of ADMIN_USERS) {
      const existing = db.prepare('SELECT id FROM users WHERE email = ? COLLATE NOCASE').get(adminUser.email)
      if (existing) {
        db.prepare('UPDATE users SET status = ? WHERE id = ?').run(adminUser.status, existing.id)
        continue
      }

      const id = adminUser.id.replace('ADM', 'USR-ADM')
      insertUser.run(
        id,
        adminUser.email,
        bcrypt.hashSync('invite123', 10),
        adminUser.name,
        roleMap[adminUser.role],
        adminUser.department === 'Institution-wide'
          ? null
          : deptMap[adminUser.department] ?? null,
        adminUser.status,
      )
      insertNotificationPrefs.run(id)
    }

    const insertStudent = db.prepare(`
      INSERT INTO students (id, name, course_id, department_id)
      VALUES (?, ?, ?, ?)
    `)
    const insertMetrics = db.prepare(`
      INSERT INTO student_metrics
        (student_id, term_id, attendance, gpa, lms_activity, late_assignments, risk_score, risk_level, trend)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    for (const student of STUDENTS) {
      insertStudent.run(
        student.id,
        student.name,
        courseCache.get(student.course),
        deptMap[student.department],
      )
      insertMetrics.run(
        student.id,
        termId,
        student.attendance,
        student.gpa,
        student.lmsActivity,
        student.lateAssignments,
        student.riskScore,
        student.riskLevel,
        student.trend,
      )
    }

    let sortOrder = 0
    for (const [riskLevel, actions] of Object.entries(INTERVENTIONS)) {
      for (const action of actions) {
        sortOrder += 1
        db.prepare(
          `INSERT INTO intervention_templates (risk_level, action_text, sort_order) VALUES (?, ?, ?)`,
        ).run(riskLevel, action, sortOrder)
      }
    }

    for (const row of RETENTION) {
      db.prepare(
        `INSERT INTO retention_rates (term, retention_rate, cohort, sort_order) VALUES (?, ?, 'undergraduate', ?)`,
      ).run(row.term, row.retentionRate, row.sortOrder)
    }

    for (const row of DEPT_RISK) {
      db.prepare(`
        INSERT INTO department_risk_snapshots
          (department_id, term_id, critical_pct, high_pct, medium_pct, low_pct, total_students)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        deptMap[row.department],
        termId,
        row.critical,
        row.high,
        row.medium,
        row.low,
        row.totalStudents,
      )
    }

    for (const row of INSTITUTION_ENGAGEMENT) {
      db.prepare(`
        INSERT INTO engagement_weekly_snapshots
          (term_id, week_number, week_label, scope_type, scope_id, attendance_avg, lms_activity_avg)
        VALUES (?, ?, ?, 'institution', NULL, ?, ?)
      `).run(termId, row.week, `Week ${row.week}`, row.attendance, row.lmsActivity)
    }
  })

  console.log('Database seeded successfully.')
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const force = process.argv.includes('--force')
  seedDatabase({ force })
}
