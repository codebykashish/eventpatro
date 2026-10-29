# CampusPulse / Eventpatro — Development Memory

## Project Overview
- **Project name:** CampusPulse (internal/technical) — branded as **Eventpatro** in the UI.
- **Purpose:** University event management platform for Sunway College. Students discover, register for, and apply to campus events. Admins manage events, registrations, attendance, and feedback.
- **Learning context:** BSc Computer Science coursework. Code must be beginner-friendly and explainable.
- **College email domain:** `@sunway.edu.np`

---

## Current Phase
**Phase 0 — Project Setup** (Completed ✅)

---

## Completed Tasks (tested)
- Phase 0, Step 0.1: Initial environment inspection and documentation reading ✅
- Phase 0, Step 0.2: Environment check (Node v24, npm 11, MongoDB 7, git 2.53) ✅
- Phase 0, Step 0.3: Created `server/`, initialized package.json, installed backend dependencies ✅
- Phase 0, Step 0.4: Created Express server with `/api/health`, 404, and error handling ✅
- Phase 0, Step 0.5: Created `server/.env` and `server/.env.example` ✅
- Phase 0, Step 0.6: Connected Express to MongoDB via Mongoose ✅
- Phase 0, Step 0.7: Created `client/` React app with Vite, installed `react-router-dom` and `lucide-react` ✅
- Phase 0, Step 0.8: Verified both frontend and backend start properly ✅
- Phase 0, Step 0.9: Tested frontend-to-backend communication via `/api/health` proxy ✅
- Phase 0, Step 0.10: Initialized Git repository and set up root `.gitignore` ✅

---

## In Progress
- Ready to begin **Phase 1 — User Authentication and Roles**

---

## Environment (verified 2026-10-29)
| Tool | Version | Status |
|---|---|---|
| Node.js | v24.19.0 | ✅ Installed |
| npm | 11.17.0 | ✅ Installed |
| MongoDB | 7.0.40 | ✅ Installed |
| mongod service | active | ✅ Running |
| git | 2.53.0 | ✅ Installed |

No installation of these tools is needed.

---

## Technologies to Use
| Layer | Technology | Reason |
|---|---|---|
| Frontend | React + React Router | Required by requirement.md |
| HTTP requests | Native `fetch` | Built into browsers; no extra dependency |
| Styling | CSS / CSS Modules | Specified; no framework imposed |
| Icons | Lucide (React) | Specified in design.md |
| Backend | Node.js + Express | MERN stack |
| Auth tokens | jsonwebtoken | JWT-based auth as required |
| Password hashing | bcryptjs | Specified |
| Input validation | Zod | Specified |
| File uploads | Multer | Profile picture uploads |
| Security headers | Helmet | Specified |
| CORS | cors package | Specified |
| Rate limiting | express-rate-limit | Specified |
| Database | MongoDB + Mongoose | MERN stack |

---

## Folder Structure (target, from architecture.md)
```
mern_project/          ← existing project root (docs live here)
├── client/            ← React frontend (to be created)
└── server/            ← Express backend (to be created)
```

---

## Phase 0 Plan
- Step 0.1: Inspect project folder and read all docs ✅
- Step 0.2: Check environment (Node, npm, MongoDB, git) ✅
- Step 0.3: Create `server/` with package.json, install backend deps ✅
- Step 0.4: Create initial Express app with health-check route ✅
- Step 0.5: Set up `.env` and `.env.example` for the server ✅
- Step 0.6: Connect Express to MongoDB (db.js) ✅
- Step 0.7: Create `client/` React app (Vite), install frontend deps
- Step 0.8: Verify frontend and backend start correctly
- Step 0.9: Confirm frontend can call backend health-check route
- Step 0.10: Initialize git and add .gitignore ✅

---

## Completed Phase Tasks
- Phase 0 Step 0.1 — Docs read ✅
- Phase 0 Step 0.2 — Environment verified ✅
- Phase 0 Step 0.3 — server/ created, all backend deps installed ✅
- Phase 0 Step 0.4 — app.js (Express + /api/health) created ✅
- Phase 0 Step 0.5 — .env and .env.example created ✅
- Phase 0 Step 0.6 — db.js connects to MongoDB; tested and confirmed ✅
- Phase 0 Step 0.10 — .gitignore created ✅

---

## Files Created or Modified
- `memory.md` — updated with Phase 0 completion (2026-10-29)
- `server/package.json` — created; name campuspulse-server, start/dev scripts, all deps listed
- `server/src/server.js` — entry point; loads .env, connects DB, starts Express
- `server/src/app.js` — Express app; helmet, cors, JSON body parser, /api/health, 404+error handlers
- `server/src/config/db.js` — MongoDB connection via Mongoose
- `server/src/utils/AppError.js` — custom error class with statusCode
- `server/.env` — real local config (gitignored)
- `server/.env.example` — safe placeholder template (committed to git)
- `.gitignore` — root gitignore (node_modules, .env, dist, logs)
- `client/package.json` — created by Vite; React 19, react-router-dom, lucide-react
- `client/vite.config.js` — dev server with `/api` proxy to Express backend
- `client/index.html` — updated page title and Google Font Plus Jakarta Sans
- `client/.env` and `client/.env.example` — frontend environment config with VITE_API_URL
- `client/src/index.css` — CSS design tokens from design.md (burgundy palette, reset)
- `client/src/App.jsx` — health-check UI demonstrating frontend-to-backend communication
- `client/src/App.css` — styling for health-check dashboard and brand header

---

## Important Decisions Made
1. Project root is `/home/kash/year1/training-sem/mern_project` — docs and subfolders live here, no new parent folder will be created.
2. Brand name in UI is **Eventpatro**; internal/code name is **CampusPulse** — both are correct depending on context.
3. `bcryptjs` preferred over `bcrypt` (pure JS, no native bindings needed for a learning project).
4. JWT storage method (localStorage vs HTTP-only cookie) to be discussed in Phase 1 before building auth.
5. No TypeScript — plain JavaScript as stated in `rules.md`.
6. Admin accounts created via a one-time seed script, not via the public signup form.
7. Concise code comments (1–2 lines) that clearly explain what the code does for beginner comprehension.
8. **Git remote & commit workflow:** Remote is `https://github.com/codebykashish/eventpatro.git`. Changes are committed and pushed strictly at the completion of each milestone with a clear, descriptive message (no random/intermediate partial pushes).

---

## Commands Executed Successfully
- `mkdir server && cd server && npm init -y` — created server/ and package.json
- `npm install express mongoose bcryptjs jsonwebtoken zod multer helmet cors express-rate-limit dotenv` — 113 packages, 0 vulnerabilities
- `npm install --save-dev nodemon` — 25 packages, 0 vulnerabilities
- `node src/server.js` (smoke test) — MongoDB connected, /api/health returned {success:true}
- `npx create-vite client --template react` — created React frontend
- `cd client && npm install react-router-dom lucide-react` — installed frontend routing and icons
- `cd client && npm run build` — verified frontend builds with 0 errors
- Frontend & backend simultaneous smoke test: curl tested both servers and proxy integration successfully
- `git init` — initialized root git repository with verified `.gitignore`

---

## Known Issues / Open Questions
1. **Name settled:** UI brand name is **Eventpatro** (confirmed by project owner 2026-10-29). Code files/folders use "campuspulse" or similar. Docs may still say Eventify — treat those as Eventpatro.
2. **JWT storage decision for Phase 1:** HTTP-only cookies vs localStorage. We will discuss the trade-offs before implementing Phase 1 auth.

---

## Decisions Awaiting Approval
- Phase 1 discussion on token storage (HTTP-only cookie vs Authorization header).

---

## Last Updated
2026-10-29 — Phase 0 complete. Both frontend and backend configured, tested, communicating, and Git repository initialized. Ready for Phase 1 (User Authentication & Roles).