# Codemaster Implementation Tasks

## Phase 1: Project Setup & Orchestration
- [x] Relocate existing React frontend files to a `frontend/` subdirectory
- [x] Create root `package.json` for task execution and dependency installation
- [x] Create `backend/package.json` with dependencies and start scripts
- [x] Configure `backend/.env` with environment variables

## Phase 2: Database Models & Connections
- [x] Set up MongoDB & Redis connection configurations in backend
- [x] Create Mongoose schemas: `User`, `Problem`, `TestCase`, `Submission`

## Phase 3: Express REST API Development
- [x] Implement input validation, rate limiting, and JWT authentication middleware
- [x] Create auth controllers and routes (`/api/auth/*`)
- [x] Create problem controllers and routes (`/api/problems/*` - supporting query filters, pagination, admin creation)
- [x] Create submission controllers and routes (`/api/submit`, `/api/submissions/*`)
- [x] Create leaderboard and user controllers and routes (`/api/leaderboard`, `/api/users/*`)

## Phase 4: Sandboxed Code Evaluation System
- [x] Design Redis queue interface for pushing submissions
- [x] Implement Worker process: dequeue jobs, create temp files
- [x] Implement container compilation step for C++ & Java
- [x] Implement container run step with 1 core CPU, 256MB memory, read-only FS, network disabled
- [x] Implement result verification, cleanups, and Redis pub/sub update broadcasting

## Phase 5: WebSocket Real-time Integration
- [x] Configure Socket.IO in Express server
- [x] Subscribe Express server to Redis pub/sub and forward verdicts to client rooms

## Phase 6: Frontend Development (React & Redux)
- [x] Setup `frontend/package.json` and configure Vite proxy to backend (port 5000)
- [x] Design and implement CSS Design System in `index.css`
- [x] Set up Redux store, auth, problem, submission, and leaderboard slices
- [x] Implement pages: Home, Login, Register, ProblemList, ProblemDetail, Leaderboard, Dashboard
- [x] Integrate Monaco Editor and connect Socket.IO for real-time submission alerts

## Phase 7: Seeding and Testing
- [x] Write seed script to populate 10 sample problems and test users
- [x] Validate and verify C++, Java, and Python compilations and runs manually and automatically

## Phase 8: CodeMastery Enhancements
- [x] Replace residual LazyStudio branding (index.html, logo, favicons)
- [x] Implement Undo/Redo buttons using Monaco history stack
- [x] Seed 25 test cases (3 visible, 22 hidden edge cases) programmatically
- [x] Add runCode API endpoint and database schema extensions
- [x] Modify execution worker to support custom inputs and run outputs
- [x] Update VerdictDisplay and ProblemDetail pages
- [x] Validate via local integration tests
