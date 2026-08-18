import { ROLES } from '../constants/roles.js'
import AdminPanel from './AdminPanel'

/**
 * Director/Dean module to invite and manage new admin-type users.
 * Because the system merges Admin + Administrative Staff, we allow both.
 */
export default function DirectorAdminPanel() {
  return <AdminPanel roleRestriction={[ROLES.ADMIN, ROLES.STAFF]} initialRoleFilter={ROLES.ADMIN} />
}

