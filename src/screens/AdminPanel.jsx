import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CheckCircle2,
  GraduationCap,
  Mail,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  SearchX,
  Shield,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react'
import {
  Card,
  Modal,
  PageLayout,
  SectionHeader,
  StatCard,
  StatusBadge,
  ErrorState,
} from '../components/ui'
import { ROLES, NO_DEPARTMENT_ROLES, ROLE_HIERARCHY } from '../constants/roles'
import { api } from '../api/client'

const DEFAULT_ROLE_OPTIONS = ROLE_HIERARCHY
const STATUS_FILTERS = ['All', 'Active', 'Invited', 'Disabled']
const LIST_PANEL =
  'mt-6 overflow-hidden rounded-xl border border-[#CDD6E4] bg-[#E8EEF6] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]'

function RoleOnOffSwitch({ offValue, onValue, value, onChange }) {
  const options = [
    { value: offValue, icon: GraduationCap },
    { value: onValue, icon: Users },
  ]

  return (
    <div
      role="group"
      aria-label="Role"
      className="inline-grid grid-cols-2 rounded-full bg-[#2C3546] p-1 shadow-[0_10px_24px_rgba(44,53,70,0.32)] ring-1 ring-black/10"
    >
      {options.map((option) => {
        const selected = value === option.value
        const Icon = option.icon
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={[
              'inline-flex min-w-[8.75rem] items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
              selected
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-transparent text-white/55 hover:text-white',
            ].join(' ')}
          >
            <Icon size={15} className="shrink-0" aria-hidden="true" />
            {option.value}
          </button>
        )
      })}
    </div>
  )
}

function emptyUserForm(departments = [], defaultRole = ROLES.FACULTY) {
  return {
    name: '',
    email: '',
    role: defaultRole,
    department: departments[0] ?? 'Computer Science',
    courses: [],
  }
}

function RoleBadge({ role }) {
  const isDirector = role === ROLES.DIRECTOR
  const isAdmin = role === ROLES.ADMIN
  const isHead = role === ROLES.DEPARTMENT_HEAD
  const isStaff = role === ROLES.STAFF
  const isStudent = role === ROLES.STUDENT

  return (
    <span
      className={[
        'inline-flex items-center rounded-badge border px-2.5 py-0.5 text-xs font-semibold tracking-wide',
        isDirector
          ? 'border-[#FEE4E2] bg-[#FEF3F2] text-[#B42318]'
          : isAdmin
            ? 'border-[#E9D7FE] bg-[#F4EBFF] text-[#6941C6]'
            : isHead
              ? 'border-primary-100 bg-primary-50 text-primary-700'
              : isStaff
                ? 'border-[#B2DDFF] bg-[#EFF8FF] text-[#175CD3]'
                : isStudent
                  ? 'border-primary-100 bg-primary-50 text-primary-700'
                  : 'border-[#D0D5DD] bg-[#F2F4F7] text-[#475467]',
      ].join(' ')}
    >
      {role}
    </span>
  )
}

function ActionsMenu({ account, onEdit, onToggleStatus, onResendInvite, onRemove, isOpen, onToggle, onClose }) {
  const menuRef = useRef(null)
  const toggleLabel = account.status === 'Disabled' ? 'Enable account' : 'Disable account'
  const canToggle = account.status === 'Active' || account.status === 'Disabled'
  const canResend = account.status === 'Invited'

  useEffect(() => {
    if (!isOpen) return undefined

    function handlePointerDown(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) onClose()
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  return (
    <div ref={menuRef} className="relative">
      <button type="button" onClick={onToggle} aria-haspopup="menu" aria-expanded={isOpen} aria-label={`Actions for ${account.name}`} className="btn-ghost p-2">
        <MoreHorizontal size={16} aria-hidden="true" />
      </button>
      {isOpen && (
        <div role="menu" className="absolute right-0 z-20 mt-1 min-w-[12rem] rounded-md border border-border bg-surface py-1 shadow-card-hover">
          <button type="button" role="menuitem" onClick={() => { onEdit(account); onClose() }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text-primary hover:bg-background">
            <Pencil size={14} aria-hidden="true" /> Edit
          </button>
          {canResend && (
            <button type="button" role="menuitem" onClick={() => { onResendInvite(account); onClose() }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text-primary hover:bg-background">
              <RefreshCw size={14} aria-hidden="true" /> Resend invite
            </button>
          )}
          {canToggle && (
            <button type="button" role="menuitem" onClick={() => { onToggleStatus(account); onClose() }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text-primary hover:bg-background">
              <Shield size={14} aria-hidden="true" /> {toggleLabel}
            </button>
          )}
          <button type="button" role="menuitem" onClick={() => { onRemove(account); onClose() }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-risk-critical hover:bg-risk-critical-bg">
            <Trash2 size={14} aria-hidden="true" /> Remove
          </button>
        </div>
      )}
    </div>
  )
}

function inviteErrorMessage(err) {
  const code = err?.code
  const message = err?.message ?? 'Unable to complete request'

  if (code === 'FORBIDDEN') {
    return 'You must be logged in as Academic Admin to invite users.'
  }
  if (code === 'UNAUTHORIZED') {
    return 'Please log in again (session expired).'
  }
  if (code === 'EMAIL_NOT_CONFIGURED') {
    return message
  }
  if (code === 'EMAIL_DELIVERY_FAILED') {
    return message || 'Failed to send the activation email. Check SMTP settings and try again.'
  }
  if (code === 'INVALID_EMAIL' || code === 'EMAIL_NOT_FOUND' || code === 'EMAIL_UNVERIFIED') {
    return message || 'Enter a valid work email that exists and can receive mail.'
  }
  if (code === 'EMAIL_EXISTS') {
    return message || 'This work email is already registered in the system.'
  }
  if (code === 'TIMEOUT') {
    return 'The invitation request timed out while verifying email or contacting SMTP. Try again.'
  }
  if (code === 'INVALID_COURSE' || code === 'COURSES_REQUIRED' || code === 'INVALID_DEPARTMENT') {
    return message || 'Choose a valid department and course for this student.'
  }
  return message
}

function InviteSuccessModal({ result, onClose }) {
  if (!result) return null

  const { user, invite, added } = result
  const deliveredTo = invite?.email?.to ?? user.workEmail ?? user.email
  const isStudent = added || user?.role === ROLES.STUDENT

  return (
    <Modal
      isOpen={Boolean(result)}
      onClose={onClose}
      title={isStudent ? 'Student added' : 'Invitation emailed'}
      description={
        isStudent
          ? 'The student is on the roster immediately, enrolled in the selected courses. No invitation email is sent.'
          : 'The activation link was sent only to their work inbox. No invite links are shown in the admin console.'
      }
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-background px-4 py-3">
          <p className="text-sm font-semibold text-text-primary">{user.name}</p>
          {!isStudent && (
            <p className="mt-1 text-sm text-text-secondary">{user.workEmail ?? user.email}</p>
          )}
          <p className="mt-2 text-xs text-text-muted">
            {user.role}
            {user.department && user.department !== 'Institution-wide' ? ` · ${user.department}` : ''}
            {user.courses?.length ? ` · ${user.courses.join(', ')}` : ''}
          </p>
        </div>

        <div className="rounded-lg border border-primary-100 bg-primary-50 px-4 py-3 text-sm text-primary-800">
          <p className="inline-flex items-start gap-2">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>
              {isStudent ? (
                <>
                  <strong>{user.name}</strong> is now enrolled and visible on academic dashboards.
                </>
              ) : (
                <>
                  Activation email delivered to <strong>{deliveredTo}</strong>. They open the link from that inbox,
                  set a password, and their account activates automatically.
                </>
              )}
            </span>
          </p>
          {invite?.expiresAt && (
            <p className="mt-2 text-xs text-primary-700/80">
              Link expires {new Date(invite.expiresAt).toLocaleString()}.
            </p>
          )}
        </div>

        <div className="flex justify-end border-t border-border pt-4">
          <button type="button" onClick={onClose} className="btn-primary">Done</button>
        </div>
      </div>
    </Modal>
  )
}

function UserFormModal({
  isOpen,
  mode,
  form,
  departments,
  courseOptions,
  roleOptions = DEFAULT_ROLE_OPTIONS,
  onChange,
  onSubmit,
  onClose,
  saving,
  formError,
  emailStatus,
  onEmailBlur,
}) {
  const isEdit = mode === 'edit'
  const isStudent = form.role === ROLES.STUDENT
  const requiresDepartment = !NO_DEPARTMENT_ROLES.has(form.role)
  const requiresCourses = form.role === ROLES.FACULTY || isStudent
  const departmentOptions = departments.length > 0 ? departments : ['Computer Science']
  const availableCourses = (courseOptions ?? []).filter((c) => c.department === form.department)

  function handleSubmit(event) {
    event.preventDefault()
    if (!form.name.trim()) return
    if (!isStudent && !form.email.trim()) return
    if (requiresDepartment && !form.department) return
    if (requiresCourses && (!form.courses || form.courses.length === 0)) return
    if (!isStudent && emailStatus === 'invalid') return
    onSubmit()
  }

  function toggleCourse(courseName) {
    onChange((f) => {
      const current = f.courses ?? []
      const next = current.includes(courseName)
        ? current.filter((c) => c !== courseName)
        : [...current, courseName]
      return { ...f, courses: next }
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? (isStudent ? 'Edit student' : 'Edit user account') : isStudent ? 'Add student' : 'Invite new user'}
      description={
        isEdit
          ? isStudent
            ? 'Update the student name, department, and enrolled courses.'
            : 'Update account details and course assignments.'
          : isStudent
            ? 'Students are added to the roster immediately. Tick every course they are enrolled in — no invitation email is sent.'
            : 'Enter a real work email. The system verifies it can receive mail, then emails the activation link directly to that inbox.'
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div className="rounded-lg border border-risk-critical-border bg-risk-critical-bg px-3 py-2.5 text-sm text-risk-critical" role="alert">
            <p className="font-medium">{isStudent ? 'Student could not be saved' : 'Invitation could not be sent'}</p>
            <p className="mt-1">{formError}</p>
          </div>
        )}
        <div>
          <label htmlFor="user-name" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-secondary">Full name</label>
          <input id="user-name" type="text" value={form.name} onChange={(e) => onChange((f) => ({ ...f, name: e.target.value }))} className="input-field w-full" required autoComplete="name" />
        </div>
        {!isStudent && (
        <div>
          <label htmlFor="user-email" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-secondary">
            Professional work email
          </label>
          <input
            id="user-email"
            type="email"
            value={form.email}
            onChange={(e) => onChange((f) => ({ ...f, email: e.target.value }))}
            onBlur={() => onEmailBlur?.(form.email)}
            className="input-field w-full"
            required
            autoComplete="email"
            placeholder="faculty.name@university.edu"
            aria-invalid={emailStatus === 'invalid'}
            aria-describedby="user-email-help"
          />
          <p
            id="user-email-help"
            className={[
              'mt-1.5 text-xs',
              emailStatus === 'invalid' ? 'text-risk-critical' : emailStatus === 'valid' ? 'text-primary-700' : 'text-text-muted',
            ].join(' ')}
          >
            {emailStatus === 'checking' && 'Verifying that this email exists and can receive mail…'}
            {emailStatus === 'valid' && 'Email verified — activation will be sent to this address.'}
            {emailStatus === 'invalid' && (formError || 'This email does not exist. Enter a valid email address.')}
            {!emailStatus && 'Must be a real mailbox. Addresses that do not exist are rejected.'}
          </p>
        </div>
        )}
        <div>
          <label htmlFor="user-role" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-secondary">Role</label>
          <select
            id="user-role"
            value={form.role}
              onChange={(e) => {
              const role = e.target.value
              onChange((f) => ({
                ...f,
                role,
                courses:
                  role === ROLES.FACULTY || role === ROLES.STUDENT ? (f.courses ?? []) : [],
                department: NO_DEPARTMENT_ROLES.has(role)
                  ? 'Institution-wide'
                  : f.department === 'Institution-wide'
                    ? (departmentOptions[0] ?? 'Computer Science')
                    : f.department,
              }))
            }}
            className="input-field w-full"
          >
            {roleOptions.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>
        {requiresDepartment && (
          <div>
            <label htmlFor="user-department" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-secondary">Department</label>
            <select
              id="user-department"
              value={form.department}
              onChange={(e) => onChange((f) => ({ ...f, department: e.target.value, courses: [] }))}
              className="input-field w-full"
              required
            >
              {departmentOptions.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        )}
        {requiresCourses && (
          <div>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-text-secondary">
              {isStudent ? 'Enrolled courses' : 'Assigned courses'}{' '}
              <span className="normal-case text-text-muted">(required)</span>
            </p>
            {availableCourses.length === 0 ? (
              <p className="text-sm text-text-muted">No courses found for this department.</p>
            ) : (
              <div className="max-h-44 space-y-1 overflow-y-auto rounded-lg border border-border bg-background p-2">
                {availableCourses.map((course) => {
                  const checked = (form.courses ?? []).includes(course.name)
                  return (
                    <label
                      key={course.name}
                      className={[
                        'flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors',
                        checked ? 'bg-primary-50 text-primary-800' : 'text-text-primary hover:bg-[#F9FAFB]',
                      ].join(' ')}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCourse(course.name)}
                        className="h-4 w-4 accent-primary-600"
                      />
                      <span className="font-medium">{course.name}</span>
                    </label>
                  )
                })}
              </div>
            )}
            <p className="mt-1.5 text-xs text-text-muted">
              {isStudent
                ? `${(form.courses ?? []).length || 'No'} course${(form.courses ?? []).length === 1 ? '' : 's'} selected — tick every course this student is enrolled in.`
                : `${(form.courses ?? []).length || 'No'} course${(form.courses ?? []).length === 1 ? '' : 's'} selected.`}
            </p>
          </div>
        )}
        <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
          <button type="button" onClick={onClose} className="btn-secondary" disabled={saving}>Cancel</button>
          <button
            type="submit"
            className="btn-primary"
            disabled={saving || (!isStudent && (emailStatus === 'checking' || emailStatus === 'invalid'))}
          >
            {isEdit ? 'Save changes' : isStudent ? (saving ? 'Adding student…' : 'Add student') : saving ? 'Verifying & sending…' : 'Send invite'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default function AdminPanel({ roleRestriction = [ROLES.FACULTY], initialRoleFilter = ROLES.FACULTY } = {}) {
  const roleOptions =
    Array.isArray(roleRestriction) && roleRestriction.length ? roleRestriction : DEFAULT_ROLE_OPTIONS
  const restrictedMode = Array.isArray(roleRestriction) && roleRestriction.length > 0

  // UI simplification: roles that are merged in the system shouldn't be shown as separate options.
  const uiRoleOptions = roleOptions.filter(
    (r) => r !== ROLES.DEPARTMENT_HEAD && r !== ROLES.STAFF,
  )
  const effectiveRoleOptions = uiRoleOptions.length ? uiRoleOptions : roleOptions

  const [users, setUsers] = useState([])
  const [departments, setDepartments] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState(
    effectiveRoleOptions.includes(initialRoleFilter) ? initialRoleFilter : effectiveRoleOptions[0],
  )
  const [statusFilter, setStatusFilter] = useState('All')
  const [modalMode, setModalMode] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyUserForm([], effectiveRoleOptions[0] ?? ROLES.FACULTY))
  const [removeTarget, setRemoveTarget] = useState(null)
  const [openMenuId, setOpenMenuId] = useState(null)
  const [inviteResult, setInviteResult] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [emailStatus, setEmailStatus] = useState('') // '' | checking | valid | invalid
  const canAddStudents = effectiveRoleOptions.includes(ROLES.STUDENT)
  const viewingStudents = roleFilter === ROLES.STUDENT
  const statusFilters = viewingStudents ? STATUS_FILTERS.filter((status) => status !== 'Invited') : STATUS_FILTERS

  async function loadUsers() {
    setLoading(true)
    setError(null)
    try {
      const studentStatus = statusFilter === 'Invited' ? 'All' : statusFilter
      const [userList, deptList, courseList] = await Promise.all([
        viewingStudents
          ? api.getAdminStudents({ search, status: studentStatus })
          : api.getAdminUsers({ search, role: roleFilter, status: statusFilter }),
        departments.length ? Promise.resolve(departments) : api.getDepartments(),
        courses.length ? Promise.resolve(courses) : api.getCourses(),
      ])
      setUsers(userList)
      if (!departments.length) setDepartments(deptList)
      if (!courses.length) setCourses(courseList)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, roleFilter, statusFilter])

  const stats = useMemo(
    () => ({
      total: users.length,
      active: users.filter((u) => u.status === 'Active').length,
      invited: users.filter((u) => u.status === 'Invited').length,
    }),
    [users],
  )

  const hasActiveFilters = search.trim() !== '' || roleFilter !== 'All' || statusFilter !== 'All'

  async function openInviteModal() {
    try {
      let depts = departments
      let courseList = courses
      if (!depts.length) {
        depts = await api.getDepartments()
        setDepartments(depts)
      }
      if (!courseList.length) {
        courseList = await api.getCourses()
        setCourses(courseList)
      }
      setForm(emptyUserForm(depts, viewingStudents ? ROLES.STUDENT : effectiveRoleOptions[0] ?? ROLES.FACULTY))
      setFormError('')
      setEmailStatus('')
      setEditingId(null)
      setModalMode('invite')
    } catch (err) {
      setError(err)
    }
  }

  function openEditModal(account) {
    setForm({
      name: account.name,
      email: account.email,
      role: account.role,
      department: NO_DEPARTMENT_ROLES.has(account.role) ? 'Institution-wide' : account.department,
      courses: account.courses ?? [],
    })
    setFormError('')
    setEmailStatus('')
    setEditingId(account.id)
    setModalMode('edit')
  }

  function closeModal() {
    setModalMode(null)
    setEditingId(null)
    setFormError('')
    setEmailStatus('')
    setForm(emptyUserForm(departments, effectiveRoleOptions[0] ?? ROLES.FACULTY))
  }

  async function handleEmailBlur(email) {
    if (form.role === ROLES.STUDENT) return
    const value = email?.trim()
    if (!value) {
      setEmailStatus('')
      return
    }
    setEmailStatus('checking')
    setFormError('')
    try {
      const result = await api.validateWorkEmail(value)
      if (!result?.mailboxConfirmed) {
        setEmailStatus('invalid')
        setFormError('This email does not exist. Enter a valid email address.')
        return
      }
      setEmailStatus('valid')
      setFormError('')
    } catch (err) {
      setEmailStatus('invalid')
      setFormError(err.message || 'This email does not exist. Enter a valid email address.')
    }
  }

  async function handleSaveUser() {
    setSaving(true)
    setError(null)
    setFormError('')
    try {
      const isStudent = form.role === ROLES.STUDENT
      if (modalMode === 'edit' && editingId) {
        if (isStudent) await api.updateStudent(editingId, form)
        else await api.updateAdminUser(editingId, form)
        closeModal()
        await loadUsers()
      } else {
        const result = isStudent ? await api.createStudent(form) : await api.createAdminUser(form)
        closeModal()
        setInviteResult(result)
        await loadUsers()
      }
    } catch (err) {
      const message = inviteErrorMessage(err)
      setFormError(message)
      if (
        err.code === 'INVALID_EMAIL' ||
        err.code === 'EMAIL_NOT_FOUND' ||
        err.code === 'EMAIL_UNVERIFIED'
      ) {
        setEmailStatus('invalid')
      }
      // Keep modal open so the admin can correct the email / retry after fixing SMTP
      setError(null)
    } finally {
      setSaving(false)
    }
  }

  async function handleResendInvite(account) {
    setError(null)
    try {
      const result = await api.resendInvite(account.id)
      setInviteResult(result)
      await loadUsers()
    } catch (err) {
      setError({
        message: inviteErrorMessage(err),
        code: err.code,
        status: err.status,
      })
    }
  }

  async function handleToggleStatus(account) {
    try {
      if (account.role === ROLES.STUDENT) await api.toggleStudentStatus(account.id)
      else await api.toggleAdminUserStatus(account.id)
      await loadUsers()
    } catch (err) {
      setError(err)
    }
  }

  async function handleConfirmRemove() {
    if (!removeTarget) return
    try {
      if (removeTarget.role === ROLES.STUDENT) await api.deleteStudent(removeTarget.id)
      else await api.deleteAdminUser(removeTarget.id)
      setRemoveTarget(null)
      await loadUsers()
    } catch (err) {
      setError(err)
    }
  }

  function handleClearFilters() {
    setSearch('')
    setRoleFilter(restrictedMode ? effectiveRoleOptions[0] : 'All')
    setStatusFilter('All')
  }

  if (error && users.length === 0) {
    return (
      <PageLayout size="wide">
        <ErrorState error={error} onRetry={loadUsers} />
      </PageLayout>
    )
  }

  return (
    <PageLayout size="wide">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {canAddStudents ? (
          <h2 className="font-heading text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
            Admin Panel — User Management
          </h2>
        ) : (
          <SectionHeader
            as="h2"
            title="Admin Panel — User Management"
            description="Invite users with a professional system email and manage accounts in your scope."
          />
        )}
        <button type="button" onClick={openInviteModal} className="btn-primary shrink-0">
          <Plus size={16} aria-hidden="true" /> {canAddStudents ? 'Add faculty or student' : 'Invite new user'}
        </button>
      </div>

      {error && (
        <div className="mt-4">
          <ErrorState error={error} />
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Accounts"
          value={stats.total}
          subLabel="Managed users"
          icon={Users}
          kpiTheme="accounts"
        />
        <StatCard
          label="Active"
          value={stats.active}
          subLabel="Currently enabled"
          icon={UserCheck}
          kpiTheme="active"
        />
        <StatCard
          label="Pending Invites"
          value={stats.invited}
          subLabel="Awaiting acceptance"
          icon={UserPlus}
          kpiTheme="pending"
        />
      </div>

      <Card className="mt-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-md min-w-0 flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden="true" />
            <input id="admin-user-search" type="search" placeholder={viewingStudents ? 'Search by student name or ID…' : 'Search by name or email…'} value={search} onChange={(e) => setSearch(e.target.value)} className="input-field py-2 pl-9" />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:gap-4">
            <div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.03em] text-text-muted">Role</p>
              {!restrictedMode ? (
                <div className="flex flex-wrap gap-2">
                  {['All', ...effectiveRoleOptions].map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setRoleFilter(role)}
                      aria-pressed={roleFilter === role}
                      className={[
                        'filter-pill',
                        roleFilter === role ? 'filter-pill-active' : 'filter-pill-inactive',
                      ].join(' ')}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              ) : canAddStudents && effectiveRoleOptions.includes(ROLES.FACULTY) ? (
                <RoleOnOffSwitch
                  offValue={ROLES.FACULTY}
                  onValue={ROLES.STUDENT}
                  value={roleFilter}
                  onChange={(role) => {
                    setRoleFilter(role)
                    if (role === ROLES.STUDENT && statusFilter === 'Invited') setStatusFilter('All')
                  }}
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {effectiveRoleOptions.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => {
                        setRoleFilter(role)
                        if (role === ROLES.STUDENT && statusFilter === 'Invited') setStatusFilter('All')
                      }}
                      aria-pressed={roleFilter === role}
                      className={['filter-pill', roleFilter === role ? 'filter-pill-active' : 'filter-pill-inactive'].join(' ')}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="hidden self-stretch border-l border-border sm:block" aria-hidden="true" />
            <div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.03em] text-text-muted">Status</p>
              <div className="flex flex-wrap gap-2">
                {statusFilters.map((status) => (
                  <button key={status} type="button" onClick={() => setStatusFilter(status)} aria-pressed={statusFilter === status} className={['filter-pill', statusFilter === status ? 'filter-pill-active' : 'filter-pill-inactive'].join(' ')}>
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className={`${LIST_PANEL} space-y-3 p-4`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-skeleton h-12 w-full rounded-md bg-[#D5DEEB]" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className={`${LIST_PANEL} flex flex-col items-center justify-center px-6 py-16 text-center`}>
            <SearchX size={22} className="text-[#2C3546]" aria-hidden="true" />
            <h3 className="mt-4 text-sm font-semibold text-text-primary">{viewingStudents ? 'No students match your search' : 'No users match your search'}</h3>
            {hasActiveFilters && (
              <button type="button" onClick={handleClearFilters} className="btn-primary mt-4">Clear filters</button>
            )}
          </div>
        ) : (
          <div className={`${LIST_PANEL} -mx-5 min-w-0 sm:mx-0`}>
            <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#CDD6E4] bg-[#D9E2EF]">
                  <th className="px-3 py-3 text-xs font-medium uppercase tracking-wide text-[#3D4A5C]">Name</th>
                  {!viewingStudents && (
                    <th className="px-3 py-3 text-xs font-medium uppercase tracking-wide text-[#3D4A5C]">Work email</th>
                  )}
                  <th className="px-3 py-3 text-xs font-medium uppercase tracking-wide text-[#3D4A5C]">Role</th>
                  <th className="px-3 py-3 text-xs font-medium uppercase tracking-wide text-[#3D4A5C]">Department</th>
                  <th className="px-3 py-3 text-xs font-medium uppercase tracking-wide text-[#3D4A5C]">{viewingStudents ? 'Enrolled courses' : 'Courses'}</th>
                  <th className="px-3 py-3 text-xs font-medium uppercase tracking-wide text-[#3D4A5C]">Status</th>
                  <th className="px-3 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {users.map((account) => (
                  <tr key={account.id} className="border-b border-[#D5DEEB] bg-transparent transition-colors hover:bg-[#DEE6F2] last:border-b-0">
                    <td className="px-3 py-3">
                      <p className="font-medium text-text-primary">{account.name}</p>
                      <p className="text-xs text-text-muted">{account.id}</p>
                    </td>
                    {!viewingStudents && (
                    <td className="px-3 py-3 text-text-secondary">
                      {account.role === ROLES.STUDENT ? (
                        <span className="text-text-muted">—</span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5">
                          <Mail size={14} className="shrink-0 text-text-muted" aria-hidden="true" />
                          {account.email}
                        </span>
                      )}
                    </td>
                    )}
                    <td className="px-3 py-3"><RoleBadge role={account.role} /></td>
                    <td className="px-3 py-3 text-text-secondary">{account.department}</td>
                    <td className="px-3 py-3 text-text-secondary">
                      {account.role === ROLES.FACULTY || account.role === ROLES.STUDENT
                        ? (account.courses?.length
                          ? (
                            <div className="flex max-w-[22rem] flex-wrap gap-1.5">
                              {account.courses.map((course) => (
                                <span
                                  key={course}
                                  className="inline-flex items-center rounded-full border border-primary-100 bg-primary-50 px-2 py-0.5 text-[11px] font-medium text-primary-800"
                                >
                                  {course}
                                </span>
                              ))}
                            </div>
                          )
                          : <span className="text-risk-high">{account.role === ROLES.STUDENT ? 'No courses enrolled' : 'No courses assigned'}</span>)
                        : '—'}
                    </td>
                    <td className="px-3 py-3"><StatusBadge status={account.status} /></td>
                    <td className="px-3 py-3 text-right">
                      <ActionsMenu
                        account={account}
                        isOpen={openMenuId === account.id}
                        onToggle={() => setOpenMenuId((current) => (current === account.id ? null : account.id))}
                        onClose={() => setOpenMenuId(null)}
                        onEdit={openEditModal}
                        onResendInvite={handleResendInvite}
                        onToggleStatus={handleToggleStatus}
                        onRemove={setRemoveTarget}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </Card>

      <UserFormModal
        isOpen={modalMode === 'invite' || modalMode === 'edit'}
        mode={modalMode}
        form={form}
        departments={departments}
        courseOptions={courses}
        roleOptions={effectiveRoleOptions}
        onChange={(updater) => {
          setForm(updater)
          setEmailStatus('')
          setFormError('')
        }}
        onSubmit={handleSaveUser}
        onClose={closeModal}
        saving={saving}
        formError={formError}
        emailStatus={emailStatus}
        onEmailBlur={handleEmailBlur}
      />

      <InviteSuccessModal result={inviteResult} onClose={() => setInviteResult(null)} />

      <Modal
        isOpen={Boolean(removeTarget)}
        onClose={() => setRemoveTarget(null)}
        title={removeTarget?.role === ROLES.STUDENT ? 'Remove student?' : 'Remove user account?'}
        description={removeTarget ? `This will permanently remove ${removeTarget.name} from the ${removeTarget.role === ROLES.STUDENT ? 'student roster' : 'managed user list'}.` : undefined}
        size="small"
      >
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" onClick={() => setRemoveTarget(null)} className="btn-secondary">Cancel</button>
          <button type="button" onClick={handleConfirmRemove} className="btn-secondary border-risk-critical-border text-risk-critical hover:bg-risk-critical-bg">Remove account</button>
        </div>
      </Modal>
    </PageLayout>
  )
}
