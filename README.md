# Team Task Manager

Production-ready full-stack web application for managing team projects and tasks.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Django 4.2 + Django REST Framework |
| Database | PostgreSQL (SQLite for local dev) |
| Auth | JWT (access + refresh tokens via SimpleJWT) |
| Frontend | React + Vite |
| Deployment | Railway (backend + DB), Vercel (frontend) |

## Features

- **Auth**: Signup, Login, JWT authentication, role-based access (Admin/Member)
- **Projects**: Create, manage, assign members to projects
- **Tasks**: Create, assign, update status (TODO/IN_PROGRESS/DONE), due dates, overdue detection
- **Dashboard**: Stats overview, personal task list

## Quick Start

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full deployment instructions.

### Backend
```bash
cd backend
python -m venv venv && venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env  # edit values
python manage.py migrate
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
copy .env.example .env  # edit VITE_API_URL
npm run dev
```

## API Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/register/` | Create account | Public |
| POST | `/api/auth/login/` | Login (get JWT) | Public |
| POST | `/api/auth/logout/` | Blacklist refresh token | Auth |
| GET/PATCH | `/api/auth/me/` | Profile | Auth |
| PUT | `/api/auth/change-password/` | Change password | Auth |
| GET | `/api/auth/users/` | List all users | Admin |
| POST | `/api/auth/token/refresh/` | Refresh access token | Auth |
| GET/POST | `/api/projects/` | List/create projects | Auth |
| GET/PATCH/DELETE | `/api/projects/{id}/` | Get/update/delete project | Auth/Admin |
| POST | `/api/projects/{id}/add_member/` | Add member to project | Admin |
| DELETE | `/api/projects/{id}/remove_member/{uid}/` | Remove member | Admin |
| GET | `/api/projects/{id}/members/` | List project members | Auth |
| GET/POST | `/api/tasks/` | List/create tasks | Auth |
| GET/PATCH/DELETE | `/api/tasks/{id}/` | Get/update/delete task | Auth |
| PATCH | `/api/tasks/{id}/status/` | Update task status | Auth |
| GET | `/api/tasks/my-tasks/` | My assigned tasks | Auth |
| GET | `/api/dashboard/` | Dashboard stats | Auth |
| GET | `/api/health/` | Health check | Public |

## Project Structure

```
team-task-manager/
├── backend/
│   ├── taskmanager/         # Django project settings, URLs, WSGI
│   ├── accounts/            # User model, auth views, JWT
│   ├── projects/            # Project model, CRUD, membership
│   ├── tasks/               # Task model, CRUD, status tracking
│   ├── core/                # Dashboard, health check
│   ├── manage.py
│   ├── requirements.txt
│   └── Procfile
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios client + service functions
│   │   ├── context/         # Auth context (React)
│   │   ├── components/      # Sidebar, Layout, ProtectedRoute
│   │   └── pages/           # Login, Signup, Dashboard, Projects, Tasks, Users
│   ├── vercel.json
│   └── .env.example
└── DEPLOYMENT.md
```

## Roles

| Role | Permissions |
|---|---|
| **Admin** | Full CRUD on all projects/tasks, manage members, view all users |
| **Member** | View assigned projects, view/update tasks in their projects, update their own task status |
