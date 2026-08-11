import { ROLES } from '../constants/roles.js'

export function getNavItemsForRole(role) {
  const faculty = [
    { id: 'dashboard', label: 'Faculty Dashboard', shortLabel: 'Dashboard' },
    { id: 'my-students', label: 'My Students', shortLabel: 'Students' },
    { id: 'risk-alerts', label: 'Risk Alerts', shortLabel: 'Alerts' },
    { id: 'recommendations', label: 'Recommendations', shortLabel: 'Plans' },
    { id: 'settings', label: 'Settings', shortLabel: 'Settings' },
  ]

  const deptHead = [
    { id: 'dashboard', label: 'Department Dashboard', shortLabel: 'Dept' },
    { id: 'faculty-overview', label: 'Faculty Overview', shortLabel: 'Faculty' },
    { id: 'risk-alerts', label: 'Risk Alerts', shortLabel: 'Alerts' },
    { id: 'reports', label: 'Department Reports', shortLabel: 'Reports' },
    { id: 'settings', label: 'Settings', shortLabel: 'Settings' },
  ]

  const admin = [
    { id: 'dashboard', label: 'Academic Overview', shortLabel: 'Overview' },
    { id: 'reports', label: 'Institutional Reports', shortLabel: 'Reports' },
    { id: 'risk-alerts', label: 'Risk Alerts', shortLabel: 'Alerts' },
    { id: 'admin', label: 'Admin Panel', shortLabel: 'Admin' },
    { id: 'settings', label: 'Settings', shortLabel: 'Settings' },
  ]

  const director = [
    { id: 'dashboard', label: 'Executive Dashboard', shortLabel: 'Dashboard' },
    { id: 'reports', label: 'University Reports', shortLabel: 'Reports' },
    { id: 'risk-alerts', label: 'High-Risk Students', shortLabel: 'Alerts' },
    { id: 'settings', label: 'Settings', shortLabel: 'Settings' },
  ]

  const staff = [
    { id: 'reports', label: 'Institutional Reports', shortLabel: 'Reports' },
    { id: 'risk-alerts', label: 'Risk Alerts', shortLabel: 'Alerts' },
    { id: 'settings', label: 'Settings', shortLabel: 'Settings' },
  ]

  if (role === ROLES.DIRECTOR) return director
  if (role === ROLES.ADMIN) return admin
  if (role === ROLES.DEPARTMENT_HEAD) return deptHead
  if (role === ROLES.STAFF) return staff
  return faculty
}

export function getDefaultViewForRole(role) {
  if (role === ROLES.DIRECTOR || role === ROLES.ADMIN) return 'dashboard'
  if (role === ROLES.STAFF) return 'reports'
  return 'dashboard'
}

export function getViewTitle(view, role) {
  const titles = {
    dashboard:
      role === ROLES.DIRECTOR
        ? 'Executive Dashboard'
        : role === ROLES.ADMIN
          ? 'Academic Overview'
          : role === ROLES.DEPARTMENT_HEAD
            ? 'Department Dashboard'
            : 'Faculty Dashboard',
    'my-students': 'My Students',
    'risk-alerts':
      role === ROLES.DIRECTOR ? 'High-Risk Students' : 'Risk Alerts',
    'faculty-overview': 'Faculty Overview',
    recommendations: 'Recommendations',
    reports:
      role === ROLES.DEPARTMENT_HEAD
        ? 'Department Reports'
        : role === ROLES.DIRECTOR
          ? 'University Reports'
          : 'Institutional Reports',
    admin: 'Admin Panel — User Management',
    settings: 'Settings',
    'student-search': 'Student Search',
    'student-detail': 'Student Detail',
  }
  return titles[view] ?? 'Dashboard'
}

export function canAccessView(view, role) {
  const allowed = getNavItemsForRole(role).map((item) => item.id)
  if (['student-search', 'student-detail'].includes(view)) return true
  return allowed.includes(view)
}

export { ROLES }
