/**
 * Mock API responses for the Student Success Intelligence Platform.
 * Shape mirrors expected backend payloads so components can swap
 * fetch calls without structural changes.
 */

export const studentsResponse = {
  data: [
    {
      id: 'STU-1001',
      name: 'Aisha Rahman',
      course: 'CS-301 Data Structures',
      department: 'Computer Science',
      attendance: 62,
      gpa: 2.1,
      lmsActivity: 41,
      lateAssignments: 7,
      riskScore: 88,
      riskLevel: 'Critical',
      trend: 'down',
    },
    {
      id: 'STU-1002',
      name: 'Marcus Chen',
      course: 'MATH-220 Linear Algebra',
      department: 'Mathematics',
      attendance: 71,
      gpa: 2.4,
      lmsActivity: 55,
      lateAssignments: 5,
      riskScore: 79,
      riskLevel: 'High',
      trend: 'down',
    },
    {
      id: 'STU-1003',
      name: 'Elena Vasquez',
      course: 'BIO-150 Cell Biology',
      department: 'Biology',
      attendance: 78,
      gpa: 2.6,
      lmsActivity: 63,
      lateAssignments: 4,
      riskScore: 68,
      riskLevel: 'High',
      trend: 'flat',
    },
    {
      id: 'STU-1004',
      name: 'James Okafor',
      course: 'ENG-201 Technical Writing',
      department: 'English',
      attendance: 84,
      gpa: 2.8,
      lmsActivity: 72,
      lateAssignments: 3,
      riskScore: 54,
      riskLevel: 'Medium',
      trend: 'up',
    },
    {
      id: 'STU-1005',
      name: 'Sofia Petrov',
      course: 'PSY-110 Intro to Psychology',
      department: 'Psychology',
      attendance: 88,
      gpa: 3.0,
      lmsActivity: 76,
      lateAssignments: 2,
      riskScore: 42,
      riskLevel: 'Medium',
      trend: 'flat',
    },
    {
      id: 'STU-1006',
      name: 'David Kim',
      course: 'CS-210 Object-Oriented Programming',
      department: 'Computer Science',
      attendance: 58,
      gpa: 1.9,
      lmsActivity: 38,
      lateAssignments: 9,
      riskScore: 92,
      riskLevel: 'Critical',
      trend: 'down',
    },
    {
      id: 'STU-1007',
      name: 'Priya Sharma',
      course: 'MATH-310 Probability',
      department: 'Mathematics',
      attendance: 91,
      gpa: 3.4,
      lmsActivity: 85,
      lateAssignments: 1,
      riskScore: 22,
      riskLevel: 'Low',
      trend: 'up',
    },
    {
      id: 'STU-1008',
      name: 'Tyler Brooks',
      course: 'BIO-220 Genetics',
      department: 'Biology',
      attendance: 75,
      gpa: 2.5,
      lmsActivity: 58,
      lateAssignments: 4,
      riskScore: 65,
      riskLevel: 'High',
      trend: 'down',
    },
    {
      id: 'STU-1009',
      name: 'Nina Alvarez',
      course: 'ENG-305 American Literature',
      department: 'English',
      attendance: 93,
      gpa: 3.6,
      lmsActivity: 88,
      lateAssignments: 0,
      riskScore: 15,
      riskLevel: 'Low',
      trend: 'flat',
    },
    {
      id: 'STU-1010',
      name: 'Omar Hassan',
      course: 'PSY-250 Research Methods',
      department: 'Psychology',
      attendance: 82,
      gpa: 2.9,
      lmsActivity: 69,
      lateAssignments: 3,
      riskScore: 48,
      riskLevel: 'Medium',
      trend: 'up',
    },
    {
      id: 'STU-1011',
      name: 'Grace Liu',
      course: 'CS-340 Algorithms',
      department: 'Computer Science',
      attendance: 95,
      gpa: 3.7,
      lmsActivity: 91,
      lateAssignments: 0,
      riskScore: 12,
      riskLevel: 'Low',
      trend: 'up',
    },
    {
      id: 'STU-1012',
      name: 'Ryan Mitchell',
      course: 'MATH-150 Calculus II',
      department: 'Mathematics',
      attendance: 67,
      gpa: 2.2,
      lmsActivity: 47,
      lateAssignments: 6,
      riskScore: 81,
      riskLevel: 'Critical',
      trend: 'down',
    },
    {
      id: 'STU-1013',
      name: 'Hannah Wright',
      course: 'BIO-310 Ecology',
      department: 'Biology',
      attendance: 89,
      gpa: 3.2,
      lmsActivity: 80,
      lateAssignments: 1,
      riskScore: 28,
      riskLevel: 'Low',
      trend: 'flat',
    },
    {
      id: 'STU-1014',
      name: 'Carlos Mendez',
      course: 'ENG-220 Rhetoric',
      department: 'English',
      attendance: 80,
      gpa: 2.7,
      lmsActivity: 64,
      lateAssignments: 3,
      riskScore: 52,
      riskLevel: 'Medium',
      trend: 'down',
    },
    {
      id: 'STU-1015',
      name: 'Emily Foster',
      course: 'PSY-320 Cognitive Psychology',
      department: 'Psychology',
      attendance: 73,
      gpa: 2.3,
      lmsActivity: 52,
      lateAssignments: 5,
      riskScore: 74,
      riskLevel: 'High',
      trend: 'flat',
    },
  ],
  meta: {
    total: 15,
    page: 1,
    perPage: 20,
    generatedAt: '2026-07-02T10:00:00Z',
  },
}

export const engagementTrendResponse = {
  data: [
    { week: 1, weekLabel: 'Week 1', attendance: 89, lmsActivity: 82 },
    { week: 2, weekLabel: 'Week 2', attendance: 87, lmsActivity: 79 },
    { week: 3, weekLabel: 'Week 3', attendance: 85, lmsActivity: 76 },
    { week: 4, weekLabel: 'Week 4', attendance: 83, lmsActivity: 74 },
    { week: 5, weekLabel: 'Week 5', attendance: 81, lmsActivity: 71 },
    { week: 6, weekLabel: 'Week 6', attendance: 79, lmsActivity: 68 },
    { week: 7, weekLabel: 'Week 7', attendance: 77, lmsActivity: 65 },
    { week: 8, weekLabel: 'Week 8', attendance: 75, lmsActivity: 62 },
  ],
  meta: {
    term: 'Spring 2026',
    metric: 'weekly_engagement',
  },
}

export const retentionResponse = {
  data: [
    { term: 'Fall 2023', retentionRate: 91.2 },
    { term: 'Spring 2024', retentionRate: 89.8 },
    { term: 'Fall 2024', retentionRate: 88.5 },
    { term: 'Spring 2025', retentionRate: 87.1 },
    { term: 'Fall 2025', retentionRate: 86.4 },
    { term: 'Spring 2026', retentionRate: 85.9 },
  ],
  meta: {
    unit: 'percent',
    cohort: 'undergraduate',
  },
}

export const departmentRiskResponse = {
  data: [
    {
      department: 'Computer Science',
      critical: 8,
      high: 14,
      medium: 22,
      low: 56,
      totalStudents: 100,
    },
    {
      department: 'Mathematics',
      critical: 5,
      high: 11,
      medium: 19,
      low: 48,
      totalStudents: 83,
    },
    {
      department: 'Biology',
      critical: 3,
      high: 9,
      medium: 24,
      low: 61,
      totalStudents: 97,
    },
    {
      department: 'English',
      critical: 2,
      high: 6,
      medium: 18,
      low: 68,
      totalStudents: 94,
    },
    {
      department: 'Psychology',
      critical: 4,
      high: 10,
      medium: 21,
      low: 58,
      totalStudents: 93,
    },
  ],
  meta: {
    term: 'Spring 2026',
    riskDistributionUnit: 'percent',
  },
}

export const interventionsResponse = {
  data: {
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
  },
  meta: {
    version: '1.0',
    lastUpdated: '2026-06-15T08:30:00Z',
  },
}

export const facultyResponse = {
  data: [
    {
      id: 'FAC-001',
      name: 'Dr. Sarah Mitchell',
      email: 'faculty@university.edu',
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
      courses: ['CS-101 Intro to Programming', 'CS-250 Database Systems'],
    },
    {
      id: 'FAC-003',
      name: 'Dr. Mei Lin',
      email: 'mlin@university.edu',
      department: 'Computer Science',
      courses: ['CS-401 Machine Learning', 'CS-315 Software Engineering'],
    },
    {
      id: 'FAC-004',
      name: 'Dr. James Wu',
      email: 'jwu@university.edu',
      department: 'Computer Science',
      courses: ['CS-220 Computer Networks', 'CS-350 Operating Systems'],
    },
    {
      id: 'FAC-005',
      name: 'Prof. Priya Nair',
      email: 'pnair@university.edu',
      department: 'Computer Science',
      courses: ['CS-150 Foundations of Computing', 'CS-280 Web Development'],
    },
    {
      id: 'FAC-006',
      name: 'Dr. Carlos Ortiz',
      email: 'cortiz@university.edu',
      department: 'Computer Science',
      courses: ['CS-330 Computer Security', 'CS-390 Capstone Project'],
    },
  ],
  meta: {
    term: 'Spring 2026',
  },
}

function scoreToRiskLevel(avgScore) {
  if (avgScore >= 75) return 'Critical'
  if (avgScore >= 55) return 'High'
  if (avgScore >= 35) return 'Medium'
  return 'Low'
}

function enrichFacultyRecord(faculty, students) {
  const sectionStudents = students.filter((s) => faculty.courses.includes(s.course))
  const studentCount = sectionStudents.length
  const atRiskCount = sectionStudents.filter(
    (s) => s.riskLevel === 'Critical' || s.riskLevel === 'High',
  ).length
  const hasCriticalStudent = sectionStudents.some((s) => s.riskLevel === 'Critical')

  if (studentCount === 0) {
    return {
      ...faculty,
      studentCount: 0,
      avgRiskScore: null,
      avgClassRiskLevel: 'Low',
      atRiskCount: 0,
      hasCriticalStudent: false,
      sectionStudents: [],
    }
  }

  const avgRiskScore = Math.round(
    sectionStudents.reduce((sum, s) => sum + s.riskScore, 0) / studentCount,
  )

  return {
    ...faculty,
    studentCount,
    avgRiskScore,
    avgClassRiskLevel: scoreToRiskLevel(avgRiskScore),
    atRiskCount,
    hasCriticalStudent,
    sectionStudents,
  }
}

export const adminUsersResponse = {
  data: [
    {
      id: 'ADM-001',
      name: 'Dr. Sarah Mitchell',
      email: 'faculty@university.edu',
      role: 'Faculty',
      department: 'Computer Science',
      status: 'Active',
    },
    {
      id: 'ADM-002',
      name: 'James Porter',
      email: 'admin@university.edu',
      role: 'Academic Admin',
      department: 'Institution-wide',
      status: 'Active',
    },
    {
      id: 'ADM-003',
      name: 'Dr. Elena Vasquez',
      email: 'head@university.edu',
      role: 'Department Head',
      department: 'Computer Science',
      status: 'Active',
    },
    {
      id: 'ADM-004',
      name: 'Prof. Alan Reed',
      email: 'areed@university.edu',
      role: 'Faculty',
      department: 'Computer Science',
      status: 'Active',
    },
    {
      id: 'ADM-005',
      name: 'Dr. Mei Lin',
      email: 'mlin@university.edu',
      role: 'Faculty',
      department: 'Computer Science',
      status: 'Invited',
    },
    {
      id: 'ADM-006',
      name: 'Dr. Marcus Chen',
      email: 'mchen@university.edu',
      role: 'Department Head',
      department: 'Mathematics',
      status: 'Active',
    },
    {
      id: 'ADM-007',
      name: 'Prof. Nina Alvarez',
      email: 'nalvarez@university.edu',
      role: 'Faculty',
      department: 'English',
      status: 'Disabled',
    },
    {
      id: 'ADM-008',
      name: 'Prof. Priya Nair',
      email: 'pnair@university.edu',
      role: 'Faculty',
      department: 'Computer Science',
      status: 'Invited',
    },
    {
      id: 'ADM-009',
      name: 'Dr. Carlos Ortiz',
      email: 'cortiz@university.edu',
      role: 'Faculty',
      department: 'Biology',
      status: 'Active',
    },
    {
      id: 'ADM-010',
      name: 'Dr. Hannah Wright',
      email: 'hwright@university.edu',
      role: 'Department Head',
      department: 'Biology',
      status: 'Invited',
    },
  ],
  meta: {
    managedBy: 'Academic Admin',
    lastSyncedAt: '2026-07-02T09:00:00Z',
  },
}

export const INSTITUTION_DEPARTMENTS = [
  'Computer Science',
  'Mathematics',
  'Biology',
  'English',
  'Psychology',
]

/** Convenience accessors that mirror future API service functions */
export const getStudents = () => studentsResponse.data
export const getEngagementTrend = () => engagementTrendResponse.data
export const getRetentionRates = () => retentionResponse.data
export const getDepartmentRisk = () => departmentRiskResponse.data
export const getInterventions = () => interventionsResponse.data
export const getFaculty = () => facultyResponse.data

export const getAdminUsers = () => adminUsersResponse.data

export function getFacultyByDepartment(department) {
  return facultyResponse.data.filter((f) => f.department === department)
}

export function getFacultyById(facultyId) {
  return facultyResponse.data.find((f) => f.id === facultyId) ?? null
}

export function getFacultyOverview(department, students = getStudents()) {
  const deptStudents = students.filter((s) => s.department === department)
  const faculty = getFacultyByDepartment(department).map((f) =>
    enrichFacultyRecord(f, deptStudents),
  )

  const activeFaculty = faculty.filter((f) => f.studentCount > 0)
  const avgDepartmentRisk =
    activeFaculty.length > 0
      ? Math.round(
          activeFaculty.reduce((sum, f) => sum + f.avgRiskScore, 0) / activeFaculty.length,
        )
      : 0
  const facultyWithCritical = faculty.filter((f) => f.hasCriticalStudent).length

  return {
    faculty: [...faculty].sort((a, b) => b.atRiskCount - a.atRiskCount),
    summary: {
      totalFaculty: faculty.length,
      avgDepartmentRisk,
      avgDepartmentRiskLevel: scoreToRiskLevel(avgDepartmentRisk),
      facultyWithCritical,
    },
  }
}
