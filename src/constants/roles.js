export const ROLES = {
  DIRECTOR: 'Director / Dean',
  ADMIN: 'Academic Admin',
  DEPARTMENT_HEAD: 'Department Head',
  FACULTY: 'Faculty',
  STAFF: 'Administrative Staff',
  STUDENT: 'Student',
}

export const ROLE_HIERARCHY = [
  ROLES.DIRECTOR,
  ROLES.ADMIN,
  ROLES.DEPARTMENT_HEAD,
  ROLES.FACULTY,
  ROLES.STAFF,
]

export const NO_DEPARTMENT_ROLES = new Set([
  ROLES.DIRECTOR,
  ROLES.ADMIN,
  ROLES.STAFF,
])
