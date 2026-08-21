import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  BarChart3,
  GraduationCap,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Search,
  Settings as SettingsIcon,
  UserCog,
  Users,
} from 'lucide-react'
import {
  DashboardSkeleton,
  FacultyOverviewSkeleton,
  ReportsSkeleton,
  RiskAlertsSkeleton,
} from './components/skeletons/LoadingSkeletons'
import { Toast, UserAvatar } from './components/ui'
import AdminPanel from './screens/AdminPanel'
import AcademicAdminDashboard from './screens/AcademicAdminDashboard'
import DepartmentDashboard from './screens/DepartmentDashboard'
import DirectorDashboard from './screens/DirectorDashboard'
import DirectorAdminPanel from './screens/DirectorAdminPanel'
import FacultyDashboard from './screens/FacultyDashboard'
import FacultyOverview from './screens/FacultyOverview'
import FacultyStudents from './screens/FacultyStudents'
import InstitutionalReports from './screens/InstitutionalReports'
import Login from './screens/Login'
import AcceptInvite from './screens/AcceptInvite'
import ResetPassword from './screens/ResetPassword'
import RecommendationEngine from './screens/RecommendationEngine'
import RiskAlertPanel from './screens/RiskAlertPanel'
import DirectorRiskDrilldown from './screens/DirectorRiskDrilldown'
import Settings from './screens/Settings'
import StudentDetail from './screens/StudentDetail'
import StudentSearch from './screens/StudentSearch'
import { api, getToken, setToken, setUnauthorizedHandler } from './api/client'
import { ROLES } from './utils/roleScope'
import {
  canAccessView,
  getDefaultViewForRole,
  getNavItemsForRole,
  getViewTitle,
} from './utils/roleScope'

const NAV_ICONS = {
  dashboard: LayoutDashboard,
  'my-students': Users,
  'faculty-overview': Users,
  'risk-alerts': AlertTriangle,
  recommendations: Lightbulb,
  reports: BarChart3,
  admin: UserCog,
  'director-admin': UserCog,
  settings: SettingsIcon,
}

const DATA_HEAVY_VIEWS = new Set(['dashboard', 'my-students', 'faculty-overview', 'risk-alerts', 'reports'])
const LOADING_DURATION_MS = 480

const SKELETONS = {
  dashboard: DashboardSkeleton,
  'my-students': RiskAlertsSkeleton,
  'faculty-overview': FacultyOverviewSkeleton,
  'risk-alerts': RiskAlertsSkeleton,
  reports: ReportsSkeleton,
}

function readAuthLink() {
  const params = new URLSearchParams(window.location.search)
  const path = window.location.pathname
  const hash = window.location.hash.replace(/^#/, '')
  const hashQuery = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : ''
  const hashParams = new URLSearchParams(hashQuery)
  const token = params.get('token') || params.get('resetToken') || hashParams.get('token')

  if (!token) return { kind: null, token: null }

  const isReset =
    path.includes('reset-password') || hash.includes('reset-password') || params.has('resetToken')
  const isInvite = path.includes('accept-invite') || hash.includes('accept-invite')

  if (isReset && !isInvite) return { kind: 'reset', token }
  if (isInvite && !isReset) return { kind: 'invite', token }
  return { kind: 'unknown', token }
}

function deriveNameFromEmail(email) {
  if (!email) return 'User'
  const local = email.split('@')[0] ?? ''
  return local
    .replace(/[._-]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function LogoutButton({ onClick, fullWidth = false, compact = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Log out of your account"
      className={[
        'inline-flex items-center justify-center gap-1.5 rounded-md border',
        'bg-transparent text-sm font-semibold transition-all duration-150',
        'active:scale-[0.98]',
        'hover:bg-[#FEF3F2] hover:border-[#FDA29B] hover:text-[#B42318]',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600',
        fullWidth ? 'mt-3 w-full px-4 py-2' : 'shrink-0 px-3 py-2',
        compact ? 'h-9 w-9 px-0' : '',
      ].join(' ')}
      style={{
        borderColor: '#D0D5DD',
        color: '#475467',
      }}
      title="Log out"
    >
      <LogOut size={16} aria-hidden="true" />
      {!compact && <span className={fullWidth ? '' : 'hidden sm:inline'}>Log out</span>}
    </button>
  )
}

function NavButton({ item, active, onClick, compact }) {
  const Icon = item.icon

  if (compact) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-current={active ? 'page' : undefined}
        aria-label={item.label}
        className={[
          'flex flex-col items-center gap-1 rounded-md px-2 py-1.5 text-[10px] font-medium transition-all duration-150',
          active
            ? 'bg-[#E6F4EE] text-[#0B6E4F]'
            : 'text-[#475467] hover:bg-background hover:text-[#101828]',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 active:scale-[0.98]',
        ].join(' ')}
      >
        <Icon size={18} strokeWidth={2} className={active ? 'text-[#0B6E4F]' : undefined} aria-hidden="true" />
        <span className="leading-tight">{item.shortLabel}</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={[
        'flex w-full items-center gap-3 rounded-md border-l-[3px] py-2 pr-3 text-sm font-medium transition-all duration-150',
        active
          ? 'border-[#0B6E4F] bg-[#E6F4EE] pl-[calc(0.75rem-3px)] text-[#0B6E4F]'
          : 'border-transparent pl-3 text-[#475467] hover:bg-background hover:text-[#101828]',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 active:scale-[0.98]',
      ].join(' ')}
    >
      <Icon
        size={18}
        strokeWidth={2}
        className={active ? 'text-[#0B6E4F]' : 'text-[#475467]'}
        aria-hidden="true"
      />
      <span>{item.label}</span>
    </button>
  )
}

function AppShell({
  user,
  view,
  isLoading,
  onNavigate,
  onOpenSearch,
  onSelectStudent,
  onBackFromDetail,
  onBackFromSearch,
  onSelectStaff,
  onLogout,
  onNotify,
  onUserUpdate,
  selectedStudentId,
  selectedFacultyId,
  selectedDepartment,
  onSelectFaculty,
  onClearFacultyFilter,
  onClearDepartmentFilter,
  facultyStudentsPrefill,
  onOpenStudents,
  onConsumeStudentsPrefill,
}) {
  const displayName = user.name ?? deriveNameFromEmail(user.email)
  const navItems = useMemo(() => {
    const items = getNavItemsForRole(user.role).filter((item) => {
      if (item.id === 'faculty-overview') return user.role === ROLES.DEPARTMENT_HEAD
      if (item.id === 'admin') return user.role === ROLES.ADMIN || user.role === ROLES.STAFF
      if (item.id === 'my-students')
        return user.role === ROLES.FACULTY || user.role === ROLES.DEPARTMENT_HEAD
      return true
    })

    return items.map((item) => ({
      ...item,
      icon: NAV_ICONS[item.id],
    }))
  }, [user.role])
  const activeNav = navItems.some((item) => item.id === view) ? view : null
  const SkeletonComponent = SKELETONS[view]
  const pageTitle = getViewTitle(view, user.role)

  function renderContent() {
    if (isLoading && SkeletonComponent) {
      return <SkeletonComponent />
    }

    switch (view) {
      case 'dashboard':
        if (user.role === ROLES.DIRECTOR) {
          return (
            <DirectorDashboard />
          )
        }
        if (user.role === ROLES.ADMIN || user.role === ROLES.STAFF) {
          return <AcademicAdminDashboard />
        }
        return <FacultyDashboard user={user} onNavigate={onNavigate} onSelectStudent={onSelectStudent} onOpenStudents={onOpenStudents} />
      case 'my-students':
        return (
          <FacultyStudents
            user={user}
            onNotify={onNotify}
            initialCourse={facultyStudentsPrefill?.course ?? null}
            initialRiskFilter={facultyStudentsPrefill?.riskFilter ?? 'All'}
            onPrefillConsumed={onConsumeStudentsPrefill}
          />
        )
      case 'faculty-overview':
        return (
          <FacultyOverview user={user} onSelectFaculty={onSelectFaculty} />
        )
      case 'risk-alerts':
        if (user.role === ROLES.FACULTY || user.role === ROLES.DEPARTMENT_HEAD) {
          return <FacultyStudents user={user} onNotify={onNotify} />
        }
        if (user.role === ROLES.DIRECTOR || user.role === ROLES.ADMIN || user.role === ROLES.STAFF) {
          return <DirectorRiskDrilldown onSelectStudent={onSelectStudent} />
        }
        return (
          <RiskAlertPanel
            user={user}
            facultyId={selectedFacultyId}
            departmentFilter={selectedDepartment}
            onClearFacultyFilter={onClearFacultyFilter}
            onClearDepartmentFilter={onClearDepartmentFilter}
            onSelectStudent={onSelectStudent}
          />
        )
      case 'recommendations':
        if (user.role === ROLES.FACULTY || user.role === ROLES.DEPARTMENT_HEAD) {
          return <FacultyStudents user={user} onNotify={onNotify} />
        }
        return <RecommendationEngine user={user} onNotify={onNotify} />
      case 'reports':
        return <InstitutionalReports user={user} />
      case 'admin':
        return <AdminPanel roleRestriction={[ROLES.FACULTY, ROLES.STUDENT]} initialRoleFilter={ROLES.FACULTY} />
      case 'director-admin':
        return <DirectorAdminPanel user={user} />
      case 'settings':
        return <Settings user={user} onUserUpdate={onUserUpdate} onNotify={onNotify} />
      case 'student-search':
        return (
          <StudentSearch
            user={user}
            onSelectStudent={onSelectStudent}
            onSelectStaff={onSelectStaff}
            onBack={onBackFromSearch}
          />
        )
      case 'student-detail':
        return (
          <StudentDetail
            studentId={selectedStudentId}
            onBack={onBackFromDetail}
            includeRecommendations={user.role === ROLES.FACULTY || user.role === ROLES.DEPARTMENT_HEAD}
            facultyMode={user.role === ROLES.FACULTY || user.role === ROLES.DEPARTMENT_HEAD}
            onNotify={onNotify}
          />
        )
      default:
        if (user.role === ROLES.DIRECTOR) {
          return (
            <DirectorDashboard />
          )
        }
        if (user.role === ROLES.ADMIN || user.role === ROLES.STAFF) {
          return <AcademicAdminDashboard />
        }
        return <FacultyDashboard user={user} onNavigate={onNavigate} onSelectStudent={onSelectStudent} onOpenStudents={onOpenStudents} />
    }
  }

  return (
    <div className="flex min-h-svh bg-background">
      <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-r border-border bg-surface md:flex">
        <div className="flex shrink-0 items-center gap-2.5 border-b border-border px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-white shadow-card">
            <GraduationCap size={18} strokeWidth={2} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p
              className="truncate text-sm font-semibold text-text-primary"
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            >
              PrognosEd
            </p>
            <p className="truncate text-[11px] text-text-secondary">Student Success</p>
          </div>
        </div>

        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3" aria-label="Main navigation">
          {navItems.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              active={activeNav === item.id}
              onClick={() => onNavigate(item.id)}
            />
          ))}
        </nav>

        <div className="mt-auto shrink-0 border-t border-border bg-surface p-3">
          <div className="rounded-xl border border-border bg-[#F9FAFB] p-3">
            <div className="flex items-center gap-3">
              <UserAvatar name={displayName} photoUrl={user.avatarUrl} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-text-primary">{displayName}</p>
                <p className="mt-0.5 truncate text-[11px] text-text-muted">{user.role}</p>
              </div>
            </div>
            {user.department ? (
              <p className="mt-2 truncate text-[11px] text-text-muted">{user.department}</p>
            ) : null}
            <LogoutButton onClick={onLogout} fullWidth />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-surface/95 px-4 py-3 backdrop-blur-md sm:px-6">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted md:hidden">
              PrognosEd
            </p>
            <h1 className="min-w-0 truncate font-heading text-base font-bold text-text-primary md:text-lg">
              {pageTitle}
            </h1>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onOpenSearch}
              aria-label={
                user.role === ROLES.DIRECTOR || user.role === ROLES.ADMIN || user.role === ROLES.STAFF
                  ? 'Search people'
                  : 'Open student search'
              }
              className={[
                'btn-secondary px-3 py-2',
                view === 'student-search' ? 'border-primary-600 bg-primary-50 text-primary-700' : '',
              ].join(' ')}
            >
              <Search size={16} aria-hidden="true" />
              <span className="hidden sm:inline">Search</span>
            </button>

            <div className="hidden items-center gap-2 rounded-lg border border-border bg-[#F9FAFB] py-1 pl-1 pr-2 md:flex">
              <UserAvatar name={displayName} photoUrl={user.avatarUrl} />
              <div className="min-w-0">
                <p className="max-w-[9rem] truncate text-xs font-semibold text-text-primary lg:max-w-[12rem]">
                  {displayName}
                </p>
                <p className="max-w-[9rem] truncate text-[10px] text-text-muted lg:max-w-[12rem]">
                  {user.role}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto pb-20 md:pb-0">
          <div key={view} className="animate-page-enter">
            {renderContent()}
          </div>
        </main>

        <nav
          className="fixed inset-x-0 bottom-0 z-20 flex items-stretch justify-around border-t border-border bg-surface/95 px-1 py-1.5 backdrop-blur-sm md:hidden"
          aria-label="Mobile navigation"
        >
          {navItems.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              compact
              active={activeNav === item.id}
              onClick={() => onNavigate(item.id)}
            />
          ))}
          <LogoutButton onClick={onLogout} compact />
        </nav>
      </div>
    </div>
  )
}

function App() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [view, setView] = useState('dashboard')
  const [previousView, setPreviousView] = useState('dashboard')
  const [searchReturnView, setSearchReturnView] = useState('dashboard')
  const [selectedStudentId, setSelectedStudentId] = useState(null)
  const [selectedFacultyId, setSelectedFacultyId] = useState(null)
  const [selectedDepartment, setSelectedDepartment] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const loadingTimerRef = useRef(null)
  const [inviteToken, setInviteToken] = useState(() => {
    const link = readAuthLink()
    return link.kind === 'invite' ? link.token : null
  })
  const [resetToken, setResetToken] = useState(() => {
    const link = readAuthLink()
    return link.kind === 'reset' ? link.token : null
  })
  const [loginNotice, setLoginNotice] = useState('')
  const [facultyStudentsPrefill, setFacultyStudentsPrefill] = useState(null)

  useEffect(() => {
    const link = readAuthLink()
    if (link.kind !== 'unknown' || !link.token) return undefined

    let cancelled = false
    api
      .getPasswordReset(link.token)
      .then(() => {
        if (!cancelled) setResetToken(link.token)
      })
      .catch(() => {
        if (!cancelled) setInviteToken(link.token)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const dismissToast = useCallback(() => setToast(null), [])

  const showToast = useCallback((message, variant = 'success') => {
    setToast({ message, variant, id: Date.now() })
  }, [])

  function clearInviteUrl() {
    const url = new URL(window.location.href)
    url.pathname = '/'
    url.search = ''
    url.hash = ''
    window.history.replaceState({}, '', url.toString())
    setInviteToken(null)
  }

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null)
      setView('dashboard')
      setSelectedStudentId(null)
    })
  }, [])

  useEffect(() => {
    let cancelled = false

    async function restoreSession() {
      // Prefer invitation / password-reset links over an existing session
      if (inviteToken || resetToken) {
        setToken(null)
        setAuthLoading(false)
        return
      }

      if (!getToken()) {
        setAuthLoading(false)
        return
      }

      try {
        const me = await api.getMe()
        if (!cancelled) {
          setUser(me)
          setView(getDefaultViewForRole(me.role))
          setPreviousView(getDefaultViewForRole(me.role))
        }
      } catch {
        setToken(null)
      } finally {
        if (!cancelled) setAuthLoading(false)
      }
    }

    restoreSession()

    return () => {
      cancelled = true
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current)
    }
  }, [])

  function navigateWithLoading(nextView, resetStudent = true) {
    if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current)

    if (resetStudent) setSelectedStudentId(null)
    if (nextView !== 'risk-alerts') {
      setSelectedFacultyId(null)
      setSelectedDepartment(null)
    }

    if (user && !canAccessView(nextView, user.role)) {
      return
    }

    if (DATA_HEAVY_VIEWS.has(nextView) && nextView !== view) {
      setIsLoading(true)
      setView(nextView)
      loadingTimerRef.current = setTimeout(() => setIsLoading(false), LOADING_DURATION_MS)
      return
    }

    setIsLoading(false)
    setView(nextView)
  }

  async function handleLogin(userData, token) {
    setToken(token)
    const defaultView = getDefaultViewForRole(userData.role)
    setUser(userData)
    setView(defaultView)
    setPreviousView(defaultView)
    setSelectedStudentId(null)
    setSelectedFacultyId(null)
    setSelectedDepartment(null)
    setIsLoading(false)
  }

  async function handleInviteAccepted(userData, token) {
    clearInviteUrl()
    await handleLogin(userData, token)
    showToast('Welcome — your account is ready.', 'success')
  }

  function handleUserUpdate(updatedUser) {
    setUser(updatedUser)
  }

  function handleSelectFaculty(facultyId) {
    setSelectedFacultyId(facultyId)
    setSelectedDepartment(null)
    navigateWithLoading('risk-alerts', false)
  }

  function handleClearFacultyFilter() {
    setSelectedFacultyId(null)
  }

  function handleSelectDepartment(department) {
    setSelectedDepartment(department)
    setSelectedFacultyId(null)
    navigateWithLoading('risk-alerts', false)
  }

  function handleClearDepartmentFilter() {
    setSelectedDepartment(null)
  }

  function handleOpenStudents(prefill = {}) {
    setFacultyStudentsPrefill(prefill)
    navigateWithLoading('my-students', false)
  }

  function handleConsumeStudentsPrefill() {
    setFacultyStudentsPrefill(null)
  }

  function handleNavigate(nextView) {
    navigateWithLoading(nextView)
  }

  function handleOpenSearch() {
    if (view !== 'student-search') {
      setSearchReturnView(view)
    }
    navigateWithLoading('student-search', false)
  }

  function handleBackFromSearch() {
    const target =
      searchReturnView && searchReturnView !== 'student-search' ? searchReturnView : 'dashboard'
    setIsLoading(false)
    setView(target)
  }

  function handleSelectStaff() {
    setIsLoading(false)
    setView(user?.role === ROLES.DIRECTOR ? 'director-admin' : 'admin')
  }

  function handleSelectStudent(studentId) {
    setPreviousView(view)
    setSelectedStudentId(studentId)
    setIsLoading(false)
    setView('student-detail')
  }

  function handleBackFromDetail() {
    setIsLoading(false)
    setView(previousView)
    setSelectedStudentId(null)
  }

  async function handleLogout() {
    if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current)
    try {
      await api.logout()
    } catch {
      // Clear local session even if API logout fails
    }
    setToken(null)
    setUser(null)
    setView('dashboard')
    setPreviousView('dashboard')
    setSelectedStudentId(null)
    setSelectedFacultyId(null)
    setSelectedDepartment(null)
    setIsLoading(false)
    setToast(null)
  }

  function handleNotify(payload = {}) {
    if (payload.message) {
      showToast(payload.message, payload.variant ?? 'info')
      return
    }
    if (payload.decision === 'accepted') {
      showToast(`Intervention plan accepted for ${payload.studentName}`, 'success')
    } else {
      showToast(`Recommendation dismissed for ${payload.studentName}`, 'dismiss')
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white shadow-card">
            <GraduationCap size={24} strokeWidth={2} aria-hidden="true" />
          </div>
          <p className="text-sm text-text-secondary">Loading platform…</p>
        </div>
      </div>
    )
  }

  if (!user && resetToken) {
    return (
      <div className="animate-page-enter">
        <ResetPassword
          token={resetToken}
          onComplete={() => {
            const url = new URL(window.location.href)
            url.pathname = '/'
            url.search = ''
            url.hash = ''
            window.history.replaceState({}, '', url.toString())
            setResetToken(null)
            setLoginNotice('Your password was updated. Sign in with your new password.')
          }}
        />
      </div>
    )
  }

  if (!user && inviteToken) {
    return (
      <div className="animate-page-enter">
        <AcceptInvite
          token={inviteToken}
          onUseAsReset={() => {
            const url = new URL(window.location.href)
            url.pathname = '/reset-password'
            window.history.replaceState({}, '', url.toString())
            setInviteToken(null)
            setResetToken(inviteToken)
          }}
          onAccepted={({ user: invitedUser, token }) => handleInviteAccepted(invitedUser, token)}
        />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="animate-page-enter">
        <Login onLogin={handleLogin} initialNotice={loginNotice} />
      </div>
    )
  }

  return (
    <>
      <AppShell
        user={user}
        view={view}
        isLoading={isLoading}
        onNavigate={handleNavigate}
        onOpenSearch={handleOpenSearch}
        onSelectStudent={handleSelectStudent}
        onBackFromDetail={handleBackFromDetail}
        onBackFromSearch={handleBackFromSearch}
        onSelectStaff={handleSelectStaff}
        onLogout={handleLogout}
        onNotify={handleNotify}
        onUserUpdate={handleUserUpdate}
        selectedStudentId={selectedStudentId}
        selectedFacultyId={selectedFacultyId}
        selectedDepartment={selectedDepartment}
        onSelectFaculty={handleSelectFaculty}
        onClearFacultyFilter={handleClearFacultyFilter}
        onClearDepartmentFilter={handleClearDepartmentFilter}
        facultyStudentsPrefill={facultyStudentsPrefill}
        onOpenStudents={handleOpenStudents}
        onConsumeStudentsPrefill={handleConsumeStudentsPrefill}
      />
      <Toast toast={toast} onDismiss={dismissToast} />
    </>
  )
}

export default App
