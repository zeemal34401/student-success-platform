/** Canonical role display names — must match `roles.name` in the database. */
export const ROLES = {
  DIRECTOR: 'Director / Dean',
  ADMIN: 'Academic Admin',
  DEPARTMENT_HEAD: 'Department Head',
  FACULTY: 'Faculty',
  STAFF: 'Administrative Staff',
}

/** Roles with institution-wide student visibility (no department/course filter). */
export const INSTITUTION_WIDE_ROLES = new Set([
  ROLES.DIRECTOR,
  ROLES.ADMIN,
  ROLES.STAFF,
])

/** Roles that do not require a department assignment. */
export const NO_DEPARTMENT_ROLES = new Set([
  ROLES.DIRECTOR,
  ROLES.ADMIN,
  ROLES.STAFF,
])

export const ROLE_HIERARCHY = [
  ROLES.DIRECTOR,
  ROLES.ADMIN,
  ROLES.DEPARTMENT_HEAD,
  ROLES.FACULTY,
  ROLES.STAFF,
]
