# Developer Quick Start Checklist

## 🚀 First Time Setup (Choose One)

### Option 1: Docker (Recommended) ⭐
```bash
# Open PowerShell/Terminal in project root

# Windows
setup.bat docker

# macOS/Linux  
chmod +x setup.sh && ./setup.sh docker
```
**Time**: ~5-10 minutes
**Result**: Everything running at http://localhost:5173

---

### Option 2: Local Development Without Docker
```bash
# Windows
setup.bat local

# macOS/Linux
chmod +x setup.sh && ./setup.sh local
```
**Time**: ~10-15 minutes
**Requires**: Python 3.12+, Node 18+, PostgreSQL 15+

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] Frontend loads at http://localhost:5173
- [ ] Backend API responds at http://localhost:8000/api/v1
- [ ] Can login with admin@yourchurch.org / your_password
- [ ] API docs available at http://localhost:8000/api/docs/
- [ ] No errors in browser console
- [ ] No errors in backend logs

---

## 📱 Access Points

| What | URL | Username | Password |
|------|-----|----------|----------|
| **Frontend** | http://localhost:5173 | admin@yourchurch.org | (from setup) |
| **API Docs** | http://localhost:8000/api/docs/ | N/A | N/A |
| **Django Admin** | http://localhost:8000/admin/ | admin | (from setup) |
| **Database** | localhost:5432 | postgres | postgres |

---

## 🔄 Daily Development Workflow

### With Docker
```bash
# Start (first time or after restart)
docker-compose up

# View logs
docker-compose logs -f

# Restart after code changes (usually auto-reloads)
docker-compose restart backend

# Stop when done
Ctrl+C
# or in another terminal
docker-compose down
```

### Without Docker (Split Terminals)

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate  # macOS/Linux: venv\Scripts\activate (Windows)
python manage.py runserver
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

---

## 📝 Making Changes

### Backend (Django)

**Add new API endpoint:**
1. Create/edit view in `apps/<your_app>/views.py`
2. Add route in `apps/<your_app>/urls.py`
3. Changes hot-reload automatically

**Modify database:**
1. Update model in `apps/<your_app>/models.py`
2. Run: `python manage.py makemigrations`
3. Run: `python manage.py migrate`
4. With Docker: `docker-compose exec backend python manage.py migrate`

**Test your changes:**
```bash
cd backend
pytest  # or docker-compose -f docker-compose.test.yml up
```

### Frontend (React)

**Add new component:**
1. Create in `src/components/`
2. Changes hot-reload automatically in Vite

**Add new page:**
1. Create in `src/pages/`
2. Add route in `src/App.tsx`

**Test UI changes:**
- Browser auto-refreshes on save
- Check console for TypeScript errors

---

## 🐛 Common Issues & Fixes

### Frontend won't load
```bash
# Clear cache and restart
rm -rf frontend/node_modules/.vite
docker-compose restart frontend
# or: npm run dev
```

### Backend says "database connection refused"
```bash
# Make sure Docker db is healthy
docker-compose ps
docker-compose logs db

# Restart database
docker-compose restart db
```

### Port already in use
```bash
# Find what's using the port
lsof -i :5173  # macOS/Linux
netstat -ano | findstr :5173  # Windows

# Kill it
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

### Changes not showing (Python)
```bash
# Make sure you're in active environment
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows

# Django dev server should auto-reload
# If not: Ctrl+C then python manage.py runserver
```

---

## 📚 Documentation

| Need | Read |
|------|------|
| **Full setup guide** | [LOCAL_SETUP.md](LOCAL_SETUP.md) |
| **Docker details** | [CONTAINERIZATION.md](CONTAINERIZATION.md) |
| **Quick commands** | [SETUP_SUMMARY.md](SETUP_SUMMARY.md) |
| **Backend code** | docs/BACKEND.md |
| **Frontend code** | docs/FRONTEND.md |
| **Database schema** | docs/DATABASE.md |
| **Security** | docs/Security%20SKILL.md |

---

## 🔍 Debugging

### Backend Debugging
```bash
# Access Django shell
docker-compose exec backend python manage.py shell

# Or locally
python manage.py shell

# Query database
from apps.persons.models import Person
Person.objects.all()
```

### Frontend Debugging
- Open browser DevTools: F12 or Ctrl+Shift+I
- Check Console tab for errors
- Check Network tab for API calls
- Check Elements tab for HTML structure

### Database Debugging
```bash
# Access PostgreSQL directly
docker-compose exec db psql -U postgres -d cms_church_dev

# Or locally
psql -U postgres -d cms_church_dev

# List tables
\dt

# Query
SELECT * FROM accounts_systemuser;
```

---

## 🧪 Testing

### Backend Unit Tests
```bash
# Docker
docker-compose -f docker-compose.test.yml up --build

# Local
cd backend
pytest -v
```

### Frontend Unit Tests
```bash
cd frontend
npm run test
```

---

## 🚀 Deployment Steps (Later)

When ready to go to production:

1. Commit all changes to GitHub
2. Verify tests pass
3. Go to Render.com dashboard
4. Create "New Blueprint"
5. Connect GitHub repo
6. Fill in environment variables
7. Deploy

See [CONTAINERIZATION.md](CONTAINERIZATION.md) for details

---

## 💾 Database Backup

```bash
# Backup (Docker)
docker-compose exec db pg_dump -U postgres cms_church_dev > backup.sql

# Backup (Local)
pg_dump -U postgres cms_church_dev > backup.sql

# Restore (Docker)
docker-compose exec -T db psql -U postgres cms_church_dev < backup.sql

# Restore (Local)
psql -U postgres cms_church_dev < backup.sql
```

---

## 📞 Getting Help

| Issue | Check |
|-------|-------|
| Can't start Docker | Install Docker Desktop |
| Can't connect to database | Make sure db service is running |
| Frontend won't load | Check http://localhost:5173 |
| API says 401 Unauthorized | Login first and get access token |
| Page errors | Check browser console (F12) |
| Backend errors | Check terminal logs or `docker-compose logs backend` |

---

## ⚡ Pro Tips

1. **Use Docker** - Makes everything consistent
2. **Keep .env files** - But never commit them
3. **Read API docs** - All endpoints documented at /api/docs/
4. **Watch logs** - `docker-compose logs -f` helps debug
5. **Use git branches** - Create feature branches for new work
6. **Write tests** - Especially for backend logic
7. **Check migrations** - Run after pulling code with migrations

---

## 📋 Before Committing Code

- [ ] Code follows project style
- [ ] No console errors
- [ ] Tests pass
- [ ] No .env file changes
- [ ] .gitignore respected
- [ ] Meaningful commit message
- [ ] Related issues linked

---

## 🎯 First Day Goals

1. ✅ Setup development environment
2. ✅ Access frontend at http://localhost:5173
3. ✅ Login successfully
4. ✅ Browse API documentation
5. ✅ Make a small code change
6. ✅ See hot-reload in action
7. ✅ Read relevant documentation
8. ✅ Ask questions in team chat

---

**Status**: You're ready to develop! 🎉

Questions? Check [LOCAL_SETUP.md](LOCAL_SETUP.md) troubleshooting section or reach out to the team.
