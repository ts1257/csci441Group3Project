# Multi-Persona Planner

A full-stack productivity app that lets users switch between **Student**, **Work**, and **Finance** personas — each with its own tailored dashboard, tasks, courses/projects, calendar, and finance tracking.

This repository contains:

- `backend/`: Express + MongoDB API
- `client/`: React + Vite frontend

## Tech Stack

| Layer    | Technology                                  |
| -------- | ------------------------------------------- |
| Frontend | React 19, Vite, Tailwind CSS v4, DaisyUI v5 |
| Backend  | Node.js, Express 4                          |
| Database | MongoDB (Mongoose 8)                        |
| Auth     | JWT (jsonwebtoken), bcryptjs                |
| Icons    | Font Awesome (react-fontawesome)            |

## Getting Started

### Prerequisites

- Node.js ≥ 18
- MongoDB instance (local or Atlas)

## Installation

Install dependencies for both apps:

```bash
cd backend
npm install

cd ../client
npm install
```

### Backend

```bash
cd backend
```

Create a `.env` file in `backend/`:

```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
```

Start the server:

```bash
npm run dev   # development (watch mode)
npm start     # production
```

The API runs at `http://localhost:5000`.
Health check: `GET /api/health`.

### Frontend

```bash
cd client
npm run dev
```

Create a `.env` file in `client/`:

```
VITE_API_URL=http://localhost:5000
```

The app runs at `http://localhost:5173`.

## Features

- **Multi-persona support** — Student, Work, and Finance modes; each user has all three personas
- **Task Manager** — Create, edit, complete, and delete tasks scoped per persona
- **Courses** — Track enrolled courses with instructor, credits, color, and status (Student persona)
- **Projects** — Track projects with client, budget, notes, color, and status (Work persona)
- **Habits** — Build and track recurring habits
- **Trips** — Plan and organize trips
- **Finance Dashboard** — Income/expense records with category tagging; planned payments with overdue detection and one-click complete
- **Calendar** — Unified monthly view of tasks and planned payments filtered by persona
- **Categories** — Custom categories for finance records
- **Admin Area** — Admin-only users and task management pages
- **Authentication** — Register, login, JWT-protected routes

## API Endpoints

| Resource         | Base Path               |
| ---------------- | ----------------------- |
| Health           | `/api/health`           |
| Auth             | `/api/auth`             |
| Personas         | `/api/personas`         |
| Tasks            | `/api/tasks`            |
| Courses          | `/api/courses`          |
| Projects         | `/api/projects`         |
| Records          | `/api/records`          |
| Planned Payments | `/api/planned-payments` |
| Categories       | `/api/categories`       |
| Habits           | `/api/habits`           |
| Trips            | `/api/trips`            |
| Admin            | `/api/admin`            |

## Frontend Routes

| Path                          | Page              | Protected   |
| ----------------------------- | ----------------- | ----------- |
| `/`                           | Home (landing)    | No          |
| `/login`                      | Login             | No          |
| `/register`                   | Register          | No          |
| `/dashboard`                  | Main dashboard    | Yes         |
| `/dashboard/tasks`            | Task manager      | Yes         |
| `/dashboard/courses`          | Courses (Student) | Yes         |
| `/dashboard/projects`         | Projects (Work)   | Yes         |
| `/dashboard/records`          | Finance records   | Yes         |
| `/dashboard/planned-payments` | Planned payments  | Yes         |
| `/dashboard/category`         | Manage categories | Yes         |
| `/dashboard/calendar`         | Calendar          | Yes         |
| `/dashboard/habits`           | Habits            | Yes         |
| `/dashboard/trips`            | Trips             | Yes         |
| `/dashboard/admin/users`      | Admin users       | Yes (Admin) |
| `/dashboard/admin/tasks`      | Admin tasks       | Yes (Admin) |

## Scripts

| Command                   | Description                   |
| ------------------------- | ----------------------------- |
| `backend: npm run dev`    | Start backend in watch mode   |
| `backend: npm start`      | Start backend in production   |
| `client: npm run dev`     | Start frontend dev server     |
| `client: npm run build`   | Build frontend for production |
| `client: npm run preview` | Preview production build      |
| `client: npm run lint`    | Run ESLint on frontend code   |
