# Containerization Guide

This document explains the Docker setup for the CMS application, including development, testing, and production configurations.

## Overview

The CMS project uses Docker to ensure consistency across different development environments and to simplify deployment. We provide three Docker Compose configurations:

- **docker-compose.yml** - Local development (recommended, with hot-reload)
- **docker-compose.test.yml** - Automated testing
- **docker-compose.prod.yml** - Production-like local testing
- **Dockerfile.dev** - Development image (with debug tools)
- **Dockerfile** - Production image (optimized, minimal)

---

## Architecture

### Services

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (React)                       │
│             Port: 5173 (Vite Dev Server)               │
│        Volume: ./frontend/src (hot-reload)             │
└──────────────────┬──────────────────────────────────────┘
                   │ HTTP (Vite proxy to /api)
┌──────────────────▼──────────────────────────────────────┐
│              Backend (Django + DRF)                      │
│             Port: 8000 (Django Dev)                     │
│        Volume: ./backend (hot-reload)                  │
└──────────────────┬──────────────────────────────────────┘
                   │ PostgreSQL
┌──────────────────▼──────────────────────────────────────┐
│          Database (PostgreSQL 15-Alpine)                │
│             Port: 5432 (localhost only)                 │
│        Volume: postgres_data (persistent)              │
└─────────────────────────────────────────────────────────┘
```

---

## Configuration Files

### Development (docker-compose.yml)

**Purpose**: Local development with auto-reload and live debugging

**Features**:
- Volume mounts for instant code changes (no rebuild needed)
- Environment variables for development settings
- Health checks for all services
- PostgreSQL with persistent data volume
- Exposed ports on localhost only (security)

**Services**:
- `db` - PostgreSQL 15-Alpine
- `backend` - Python 3.12-slim + Django
- `frontend` - Node 20-Alpine + Vite

**Usage**:
```bash
docker-compose up --build
```

### Testing (docker-compose.test.yml)

**Purpose**: Automated test execution in containers

**Features**:
- Separate test database (cms_test)
- Pytest with Django integration
- Automatic migration before tests
- Exit code handling for CI/CD pipelines

**Usage**:
```bash
docker-compose -f docker-compose.test.yml up --build
```

### Production-like (docker-compose.prod.yml)

**Purpose**: Local testing with production-like settings

**Features**:
- Uses production Dockerfile for backend
- DEBUG=False
- Production database config
- No volume mounts (immutable containers)

**Usage**:
```bash
docker-compose -f docker-compose.prod.yml up --build
```

---

## Dockerfile Details

### Backend Production (Dockerfile)

**Base Image**: `python:3.12-slim`

**Layers**:
1. System dependencies: `libpq-dev` (PostgreSQL client libs)
2. Python dependencies: `requirements/production.txt`
3. Application code
4. Static files collection (WhiteNoise)
5. Entrypoint script for initialization

**Optimization**:
- Multi-stage is not explicitly used but could be added for even smaller images
- Layer caching: requirements copied before source code
- Minimal base image (slim variant, not full)
- No unnecessary packages installed

**Entrypoint**: `entrypoint.sh`
- Runs migrations
- Creates/verifies superuser
- Collects static files (production only)
- Starts application (dev or production mode)

**Security**:
- `PYTHONDONTWRITEBYTECODE=1` - No .pyc files
- `PYTHONUNBUFFERED=1` - Logs appear in real-time
- Secrets from environment variables (not baked into image)

#### Build Command
```bash
docker build -t cms-backend:prod -f backend/Dockerfile backend/
```

#### Size
Expected: ~400-500 MB (slim base + minimal dependencies)

---

### Backend Development (Dockerfile.dev)

**Base Image**: `python:3.12-slim`

**Additional Tools**:
- `gcc` - For compilation if needed during development
- Full development.txt requirements (includes pytest, debug-toolbar)

**Volume Mounts**:
- `./backend:/app` - Source code for hot-reload
- No need to rebuild when code changes

#### Build Command
```bash
docker build -t cms-backend:dev -f backend/Dockerfile.dev backend/
```

---

### Frontend Development (Dockerfile.dev)

**Base Image**: `node:20-alpine`

**Setup**:
- npm install on build
- `CMD npm run dev` - Starts Vite dev server with HMR

**Volume Mounts**:
- `./frontend/src:/app/src` - Source code (hot-reload)
- `./frontend/public:/app/public` - Static assets

#### Build Command
```bash
docker build -t cms-frontend:dev -f frontend/Dockerfile.dev frontend/
```

#### Size
Expected: ~300-400 MB (Alpine base is small)

---

## Environment Variables

### Backend (.env)

Located in: `backend/.env` (created from `backend/.env.example`)

**Development** (local with Docker):
```env
DJANGO_SETTINGS_MODULE=cms.settings.development
SECRET_KEY=dev-secret-key-for-docker-NOT-for-production-change-me
DEBUG=True
DB_NAME=cms_church_dev
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=db  # Docker service name
DB_PORT=5432
ALLOWED_HOSTS=localhost,127.0.0.1,backend
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

**Production** (Render/server):
```env
DJANGO_SETTINGS_MODULE=cms.settings.production
SECRET_KEY=<strong-random-key-from-render-dashboard>
DEBUG=False
DB_NAME=<render-database-name>
DB_USER=<render-database-user>
DB_PASSWORD=<render-database-password>
DB_HOST=<render-database-host>
DB_PORT=5432
ALLOWED_HOSTS=cms-backend.onrender.com
CORS_ALLOWED_ORIGINS=https://cms-frontend.vercel.app
CSRF_TRUSTED_ORIGINS=https://cms-backend.onrender.com
```

### Frontend (.env)

Located in: `frontend/.env` (created from `frontend/.env.example`)

**Development**:
```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_API_PROXY_TARGET=http://backend:8000  # Docker service name
```

**Production**:
```env
VITE_API_URL=https://cms-backend.onrender.com/api/v1
```

---

## Health Checks

All services include health checks for reliability:

### Database Health Check
```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U postgres"]
  interval: 10s
  timeout: 5s
  retries: 5
```

### Backend Health Check
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8000/api/v1/health/"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 30s
```

### Frontend Health Check
```yaml
healthcheck:
  test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:5173/"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 30s
```

---

## Volume Management

### Persistent Data (Production)

```yaml
volumes:
  postgres_data:           # Development
  postgres_prod_data:      # Production-like testing
```

**Location**: Docker's default volume directory
- **Docker Desktop**: `~/Library/Containers/com.docker.docker/Data/docker.raw` (macOS)
- **Linux**: `/var/lib/docker/volumes/`

### Development Source Mounts

```yaml
volumes:
  - ./backend:/app              # Backend source code
  - ./frontend/src:/app/src     # Frontend source code
  - ./frontend/public:/app/public
```

**Benefit**: Code changes are immediately reflected (no rebuild)

### Cleanup

```bash
# Remove all stopped containers
docker-compose down

# Remove volumes (lose database data)
docker-compose down -v

# Remove all images
docker-compose down -v --rmi all
```

---

## Network Configuration

### Internal Communication

Services communicate using Docker's internal DNS:
- `backend:8000` - Backend container
- `db:5432` - Database container
- `frontend:5173` - Frontend container

### External Ports

All services bind to `127.0.0.1` (localhost only):
- Frontend: `127.0.0.1:5173` - Vite dev server
- Backend: `127.0.0.1:8000` - Django dev server
- Database: `127.0.0.1:5432` - PostgreSQL (local connections only)

**Security**: Not exposed on LAN or public network

---

## Building & Running

### Build Images

```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build backend
docker-compose build frontend
docker-compose build db  # N/A - uses pre-built image

# Build without cache (fresh build)
docker-compose build --no-cache
```

### Run Services

```bash
# Start in foreground (see logs)
docker-compose up

# Start in background
docker-compose up -d

# Build and start
docker-compose up --build

# Rebuild and restart everything
docker-compose up --build --force-recreate
```

### View Logs

```bash
# All services
docker-compose logs

# Specific service
docker-compose logs backend
docker-compose logs frontend

# Follow logs in real-time
docker-compose logs -f

# Last 50 lines
docker-compose logs --tail=50
```

### Execute Commands

```bash
# Backend shell
docker-compose exec backend bash

# Create superuser
docker-compose exec backend python manage.py createsuperuser

# Backend shell (Python REPL)
docker-compose exec backend python manage.py shell

# Frontend npm command
docker-compose exec frontend npm run build
```

### Stop/Remove

```bash
# Stop all services (keeps data)
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop and remove everything (including volumes)
docker-compose down -v
```

---

## Production Deployment

### On Render.com

The `render.yaml` blueprint file handles deployment:

```bash
# 1. Push to GitHub with render.yaml in root
# 2. Create Blueprint in Render dashboard
# 3. Render auto-provisions:
#    - PostgreSQL database
#    - Web service (backend)
#    - Environment variables
# 4. Set required env vars in Render dashboard:
#    - SECRET_KEY
#    - CORS_ALLOWED_ORIGINS
#    - CSRF_TRUSTED_ORIGINS
#    - Cloudinary credentials (optional)
```

**Build Command** (in render.yaml):
```bash
pip install -r requirements/production.txt &&
python manage.py collectstatic --noinput --settings=cms.settings.production
```

**Start Command** (in render.yaml):
```bash
python manage.py migrate --settings=cms.settings.production &&
python manage.py ensure_superuser --settings=cms.settings.production &&
gunicorn cms.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120
```

---

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process on port
lsof -i :5173  # macOS/Linux
netstat -ano | findstr :5173  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

#### Database Connection Failed
```bash
# Check if db service is healthy
docker-compose ps

# Check database logs
docker-compose logs db

# Restart database
docker-compose restart db
```

#### Frontend Can't Connect to Backend
```bash
# Verify backend is running
curl http://localhost:8000/api/v1/health/

# Check Vite configuration
cat frontend/vite.config.ts

# Check VITE_API_PROXY_TARGET in frontend/.env
# Should point to http://backend:8000 (Docker) or http://localhost:8000 (local)
```

#### Out of Disk Space
```bash
# Clean up Docker system
docker system prune -a --volumes

# Remove specific images/volumes
docker rmi <image_id>
docker volume rm <volume_name>
```

#### Migrations Fail
```bash
# Check migrations status
docker-compose exec backend python manage.py showmigrations

# Create new migration
docker-compose exec backend python manage.py makemigrations

# Rollback specific app migration
docker-compose exec backend python manage.py migrate <app> <migration_number>
```

---

## Performance Tips

1. **Use .dockerignore** to exclude unnecessary files from build context
2. **Layer caching** - put changing files (requirements) after static files
3. **Alpine images** - use lightweight versions (`python:3.12-slim`, `node:20-alpine`)
4. **Volume mounts** - use for development to avoid rebuilds
5. **Separate dev/prod** - different Dockerfiles for different use cases

---

## Security Best Practices

1. **Don't bake secrets into images** - use environment variables
2. **Use HTTPS in production** - Render handles this
3. **Bind to localhost only** - ports bound to 127.0.0.1 in development
4. **Update base images** - regularly pull latest Alpine/Slim images
5. **Run as non-root** - Django/Node automatically use standard user
6. **Health checks** - detect and restart unhealthy containers

---

## Next Steps

- Read [LOCAL_SETUP.md](./LOCAL_SETUP.md) for detailed setup instructions
- Check [render.yaml](./render.yaml) for production configuration
- Review [backend/Dockerfile](./backend/Dockerfile) for production image details
- Explore `docs/DEVOPS.md` for operations guide

---

Happy containerizing! 🐳
