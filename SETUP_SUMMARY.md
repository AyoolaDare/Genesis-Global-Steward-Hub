# Setup & Containerization Summary

This document provides a quick reference for all setup and deployment configurations.

## Quick Reference

### Getting Started (Choose One)

#### Option 1: Docker (Recommended) ⭐ 
```bash
# Windows
setup.bat docker

# macOS/Linux
chmod +x setup.sh && ./setup.sh docker
```

#### Option 2: Local Development
```bash
# Windows
setup.bat local

# macOS/Linux
chmod +x setup.sh && ./setup.sh local
```

---

## Project Files Overview

### Root Level Documentation
| File | Purpose |
|------|---------|
| [README.md](README.md) | Main project overview |
| [LOCAL_SETUP.md](LOCAL_SETUP.md) | Detailed local setup & troubleshooting |
| [CONTAINERIZATION.md](CONTAINERIZATION.md) | Docker configuration & deployment |
| [SETUP_SUMMARY.md](SETUP_SUMMARY.md) | This file - quick reference |

### Docker Compose Files
| File | Use Case |
|------|----------|
| [docker-compose.yml](docker-compose.yml) | **Development** (recommended) - hot-reload, debugging |
| [docker-compose.test.yml](docker-compose.test.yml) | Testing - runs pytest in containers |
| [docker-compose.prod.yml](docker-compose.prod.yml) | Production-like testing - local prod environment |

### Dockerfiles
| File | Purpose |
|------|---------|
| [backend/Dockerfile](backend/Dockerfile) | Production image (optimized, minimal) |
| [backend/Dockerfile.dev](backend/Dockerfile.dev) | Development image (debug tools) |
| [frontend/Dockerfile.dev](frontend/Dockerfile.dev) | Frontend dev image (Vite HMR) |

### Configuration Files
| File | Type | Environment |
|------|------|-------------|
| [backend/.env.example](backend/.env.example) | Template | All |
| [backend/.env](backend/.env) | Config | Local dev/Docker dev |
| [frontend/.env.example](frontend/.env.example) | Template | All |
| [frontend/.env](frontend/.env) | Config | Local dev/Docker dev |

### Setup Scripts
| File | Platform | Purpose |
|------|----------|---------|
| [setup.bat](setup.bat) | Windows | Automated Docker/Local setup |
| [setup.sh](setup.sh) | macOS/Linux | Automated Docker/Local setup |
| [backend/entrypoint.sh](backend/entrypoint.sh) | All | Container initialization |

### Optimization Files
| File | Purpose |
|------|---------|
| [backend/.dockerignore](backend/.dockerignore) | Reduce build context size |
| [frontend/.dockerignore](frontend/.dockerignore) | Reduce build context size |

---

## Service Ports

| Service | Port | URL | Notes |
|---------|------|-----|-------|
| Frontend | 5173 | http://localhost:5173 | Vite dev server |
| Backend API | 8000 | http://localhost:8000 | Django dev server |
| API Docs | 8000 | http://localhost:8000/api/docs/ | Swagger UI |
| Admin | 8000 | http://localhost:8000/admin/ | Django admin |
| Database | 5432 | localhost:5432 | PostgreSQL (local only) |

**Access**: All bound to `127.0.0.1` (localhost only for security)

---

## Environment Variables Quick Reference

### Backend (backend/.env)

**Minimal Setup for Docker Development:**
```env
DJANGO_SETTINGS_MODULE=cms.settings.development
SECRET_KEY=dev-secret-key-for-docker
DEBUG=True
DB_NAME=cms_church_dev
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=db           # No Docker: localhost
DB_PORT=5432
ALLOWED_HOSTS=localhost,127.0.0.1,backend
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

**Key Variables by Environment:**

| Variable | Development | Production |
|----------|------------|-----------|
| DJANGO_SETTINGS_MODULE | `cms.settings.development` | `cms.settings.production` |
| DEBUG | `True` | `False` |
| SECRET_KEY | dev key (baked in compose) | Strong random (from Render) |
| DB_HOST | `db` (Docker) / `localhost` | Render DB cluster |
| ALLOWED_HOSTS | `localhost,127.0.0.1` | `cms-backend.onrender.com` |

### Frontend (frontend/.env)

**Docker Development:**
```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_API_PROXY_TARGET=http://backend:8000
```

**Local Development:**
```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_API_PROXY_TARGET=http://localhost:8000
```

**Production:**
```env
VITE_API_URL=https://cms-backend.onrender.com/api/v1
```

---

## Common Commands

### Docker Development

```bash
# Start everything
docker-compose up --build

# Start in background
docker-compose up -d --build

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend

# Execute command in container
docker-compose exec backend python manage.py createsuperuser

# Stop all services
docker-compose stop

# Remove everything (keep data)
docker-compose down

# Remove everything (including database)
docker-compose down -v

# Rebuild without cache
docker-compose build --no-cache

# Restart specific service
docker-compose restart backend
```

### Local Development

#### Backend
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements/development.txt

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start server
python manage.py runserver
```

#### Frontend
```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Lint code
npm run lint
```

### Testing

```bash
# Docker testing
docker-compose -f docker-compose.test.yml up --build

# Local backend testing
cd backend
source venv/bin/activate
pytest

# Local frontend testing
cd frontend
npm run test
```

---

## Database Management

### With Docker

```bash
# Connect to PostgreSQL
docker-compose exec db psql -U postgres -d cms_church_dev

# Backup database
docker-compose exec db pg_dump -U postgres cms_church_dev > backup.sql

# Restore database
docker-compose exec -T db psql -U postgres cms_church_dev < backup.sql

# View database
docker-compose exec db psql -U postgres -d cms_church_dev -c "\dt"
```

### Local Development

```bash
# Connect to PostgreSQL
psql -U postgres -d cms_church_dev

# Backup database
pg_dump -U postgres cms_church_dev > backup.sql

# Restore database
psql -U postgres cms_church_dev < backup.sql
```

### Django Migrations

```bash
# Make migrations (after model changes)
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Show migration status
python manage.py showmigrations

# Rollback to specific migration
python manage.py migrate <app_name> <migration_number>
```

---

## Health Checks

All services include health checks:

```bash
# Check service status
docker-compose ps

# Check specific service health
docker-compose exec backend curl http://localhost:8000/api/v1/health/

# View health check logs
docker ps --format="table {{.Names}}\t{{.Status}}"
```

---

## Initial Setup Checklist

- [ ] Clone repository
- [ ] Copy `.env.example` to `.env` files
- [ ] Run setup script or manual setup
- [ ] Verify database connection
- [ ] Run migrations
- [ ] Create superuser
- [ ] Access frontend at http://localhost:5173
- [ ] Login with superuser credentials
- [ ] Test API at http://localhost:8000/api/v1
- [ ] Check admin panel at http://localhost:8000/admin/

---

## Deployment (Render.com)

1. **Push to GitHub** - Includes `render.yaml`
2. **Create Blueprint** - In Render dashboard
3. **Set Environment** - Configure in dashboard:
   - `SECRET_KEY`
   - `CORS_ALLOWED_ORIGINS`
   - `CSRF_TRUSTED_ORIGINS`
   - Optional: Cloudinary, Termii credentials
4. **Deploy** - Render auto-builds and deploys
5. **Monitor** - View logs in Render dashboard

```bash
# Verify production (after deployment)
curl https://cms-backend.onrender.com/api/v1/health/
```

---

## Troubleshooting Quick Fixes

### Port Already in Use
```bash
# Find and kill process
lsof -i :5173 && kill -9 <PID>  # macOS/Linux
netstat -ano | findstr :5173 && taskkill /PID <PID> /F  # Windows
```

### Database Won't Connect
```bash
# Check PostgreSQL status
docker-compose ps

# Restart service
docker-compose restart db

# Check logs
docker-compose logs db
```

### Changes Not Appearing (Local Dev)
```bash
# Make sure venv is activated
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows

# Frontend - clear cache
rm -rf node_modules/.vite
npm run dev
```

### Docker Build Fails
```bash
# Clean build
docker-compose build --no-cache

# Check disk space
docker system df

# Cleanup if needed
docker system prune -a --volumes
```

---

## Documentation Structure

```
docs/
├── ADMIN.md              # Admin interface guide
├── BACKEND.md            # Backend development
├── DATABASE.md           # Database schema & models
├── DEPARTMENT.md         # Department features
├── DEVOPS.md             # Operations & deployment
├── ENVIRONMENTS.md       # Environment setup
├── FRONTEND.md           # Frontend development
├── GENERAL.md            # General documentation
└── Security SKILL.md     # Security best practices
```

---

## Key Technologies

| Component | Technology | Version |
|-----------|-----------|---------|
| **Backend** | Django + DRF | 5.0.4 + 3.15.1 |
| **Frontend** | React + Vite | 18.3 + 5.3.4 |
| **Database** | PostgreSQL | 15 |
| **Container** | Docker | 20.10+ |
| **Python** | Python | 3.12 |
| **Node** | Node.js | 18+ |

---

## Support & Help

1. **Setup Issues**: See [LOCAL_SETUP.md](LOCAL_SETUP.md) → Troubleshooting
2. **Docker Issues**: See [CONTAINERIZATION.md](CONTAINERIZATION.md) → Troubleshooting
3. **API Issues**: See http://localhost:8000/api/docs/ (Swagger)
4. **Database Issues**: See [docs/DATABASE.md](docs/DATABASE.md)
5. **Security**: See [docs/Security SKILL.md](docs/Security%20SKILL.md)

---

Last Updated: April 5, 2026

For detailed information, see the individual setup and containerization guides.
