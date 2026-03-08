# Environments: Dev, Test, Production

This project supports three separate tracks:

1. Development (Docker local)
2. Test (Docker local/CI)
3. Production (Render backend + Vercel frontend via GitHub)

## 1) Development (Docker)

Use the main compose file:

```bash
docker compose up -d
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py seed_data
```

URLs:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000/api/v1`

## 2) Test (Container-ready)

Use dedicated test compose:

```bash
docker compose -f docker-compose.test.yml up --build --abort-on-container-exit --exit-code-from backend-test
docker compose -f docker-compose.test.yml down -v
```

What it does:
- Starts isolated Postgres (`cms_test`)
- Runs Django migrations
- Runs `pytest`
- Treats pytest exit code `5` (no tests collected) as success

## 3) Production (Git + Render + Vercel)

Production deploy is already wired through GitHub Actions:

- Backend: `.github/workflows/deploy-backend.yml` -> Render deploy hook
- Frontend: `.github/workflows/deploy-frontend.yml` -> Vercel deploy

### Recommended Git flow

1. Work on feature branches
2. Open PR into `develop`
3. CI must pass (`.github/workflows/ci.yml`)
4. Merge `develop` -> `main` for production release

### Required GitHub secrets

Backend (Render):
- `RENDER_DEPLOY_HOOK_URL`
- `RENDER_BACKEND_URL`

Frontend (Vercel):
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `VITE_API_URL` (example: `https://<your-render-domain>/api/v1`)

### Render production env vars (dashboard)

Set at minimum:
- `DJANGO_SETTINGS_MODULE=cms.settings.production`
- `SECRET_KEY`
- `ALLOWED_HOSTS`
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`
- `CORS_ALLOWED_ORIGINS`
- `CSRF_TRUSTED_ORIGINS`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

### Vercel production env vars

- `VITE_API_URL=https://<your-render-domain>/api/v1`

## Quick readiness checklist

- [ ] `docker compose up -d` works locally
- [ ] `docker compose -f docker-compose.test.yml ...` passes
- [ ] `ci.yml` passes on PR
- [ ] `main` branch protected (require CI)
- [ ] Render + Vercel secrets present
- [ ] Production backend health endpoint returns 200: `/api/v1/health/`
