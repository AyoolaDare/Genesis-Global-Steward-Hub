@echo off
REM Setup script for CMS project
REM Usage: setup.bat [docker|local]

SETLOCAL ENABLEDELAYEDEXPANSION

if "%1%"=="" (
    echo.
    echo ====================================================
    echo CMS Project Setup Script
    echo ====================================================
    echo.
    echo Usage: setup.bat [docker^|local]
    echo.
    echo   docker    - Setup using Docker Compose (recommended^)
    echo   local     - Setup for local development (requires Python, Node, PostgreSQL^)
    echo.
    goto :end
)

if "%1%"=="docker" (
    echo.
    echo ====================================================
    echo Docker Setup
    echo ====================================================
    echo.
    
    echo Checking Docker installation...
    docker --version >nul 2>&1
    if errorlevel 1 (
        echo ERROR: Docker is not installed or not in PATH
        echo Please install Docker Desktop: https://www.docker.com/products/docker-desktop
        goto :end
    )
    
    echo ✓ Docker found
    echo.
    
    echo Copying environment files...
    if not exist backend\.env (
        copy backend\.env.example backend\.env
        echo ✓ Created backend\.env
    ) else (
        echo - backend\.env already exists
    )
    
    if not exist frontend\.env (
        copy frontend\.env.example frontend\.env
        echo ✓ Created frontend\.env
    ) else (
        echo - frontend\.env already exists
    )
    
    echo.
    echo Starting Docker containers...
    docker-compose up --build -d
    
    if errorlevel 1 (
        echo ERROR: Failed to start containers
        goto :end
    )
    
    echo.
    echo ✓ Containers started!
    echo.
    echo Services running:
    echo   - Frontend:  http://localhost:5173
    echo   - Backend:   http://localhost:8000
    echo   - API Docs:  http://localhost:8000/api/docs/
    echo   - Admin:     http://localhost:8000/admin/
    echo   - Database:  localhost:5432
    echo.
    echo Run: docker-compose logs -f
    echo to watch the logs
    echo.
    goto :end
)

if "%1%"=="local" (
    echo.
    echo ====================================================
    echo Local Setup
    echo ====================================================
    echo.
    
    REM Check Python
    python --version >nul 2>&1
    if errorlevel 1 (
        echo ERROR: Python is not installed or not in PATH
        echo Please install Python 3.12+: https://www.python.org/downloads/
        goto :end
    )
    echo ✓ Python found: 
    python --version
    
    REM Check Node
    node --version >nul 2>&1
    if errorlevel 1 (
        echo ERROR: Node.js is not installed or not in PATH
        echo Please install Node.js 18+: https://nodejs.org/
        goto :end
    )
    echo ✓ Node.js found:
    node --version
    
    REM Check PostgreSQL
    psql --version >nul 2>&1
    if errorlevel 1 (
        echo WARNING: PostgreSQL not in PATH - make sure PostgreSQL service is running
    ) else (
        echo ✓ PostgreSQL found:
        psql --version
    )
    
    echo.
    echo ====================================================
    echo Backend Setup
    echo ====================================================
    echo.
    
    cd backend
    
    if not exist venv (
        echo Creating virtual environment...
        python -m venv venv
        echo ✓ Virtual environment created
    )
    
    echo Activating virtual environment...
    call venv\Scripts\activate.bat
    
    echo Installing dependencies...
    pip install -q -r requirements/development.txt
    echo ✓ Dependencies installed
    
    echo Copying .env file...
    if not exist .env (
        copy .env.example .env
        echo ✓ Created .env
        echo   Edit backend\.env and set your database credentials
    )
    
    echo Running migrations...
    python manage.py migrate
    if errorlevel 1 (
        echo ERROR: Database migrations failed
        echo Make sure PostgreSQL is running and database credentials are correct
        echo Edit backend\.env
        goto :end
    )
    echo ✓ Migrations complete
    
    cd ..
    
    echo.
    echo ====================================================
    echo Frontend Setup
    echo ====================================================
    echo.
    
    cd frontend
    
    echo Copying .env file...
    if not exist .env (
        copy .env.example .env
        echo ✓ Created .env
    )
    
    echo Installing dependencies...
    call npm install -q
    echo ✓ Dependencies installed
    
    cd ..
    
    echo.
    echo ====================================================
    echo ✓ Setup Complete!
    echo ====================================================
    echo.
    echo To start development:
    echo.
    echo 1. Backend (in another terminal^):
    echo    cd backend
    echo    venv\Scripts\activate
    echo    python manage.py runserver
    echo.
    echo 2. Frontend (in another terminal^):
    echo    cd frontend
    echo    npm run dev
    echo.
    echo Frontend will be available at: http://localhost:5173
    echo Backend API at: http://localhost:8000
    echo.
    goto :end
)

echo ERROR: Unknown option "%1%"
echo Usage: setup.bat [docker^|local]

:end
pause
