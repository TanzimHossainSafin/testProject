# Marketplace Project Workflow System

A full-stack role-based project marketplace where projects are created by buyers and executed by problem solvers, with clear state transitions, task management, and delivery submission.

## System Overview

### Role Hierarchy

```
Admin (Top Level)
  └── Can assign Buyer role to users
  └── Can view all users and projects
  └── No project execution responsibilities

Buyer (Project Owner)
  └── Creates and manages projects
  └── Reviews incoming requests from problem solvers
  └── Assigns one problem solver to a project
  └── Reviews and accepts/rejects task submissions

Problem Solver (Executor)
  └── Creates and manages profile
  └── Browses available projects
  └── Requests to work on projects
  └── Creates tasks/sub-modules when assigned
  └── Submits completed work (ZIP files)
```

### Project Lifecycle

```
1. OPEN          → Project created by Buyer, accepting requests
2. ASSIGNED      → Buyer selected a Problem Solver
3. IN_PROGRESS   → Problem Solver started working (created first task)
4. COMPLETED     → All tasks approved by Buyer
```

### State Transitions

```
Project States:
  open → assigned → in_progress → completed

Task States:
  todo → in_progress → submitted → completed
                    ↓
            revision_requested → submitted → completed

Request States:
  pending → accepted / rejected

Submission States:
  pending → approved / rejected
```

## Tech Stack

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer (ZIP files only)
- **Validation**: express-validator

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **HTTP Client**: Axios
- **Icons**: Lucide React

## Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Update .env with your MongoDB URI and JWT secret
# MONGODB_URI=mongodb://localhost:27017/marketplace
# JWT_SECRET=your-secret-key

# Seed admin user
npm run seed

# Start development server
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Start development server
npm run dev
```

The frontend will run on `http://localhost:3000`

### Default Admin Credentials
- **Email**: admin@marketplace.com
- **Password**: admin123

## API Routes Summary

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user (as Problem Solver) |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Get all users (filterable by role) |
| GET | `/api/users/:id` | Get user by ID |
| PATCH | `/api/users/:id/role` | Update user role (Admin only) |
| PATCH | `/api/users/profile/update` | Update own profile |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | Get all projects (role-based filtering) |
| POST | `/api/projects` | Create project (Buyer only) |
| GET | `/api/projects/:id` | Get project details |
| PATCH | `/api/projects/:id` | Update project |
| PATCH | `/api/projects/:id/status` | Update project status |

### Requests
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/requests` | Create work request (Problem Solver) |
| GET | `/api/requests/project/:id` | Get requests for project (Buyer) |
| GET | `/api/requests/my` | Get my requests (Problem Solver) |
| PATCH | `/api/requests/:id/accept` | Accept request (Buyer) |
| PATCH | `/api/requests/:id/reject` | Reject request (Buyer) |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tasks` | Create task (Assigned Solver) |
| GET | `/api/tasks/project/:id` | Get tasks for project |
| GET | `/api/tasks/:id` | Get task details |
| PATCH | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |

### Submissions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/submissions` | Submit work (ZIP file) |
| GET | `/api/submissions/task/:id` | Get submissions for task |
| PATCH | `/api/submissions/:id/review` | Review submission (Buyer) |
| GET | `/api/submissions/:id/download` | Download submission file |

## Key Architectural Decisions

### 1. Role-Based Access Control
- Middleware-based authorization on all protected routes
- Role checks performed both at API and UI level
- Users default to "Problem Solver" role on registration

### 2. Project State Machine
- Status transitions are validated at the API level
- Automatic status updates (e.g., project moves to "in_progress" when first task is created)
- All tasks must be completed for project to be marked complete

### 3. File Upload Security
- Only ZIP files are accepted
- Files are stored with UUID names to prevent conflicts
- File size limited to 50MB
- Downloads require proper authorization

### 4. Animated UI Transitions
- Framer Motion used for smooth state transitions
- Loading states with spinners
- Empty states with helpful messages
- Success/error feedback animations

### 5. API Design
- RESTful endpoints with clear resource naming
- Consistent response format: `{ success: boolean, data?: T, message?: string }`
- Proper HTTP status codes
- Input validation with express-validator

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── config/        # Configuration and database setup
│   │   ├── controllers/   # Request handlers
│   │   ├── middleware/    # Auth, validation, file upload
│   │   ├── models/        # Mongoose schemas
│   │   ├── routes/        # API route definitions
│   │   └── utils/         # Helper functions
│   └── uploads/           # Uploaded files storage
│
├── frontend/
│   ├── src/
│   │   ├── app/           # Next.js app router pages
│   │   ├── components/    # React components
│   │   │   ├── layout/    # Navigation, sidebar
│   │   │   └── ui/        # Reusable UI components
│   │   ├── lib/           # API client, auth context, utilities
│   │   └── types/         # TypeScript type definitions
│   └── public/            # Static assets
│
└── README.md
```

## Core Workflow

1. **Admin assigns Buyer role** to a registered user via the Users page
2. **Buyer creates a project** with title, description, requirements, budget, and deadline
3. **Problem Solvers browse** available (open) projects
4. **Problem Solver requests** to work on a project
5. **Buyer reviews requests** and selects one problem solver
6. **Project becomes assigned** and other pending requests are auto-rejected
7. **Problem Solver creates tasks** with metadata (title, description, deadline, status)
8. **Problem Solver submits ZIP** file for each completed task
9. **Buyer reviews submission** and approves or requests revision
10. **When all tasks approved**, project is marked as completed
# testProject
