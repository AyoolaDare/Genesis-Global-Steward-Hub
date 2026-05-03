# Workers Hub — Developer Installation & Skills Guide
**Reference before starting any phase of the build**  
**Last updated:** April 2026

---

## Table of Contents

1. [Machine Prerequisites](#1-machine-prerequisites)
2. [Backend Stack — Install & Setup](#2-backend-stack--install--setup)
3. [Frontend Stack — Install & Setup](#3-frontend-stack--install--setup)
4. [Docker & Infrastructure](#4-docker--infrastructure)
5. [API Integrations — Termii & Paystack](#5-api-integrations--termii--paystack)
6. [Security Libraries](#6-security-libraries)
7. [Dev Tools & Quality](#7-dev-tools--quality)
8. [Key Concepts You Must Understand](#8-key-concepts-you-must-understand)
9. [Recommended Learning Order](#9-recommended-learning-order)
10. [Quick Command Reference](#10-quick-command-reference)

---

## 1. Machine Prerequisites

Install these first before anything else.

### Required Software

| Tool | Version | Install Command / Link |
|---|---|---|
| Python | 3.11+ | https://python.org/downloads |
| Node.js | 20 LTS | https://nodejs.org |
| Docker Desktop | Latest | https://docker.com/products/docker-desktop |
| Git | Latest | https://git-scm.com |
| VS Code | Latest | https://code.visualstudio.com |

### Verify Installation

```bash
python --version       # Should show 3.11+
node --version         # Should show v20+
npm --version          # Should show 10+
docker --version       # Should show 24+
docker compose version # Should show v2+
git --version
```

### VS Code Extensions to Install

Search and install these inside VS Code:

```
Python (Microsoft)
Pylance
Docker
ESLint
Prettier - Code formatter
Tailwind CSS IntelliSense
Thunder Client  ← for testing APIs inside VS Code (no Postman needed)
GitLens
```

---

## 2. Backend Stack — Install & Setup

### 2.1 Python Virtual Environment

Always create a virtual environment before installing any Python packages:

```bash
# Create virtual environment
python -m venv venv

# Activate (Linux/Mac)
source venv/bin/activate

# Activate (Windows)
venv\Scripts\activate

# You should see (venv) in your terminal prompt
```

### 2.2 Core Backend Packages

Create a `requirements.txt` in your backend folder with these:

```txt
# Web Framework
fastapi[standard]==0.115.0
uvicorn[standard]==0.32.1

# Database
sqlalchemy[asyncio]==2.0.23
asyncpg==0.29.0
psycopg2-binary==2.9.9
alembic==1.13.1

# Data Validation
pydantic==2.10.3
pydantic-settings==2.7.0
pydantic[email]==2.10.3
email-validator==2.3.0

# Authentication & Security
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
bcrypt==4.1.2
python-multipart==0.0.9

# Redis (session, rate limiting)
redis==5.0.1
aioredis==2.0.1

# HTTP Client (for Termii, Paystack calls)
httpx==0.27.0

# Environment variables
python-dotenv==1.0.1

# File handling (MinIO)
minio==7.2.5

# Encryption (medical data)
cryptography==42.0.5

# Scheduling (future use)
celery==5.3.6

# Testing
pytest==7.4.4
pytest-asyncio==0.23.5
httpx==0.27.0
```

Install all at once:

```bash
pip install -r requirements.txt
```

### 2.3 FastAPI — Key Concepts

**FastAPI is the web framework.** It handles incoming HTTP requests and sends responses.

```python
# Basic FastAPI pattern you'll use everywhere
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

app = FastAPI()

@app.get("/members")                    # Route decorator
async def get_members():                # async function = non-blocking
    return {"members": []}
```

**Critical rule:** Always use `async def` for route functions. This is what makes FastAPI fast.

### 2.4 SQLAlchemy 2.0 (Async) — Key Concepts

SQLAlchemy is your database translator. It converts Python objects into SQL.

**IMPORTANT — Use SQLAlchemy 2.0 style, NOT version 1 style.** Most old tutorials show version 1. Use the version 2 pattern:

```python
# database.py — Correct 2.0 async setup
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

# NOTE: Use postgresql+asyncpg:// NOT postgresql://
DATABASE_URL = "postgresql+asyncpg://user:password@localhost:5432/workershub"

engine = create_async_engine(DATABASE_URL, echo=True)
async_session_maker = async_sessionmaker(engine, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

# Dependency injection pattern — used in every route
async def get_db():
    async with async_session_maker() as session:
        yield session
```

**Common mistake:** Using `postgresql://` instead of `postgresql+asyncpg://`. It won't crash immediately but will block your event loop under real traffic.

### 2.5 Alembic — Database Migrations

Alembic manages your database schema changes safely. Think of it as version control for your database.

```bash
# Initialize Alembic (run once)
alembic init alembic

# After creating or changing a model, generate a migration
alembic revision --autogenerate -m "Add member table"

# Apply migrations to database
alembic upgrade head

# Roll back one migration
alembic downgrade -1

# See migration history
alembic history
```

**Rule:** Never manually ALTER tables in production. Always use Alembic migrations.

### 2.6 JWT Authentication Pattern

```python
# auth_service.py — the pattern you'll follow
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from passlib.context import CryptContext

SECRET_KEY = "your-secret-from-env"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload["type"] = "access"
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
```

### 2.7 RBAC Pattern (Role-Based Access Control)

```python
# dependencies.py — role checking you'll use on every protected route
from fastapi import Depends, HTTPException, status
from enum import Enum

class Role(str, Enum):
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    FOLLOWUP_OFFICER = "followup_officer"
    MEDICAL_OFFICER = "medical_officer"
    CELL_LEADER = "cell_leader"

def require_role(*allowed_roles: Role):
    def checker(current_user = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource"
            )
        return current_user
    return checker

# Usage on any route:
@app.get("/admin/dashboard")
async def admin_dashboard(user = Depends(require_role(Role.SUPER_ADMIN, Role.ADMIN))):
    ...
```

**Security rule:** Always enforce RBAC on the backend. Frontend role-gating is for UX only — not security.

---

## 3. Frontend Stack — Install & Setup

### 3.1 Create React App with Vite (2026 method)

```bash
# Create project
npm create vite@latest workers-hub-frontend -- --template react

# Move into folder
cd workers-hub-frontend

# Install base dependencies
npm install
```

### 3.2 Install Tailwind CSS (2026 correct method)

**Important:** The setup method changed in Tailwind v4. Use the Vite plugin method:

```bash
npm install -D @tailwindcss/vite
```

Update `vite.config.js`:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),   // ← Add this
  ],
})
```

In `src/index.css`, replace everything with:

```css
@import "tailwindcss";
```

**If that doesn't work (v3 fallback):**

```bash
npm install -D tailwindcss@3 postcss autoprefixer
npx tailwindcss init -p
```

Add to `tailwind.config.js`:
```javascript
content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"]
```

Add to `src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 3.3 Genesis Global Brand Colors — Tailwind Config

Add your brand colors to `tailwind.config.js` so you can use them as utility classes:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          black:     "#000000",   // text-brand-black
          gold:      "#A4892C",   // bg-brand-gold, text-brand-gold
          yellow:    "#FDF100",   // bg-brand-yellow
          cream:     "#E8D9C1",   // bg-brand-cream
          darkgold:  "#8B6C23",   // border-brand-darkgold
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
```

Now you can write:
```jsx
<button className="bg-brand-gold text-white rounded-lg px-4 py-2 hover:bg-brand-darkgold">
  Save Member
</button>
```

### 3.4 Additional Frontend Packages

Install these after Tailwind:

```bash
# Routing
npm install react-router-dom

# API calls
npm install axios

# Forms & validation
npm install react-hook-form zod @hookform/resolvers

# State management (lightweight)
npm install zustand

# UI utilities
npm install clsx                  # Conditional class names
npm install lucide-react          # Icons

# Date handling
npm install date-fns

# Tables
npm install @tanstack/react-table

# Notifications/Toast
npm install react-hot-toast

# Loading skeletons
npm install react-loading-skeleton
```

### 3.5 Project Structure Pattern

```
src/
├── api/                    # All API call functions (axios)
│   ├── auth.js
│   ├── members.js
│   ├── followup.js
│   └── index.js            # Axios instance with base URL + interceptors
├── components/             # Shared reusable UI
│   ├── ui/
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── Badge.jsx
│   │   ├── Input.jsx
│   │   ├── Table.jsx
│   │   └── SearchBar.jsx
│   └── layout/
│       ├── Sidebar.jsx     # Desktop navigation
│       ├── BottomNav.jsx   # Mobile navigation
│       ├── Header.jsx
│       └── PageWrapper.jsx
├── features/               # Feature modules (one per app module)
│   ├── auth/
│   ├── members/
│   ├── workers/
│   ├── followup/
│   ├── cellgroups/
│   ├── health/
│   ├── sponsors/
│   └── admin/
├── hooks/                  # Custom React hooks
│   ├── useAuth.js
│   ├── useMembers.js
│   └── useDebounce.js
├── store/                  # Zustand global state
│   ├── authStore.js
│   └── uiStore.js
├── utils/
│   ├── formatters.js       # Date, currency, phone formatters
│   └── validators.js
├── App.jsx
├── main.jsx
└── index.css
```

### 3.6 Axios Setup Pattern

```javascript
// src/api/index.js — Set up once, use everywhere
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  withCredentials: true,   // Send cookies with every request
})

// Auto-attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')  // or from cookie
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-handle 401 (token expired)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
```

---

## 4. Docker & Infrastructure

### 4.1 Docker Compose — Full Stack Template

Create `docker-compose.yml` at the root of your project:

```yaml
version: '3.9'

services:

  # PostgreSQL Database
  db:
    image: postgres:16-alpine
    container_name: workershub_db
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: workershub_redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  # FastAPI Backend
  backend:
    build:
      context: ./workers-hub-backend
      dockerfile: Dockerfile
    container_name: workershub_backend
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    volumes:
      - ./workers-hub-backend:/app
    ports:
      - "8000:8000"
    env_file:
      - ./workers-hub-backend/.env
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started

  # React Frontend
  frontend:
    build:
      context: ./workers-hub-frontend
      dockerfile: Dockerfile
    container_name: workershub_frontend
    ports:
      - "5173:5173"
    volumes:
      - ./workers-hub-frontend:/app
      - /app/node_modules
    depends_on:
      - backend

  # MinIO (File Storage)
  minio:
    image: minio/minio:latest
    container_name: workershub_minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ACCESS_KEY}
      MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY}
    volumes:
      - minio_data:/data
    ports:
      - "9000:9000"
      - "9001:9001"   # MinIO console UI

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

### 4.2 Backend Dockerfile

```dockerfile
# workers-hub-backend/Dockerfile
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
```

### 4.3 Frontend Dockerfile

```dockerfile
# workers-hub-frontend/Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json .
RUN npm install

COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]
```

### 4.4 Key Docker Commands

```bash
# Start all services
docker compose up

# Start in background
docker compose up -d

# Build fresh images (after code changes)
docker compose up --build

# Stop everything
docker compose down

# Stop and delete volumes (fresh database)
docker compose down -v

# View backend logs
docker compose logs backend -f

# Run Alembic migrations inside container
docker compose exec backend alembic upgrade head

# Connect to PostgreSQL
docker compose exec db psql -U workershub_user -d workershub

# Restart one service
docker compose restart backend
```

---

## 5. API Integrations — Termii & Paystack

### 5.1 Termii — SMS & WhatsApp

**Account:** Register at https://termii.com  
**Docs:** https://developers.termii.com  
**API Key:** Dashboard → Settings → API Keys

#### Send SMS

```python
# services/termii_service.py
import httpx
import os

TERMII_API_KEY = os.getenv("TERMII_API_KEY")
TERMII_BASE_URL = "https://api.ng.termii.com"
TERMII_SENDER_ID = "GenesisCh"  # Register this in your Termii dashboard

async def send_sms(phone: str, message: str) -> bool:
    """Send SMS to a Nigerian phone number. Phone must start with 234"""
    payload = {
        "api_key": TERMII_API_KEY,
        "to": phone,              # Format: "2348012345678"
        "from": TERMII_SENDER_ID,
        "sms": message,
        "type": "plain",
        "channel": "dnd"          # Use "dnd" for transactional (reaches DND numbers)
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{TERMII_BASE_URL}/api/sms/send",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        return response.json().get("code") == "ok"

async def send_whatsapp(phone: str, message: str) -> bool:
    """Send WhatsApp message. Requires WhatsApp channel enabled on your Termii account."""
    payload = {
        "api_key": TERMII_API_KEY,
        "to": phone,
        "from": TERMII_SENDER_ID,
        "sms": message,
        "type": "plain",
        "channel": "whatsapp"
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{TERMII_BASE_URL}/api/sms/send",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        return response.json().get("code") == "ok"
```

**Termii SMS channel notes:**
- `"channel": "generic"` — Promotional only. Does NOT deliver to DND numbers
- `"channel": "dnd"` — Transactional. Delivers to all numbers including DND ✅ Use this
- `"channel": "whatsapp"` — WhatsApp. Must be enabled separately on your account

**WhatsApp note:** Contact Termii support at whatsapp@termii.com to enable WhatsApp on your account. You'll also need pre-approved message templates for outbound messages.

### 5.2 Paystack — Payment Webhooks

**Account:** https://dashboard.paystack.com  
**Docs:** https://paystack.com/docs/payments/webhooks  
**Keys:** Dashboard → Settings → API Keys & Webhooks

#### Webhook Endpoint Pattern

```python
# routers/webhooks.py
import hmac
import hashlib
import os
from fastapi import APIRouter, Request, HTTPException, BackgroundTasks

router = APIRouter()

PAYSTACK_SECRET = os.getenv("PAYSTACK_SECRET_KEY")

def verify_paystack_signature(payload: bytes, signature: str) -> bool:
    """
    Verify the webhook is genuinely from Paystack.
    NEVER skip this step — anyone could post fake events to your endpoint.
    """
    expected = hmac.new(
        PAYSTACK_SECRET.encode('utf-8'),
        payload,
        hashlib.sha512
    ).hexdigest()
    return hmac.compare_digest(expected, signature)

@router.post("/webhooks/paystack")
async def paystack_webhook(
    request: Request,
    background_tasks: BackgroundTasks
):
    # 1. Get raw body BEFORE parsing JSON
    payload = await request.body()
    
    # 2. Verify signature
    signature = request.headers.get("x-paystack-signature", "")
    if not verify_paystack_signature(payload, signature):
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # 3. Parse event
    event = await request.json()
    event_type = event.get("event")
    
    # 4. Handle payment success
    if event_type == "charge.success":
        data = event.get("data", {})
        email = data.get("customer", {}).get("email")
        amount = data.get("amount", 0) / 100  # Paystack amount is in kobo
        reference = data.get("reference")
        
        # Process in background so webhook returns 200 immediately
        background_tasks.add_task(
            handle_successful_payment,
            email=email,
            amount=amount,
            reference=reference
        )
    
    # Always return 200 quickly so Paystack knows you received it
    return {"status": "received"}

async def handle_successful_payment(email: str, amount: float, reference: str):
    """
    1. Match email to sponsor record
    2. Update payment ledger
    3. Send Termii SMS + WhatsApp confirmation
    4. Log to audit table
    """
    pass  # You'll build this out in Phase 6
```

**Paystack webhook rules:**
- Always return HTTP 200 immediately (even before processing)
- If you return non-200, Paystack retries every hour for 72 hours
- Always verify the `x-paystack-signature` header
- Use background tasks for the processing logic

#### Set Webhook URL in Paystack Dashboard

Dashboard → Settings → API Keys & Webhooks → Webhook URL:
```
https://your-domain.com/api/webhooks/paystack
```

---

## 6. Security Libraries

### 6.1 Password Hashing

```bash
pip install passlib[bcrypt] bcrypt
```

```python
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Hash a password
hashed = pwd_context.hash("UserPassword123")

# Verify
is_valid = pwd_context.verify("UserPassword123", hashed)
```

### 6.2 JWT Tokens

```bash
pip install python-jose[cryptography]
```

```python
from jose import jwt, JWTError

# Encode
token = jwt.encode({"sub": user_id, "role": role}, SECRET_KEY, algorithm="HS256")

# Decode
payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
```

### 6.3 Rate Limiting

```bash
pip install fastapi-limiter
```

```python
from fastapi_limiter import FastAPILimiter
from fastapi_limiter.depends import RateLimiter

# On startup
await FastAPILimiter.init(redis_connection)

# On login endpoint — max 5 attempts per minute per IP
@router.post("/auth/login")
@limiter.limit("5/minute")
async def login(...):
    ...
```

### 6.4 CORS (Cross-Origin)

```python
# main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://workershub.genesislobal.church"],  # Your frontend URL only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 6.5 Medical Data Encryption

```bash
pip install cryptography
```

```python
# utils/encryption.py
from cryptography.fernet import Fernet
import os, base64

ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")  # 32-byte base64 key
fernet = Fernet(ENCRYPTION_KEY)

def encrypt_field(value: str) -> str:
    """Encrypt a sensitive field before storing in database"""
    return fernet.encrypt(value.encode()).decode()

def decrypt_field(encrypted: str) -> str:
    """Decrypt a field when reading from database"""
    return fernet.decrypt(encrypted.encode()).decode()

# Generate a key (run once and store in .env)
# key = Fernet.generate_key()
# print(key.decode())
```

**Use encrypt_field() on:** BP readings, blood sugar, drug records, medical notes  
**Use decrypt_field() on:** Any medical field read back from the database

---

## 7. Dev Tools & Quality

### 7.1 pgAdmin (Database UI)

Add to docker-compose for a web-based database viewer:

```yaml
pgadmin:
  image: dpage/pgadmin4
  environment:
    PGADMIN_DEFAULT_EMAIL: admin@genesis.church
    PGADMIN_DEFAULT_PASSWORD: admin
  ports:
    - "5050:80"
```

Access at: `http://localhost:5050`

### 7.2 FastAPI Auto-Documentation

FastAPI gives you interactive API docs for free at:
- `http://localhost:8000/docs` → Swagger UI (test endpoints here)
- `http://localhost:8000/redoc` → ReDoc (cleaner reading view)

**Use these during development to test every endpoint before building the frontend.**

### 7.3 Thunder Client (VS Code API Tester)

Install from VS Code extensions. Use it to:
- Test your FastAPI endpoints without switching apps
- Save test requests (like a lightweight Postman inside VS Code)
- Test webhook payloads locally

### 7.4 ESLint + Prettier (Frontend)

```bash
npm install -D eslint prettier eslint-config-prettier
```

`.eslintrc.json`:
```json
{
  "extends": ["react-app", "prettier"],
  "rules": {
    "no-unused-vars": "warn",
    "no-console": "warn"
  }
}
```

`.prettierrc`:
```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

---

## 8. Key Concepts You Must Understand

These are the concepts that will block you if you don't understand them. Learn each one before the phase that uses it.

### Before Phase 1 — Auth & Members

| Concept | Why It Matters |
|---|---|
| `async/await` in Python | Every FastAPI route must be async or it will block under load |
| Pydantic models | How FastAPI validates all incoming data — you'll write dozens of these |
| SQLAlchemy sessions | Each request gets one session. Sessions are NOT thread-safe. Use the dependency injection pattern |
| httpOnly cookies vs localStorage | Your JWT must go in httpOnly cookies, never localStorage (XSS protection) |
| IDOR (Insecure Direct Object Reference) | User A must not be able to access User B's data by changing an ID in the URL |

### Before Phase 3 — Follow-Up Pipeline

| Concept | Why It Matters |
|---|---|
| SQLAlchemy relationships | Members link to pipelines link to logs — relationships define how these connect |
| Background tasks (FastAPI) | Pipeline creation after member registration should not slow down the registration response |

### Before Phase 5 — Health Care

| Concept | Why It Matters |
|---|---|
| Fernet encryption | Used to encrypt medical fields at rest |
| PostgreSQL schemas | Health records live in a separate schema for isolation |
| Audit logging | Every health record access must be logged — who, when, what record |

### Before Phase 6 — Sponsors

| Concept | Why It Matters |
|---|---|
| HMAC-SHA512 | How you verify Paystack webhook signatures — skip this and anyone can fake a payment |
| Idempotency | Paystack retries webhooks — your handler must not process the same payment twice |
| Background tasks | Payment handling must not block the webhook response |

---

## 9. Recommended Learning Order

If any of these tools are new to you, learn in this order. Each one takes 30–60 minutes of reading + practice:

1. **Python async/await basics** — search: "Python asyncio explained simply"
2. **FastAPI tutorial (official)** — https://fastapi.tiangolo.com/tutorial
3. **SQLAlchemy 2.0 async** — https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html
4. **Alembic quickstart** — https://alembic.sqlalchemy.org/en/latest/tutorial.html
5. **JWT explained** — search: "JWT authentication explained in 10 minutes"
6. **React Router v6** — https://reactrouter.com/en/main/start/tutorial
7. **Tailwind CSS core concepts** — https://tailwindcss.com/docs/utility-first
8. **React Hook Form** — https://react-hook-form.com/get-started
9. **Zustand state management** — https://docs.pmnd.rs/zustand/getting-started/introduction
10. **Docker Compose basics** — search: "Docker Compose explained for beginners"

---

## 10. Quick Command Reference

### Backend

```bash
# Start virtual environment
source venv/bin/activate

# Install packages
pip install -r requirements.txt

# Run FastAPI locally (no Docker)
uvicorn app.main:app --reload --port 8000

# Generate migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Roll back migration
alembic downgrade -1
```

### Frontend

```bash
# Create project
npm create vite@latest workers-hub-frontend -- --template react

# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Docker

```bash
# Start all services
docker compose up -d --build

# Apply migrations inside container
docker compose exec backend alembic upgrade head

# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Stop all
docker compose down

# Full reset (destroys database data)
docker compose down -v
```

### Git

```bash
# Standard commit flow
git add .
git commit -m "Phase 1: Add JWT auth system"
git push origin main

# Create feature branch for each phase
git checkout -b phase-1-foundation
git checkout -b phase-2-members
```

---

## Environment Variables Template

Create `workers-hub-backend/.env` using this template:

```env
# Database
DB_USER=workershub_user
DB_PASSWORD=choose_strong_password
DB_NAME=workershub
DATABASE_URL=postgresql+asyncpg://workershub_user:choose_strong_password@db:5432/workershub

# Redis
REDIS_URL=redis://redis:6379

# JWT Security
JWT_SECRET_KEY=run_openssl_rand_hex_32_to_generate_this
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# Medical Data Encryption
ENCRYPTION_KEY=run_python_fernet_generate_key_to_get_this

# Termii
TERMII_API_KEY=your_termii_api_key_here
TERMII_SENDER_ID=GenesisCh

# Paystack
PAYSTACK_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxx

# MinIO
MINIO_ACCESS_KEY=your_minio_key
MINIO_SECRET_KEY=your_minio_secret
MINIO_BUCKET=workers-hub-files
MINIO_ENDPOINT=minio:9000

# App
APP_ENV=development
CORS_ORIGINS=http://localhost:5173
```

**Generate JWT secret:**
```bash
openssl rand -hex 32
```

**Generate Encryption key:**
```python
from cryptography.fernet import Fernet
print(Fernet.generate_key().decode())
```

---

*This guide is your installation and reference bible throughout the Workers Hub build. Every package, pattern, and command here has been chosen specifically for this project's requirements.*

**Ready? Start with Phase 1 — Docker Compose scaffold + FastAPI auth system.**