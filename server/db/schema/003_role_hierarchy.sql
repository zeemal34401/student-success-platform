-- Role hierarchy: Director / Dean → Academic Admin → HODs → Faculty; Administrative Staff under Director

INSERT OR IGNORE INTO roles (name, slug) VALUES ('Director / Dean', 'director_dean');
INSERT OR IGNORE INTO roles (name, slug) VALUES ('Administrative Staff', 'administrative_staff');

-- Demo Director / Dean (password: director123)
INSERT OR IGNORE INTO users (id, email, work_email, password_hash, name, role_id, department_id, status, password_set_at)
SELECT
  'USR-004',
  'director@university.edu',
  'director@university.edu',
  '$2b$10$nCmOy1f5GBlsRKBtYvCWAO.JARtUOmHGrLf2l2PlG2gyo6pWcrk1W',
  'Dr. Amelia Cross',
  r.id,
  NULL,
  'Active',
  datetime('now')
FROM roles r
WHERE r.name = 'Director / Dean'
  AND NOT EXISTS (SELECT 1 FROM users WHERE id = 'USR-004');

INSERT OR IGNORE INTO user_notification_preferences (user_id)
SELECT 'USR-004'
WHERE EXISTS (SELECT 1 FROM users WHERE id = 'USR-004')
  AND NOT EXISTS (SELECT 1 FROM user_notification_preferences WHERE user_id = 'USR-004');

-- Demo Administrative Staff (password: staff123)
INSERT OR IGNORE INTO users (id, email, work_email, password_hash, name, role_id, department_id, status, password_set_at)
SELECT
  'USR-005',
  'staff@university.edu',
  'staff@university.edu',
  '$2b$10$QRsiQnbCMpZ7hqepedf8FuvGzO518CWZaLT0mfT1XF.VXRMH2Pb/y',
  'Jordan Hale',
  r.id,
  NULL,
  'Active',
  datetime('now')
FROM roles r
WHERE r.name = 'Administrative Staff'
  AND NOT EXISTS (SELECT 1 FROM users WHERE id = 'USR-005');

INSERT OR IGNORE INTO user_notification_preferences (user_id)
SELECT 'USR-005'
WHERE EXISTS (SELECT 1 FROM users WHERE id = 'USR-005')
  AND NOT EXISTS (SELECT 1 FROM user_notification_preferences WHERE user_id = 'USR-005');
