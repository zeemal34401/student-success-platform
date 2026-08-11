/**
 * Demo user accounts for local development.
 * Replace with API auth when connecting to a real backend.
 */

export const mockUsers = [
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
  {
    id: 'USR-002',
    name: 'James Porter',
    email: 'admin@university.edu',
    password: 'admin123',
    role: 'Academic Admin',
  },
  {
    id: 'USR-003',
    name: 'Dr. Elena Vasquez',
    email: 'head@university.edu',
    password: 'head123',
    role: 'Department Head',
    department: 'Computer Science',
  },
]

/** Faculty roster used by Department Head and Admin views */
export const mockFacultyRoster = [
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
    name: 'Dr. Marcus Chen',
    email: 'mchen@university.edu',
    department: 'Mathematics',
    courses: ['MATH-220 Linear Algebra', 'MATH-310 Probability'],
  },
  {
    id: 'FAC-005',
    name: 'Prof. Nina Alvarez',
    email: 'nalvarez@university.edu',
    department: 'English',
    courses: ['ENG-201 Technical Writing', 'ENG-305 American Literature'],
  },
]

export const ROLES = {
  FACULTY: 'Faculty',
  DEPARTMENT_HEAD: 'Department Head',
  ADMIN: 'Academic Admin',
}

export function authenticateUser(email, password, role) {
  const user = mockUsers.find(
    (u) =>
      u.email.toLowerCase() === email.trim().toLowerCase() &&
      u.password === password &&
      u.role === role,
  )

  if (!user) return null

  const { password: _, ...safeUser } = user
  return safeUser
}

export function getDemoAccounts() {
  return mockUsers.map(({ name, email, password, role }) => ({
    name,
    email,
    password,
    role,
  }))
}
