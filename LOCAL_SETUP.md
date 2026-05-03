# Local Development Setup Guide

This guide will help you set up and run the CMS application locally using Docker Compose and without Docker.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Quick Start (Docker)](#quick-start-docker)
- [Quick Start (Without Docker)](#quick-start-without-docker)
- [Environment Configuration](#environment-configuration)
- [Running Tests](#running-tests)
- [Troubleshooting](#troubleshooting)
- [API Documentation](#api-documentation)

---

## Prerequisites

### Option 1: Using Docker (Recommended)
- **Docker Desktop** (includes Docker Engine & Compose)
  - [Download for Windows](https://www.docker.com/products/docker-desktop)
  - [Download for macOS](https://www.docker.com/products/docker-desktop)
  - [Download for Linux](https://docs.docker.com/engine/install/)
  
- **Minimum Requirements:**
  - RAM: 4GB available
  - Disk: 5GB free space
  - Docker Engine 20.10+, Compose 2.0+

### Option 2: Local Development (No Docker)
- **Backend:**
  - Python 3.12+ ([Download](https://www.python.org/downloads/))
  - PostgreSQL 15+ ([Download](https://www.postgresql.org/download/))
  - pip (comes with Python)

- **Frontend:**
  - Node.js 18+ ([Download](https://nodejs.org/))
  - npm (comes with Node.js)

---

## Quick Start (Docker)

### 1. Clone and Navigate
```bash
cd c:\Users\LENOVO\Desktop\CMS
# or your project directory
```

### 2. Set Up Environment Files
```bash
# Copy backend environment template to .env
copy backend\.env.example backend\.env

# Copy frontend environment template to .env  
copy frontend\.env.example frontend\.env
```

### 3. Start All Services
```bash
docker-compose up --build
```

This will:
- ✅ Build backend and frontend images
- ✅ Start PostgreSQL database (port 5432)
- ✅ Start Django backend (port 8000)
- ✅ Start Vite frontend (port 5173)
- ✅ Run database migrations automatically
- ✅ Create a superuser (if needed)

### 4. Access the Application
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000/api/v1
- **API Docs (Swagger):** http://localhost:8000/api/docs/
- **Django Admin:** http://localhost:8000/admin/
- **Database:** localhost:5432 (postgres/postgres)

### 5. Create Initial Admin Account
```bash
# In a new terminal while containers are running:
docker-compose exec backend python manage.py createsuperuser
```

Or use the env variables in `backend/.env` to auto-create one:
```env
SUPERUSER_EMAIL=admin@yourchurch.org
SUPERUSER_USERNAME=admin
SUPERUSER_PASSWORD=your_strong_password
```

### 6. Stop Services
```bash
docker-compose down

# Remove volumes (database data) if you want to start fresh:
docker-compose down -v
```

---

## Quick Start (Without Docker)

### Backend Setup

#### 1. Create and Activate Virtual Environment
```bash
cd backend

# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

#### 2. Install Dependencies
```bash
pip install -r requirements/development.txt
```

#### 3. Set Up Environment
```bash
# Windows
copy .env.example .env

# macOS/Linux
cp .env.example .env
```

Edit `backend/.env` and set:
```env
DJANGO_SETTINGS_MODULE=cms.settings.development
SECRET_KEY=your-secret-key-here
DEBUG=True
DB_NAME=cms_church_dev
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
```

#### 4. Create Database
```bash
# Create PostgreSQL database (requires PostgreSQL running)
createdb -U postgres cms_church_dev
# or use pgAdmin GUI if you prefer
```

#### 5. Run Migrations
```bash
python manage.py migrate
```

#### 6. Create Superuser
```bash
python manage.py createsuperuser
```

#### 7. Start Development Server
```bash
python manage.py runserver
# Runs on http://localhost:8000
```

---

### Frontend Setup

#### 1. Navigate to Frontend
```bash
cd frontend
```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Set Up Environment
```bash
# Windows
copy .env.example .env

# macOS/Linux
cp .env.example .env
```

Edit `frontend/.env`:
```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_API_PROXY_TARGET=http://localhost:8000
```

#### 4. Start Development Server
```bash
npm run dev
# Runs on http://localhost:5173
# Vite Auto-refresh on file changes enabled
```

#### 5. Build for Production
```bash
npm run build
# Output: dist/
```

---

## Environment Configuration

### Backend (.env)

| Variable | Purpose | Example |
|----------|---------|---------|
| `DJANGO_SETTINGS_MODULE` | Which settings file to use | `cms.settings.development` |
| `SECRET_KEY` | Django secret | `python -c "import secrets; print(secrets.token_urlsafe(50))"` |
| `DEBUG` | Debug mode | `True` (dev), `False` (prod) |
| `DB_NAME` | Database name | `cms_church_dev` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | `postgres` |
| `DB_HOST` | Database host | `localhost` (no Docker), `db` (Docker) |
| `DB_PORT` | Database port | `5432` |
| `ALLOWED_HOSTS` | Allowed domains | `localhost,127.0.0.1,[::1]` |
| `CORS_ALLOWED_ORIGINS` | Frontend origins | `http://localhost:5173` |

### Frontend (.env)

| Variable | Purpose | Example |
|----------|---------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:8000/api/v1` |
| `VITE_API_PROXY_TARGET` | Vite dev server proxy | `http://localhost:8000` |

---

## Running Tests

### Backend Tests (with Docker)
```bash
docker-compose -f docker-compose.test.yml up --build
```

### Backend Tests (without Docker)
```bash
cd backend

# Activate virtual environment first
source venv/bin/activate  # or venv\Scripts\activate (Windows)

# Run all tests
pytest

# Run specific test file
pytest tests/test_auth.py

# Run with verbose output
pytest -v

# Run with coverage
pytest --cov=apps
```

### Frontend Tests
```bash
cd frontend

# Run all tests
npm run test

# Run with watch mode
npm run test:watch
```

---

## Troubleshooting

### Docker Issues

#### Containers won't start
```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db

# Rebuild images
docker-compose down
docker-compose up --build
```

#### Port already in use
```bash
# Windows - find and kill process on port 5173/8000/5432
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :5173
kill -9 <PID>
```

#### Database connection error
```bash
# Ensure database service is healthy
docker-compose ps

# Check database logs
docker-compose logs db

# Rebuild and restart
docker-compose down -v
docker-compose up --build
```

---

### Local Setup Issues

#### Python module not found
```bash
# Ensure virtual environment is activated
# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements/development.txt
```

#### PostgreSQL connection refused
```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 5432

# Start PostgreSQL service
# Windows: Use Services app or `pg_ctl start`
# macOS: `brew services start postgresql`
# Linux: `sudo systemctl start postgresql`
```

#### Node dependencies issues
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Hot reload not working
```bash
# Ensure VITE_API_PROXY_TARGET points to correct backend
# In frontend/.env:
VITE_API_PROXY_TARGET=http://localhost:8000

# Clear Vite cache
rm -rf node_modules/.vite
```

---

## API Documentation

### Swagger UI
Access interactive API documentation at:
```
http://localhost:8000/api/docs/
```

### ReDoc
Alternative API documentation at:
```
http://localhost:8000/api/redoc/
```

### Example API Requests

#### Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourchurch.org",
    "password": "your_password"
  }'
```

Response:
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

#### Get Members (with Authorization)
```bash
curl -X GET http://localhost:8000/api/v1/persons/ \
  -H "Authorization: Bearer <your_access_token>"
```

---

## Next Steps

1. **Create an admin user** and explore the Django admin interface
2. **Log in to the frontend** using your admin credentials
3. **Check the API documentation** to understand available endpoints
4. **Read the backend documentation** in `docs/BACKEND.md`
5. **Read the security guide** in `docs/Security SKILL.md`

---

## Getting Help

- Check logs: `docker-compose logs <service>`
- Read documentation in `docs/` folder
- Review error messages in browser console (frontend)
- Check Django admin for database records
- Run health check: `curl http://localhost:8000/api/v1/health/`

---

## Project Structure
```
CMS/
├── backend/          # Django REST API
│  ├── cms/           # Settings & configs
│  ├── apps/          # Django apps (auth, people, medical, etc)
│  ├── requirements/  # Python dependencies
│  ├── Dockerfile     # Production image
│  └── Dockerfile.dev # Development image
├── frontend/         # React + TypeScript
│  ├── src/           # React components & logic
│  ├── public/        # Static assets
│  ├── Dockerfile.dev # Development image
│  └── package.json   # Node dependencies
├── docker-compose.yml       # Local development
├── docker-compose.test.yml  # Testing
├── render.yaml              # Production (Render deployment)
└── docs/             # Documentation

```

---

Happy coding! 🚀
