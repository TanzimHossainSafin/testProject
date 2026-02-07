# Marketplace Project Workflow System

A full-stack role-based project marketplace where **Buyers** create projects, **Problem Solvers** execute them through structured task workflows, and **Admins** manage user roles — with clear state transitions, task management, and delivery submission.

---

## System Overview

### Role Hierarchy

```
Admin (Top Level)
  ├── Assign Buyer role to users
  ├── View all users and projects
  └── No project execution responsibilities

Buyer (Project Owner)
  ├── Create and manage projects
  ├── View incoming requests from Problem Solvers
  ├── Assign one Problem Solver to a project
  └── Review and accept/reject task submissions

Problem Solver (Executor)
  ├── Create and manage a profile
  ├── Browse available projects
  ├── Request to work on a project
  ├── Create tasks/sub-modules when assigned
  ├── Manage task timelines and metadata
  └── Submit completed work as ZIP file per task
```

### Project Lifecycle

```
1. Admin assigns Buyer role to a user
2. Buyer creates a project                          → Status: OPEN
3. Problem Solvers request to work on the project
4. Buyer selects one Problem Solver                  → Status: ASSIGNED
5. Problem Solver creates tasks/sub-modules          → Status: IN_PROGRESS
   - Each task has: Title, Description, Deadline, Status
6. Problem Solver submits ZIP file per task           → Task: SUBMITTED
7. Buyer reviews and accepts submission              → Task: COMPLETED
8. All tasks approved                                → Project: COMPLETED
```

### State Transitions

```
Project States:
  open → assigned → in_progress → completed
                                → cancelled

Task States:
  todo → in_progress → submitted → completed (approved)
                                 → revision_requested → submitted (resubmit)

Request States:
  pending → accepted
          → rejected

Submission States:
  pending → approved
          → rejected
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript |
| **Styling** | Tailwind CSS 4 |
| **Animations** | Framer Motion |
| **Icons** | Lucide React |
| **HTTP Client** | Axios |
| **Backend** | Node.js, Express 4 |
| **Database** | MongoDB with Mongoose 8 |
| **Authentication** | JWT (jsonwebtoken) + bcryptjs |
| **File Upload** | Multer (ZIP only, 50MB max) |
| **Validation** | express-validator |

---

## Setup Instructions

### Prerequisites

- Node.js 20+
- MongoDB (local instance or MongoDB Atlas)
- npm

### 1. Clone the Repository

```bash
git clone <repository-url>
cd marketplace-workflow
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file (or copy from example):

```bash
cp .env.example .env
```

`.env` contents:

```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/marketplace
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
```

Start the backend:

```bash
npm run dev
```

The backend runs on **http://localhost:5001**.

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env.local` file (or copy from example):

```bash
cp .env.example .env.local
```

`.env.local` contents:

```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

Start the frontend:

```bash
npm run dev
```

The frontend runs on **http://localhost:3000**.

### 4. Default Admin Credentials

A seeded admin account is available:

- **Email:** admin@marketplace.com
- **Password:** admin123

---

## API Route Summary

All routes are prefixed with `/api`. Protected routes require `Authorization: Bearer <token>` header.

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Register new user (default role: problem_solver) | No |
| POST | `/auth/login` | Login and receive JWT token | No |
| GET | `/auth/me` | Get current authenticated user | Yes |

### Users (`/api/users`)

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/users` | Get all users (filterable by `?role=`) | Any |
| GET | `/users/:id` | Get user by ID | Any |
| PATCH | `/users/:id/role` | Update user role | Admin |
| PATCH | `/users/profile/update` | Update own profile | Any |

### Projects (`/api/projects`)

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/projects` | Get all projects (role-based filtering) | Any |
| POST | `/projects` | Create a new project | Buyer |
| GET | `/projects/:id` | Get project details (populated) | Any |
| PATCH | `/projects/:id` | Update project details | Buyer / Admin |
| PATCH | `/projects/:id/status` | Update project status | Buyer / Admin |

### Requests (`/api/requests`)

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/requests` | Request to work on a project | Problem Solver |
| GET | `/requests/my` | Get my own requests | Problem Solver |
| GET | `/requests/project/:projectId` | Get requests for a project | Buyer / Admin |
| PATCH | `/requests/:id/accept` | Accept request (assigns solver to project) | Buyer |
| PATCH | `/requests/:id/reject` | Reject request | Buyer |

### Tasks (`/api/tasks`)

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/tasks` | Create task for a project | Problem Solver |
| GET | `/tasks/project/:projectId` | Get all tasks for a project | Any |
| GET | `/tasks/:id` | Get task by ID | Any |
| PATCH | `/tasks/:id` | Update task details/status | Problem Solver |
| DELETE | `/tasks/:id` | Delete a task | Problem Solver |

### Submissions (`/api/submissions`)

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/submissions` | Submit work (`multipart/form-data`: file, taskId, notes) | Problem Solver |
| GET | `/submissions/task/:taskId` | Get submissions for a task | Any |
| PATCH | `/submissions/:id/review` | Review submission (approve/reject) | Buyer |
| GET | `/submissions/:id/download` | Download submitted ZIP file | Any |

---

## Key Architectural Decisions

### 1. Role-Based Access Control

- Authorization enforced at the middleware level using `authorize(...roles)` on every protected route
- Role checks also applied at the frontend (role-aware routing and conditional UI rendering)
- Users default to `problem_solver` on registration; only Admins can promote users to `buyer`
- No hardcoded roles or IDs anywhere in the codebase

### 2. Project State Machine

- Project status transitions (`open` → `assigned` → `in_progress` → `completed`) are validated server-side
- Accepting a solver request automatically assigns them and transitions the project to `assigned`
- Other pending requests are auto-rejected when one solver is accepted
- State transitions cannot be skipped — the backend enforces the correct order

### 3. Task-Based Delivery Model

- Projects are broken down into sub-tasks by the assigned Problem Solver
- Each task tracks its own status, deadline, and submission history independently
- ZIP-only file uploads (max 50MB) ensure consistent deliverable format
- Files stored with UUID filenames to prevent conflicts and path traversal

### 4. Animated UI Transitions

- Framer Motion used for state-driven animations (not decorative)
- Page transitions, staggered list animations, and hover micro-interactions
- Loading spinners, error alerts, and empty states all have smooth animated feedback
- Project and task status changes are visually communicated through animated transitions

### 5. Clean API Design

- RESTful endpoints with clear resource separation (auth, users, projects, requests, tasks, submissions)
- Consistent response format: `{ success: boolean, data: { ... } }`
- Proper HTTP status codes (200, 201, 400, 401, 403, 404)
- Request validation middleware for input sanitization
- Mongoose population for related documents (buyer/solver names, project details)

### 6. Security

- Passwords hashed with bcrypt (12 salt rounds)
- JWT tokens with configurable expiration (default: 7 days)
- File upload restricted to ZIP MIME types only
- UUID-based file naming prevents path traversal attacks
- CORS configured for frontend origin

---

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── config/          # App configuration & database connection
│   │   ├── controllers/     # Route handlers (auth, user, project, task, request, submission)
│   │   ├── middleware/       # Auth (JWT), role authorization, file upload (Multer), validation
│   │   ├── models/          # Mongoose schemas (User, Project, ProjectRequest, Task, Submission)
│   │   ├── routes/          # API route definitions
│   │   └── utils/           # Helper functions
│   └── uploads/             # Uploaded ZIP files (UUID-named)
│
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js App Router pages
│   │   │   ├── login/       # Login page
│   │   │   ├── register/    # Registration page
│   │   │   ├── dashboard/   # Dashboard with stats
│   │   │   ├── projects/    # Project listing & detail pages
│   │   │   ├── requests/    # My requests page (Problem Solver)
│   │   │   ├── users/       # User management (Admin)
│   │   │   └── profile/     # Profile page (Problem Solver)
│   │   ├── components/
│   │   │   ├── layout/      # DashboardLayout, Navbar, Sidebar
│   │   │   └── ui/          # Button, Card, Input, Modal, Badge, Spinner, etc.
│   │   ├── lib/             # API client (Axios), AuthContext, utility functions
│   │   └── types/           # TypeScript interfaces & enums
│   └── public/              # Static assets
│
└── README.md
```

---

## Core Workflow Summary

| Step | Actor | Action | Result |
|------|-------|--------|--------|
| 1 | Admin | Assigns Buyer role to a user | User becomes a Buyer |
| 2 | Buyer | Creates a project with details | Project status: `open` |
| 3 | Problem Solver | Browses projects and sends request | Request status: `pending` |
| 4 | Buyer | Accepts one solver's request | Project status: `assigned`, other requests rejected |
| 5 | Problem Solver | Creates tasks with metadata | Project status: `in_progress` |
| 6 | Problem Solver | Submits ZIP file per task | Task status: `submitted` |
| 7 | Buyer | Reviews and approves submission | Task status: `completed` |
| 8 | — | All tasks completed | Project status: `completed` |
