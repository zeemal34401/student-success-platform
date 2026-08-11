-- Student Success Platform — initial schema
-- Designed for SQLite today; maps cleanly to PostgreSQL/MySQL later.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS departments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS terms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  is_current INTEGER NOT NULL DEFAULT 0 CHECK (is_current IN (0, 1)),
  starts_on TEXT,
  ends_on TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role_id INTEGER NOT NULL REFERENCES roles(id),
  department_id INTEGER REFERENCES departments(id),
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Invited', 'Disabled')),
  last_login_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_department_id ON users(department_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users(email COLLATE NOCASE);

CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  display_name TEXT NOT NULL,
  department_id INTEGER NOT NULL REFERENCES departments(id),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (code, department_id)
);

CREATE INDEX IF NOT EXISTS idx_courses_department_id ON courses(department_id);
CREATE INDEX IF NOT EXISTS idx_courses_display_name ON courses(display_name);

CREATE TABLE IF NOT EXISTS faculty_courses (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  term_id INTEGER NOT NULL REFERENCES terms(id),
  assigned_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, course_id, term_id)
);

CREATE INDEX IF NOT EXISTS idx_faculty_courses_course_id ON faculty_courses(course_id);
CREATE INDEX IF NOT EXISTS idx_faculty_courses_term_id ON faculty_courses(term_id);

CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  course_id INTEGER NOT NULL REFERENCES courses(id),
  department_id INTEGER NOT NULL REFERENCES departments(id),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_students_course_id ON students(course_id);
CREATE INDEX IF NOT EXISTS idx_students_department_id ON students(department_id);
CREATE INDEX IF NOT EXISTS idx_students_name ON students(name);

CREATE TABLE IF NOT EXISTS student_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  term_id INTEGER NOT NULL REFERENCES terms(id),
  attendance REAL NOT NULL CHECK (attendance >= 0 AND attendance <= 100),
  gpa REAL NOT NULL CHECK (gpa >= 0 AND gpa <= 4),
  lms_activity REAL NOT NULL CHECK (lms_activity >= 0 AND lms_activity <= 100),
  late_assignments INTEGER NOT NULL DEFAULT 0 CHECK (late_assignments >= 0),
  risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('Critical', 'High', 'Medium', 'Low')),
  trend TEXT NOT NULL CHECK (trend IN ('up', 'down', 'flat')),
  computed_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (student_id, term_id)
);

CREATE INDEX IF NOT EXISTS idx_student_metrics_term_risk
  ON student_metrics(term_id, risk_level, risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_student_metrics_student_term
  ON student_metrics(student_id, term_id);

CREATE TABLE IF NOT EXISTS intervention_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('Critical', 'High', 'Medium', 'Low')),
  action_text TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_intervention_templates_risk
  ON intervention_templates(risk_level, sort_order);

CREATE TABLE IF NOT EXISTS recommendation_decisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  term_id INTEGER NOT NULL REFERENCES terms(id),
  decision TEXT NOT NULL CHECK (decision IN ('accepted', 'dismissed')),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, student_id, term_id)
);

CREATE INDEX IF NOT EXISTS idx_recommendation_decisions_user_term
  ON recommendation_decisions(user_id, term_id);

CREATE TABLE IF NOT EXISTS user_notification_preferences (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  critical_alerts INTEGER NOT NULL DEFAULT 1 CHECK (critical_alerts IN (0, 1)),
  weekly_digest INTEGER NOT NULL DEFAULT 1 CHECK (weekly_digest IN (0, 1)),
  intervention_updates INTEGER NOT NULL DEFAULT 0 CHECK (intervention_updates IN (0, 1)),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS retention_rates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  term TEXT NOT NULL UNIQUE,
  retention_rate REAL NOT NULL CHECK (retention_rate >= 0 AND retention_rate <= 100),
  cohort TEXT NOT NULL DEFAULT 'undergraduate',
  sort_order INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_retention_rates_sort ON retention_rates(sort_order);

CREATE TABLE IF NOT EXISTS department_risk_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  department_id INTEGER NOT NULL REFERENCES departments(id),
  term_id INTEGER NOT NULL REFERENCES terms(id),
  critical_pct REAL NOT NULL,
  high_pct REAL NOT NULL,
  medium_pct REAL NOT NULL,
  low_pct REAL NOT NULL,
  total_students INTEGER NOT NULL CHECK (total_students >= 0),
  snapshot_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (department_id, term_id)
);

CREATE INDEX IF NOT EXISTS idx_department_risk_snapshots_term
  ON department_risk_snapshots(term_id);

CREATE TABLE IF NOT EXISTS engagement_weekly_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  term_id INTEGER NOT NULL REFERENCES terms(id),
  week_number INTEGER NOT NULL CHECK (week_number >= 1),
  week_label TEXT NOT NULL,
  scope_type TEXT NOT NULL CHECK (scope_type IN ('institution', 'department', 'faculty')),
  scope_id TEXT,
  attendance_avg REAL NOT NULL,
  lms_activity_avg REAL NOT NULL,
  recorded_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (term_id, week_number, scope_type, scope_id)
);

CREATE INDEX IF NOT EXISTS idx_engagement_snapshots_scope
  ON engagement_weekly_snapshots(term_id, scope_type, scope_id, week_number);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  revoked_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions(expires_at);
