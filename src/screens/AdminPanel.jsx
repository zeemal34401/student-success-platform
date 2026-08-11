import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CheckCircle2,
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

const ROLE_OPTIONS = ROLE_HIERARCHY
const ROLE_FILTERS = ['All', ...ROLE_OPTIONS]
const STATUS_FILTERS = ['All', 'Active', 'Invited', 'Disabled']

function emptyUserForm(departments = []) {
  return {
    name: '',
    email: '',
    role: ROLES.FACULTY,
    department: departments[0] ?? 'Computer Science',
    courses: [],
  }
}

function RoleBadge({ role }) {
  const isDirector = role === ROLES.DIRECTOR
  const isAdmin = role === ROLES.ADMIN
  const isHead = role === ROLES.DEPARTMENT_HEAD
  const isStaff = role === ROLES.STAFF

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
            <button type="button" role="menuitem" onClick={() => { onToggleStatus(account.id); onClose() }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text-primary hover:bg-background">
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
  return message
}

function InviteSuccessModal({ result, onClose }) {
  if (!result) return null

  const { user, invite } = result
  const deliveredTo = invite?.email?.to ?? user.workEmail ?? user.email

  return (
    <Modal
      isOpen={Boolean(result)}
      onClose={onClose}
      title="Invitation emailed"
      description="The activation link was sent only to their work inbox. No invite links are shown in the admin console."
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-background px-4 py-3">
          <p className="text-sm font-semibold text-text-primary">{user.name}</p>
          <p className="mt-1 text-sm text-text-secondary">{user.workEmail ?? user.email}</p>
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
              Activation email delivered to <strong>{deliveredTo}</strong>. They open the link from that inbox,
              set a password, and their account activates automatically.
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
  onChange,
  onSubmit,
  onClose,
  saving,
  formError,
  emailStatus,
  onEmailBlur,
}) {
  const isEdit = mode === 'edit'
  const requiresDepartment = !NO_DEPARTMENT_ROLES.has(form.role)
  const requiresCourses = form.role === ROLES.FACULTY
  const departmentOptions = departments.length > 0 ? departments : ['Computer Science']
  const availableCourses = (courseOptions ?? []).filter((c) => c.department === form.department)

  function handleSubmit(event) {
    event.preventDefault()
    if (!form.name.trim() || !form.email.trim()) return
    if (requiresDepartment && !form.department) return
    if (requiresCourses && (!form.courses || form.courses.length === 0)) return
    if (emailStatus === 'invalid') return
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
      title={isEdit ? 'Edit user account' : 'Invite new user'}
      description={
        isEdit
          ? 'Update account details and course assignments.'
          : 'Enter a real work email. The system verifies it can receive mail, then emails the activation link directly to that inbox.'
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div className="rounded-lg border border-risk-critical-border bg-risk-critical-bg px-3 py-2.5 text-sm text-risk-critical" role="alert">
            <p className="font-medium">Invitation could not be sent</p>
            <p className="mt-1">{formError}</p>
          </div>
        )}
        <div>
          <label htmlFor="user-name" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-secondary">Full name</label>
          <input id="user-name" type="text" value={form.name} onChange={(e) => onChange((f) => ({ ...f, name: e.target.value }))} className="input-field w-full" required autoComplete="name" />
        </div>
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
            {emailStatus === 'invalid' && 'Enter a valid email that exists and can receive mail.'}
            {!emailStatus && 'Must be a real mailbox. Fake or unreachable addresses are rejected.'}
          </p>
        </div>
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
                courses: role === ROLES.FACULTY ? (f.courses ?? []) : [],
                department: NO_DEPARTMENT_ROLES.has(role)
                  ? 'Institution-wide'
                  : f.department === 'Institution-wide'
                    ? (departmentOptions[0] ?? 'Computer Science')
                    : f.department,
              }))
            }}
            className="input-field w-full"
          >
            {ROLE_OPTIONS.map((role) => (
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
              Assigned courses <span className="normal-case text-text-muted">(required)</span>
            </p>
            {availableCourses.length === 0 ? (
              <p className="text-sm text-text-muted">No courses found for this department.</p>
            ) : (
              <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border border-border bg-background p-3">
                {availableCourses.map((course) => {
                  const checked = (form.courses ?? []).includes(course.name)
                  return (
                    <label key={course.name} className="flex items-center gap-2 text-sm text-text-primary">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCourse(course.name)}
                      />
                      <span>{course.name}</span>
                    </label>
                  )
                })}
              </div>
            )}
          </div>
        )}
        <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
          <button type="button" onClick={onClose} className="btn-secondary" disabled={saving}>Cancel</button>
          <button
            type="submit"
            className="btn-primary"
            disabled={saving || emailStatus === 'checking' || emailStatus === 'invalid'}
          >
            {isEdit ? 'Save changes' : saving ? 'Verifying & sending…' : 'Send invite'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default function AdminPanel() {
  const [users, setUsers] = useState([])
  const [departments, setDepartments] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [modalMode, setModalMode] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyUserForm())
  const [removeTarget, setRemoveTarget] = useState(null)
  const [openMenuId, setOpenMenuId] = useState(null)
  const [inviteResult, setInviteResult] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [emailStatus, setEmailStatus] = useState('') // '' | checking | valid | invalid

  async function loadUsers() {
    setLoading(true)
    setError(null)
    try {
      const [userList, deptList, courseList] = await Promise.all([
        api.getAdminUsers({ search, role: roleFilter, status: statusFilter }),
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
      setForm(emptyUserForm(depts))
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
    setForm(emptyUserForm(departments))
  }

  async function handleEmailBlur(email) {
    const value = email?.trim()
    if (!value) {
      setEmailStatus('')
      return
    }
    setEmailStatus('checking')
    setFormError('')
    try {
      await api.validateWorkEmail(value)
      setEmailStatus('valid')
    } catch (err) {
      setEmailStatus('invalid')
      setFormError(err.message ?? 'Enter a valid email that exists.')
    }
  }

  async function handleSaveUser() {
    setSaving(true)
    setError(null)
    setFormError('')
    try {
      if (modalMode === 'edit' && editingId) {
        await api.updateAdminUser(editingId, form)
        closeModal()
        await loadUsers()
      } else {
        const result = await api.createAdminUser(form)
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

  async function handleToggleStatus(id) {
    try {
      await api.toggleAdminUserStatus(id)
      await loadUsers()
    } catch (err) {
      setError(err)
    }
  }

  async function handleConfirmRemove() {
    if (!removeTarget) return
    try {
      await api.deleteAdminUser(removeTarget.id)
      setRemoveTarget(null)
      await loadUsers()
    } catch (err) {
      setError(err)
    }
  }

  function handleClearFilters() {
    setSearch('')
    setRoleFilter('All')
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
        <SectionHeader as="h2" title="Admin Panel — User Management" description="Invite faculty with a professional system email, assign courses, and manage staff accounts across the institution." />
        <button type="button" onClick={openInviteModal} className="btn-primary shrink-0">
          <Plus size={16} aria-hidden="true" /> Invite new user
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
          iconTone="blue"
        />
        <StatCard
          label="Active"
          value={stats.active}
          subLabel="Currently enabled"
          icon={UserCheck}
          iconTone="green"
        />
        <StatCard
          label="Pending Invites"
          value={stats.invited}
          subLabel="Awaiting acceptance"
          icon={UserPlus}
          iconTone="amber"
        />
      </div>

      <Card className="mt-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-md min-w-0 flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden="true" />
            <input id="admin-user-search" type="search" placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)} className="input-field py-2 pl-9" />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:gap-4">
            <div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.03em] text-text-muted">Role</p>
              <div className="flex flex-wrap gap-2">
                {ROLE_FILTERS.map((role) => (
                  <button key={role} type="button" onClick={() => setRoleFilter(role)} aria-pressed={roleFilter === role} className={['filter-pill', roleFilter === role ? 'filter-pill-active' : 'filter-pill-inactive'].join(' ')}>
                    {role}
                  </button>
                ))}
              </div>
            </div>
            <div className="hidden self-stretch border-l border-border sm:block" aria-hidden="true" />
            <div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.03em] text-text-muted">Status</p>
              <div className="flex flex-wrap gap-2">
                {STATUS_FILTERS.map((status) => (
                  <button key={status} type="button" onClick={() => setStatusFilter(status)} aria-pressed={statusFilter === status} className={['filter-pill', statusFilter === status ? 'filter-pill-active' : 'filter-pill-inactive'].join(' ')}>
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="mt-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-skeleton h-12 w-full rounded-md bg-border/80" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-background px-6 py-16 text-center">
            <SearchX size={22} className="text-primary-600" aria-hidden="true" />
            <h3 className="mt-4 text-sm font-semibold text-text-primary">No users match your search</h3>
            {hasActiveFilters && (
              <button type="button" onClick={handleClearFilters} className="btn-primary mt-4">Clear filters</button>
            )}
          </div>
        ) : (
          <div className="mt-6 -mx-5 min-w-0 overflow-x-auto px-5 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[980px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-[#F9FAFB]">
                  <th className="px-3 py-3 text-xs font-medium uppercase tracking-wide text-text-secondary">Name</th>
                  <th className="px-3 py-3 text-xs font-medium uppercase tracking-wide text-text-secondary">Work email</th>
                  <th className="px-3 py-3 text-xs font-medium uppercase tracking-wide text-text-secondary">Role</th>
                  <th className="px-3 py-3 text-xs font-medium uppercase tracking-wide text-text-secondary">Department</th>
                  <th className="px-3 py-3 text-xs font-medium uppercase tracking-wide text-text-secondary">Courses</th>
                  <th className="px-3 py-3 text-xs font-medium uppercase tracking-wide text-text-secondary">Status</th>
                  <th className="px-3 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {users.map((account) => (
                  <tr key={account.id} className="border-b border-border transition-colors hover:bg-[#F9FAFB] last:border-b-0">
                    <td className="px-3 py-3">
                      <p className="font-medium text-text-primary">{account.name}</p>
                      <p className="text-xs text-text-muted">{account.id}</p>
                    </td>
                    <td className="px-3 py-3 text-text-secondary">
                      <span className="inline-flex items-center gap-1.5">
                        <Mail size={14} className="shrink-0 text-text-muted" aria-hidden="true" />
                        {account.email}
                      </span>
                    </td>
                    <td className="px-3 py-3"><RoleBadge role={account.role} /></td>
                    <td className="px-3 py-3 text-text-secondary">{account.department}</td>
                    <td className="px-3 py-3 text-text-secondary">
                      {account.role === ROLES.FACULTY
                        ? (account.courses?.length
                          ? account.courses.join(', ')
                          : <span className="text-risk-high">No courses assigned</span>)
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
        )}
      </Card>

      <UserFormModal
        isOpen={modalMode === 'invite' || modalMode === 'edit'}
        mode={modalMode}
        form={form}
        departments={departments}
        courseOptions={courses}
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
        title="Remove user account?"
        description={removeTarget ? `This will permanently remove ${removeTarget.name} from the managed user list.` : undefined}
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
