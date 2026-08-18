CREATE TABLE IF NOT EXISTS student_courses (
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  term_id INTEGER NOT NULL REFERENCES terms(id),
  enrolled_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (student_id, course_id, term_id)
);

CREATE INDEX IF NOT EXISTS idx_student_courses_course_id ON student_courses(course_id);
CREATE INDEX IF NOT EXISTS idx_student_courses_term_id ON student_courses(term_id);

INSERT OR IGNORE INTO student_courses (student_id, course_id, term_id)
SELECT s.id, s.course_id, t.id
FROM students s
JOIN terms t ON t.is_current = 1
WHERE s.course_id IS NOT NULL;
