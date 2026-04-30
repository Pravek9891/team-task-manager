# Team Task Manager — Deployment Guide

## Backend: Railway (Django + PostgreSQL)

### Step 1: Prepare your repository
```bash
# Make sure everything is committed
git init
git add .
git commit -m "Initial commit"
# Push to GitHub
gh repo create team-task-manager --public --source=. --push
```

### Step 2: Create Railway project
1. Go to [railway.app](https://railway.app) → **New Project**
2. Select **Deploy from GitHub repo** → choose your repo
3. Railway will auto-detect Python and deploy it

### Step 3: Add PostgreSQL Database
1. In your Railway project → click **+ New** → **Database** → **PostgreSQL**
2. Railway auto-sets `DATABASE_URL` as an environment variable — no manual copy needed

### Step 4: Set Environment Variables in Railway
Go to your service → **Variables** tab → add:

| Variable | Value |
|---|---|
| `SECRET_KEY` | `your-random-50-char-secret` |
| `DEBUG` | `False` |
| `ALLOWED_HOSTS` | `your-app.up.railway.app` |
| `CORS_ALLOWED_ORIGINS` | `https://your-vercel-app.vercel.app` |
| `DJANGO_SETTINGS_MODULE` | `taskmanager.settings` |

> `DATABASE_URL` is automatically set by Railway when you add the PostgreSQL plugin.

### Step 5: Configure build commands in Railway
Add a **Start Command** in Railway service settings:
```
gunicorn taskmanager.wsgi --log-file -
```

Add a **Build Command** (pre-deploy hook) — create `railway.json` in your backend root:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "gunicorn taskmanager.wsgi --log-file -",
    "healthcheckPath": "/api/health/",
    "healthcheckTimeout": 100
  }
}
```

### Step 6: Run migrations
In Railway → **Shell** (or via CLI):
```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py collectstatic --noinput
```

Or use a **deploy hook** — add to `Procfile`:
```
release: python manage.py migrate && python manage.py collectstatic --noinput
web: gunicorn taskmanager.wsgi --log-file -
```

### Step 7: Create the first Admin user
```bash
# In Railway shell or via railway run:
python manage.py shell
>>> from accounts.models import User
>>> u = User.objects.create_superuser(email='admin@example.com', password='SecurePass123!', first_name='Admin', last_name='User')
>>> u.role = 'ADMIN'
>>> u.save()
```

---

## Frontend: Vercel (React + Vite)

### Step 1: Push frontend to GitHub (if separate repo)
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
The `vercel.json` file in the frontend root handles this:
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

# Create .env from example
copy .env.example .env
# Edit .env with your local settings

python manage.py migrate
python manage.py createsuperuser  # or use the shell snippet above
python manage.py runserver
```

Backend will be running at: `http://localhost:8000`

### Frontend
```bash
cd frontend

# Create .env from example
copy .env.example .env
# .env contains: VITE_API_URL=http://localhost:8000/api

npm install
npm run dev
```

Frontend will be running at: `http://localhost:5173`

---

## Environment Variables Reference

### Backend `.env`
```
SECRET_KEY=your-50-char-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=sqlite:///db.sqlite3
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Frontend `.env`
```
VITE_API_URL=http://localhost:8000/api
```

---

## Production Checklist
- [ ] `DEBUG=False`
- [ ] Strong random `SECRET_KEY`
- [ ] PostgreSQL (not SQLite)
- [ ] `ALLOWED_HOSTS` set to Railway domain
- [ ] `CORS_ALLOWED_ORIGINS` set to Vercel domain
- [ ] Static files collected (`collectstatic`)
- [ ] Migrations applied
- [ ] Admin superuser created
- [ ] HTTPS enforced (Railway/Vercel handle this)
