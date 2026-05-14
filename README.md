# Collaborative Workflow Orchestration System

A full-stack collaborative workflow management system built using the MERN stack with real-time task synchronization, dependency orchestration, execution planning, audit tracking, and simulation capabilities.

## Live Demo

Frontend:
https://task-orchestrator-green.vercel.app

Backend:
https://task-orchestrator-backend.onrender.com

---

# Features

## Authentication & Authorization
- JWT-based authentication
- Protected routes
- Secure login/signup flow

## Project Collaboration
- Create projects
- Invite collaborators using secure invite tokens
- Join projects via token system

## Task Management
- Create and manage tasks
- Task priority handling
- Estimated effort tracking
- Task status lifecycle:
  - Pending
  - Running
  - Completed
  - Failed
  - Blocked

## Dependency Management
- Add dependencies between tasks
- Circular dependency prevention
- Dependency-safe execution ordering

## Execution Planning
- Generate execution plans based on dependencies
- Dependency graph orchestration
- Priority-aware task ordering

## Simulation Engine
- Simulate execution using available working hours
- Priority score calculation
- Task selection optimization

## Realtime Collaboration
- Socket.IO based realtime updates
- Shared project rooms
- Instant task synchronization across collaborators

## Optimistic Concurrency Control
- Version-based conflict detection
- Prevents overwriting stale task updates

## Audit Logging
- Task update tracking
- Retry tracking
- Version history support

---

# Tech Stack

## Frontend
- React
- Vite
- Axios
- React Router
- Socket.IO Client

## Backend
- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- Socket.IO
- JWT Authentication

---

# Project Structure

```bash
frontend/
backend/
```

---

# Installation & Setup

## Clone Repository

```bash
git clone https://github.com/annisingh-code/collaborative-workflow-system.git
```

---

# Backend Setup

```bash
cd backend
npm install
```

Create `.env`

```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
INVITE_SECRET=your_invite_secret
CLIENT_URL=http://localhost:5173
```

Run backend:

```bash
npm start
```

---

# Frontend Setup

```bash
cd frontend
npm install
```

Create `.env`

```env
VITE_SOCKET_URL=http://localhost:5000
```

Run frontend:

```bash
npm run dev
```

---

# Workflow Lifecycle

```text
Pending
   ↓
Running
   ↓      ↓
Completed Failed
              ↓
           Retry
              ↓
           Pending
```

---

# Core Engineering Concepts Used

- Realtime WebSocket communication
- Dependency graph traversal
- Circular dependency detection
- Optimistic concurrency control
- Audit trail management
- Execution orchestration
- Simulation-based task planning

---

# Deployment

## Frontend
- Vercel

## Backend
- Render

## Database
- MongoDB Atlas

---

# Future Improvements

- Role-based access control
- Notification system
- Kanban drag-and-drop UI
- Task comments & mentions
- Email invitations
- Advanced analytics dashboard

---

# Author

Anish