# CampusPulse / Eventpatro — Development Memory

## Project Overview
- **Project name:** CampusPulse (internal/technical) — branded as **Eventpatro** in the UI.
- **Purpose:** University event management platform for Sunway College. Students discover, register for, and apply to campus events. Admins manage events, registrations, attendance, and feedback.
- **Learning context:** BSc Computer Science coursework. Code must be beginner-friendly and explainable.
- **College email domain:** `@sunway.edu.np`

---

## Current Phase
**Phase 3 — Registration Forms and Student Registration** (In Progress)

---

## Completed Tasks (tested)
- Phase 0: Project setup, client/server scaffolding, environment, health check ✅
- Phase 1, Task 1.1: Created `User` Mongoose model with bcryptjs password hashing and role definitions ✅
- Phase 1, Task 1.2: Implemented Zod validation for signup & login (`@sunway.edu.np` domain, password matching) ✅
- Phase 1, Task 1.3: Implemented JWT authentication and auth controller (`/api/auth/signup`, `/login`, `/me`) ✅
- Phase 1, Task 1.4: Created `protect` and `restrictTo` authentication and role middleware ✅
- Phase 1, Task 1.5: Created idempotent admin seed script (`npm run seed:admin`) creating `admin@sunway.edu.np` ✅
- Phase 1, Task 1.6: Created React frontend authentication (AuthContext, Login, Signup with live password strength indicator, Dashboard, AdminDashboard, and ProtectedRoute) ✅
- Phase 1, Task 1.7: Verified all security checks (duplicate rejection, role tampering prevention, protected routes) ✅
- Phase 1, Task 1.8: Refined UI (transparent campus photo overlay, split info-form layout, animated floating cards, glowing password criteria badges, logout confirmation dialog, removed studentId requirement for admins) ✅
- Phase 1, Task 1.9: Implemented 6-digit Email OTP Verification system (Nodemailer, secure OTP generation, 10-minute expiry, unverified login block, and VerifyOtp 6-box input screen with paste & countdown timer) ✅
- Phase 2, Task 2.1: Created `Event` Mongoose model with dates, venue, category, capacity, virtual `spotsLeft`, and soft-delete (`isPublished`) ✅
- Phase 2, Task 2.2: Implemented Zod validation schemas for event creation and updates ✅
- Phase 2, Task 2.3: Created Event CRUD API routes (`/api/events`, `POST`, `GET /:id`, `PUT /:id`, `DELETE /:id`) with admin protection and search/category filters ✅
- Phase 2, Task 2.4: Built public event listing page (`/events`) with live search, category pills, upcoming/past sorting, and EventCards ✅
- Phase 2, Task 2.5: Built event detail page (`/events/:id`) with date formatting, venue, capacity countdown, student registration/cancellation, and admin participant list ✅
- Phase 2, Task 2.6: Built Create Event page (`/admin/events/new`) and Edit Event page (`/admin/events/:id/edit`) with validation and delete action ✅
- Phase 2, Task 2.7: Built Admin Event Management portal in `AdminDashboard.jsx` with live metrics, event table, quick view/edit/delete actions, and confirmation modals ✅
- Phase 2, Task 2.8: Created event seeding script (`npm run seed:events`) with 4 realistic Sunway College events ✅
- Phase 2, Task 2.9: Redesigned landing page matching the inspiration reference (full-bleed campus hero, floating search & browse bar, 3-card upcoming showcase with live "N days remaining" countdown tags, "Why Eventpatro?" pillars, CTA card, and footer) ✅
- Phase 2, Task 2.10: Implemented global `AuthModal` overlay (`backdrop-filter: blur(8px)`) with instant click-outside / Escape dismissal and seamless Sign In / Register / OTP verification tab flow ✅
- Phase 2, Task 2.11: Refactored Login, Signup, and OTP verification into a single unified card format without the red picture/illustration panel; set unified 460px width with matched heights across modes; applied red "Welcome to Eventpatro" branding (`#881421`) ✅
- Phase 2, Task 2.12: Full-screen landing page overhaul inspired by reference image (floating frosted navbar over hero, cursive Eventpatro logo without icon, automatic dashboard redirect for authenticated visitors, 3-card upcoming showcase with 'Explore More Events' button, zig-zag campus story with real photography, 'Few steps to begin' guide, embedded 2-column quick sign-up card, and complete contact/socials footer) ✅
- Phase 2, Task 2.13: Visitor-only landing page access control — authenticated users auto-redirected to their dashboard; navbar smooth-scroll animations for all section links ✅
- Phase 3, Task 3.1: `Registration` Mongoose model (answers snapshot, unique `EP-XXXXXX` code, status lifecycle: confirmed/pending/selected/rejected/cancelled, partial unique index preventing duplicate active registrations) ✅
- Phase 3, Task 3.2: `registration.controller.js` — submit with form answers + required field validation, cancel, admin list/update (select/reject), student's own registrations ✅
- Phase 3, Task 3.3: `registration.routes.js` + wired into `app.js`; event routes updated to use new registration controller; `/api/registrations/me` and `/api/registrations/me/:eventId` endpoints ✅
- Phase 3, Task 3.4: `Event` model extended with `registrationType` (open/application), `registrationDeadline`, and `formFields` (sub-schema); `event.validation.js` updated with Phase 3 fields ✅
- Phase 3, Task 3.5: `EventDetail.jsx` fully rewritten — live registration status check, dynamic form rendering (short_answer/paragraph/multiple_choice), registration code display, admin application review panel with select/reject buttons ✅
- Phase 3, Task 3.6: `FormBuilder.jsx` + `FormBuilder.css` — reusable admin form-question builder component; integrated into `CreateEvent.jsx` and `EditEvent.jsx` ✅
- Phase 3, Task 3.7: Student `Dashboard.jsx` upgraded — "My Registrations" section fetches and shows all registrations with live status badges, reg codes, event links, active/past separation ✅
- Phase 3, Task 3.8: `EventCard.jsx` redesigned to match Pinterest card inspiration — 220px cover image with gradient overlay, title + description excerpt, meta row, divider, pill-shaped dark CTA button; visitors get auth modal, logged-in users go to event detail ✅
- Phase 3, Task 3.9: Sticky Navbar upgrade — navbar now smoothly follows user as they scroll down with `position: fixed`, glassmorphism backdrop filter, and elevated scrolled state ✅


---

## In Progress
- Ready for **Phase 3 — Registration Forms and Student Registration** (Custom form builder, multiple question types, application review workflow)

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
- `server/src/models/User.js` — Mongoose user model with bcrypt hashing and validation
- `server/src/validations/auth.validation.js` — Zod schemas for signup and login
- `server/src/middleware/validate.js` — reusable Zod request body validation middleware
- `server/src/utils/generateToken.js` — JWT signing utility (7-day expiry)
- `server/src/middleware/auth.js` — protect (JWT verification) and restrictTo (role authorization)
- `server/src/controllers/auth.controller.js` — signup, login, and getMe endpoints
- `server/src/routes/auth.routes.js` — auth routing with login rate limiter (10 attempts / 15m)
- `server/src/scripts/seedAdmin.js` — idempotent initial admin creation script
- `client/src/context/AuthContext.jsx` — React authentication context with localStorage persistence
- `client/src/components/ProtectedRoute.jsx` — client-side route guard with role restriction
- `client/src/components/Navbar.jsx` & `Navbar.css` — header navigation with user state and logout
- `client/src/pages/Home.jsx` & `Home.css` — landing page with call to actions
- `client/src/pages/Login.jsx` — login form with error feedback
- `client/src/pages/Signup.jsx` & `Auth.css` — student registration with live password strength bar
- `client/src/pages/Dashboard.jsx` & `Dashboard.css` — student portal
- `client/src/pages/AdminDashboard.jsx` — admin portal restricted to role: admin

---

## Important Decisions Made
1. Project root is `/home/kash/year1/training-sem/mern_project` — docs and subfolders live here, no new parent folder will be created.
2. Brand name in UI is **Eventpatro**; internal/code name is **CampusPulse** — both are correct depending on context.
3. `bcryptjs` preferred over `bcrypt` (pure JS, no native bindings needed for a learning project).
4. JWT storage method: **Option 1 (`localStorage` + `Authorization: Bearer <token>`)** selected by user for coursework clarity.
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
- `npm run seed:admin` — seeded admin@sunway.edu.np successfully into MongoDB
- Tested signup, login, Zod email/password validation, duplicate prevention, and protected routes via curl

---

## Known Issues / Open Questions
1. **Name settled:** UI brand name is **Eventpatro** (confirmed by project owner 2026-10-29). Code files/folders use "campuspulse" or similar. Docs may still say Eventify — treat those as Eventpatro.
2. **JWT storage settled:** `localStorage` chosen for simplicity and inspection in DevTools.

---

## Decisions Awaiting Approval
- None currently. Ready for Phase 2 (Events).

---

## Last Updated
2026-10-29 — Phase 1 complete. Full authentication (User model, Zod validation, JWT, admin seed script, React Login/Signup with live password strength, protected routes) built and tested. Ready for milestone git push.