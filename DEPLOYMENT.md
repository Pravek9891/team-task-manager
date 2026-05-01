# Team Task Manager — Deployment Guide

> **Database**: This project uses **SQLite** — Django's built-in database engine.
> No PostgreSQL service, no database URL, no extra driver needed.
>
> ⚠️ **SQLite on Railway**: The `db.sqlite3` file lives inside the container filesystem.
> It **resets on every redeploy**. This is acceptable for demos and development.
> For persistent production data, replace the `DATABASES` block in `settings.py` with a managed database.

---

## Backend: Railway (Django + SQLite)

### Step 1: Prepare your repository

```bash
git init
git add .
git commit -m "Initial commit"
# Push to GitHub
gh repo create team-task-manager --public --source=. --push
```

### Step 2: Create Railway project

1. Go to [railway.app](https://railway.app) → **New Project**
2. Select **Deploy from GitHub repo** → choose your repo
3. Railway auto-detects Python — no extra plugins needed
4. **Do NOT add a PostgreSQL (or any database) plugin** — SQLite is embedded

### Step 3: Set Environment Variables in Railway

Go to your service → **Variables** tab → add:

| Variable | Value |
|---|---|
| `SECRET_KEY` | `your-random-50-char-secret` |
| `DEBUG` | `False` |
| `ALLOWED_HOSTS` | `your-app.up.railway.app` |
| `CORS_ALLOWED_ORIGINS` | `https://your-vercel-app.vercel.app` |
| `DJANGO_SETTINGS_MODULE` | `taskmanager.settings` |

> No `DATABASE_URL` needed — the SQLite path is hardcoded in `settings.py`.

### Step 4: Build & start commands

Railway will read `railway.json` in the backend root automatically:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": { "builder": "NIXPACKS" },
  "deploy": {
    "startCommand": "gunicorn taskmanager.wsgi --log-file -",
    "healthcheckPath": "/api/health/",
    "healthcheckTimeout": 100
  }
}
```

The `Procfile` handles auto-migrations before each deploy:

```
release: python manage.py migrate && python manage.py collectstatic --noinput
web: gunicorn taskmanager.wsgi --log-file -
```

### Step 5: Create the first Admin user

In Railway → **Shell** (or via `railway run`):

```bash
python manage.py shell
>>> from accounts.models import User
>>> u = User.objects.create_superuser(email='admin@example.com', password='SecurePass123!', first_name='Admin', last_name='User')
>>> u.role = 'ADMIN'
>>> u.save()
```

### SQLite Limitations on Railway

| Concern | Detail |
|---|---|
| **Data reset** | `db.sqlite3` is wiped on every redeploy (ephemeral container filesystem) |
| **Concurrency** | SQLite does not support multiple concurrent writers |
| **Scaling** | Not suitable for multi-instance / horizontal scaling |
| **Recommended upgrade** | Replace `DATABASES` in `settings.py` with PostgreSQL when scaling |

---

## Frontend: Vercel (React + Vite)

### Step 1: Push frontend to GitHub

```bash
cd frontend
git init
git add .
git commit -m "Initial frontend"
gh repo create team-task-manager-frontend --public --source=. --push
```

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your frontend GitHub repo
3. Vercel auto-detects Vite — keep defaults:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Step 3: Set Environment Variables in Vercel

Go to project → **Settings** → **Environment Variables**:

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://your-backend.up.railway.app/api` |

### Step 4: Configure SPA routing

The `vercel.json` in the frontend root handles client-side routing:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Step 5: Redeploy & verify

After setting env vars, trigger a redeployment. Your app will be live at `https://your-app.vercel.app`.

---

## Local Development Setup

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate      # Windows
# source venv/bin/activate  # macOS/Linux

pip install -r requirements.txt

# Create .env from example (no DATABASE_URL needed)
copy .env.example .env
# Edit: set SECRET_KEY, DEBUG, ALLOWED_HOSTS, CORS_ALLOWED_ORIGINS

python manage.py migrate
python manage.py runserver
```

Backend runs at: `http://localhost:8000`  
SQLite database file created at: `backend/db.sqlite3`

### Frontend

```bash
cd frontend
copy .env.example .env
# .env contains: VITE_API_URL=http://localhost:8000/api

npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## Environment Variables Reference

### Backend `.env`

```
SECRET_KEY=your-50-char-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

> No `DATABASE_URL` required. SQLite is configured directly in `settings.py`.

### Frontend `.env`

```
VITE_API_URL=http://localhost:8000/api
```

---

## Production Checklist

- [ ] `DEBUG=False`
- [ ] Strong random `SECRET_KEY`
- [ ] `ALLOWED_HOSTS` set to Railway domain
- [ ] `CORS_ALLOWED_ORIGINS` set to Vercel domain
- [ ] Static files collected (`collectstatic` — handled by `Procfile`)
- [ ] Migrations applied (`migrate` — handled by `Procfile`)
- [ ] Admin superuser created via Railway shell
- [ ] HTTPS enforced (Railway/Vercel handle this automatically)
- [ ] ⚠️ Understand that SQLite data resets on Railway redeploy
