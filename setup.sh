#!/bin/bash
# Setup script for CMS project
# Usage: chmod +x setup.sh && ./setup.sh [docker|local]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo ""
    echo "===================================================="
    echo "$1"
    echo "===================================================="
    echo ""
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}ERROR:${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}WARNING:${NC} $1"
}

print_info() {
    echo "  - $1"
}

# Main script
if [ -z "$1" ]; then
    echo ""
    print_header "CMS Project Setup Script"
    echo ""
    echo "Usage: ./setup.sh [docker|local]"
    echo ""
    echo "  docker    - Setup using Docker Compose (recommended)"
    echo "  local     - Setup for local development (requires Python, Node, PostgreSQL)"
    echo ""
    exit 0
fi

if [ "$1" = "docker" ]; then
    print_header "Docker Setup"
    
    echo "Checking Docker installation..."
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed or not in PATH"
        echo "Please install Docker Desktop: https://www.docker.com/products/docker-desktop"
        exit 1
    fi
    print_success "Docker found: $(docker --version)"
    
    echo ""
    echo "Checking Docker Compose..."
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed or not in PATH"
        echo "Please install Docker Compose: https://docs.docker.com/compose/install/"
        exit 1
    fi
    print_success "Docker Compose found: $(docker-compose --version)"
    
    echo ""
    echo "Copying environment files..."
    if [ ! -f backend/.env ]; then
        cp backend/.env.example backend/.env
        print_success "Created backend/.env"
    else
        print_info "backend/.env already exists"
    fi
    
    if [ ! -f frontend/.env ]; then
        cp frontend/.env.example frontend/.env
        print_success "Created frontend/.env"
    else
        print_info "frontend/.env already exists"
    fi
    
    echo ""
    echo "Starting Docker containers..."
    docker-compose up --build -d
    
    echo ""
    print_success "Containers started!"
    echo ""
    echo "Services running:"
    print_info "Frontend:  http://localhost:5173"
    print_info "Backend:   http://localhost:8000"
    print_info "API Docs:  http://localhost:8000/api/docs/"
    print_info "Admin:     http://localhost:8000/admin/"
    print_info "Database:  localhost:5432"
    echo ""
    echo "Run: docker-compose logs -f"
    echo "to watch the logs"
    echo ""
    exit 0
fi

if [ "$1" = "local" ]; then
    print_header "Local Setup"
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is not installed or not in PATH"
        echo "Please install Python 3.12+: https://www.python.org/downloads/"
        exit 1
    fi
    print_success "Python found: $(python3 --version)"
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed or not in PATH"
        echo "Please install Node.js 18+: https://nodejs.org/"
        exit 1
    fi
    print_success "Node.js found: $(node --version)"
    
    # Check PostgreSQL
    if ! command -v psql &> /dev/null; then
        print_warning "PostgreSQL not in PATH - make sure PostgreSQL service is running"
    else
        print_success "PostgreSQL found: $(psql --version)"
    fi
    
    # Backend setup
    print_header "Backend Setup"
    
    cd backend
    
    if [ ! -d venv ]; then
        echo "Creating virtual environment..."
        python3 -m venv venv
        print_success "Virtual environment created"
    fi
    
    echo "Activating virtual environment..."
    source venv/bin/activate
    
    echo "Installing dependencies..."
    pip install -q -r requirements/development.txt
    print_success "Dependencies installed"
    
    echo "Copying .env file..."
    if [ ! -f .env ]; then
        cp .env.example .env
        print_success "Created .env"
        echo "  Edit backend/.env and set your database credentials"
    fi
    
    echo "Running migrations..."
    if ! python manage.py migrate; then
        print_error "Database migrations failed"
        echo "Make sure PostgreSQL is running and database credentials are correct"
        echo "Edit backend/.env"
        exit 1
    fi
    print_success "Migrations complete"
    
    cd ..
    
    # Frontend setup
    print_header "Frontend Setup"
    
    cd frontend
    
    echo "Copying .env file..."
    if [ ! -f .env ]; then
        cp .env.example .env
        print_success "Created .env"
    fi
    
    echo "Installing dependencies..."
    npm install -q
    print_success "Dependencies installed"
    
    cd ..
    
    print_header "✓ Setup Complete!"
    echo ""
    echo "To start development:"
    echo ""
    echo "1. Backend (in another terminal):"
    print_info "cd backend"
    print_info "source venv/bin/activate"
    print_info "python manage.py runserver"
    echo ""
    echo "2. Frontend (in another terminal):"
    print_info "cd frontend"
    print_info "npm run dev"
    echo ""
    echo "Frontend will be available at: http://localhost:5173"
    echo "Backend API at: http://localhost:8000"
    echo ""
    exit 0
fi

print_error "Unknown option \"$1\""
echo "Usage: ./setup.sh [docker|local]"
exit 1
