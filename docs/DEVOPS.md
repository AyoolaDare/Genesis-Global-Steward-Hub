# DEVOPS SPECIFICATION
## Church Management System (CMS) — CI/CD, Hosting & Infrastructure

---

## 1. INFRASTRUCTURE OVERVIEW

```
Developer Machine
      │
      ▼
GitHub Repository
      │
      ├──── Push to `develop` ──── GitHub Actions CI ───► Run Tests
      │                                                        │
      │                                                   Pass/Fail
      │
      ├──── Merge PR to `main` ──── GitHub Actions CD ──► Deploy
      │                                                        │
      │                                          ┌────────────┴───────────────┐
      │                                          │                            │
      │                                    Render.com                    Vercel
      │                                   (Backend API)               (Frontend)
      │                                          │
      │                               PostgreSQL (Render)
      │                               Managed Database
```

---

## 2. REPOSITORY STRUCTURE (Monorepo)

```
cms-church/                         ← GitHub repo root
├── .github/
│   └── workflows/
│       ├── ci.yml                  ← Runs on every push/PR
│       ├── deploy-backend.yml      ← Deploys to Render on main merge
│       └── deploy-frontend.yml     ← Deploys to Vercel on main merge
├── backend/                        ← Node.js Express API
│   ├── src/
│   ├── prisma/
│   ├── tests/
│   ├── Dockerfile
│   ├── .env.example
│   └── package.json
├── frontend/                       ← React + Vite app
│   ├── src/
│   ├── public/
│   ├── .env.example
│   └── package.json
├── docs/                           ← MD files (these docs)
├── .gitignore
└── README.md
```

---

## 3. BRANCHING STRATEGY

### Branch Model: **GitHub Flow (simplified)**

```
main            → Production (protected, no direct push)
develop         → Staging / Integration
feature/*       → New features (e.g., feature/medical-module)
fix/*           → Bug fixes (e.g., fix/phone-normalization)
hotfix/*        → Critical production fixes
```

### Branch Rules (GitHub Settings)

**`main` branch:**
- ✅ Require pull request reviews (minimum 1 approval)
- ✅ Require status checks to pass (CI must pass)
- ✅ Require branches to be up to date before merging
- ❌ Disable force pushes
- ❌ Disable direct commits

**`develop` branch:**
- ✅ Require status checks to pass
- ❌ Disable force pushes

### Commit Convention (Conventional Commits)

```
feat(medical): add phone lookup on visit creation
fix(auth): resolve refresh token expiry bug
chore(deps): update prisma to 5.8.0
docs(api): add swagger docs for cell groups
test(users): add merge profile integration test
refactor(search): improve full-text search query
```

---

## 4. GITHUB ACTIONS — CI PIPELINE

**File:** `.github/workflows/ci.yml`
**Triggers:** Every push and pull request to `develop` or `main`

```yaml
name: CI — Test & Lint

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  backend-ci:
    name: Backend Tests & Lint (Django)
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: testuser
          POSTGRES_PASSWORD: testpass
          POSTGRES_DB: cms_test
        ports: ['5432:5432']
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'
          cache: 'pip'
          cache-dependency-path: backend/requirements/development.txt

      - name: Install backend dependencies
        working-directory: backend
        run: pip install -r requirements/development.txt

      - name: Run Django system checks
        working-directory: backend
        run: python manage.py check
        env:
          DJANGO_SETTINGS_MODULE: cms.settings.development
          DB_NAME: cms_test
          DB_USER: testuser
          DB_PASSWORD: testpass
          DB_HOST: localhost
          DB_PORT: 5432
          SECRET_KEY: test-secret-key-for-ci

      - name: Run migrations
        working-directory: backend
        run: python manage.py migrate
        env:
          DJANGO_SETTINGS_MODULE: cms.settings.development
          DB_NAME: cms_test
          DB_USER: testuser
          DB_PASSWORD: testpass
          DB_HOST: localhost
          DB_PORT: 5432
          SECRET_KEY: test-secret-key-for-ci

      - name: Run tests with pytest
        working-directory: backend
        run: pytest --cov=apps --cov-report=xml -v
        env:
          DJANGO_SETTINGS_MODULE: cms.settings.development
          DB_NAME: cms_test
          DB_USER: testuser
          DB_PASSWORD: testpass
          DB_HOST: localhost
          DB_PORT: 5432
          SECRET_KEY: test-secret-key-for-ci

      - name: Upload coverage report
        uses: codecov/codecov-action@v4
        with:
          files: backend/coverage.xml

  frontend-ci:
    name: Frontend Build & Lint
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install frontend dependencies
        working-directory: frontend
        run: npm ci

      - name: Run TypeScript type check
        working-directory: frontend
        run: npm run typecheck

      - name: Run ESLint
        working-directory: frontend
        run: npm run lint

      - name: Build frontend
        working-directory: frontend
        run: npm run build
        env:
          VITE_API_URL: https://api.placeholder.com
```

---

## 5. GITHUB ACTIONS — BACKEND DEPLOY (Render)

**File:** `.github/workflows/deploy-backend.yml`
**Triggers:** Push to `main` (after CI passes)

```yaml
name: Deploy Backend → Render

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'
      - '.github/workflows/deploy-backend.yml'

jobs:
  deploy:
    name: Deploy to Render
    runs-on: ubuntu-latest
    needs: []    # CI workflow must pass first (handled by branch protection)

    steps:
      - name: Trigger Render Deploy Hook
        run: |
          curl -X POST "${{ secrets.RENDER_DEPLOY_HOOK_URL }}"
        # Render provides a deploy hook URL in the service dashboard
        # Store it in GitHub Secrets as RENDER_DEPLOY_HOOK_URL

      - name: Wait for deployment
        run: sleep 60

      - name: Health check
        run: |
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
            https://api.cms-church.onrender.com/api/v1/health)
          if [ "$STATUS" != "200" ]; then
            echo "Health check failed with status $STATUS"
            exit 1
          fi
          echo "Deployment healthy ✅"
```

---

## 6. GITHUB ACTIONS — FRONTEND DEPLOY (Vercel)

**File:** `.github/workflows/deploy-frontend.yml`

Vercel has **native GitHub integration** — the simplest approach:

1. Connect Vercel to your GitHub repo via the Vercel dashboard
2. Set **Production Branch** to `main`
3. Set **Preview Branches** to `develop` and feature branches
4. Vercel auto-deploys on every push — no custom Action needed

**Optional manual Action (if you need more control):**

```yaml
name: Deploy Frontend → Vercel

on:
  push:
    branches: [main]
    paths:
      - 'frontend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: frontend
          vercel-args: '--prod'
```

---

## 7. RENDER — BACKEND CONFIGURATION

### Service Setup

| Setting | Value |
|---------|-------|
| Service Type | Web Service |
| Environment | Node |
| Build Command | `cd backend && pip install -r requirements/production.txt && python manage.py collectstatic --noinput && python manage.py migrate` |
| Start Command | `cd backend && gunicorn cms.wsgi:application --bind 0.0.0.0:$PORT --workers 2` |
| Health Check Path | `/api/v1/health` |
| Region | Oregon (or nearest to users) |
| Plan | Starter ($7/mo) → Scale up as needed |
| Auto-Deploy | Disabled (controlled by GitHub Actions hook) |

### Render PostgreSQL Database

| Setting | Value |
|---------|-------|
| Service Type | PostgreSQL |
| Plan | Starter ($7/mo) — 1GB storage |
| Version | PostgreSQL 15 |
| Daily Backups | ✅ Enabled |
| Connection | Internal URL for backend (free), External URL for migrations |

### Environment Variables on Render

Set all variables from `backend/.env.example` in Render dashboard:
- `DATABASE_URL` → use Render's internal PostgreSQL URL
- `JWT_ACCESS_SECRET` → generate with `openssl rand -base64 64`
- `JWT_REFRESH_SECRET` → generate with `openssl rand -base64 64`
- `NODE_ENV` → `production`
- `CORS_ORIGIN` → your Vercel frontend URL
- All Cloudinary and SendGrid keys

---

## 8. VERCEL — FRONTEND CONFIGURATION

### Project Setup

| Setting | Value |
|---------|-------|
| Framework Preset | Vite |
| Root Directory | `frontend` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm ci` |

### Environment Variables on Vercel

```
VITE_API_URL=https://api.cms-church.onrender.com/api/v1
```

### Preview Deployments

- Every PR gets a unique preview URL (e.g., `cms-church-git-feature-xyz.vercel.app`)
- `develop` branch → staging URL (e.g., `cms-church-staging.vercel.app`)
- `main` branch → production URL (e.g., `cms.yourchurch.org` with custom domain)

### Custom Domain

1. Add your domain in Vercel dashboard
2. Point DNS records to Vercel's nameservers
3. SSL auto-provisioned by Vercel (Let's Encrypt)

---

## 9. SECRETS MANAGEMENT

### GitHub Secrets Required

```
# Render
RENDER_DEPLOY_HOOK_URL       ← From Render service settings

# Vercel (if using manual Action)
VERCEL_TOKEN                 ← From Vercel account settings
VERCEL_ORG_ID                ← From Vercel project settings
VERCEL_PROJECT_ID            ← From Vercel project settings
```

### Rules for Secrets
- ❌ Never commit `.env` files
- ✅ Always use `.env.example` with placeholder values
- ✅ Rotate secrets every 90 days
- ✅ Use Render and Vercel dashboards for production env vars
- ✅ Use GitHub Secrets for CI/CD only

---

## 10. DEPLOYMENT ENVIRONMENTS

| Environment | Branch | URL | Purpose |
|-------------|--------|-----|---------|
| Development | local | `localhost:3000` / `localhost:5000` | Local dev |
| Staging | `develop` | `cms-staging.vercel.app` / Render staging service | Integration testing |
| Production | `main` | `cms.yourchurch.org` / `api.cms-church.onrender.com` | Live |

---

## 11. MONITORING & ALERTING

### Application Health
- **Render** → built-in metrics: CPU, memory, response time
- **Health endpoint:** `GET /api/v1/health` returns:
  ```json
  { "status": "ok", "db": "connected", "timestamp": "..." }
  ```

### Error Tracking (Recommended)
- **Sentry** (free tier) — add to both frontend and backend
- Captures: unhandled errors, API failures, frontend crashes
- Setup: `npm install @sentry/node` (backend), `@sentry/react` (frontend)

### Uptime Monitoring
- Use **UptimeRobot** (free) — ping health endpoint every 5 minutes
- Alerts via email if service is down

---

## 12. ROLLBACK PROCEDURE

### Backend (Render)
1. Go to Render dashboard → Deploys tab
2. Find the last stable deploy
3. Click "Rollback to this deploy"
4. Verify with health check

### Frontend (Vercel)
1. Go to Vercel dashboard → Deployments
2. Find the last stable deployment
3. Click "..." → "Promote to Production"
4. Instant — no downtime

### Database Rollback
1. Render auto-backups are daily
2. For migration issues: `npx prisma migrate resolve --rolled-back <migration_name>`
3. For data issues: restore from backup via Render dashboard

---

## 13. DEVELOPMENT WORKFLOW (Day to Day)

```bash
# 1. Create feature branch
git checkout develop
git pull origin develop
git checkout -b feature/cell-group-phone-search

# 2. Develop locally
cd backend && npm run dev
cd frontend && npm run dev

# 3. Commit with convention
git add .
git commit -m "feat(cell): add phone number batch lookup for group add"

# 4. Push and open PR
git push origin feature/cell-group-phone-search
# Open PR on GitHub → develop base branch
# CI runs automatically

# 5. After review + CI pass → Merge to develop
# Vercel preview deploys staging automatically

# 6. When ready for production → PR from develop to main
# After merge → GitHub Actions triggers Render deploy hook
# Vercel auto-promotes main to production
```
