# Es Magico - Collaborative Workflow Orchestration System

## Overview
This is a full-stack MERN application that acts as a lightweight workflow orchestration engine. It supports dependency-aware task execution, multi-user collaboration with real-time updates via WebSockets, and strict optimistic concurrency control.

## Setup Instructions

### Backend
```bash
cd backend
npm install
# Create a .env file with PORT, MONGO_URI, JWT_SECRET, INVITE_SECRET
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Architecture Overview
* **Frontend:** React (Vite) with Context/State management for optimistic UI updates. Axios for API calls, Socket.io-client for real-time syncing.
* **Backend:** Node.js & Express.
* **Database:** MongoDB (Mongoose) utilizing adjacency lists for dependency tracking and `versionNumber` fields for concurrency.
* **Real-time:** Socket.io utilizing Project-specific "rooms" for targeted broadcasting.

## Core Logic Implementations

### Dependency Logic & Cycle Detection
Dependencies are modeled as a Directed Acyclic Graph (DAG). Before a task is updated with new dependencies, a Depth-First Search (DFS) runs against an in-memory adjacency list of the project's tasks. If the DFS encounters a node currently in its recursion stack, a cycle is detected and the API strictly rejects the update (HTTP 400).

### Concurrency Handling
Implemented **Optimistic Concurrency Control** (OCC) to ensure conflict-safe operations without heavy database locking. Every task has a `versionNumber`. `PUT` requests must include the current version. The database queries specifically for `{ _id, versionNumber }`. If a mismatch occurs (meaning another user updated it first), it returns an HTTP 409 Conflict with the latest data, prompting the UI to show a refresh warning.

### Execution Planning & Simulation Approach
* **Execution Plan:** Utilizes a modified Kahn's Algorithm for Topological Sorting. Tasks are queued based on an in-degree of 0 (no dependencies), then sorted deterministically by Priority (desc) and Estimated Hours (asc).
* **Simulation:** Combines the Topological Sort with a Greedy algorithm. It processes the available queue, selecting the highest-ranked tasks that fit within the `availableHours` parameter to maximize useful work, skipping tasks that exceed the remaining time.

## Assumptions and Tradeoffs
* **Authentication:** Used standard JWTs. For production, refresh tokens and HttpOnly cookies would be preferred.
* **Testing:** Due to the 6-hour limit, automated tests focus purely on testing the core algorithmic logic (DFS, Sorting, Concurrency comparison) rather than full E2E database mocking.
* **UI:** Prioritized clean layout, clear state communication (especially for conflicts), and functional speed over complex CSS animations.