import { ROLES } from '../constants/roles.js'

export function getNavItemsForRole(role) {
  const faculty = [
    { id: 'dashboard', label: 'Faculty Dashboard', shortLabel: 'Dashboard' },
    { id: 'my-students', label: 'My Students', shortLabel: 'Students' },
    { id: 'risk-alerts', label: 'Risk Alerts', shortLabel: 'Alerts' },
    { id: 'recommendations', label: 'Recommendations', shortLabel: 'Plans' },
    { id: 'reports', label: 'Class Reports', shortLabel: 'Reports' },
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
    { id: 'risk-alerts', label: 'Academic Insights', shortLabel: 'Insights' },
    { id: 'admin', label: 'Admin Panel', shortLabel: 'Admin' },
    { id: 'settings', label: 'Settings', shortLabel: 'Settings' },
  ]

  const director = [
    { id: 'dashboard', label: 'Executive Dashboard', shortLabel: 'Dashboard' },
    { id: 'director-admin', label: 'Admin Management', shortLabel: 'Admins' },
    { id: 'reports', label: 'University Reports', shortLabel: 'Reports' },
    { id: 'risk-alerts', label: 'Academic Insights', shortLabel: 'Insights' },
    { id: 'settings', label: 'Settings', shortLabel: 'Settings' },
  ]

  const staff = [
    { id: 'reports', label: 'Institutional Reports', shortLabel: 'Reports' },
    { id: 'risk-alerts', label: 'Risk Alerts', shortLabel: 'Alerts' },
    { id: 'settings', label: 'Settings', shortLabel: 'Settings' },
  ]

  // Merged-role behavior:
  // - Department Head behaves like Faculty
  // - Administrative Staff behaves like Academic Admin
  if (role === ROLES.DIRECTOR) return director
  if (role === ROLES.ADMIN) return admin
  if (role === ROLES.DEPARTMENT_HEAD) return faculty
  if (role === ROLES.STAFF) return admin
  return faculty
}

export function getDefaultViewForRole(role) {
  if (role === ROLES.DIRECTOR || role === ROLES.ADMIN || role === ROLES.STAFF) return 'dashboard'
  return 'dashboard'
}

export function getViewTitle(view, role) {
  const titles = {
    dashboard:
      role === ROLES.DIRECTOR
        ? 'Executive Dashboard'
        : role === ROLES.ADMIN || role === ROLES.STAFF
          ? 'Academic Overview'
          : 'Faculty Dashboard',
    'my-students': 'My Students',
    'risk-alerts':
      role === ROLES.DIRECTOR || role === ROLES.ADMIN || role === ROLES.STAFF
        ? 'Academic Insights'
        : 'Risk Alerts',
    'faculty-overview': 'Faculty Overview',
    recommendations: 'Recommendations',
    reports:
      role === ROLES.DIRECTOR
        ? 'University Reports'
        : role === ROLES.ADMIN || role === ROLES.STAFF
          ? 'Institutional Reports'
          : role === ROLES.DEPARTMENT_HEAD
            ? 'Department Reports'
            : 'Class Reports',
    admin: 'Admin Panel — User Management',
    'director-admin': 'Admin Management — Invite Administrators',
    settings: 'Settings',
    'student-search':
      role === ROLES.DIRECTOR || role === ROLES.ADMIN || role === ROLES.STAFF
        ? 'Search'
        : 'Student Search',
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
