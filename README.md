# Student Success Platform

AI-based academic performance prediction and student success intelligence platform with a React frontend, Express API, SQLite database, and four Python ML microservices.

## Quick start (development)

```bash
npm install          # installs deps, copies .env, migrates + seeds DB
npm run app          # API :3001 + Vite :5173
```

Start ML services in separate terminals (see `ml/README.md`):

```bash
cd ml/model1_pipeline/src && uvicorn api:app --port 8000
cd ml/model2_pipeline/src && uvicorn api:app --port 8001
cd ml/model3_pipeline/src && uvicorn api:app --port 8002
cd ml/model4_pipeline/src && uvicorn api:app --port 8003
```

## Production

```bash
npm run build
NODE_ENV=production JWT_SECRET=<32+ char secret> npm start
```

Or with Docker Compose (set `JWT_SECRET` in environment):

```bash
docker compose up --build
```

## Architecture

| Layer | Stack | Path |
|---|---|---|
| Frontend | React 19 + Vite + Tailwind 4 | `src/` |
| API | Express + better-sqlite3 | `server/` |
| ML | FastAPI + scikit-learn/XGBoost | `ml/model*_pipeline/` |

### ML models

| Model | Purpose | Port | Key metric |
|---|---|---|---|
| 1 | Academic early-warning risk | 8000 | ROC-AUC ~0.83 (4-week) |
| 2 | Dropout risk (Dropout vs Graduate) | 8001 | **94.1% accuracy**, AUC 0.973 |
| 3 | Skill intervention recommender | 8002 | Precision@5 100% |
| 4 | Behavioral clustering | 8003 | Silhouette 0.315, k=4 |

## API health

- `GET /api/health` — Node API status
- `GET /api/health/ml` — ML service connectivity
- Each ML service: `GET /health`

## Demo accounts (development only)

Disabled when `NODE_ENV=production`. In development, use the login screen demo panel or:

| Role | Email | Password |
|---|---|---|
| Director / Dean | director@university.edu | director123 |
| Academic Admin | admin@university.edu | admin123 |
| Department Head | head@university.edu | head123 |
| Faculty | faculty@university.edu | faculty123 |
| Administrative Staff | staff@university.edu | staff123 |

### Role hierarchy

```
Director / Dean
 ├── Academic Admin → Department Heads → Faculty
 └── Administrative Staff
```

| Role | Portal focus |
|---|---|
| Director / Dean | University performance, high-risk students, department comparison |
| Academic Admin | Academic ops, faculty/course stats, user invites (Admin Panel) |
| Department Head | Department student performance and risk |
| Faculty | Own students, attendance, marks, risk alerts, recommendations |
| Administrative Staff | Institutional reports and risk alerts (support) |

## Scripts

| Command | Description |
|---|---|
| `npm run app` | Full dev stack |
| `npm run build` | Build frontend to `dist/` |
| `npm start` | Production server (API + static) |
| `npm test` | Smoke tests |
| `npm run db:reset` | Reset database |

## Environment

Copy `.env.example` to `.env`. Required for production:

- `JWT_SECRET` — strong random string (32+ characters)
- `ML_*_API_URL` — URLs for running ML services
- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` — required to email faculty activation links
- `APP_BASE_URL` — public app URL embedded in activation emails (not shown to admins)

### Faculty invitations

1. Admin creates a faculty account with a real work email and course assignments.
2. The API verifies the address (format + MX / mailbox check). Invalid or non-existent emails are rejected.
3. An activation email is sent **only** to that inbox via SMTP (no localhost invite links in the admin UI).
4. Faculty opens the link from email, sets a password, and is activated into their course-scoped portal.

Optional: `ML_DATASETS_DIR` for retraining (defaults to `ml/datasets/`).

## Testing

```bash
npm test
npm run lint
npm run build
```

CI runs lint, build, and tests on push/PR (`.github/workflows/ci.yml`).
