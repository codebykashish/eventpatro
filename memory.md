# CampusPulse / Eventpatro — Development Memory

## Project Overview
- **Project name:** CampusPulse (internal/technical) — branded as **Eventpatro** in the UI.
- **Purpose:** University event management platform for Sunway College. Students discover, register for, and apply to campus events. Admins manage events, registrations, attendance, and feedback.
- **Learning context:** BSc Computer Science coursework. Code must be beginner-friendly and explainable.
- **College email domain:** `@sunway.edu.np`

---

## Current Phase
**Complete — Project fully built, tested, and mobile-responsive.**

---

## All Completed Tasks

### Phase 0 — Project Setup
- Step 0.1: Inspect project folder and read all docs
- Step 0.2: Check environment (Node, npm, MongoDB, git)
- Step 0.3: Create `server/` with package.json, install backend deps
- Step 0.4: Create initial Express app with health-check route
- Step 0.5: Set up `.env` and `.env.example` for the server
- Step 0.6: Connect Express to MongoDB (db.js)
- Step 0.7: Create `client/` React app (Vite), install frontend deps
- Step 0.8: Verify frontend and backend start correctly
- Step 0.9: Confirm frontend can call backend health-check route
- Step 0.10: Initialize git and add .gitignore

### Phase 1 — Authentication
- Task 1.1: `User` Mongoose model with bcryptjs password hashing and role definitions
- Task 1.2: Zod validation for signup and login (`@sunway.edu.np` domain, password matching)
- Task 1.3: JWT authentication and auth controller (`/api/auth/signup`, `/login`, `/me`)
- Task 1.4: `protect` and `restrictTo` authentication and role middleware
- Task 1.5: Idempotent admin seed script (`npm run seed:admin`) creating `admin@sunway.edu.np`
- Task 1.6: React frontend authentication (AuthContext, Login, Signup with live password strength indicator, Dashboard, AdminDashboard, and ProtectedRoute)
- Task 1.7: Verified all security checks (duplicate rejection, role tampering prevention, protected routes)
- Task 1.8: UI refinements (transparent campus photo overlay, split info-form layout, animated floating cards, glowing password criteria badges, logout confirmation dialog, removed studentId requirement for admins)
- Task 1.9: 6-digit Email OTP Verification (Nodemailer, secure OTP generation, 10-minute expiry, unverified login block, VerifyOtp 6-box input screen with paste and countdown timer)

### Phase 2 — Events
- Task 2.1: `Event` Mongoose model with dates, venue, category, capacity, virtual `spotsLeft`, and soft-delete (`isPublished`)
- Task 2.2: Zod validation schemas for event creation and updates
- Task 2.3: Event CRUD API routes (`/api/events`) with admin protection and search/category filters
- Task 2.4: Public event listing page (`/events`) with live search, category pills, upcoming/past sorting, and EventCards
- Task 2.5: Event detail page (`/events/:id`) with date formatting, venue, capacity countdown, student registration/cancellation, and admin participant list
- Task 2.6: Create Event page (`/admin/events/new`) and Edit Event page (`/admin/events/:id/edit`) with validation and delete action
- Task 2.7: Admin Event Management portal with live metrics, event table, quick view/edit/delete actions, and confirmation modals
- Task 2.8: Event seeding script (`npm run seed:events`) with realistic Sunway College events
- Task 2.9: Landing page redesign (full-bleed campus hero, floating search bar, 3-card upcoming showcase with countdown tags, feature pillars, CTA card, and footer)
- Task 2.10: Global `AuthModal` overlay with blur backdrop, click-outside/Escape dismissal, and seamless Sign In / Register / OTP tab flow
- Task 2.11: Unified login/signup/OTP card format (460px width, Eventpatro branding, matched heights)
- Task 2.12: Full-screen landing page overhaul (frosted navbar, cursive logo, auto-redirect for authenticated visitors, campus story section, quick-sign-up card, contact footer)
- Task 2.13: Visitor-only landing page access control — authenticated users auto-redirect to their dashboard; navbar smooth-scroll animations

### Phase 3 — Registrations and Forms
- Task 3.1: `Registration` Mongoose model (answers snapshot, unique `EP-XXXXXX` code, status lifecycle: confirmed/pending/selected/rejected/cancelled, partial unique index preventing duplicate active registrations)
- Task 3.2: `registration.controller.js` — submit with form answers + required field validation, cancel, admin list/update (select/reject), student's own registrations
- Task 3.3: Registration routes wired into `app.js`; `/api/registrations/me` and `/api/registrations/me/:eventId` endpoints
- Task 3.4: `Event` model extended with `registrationType` (open/application), `registrationDeadline`, and `formFields`; event validation updated
- Task 3.5: `EventDetail.jsx` fully rewritten — live registration status check, dynamic form rendering (short_answer/paragraph/multiple_choice), registration code display, admin application review panel
- Task 3.6: `FormBuilder.jsx` — reusable admin form-question builder component; integrated into CreateEvent and EditEvent
- Task 3.7: Student `Dashboard.jsx` upgraded — My Registrations section with live status badges, reg codes, event links, active/past separation
- Task 3.8: `EventCard.jsx` redesigned — 220px cover image with gradient overlay, title, description excerpt, meta row, pill-shaped CTA button
- Task 3.9: Sticky navbar with `position: fixed`, glassmorphism backdrop filter, and scrolled state elevation
- Task 3.10: Admin interface refinements — View All buttons navigate to Events and Users tabs; Edit Event converted to in-place popup modal; Enrollments and Attendance section with live metrics, search and filter toolbar, questionnaire responses modal

### Phase 4 — Attendance, Feedback, and Profile
- Attendance marking (present/absent) per registration, correctable by admin
- Feedback system: attended students can submit one star rating and comment per event
- Student dashboard tabs: Dashboard (overview stats), Explore Events, My Registrations, Profile
- Profile page with Registered and Attended tabs — attendance drives tab membership
- Profile picture upload (Multer + Cloudinary fallback)
- Registration code display (EP-XXXXXX format) on each registration card
- Admin Users page: table view with user details, role badge, delete action
- Admin Events page: table on desktop, card view on mobile, chip-based status filters

### Phase 5 — Responsive Design and UI Polish
- Mobile layout at 390px × 844px for all pages
- Footer navigation bar on mobile (icons for Home, Events, Dashboard, Profile)
- Hamburger menu (transparent, icon-only) on mobile with slide-out sidebar
- Admin dashboard: 3 stat cards in a single row on mobile
- Admin Events and Users pages: horizontal scroll removed; mobile card view implemented
- Event filter chips in admin aligned with user-side filter design
- Student profile: 2-column grid for registered program cards on desktop; spacing maintained
- Consistent left/right page padding across all pages
- Search bar on landing page: compact inline input instead of large box
- Logout confirmation modal centered on screen
- White space and scroll gaps fixed across pages

---

## In Progress
None. The project is complete.

---

## Environment (verified 2026-11-09)
| Tool | Version | Status |
|---|---|---|
| Node.js | v24.19.0 | Installed |
| npm | 11.17.0 | Installed |
| MongoDB | 7.0.40 | Installed |
| mongod service | active | Running |
| git | 2.53.0 | Installed |

---

## Technologies Used
| Layer | Technology | Reason |
|---|---|---|
| Frontend | React 19 + React Router v7 | Required by requirement.md |
| HTTP requests | Native `fetch` | Built into browsers; no extra dependency |
| Styling | Plain CSS | Specified; no framework imposed |
| Icons | Lucide React | Specified in design.md |
| Backend | Node.js + Express | MERN stack |
| Auth tokens | jsonwebtoken | JWT-based auth as required |
| Password hashing | bcryptjs | Specified |
| Input validation | Zod | Specified |
| File uploads | Multer + Cloudinary | Profile picture and event cover uploads |
| Security headers | Helmet | Specified |
| CORS | cors package | Specified |
| Rate limiting | express-rate-limit | Specified |
| Database | MongoDB Atlas + Mongoose | MERN stack |
| Email | Nodemailer + Gmail SMTP | OTP verification |

---

## Important Decisions Made
1. Project root is `/home/kash/year1/training-sem/mern_project` — docs and subfolders live here, no new parent folder will be created.
2. Brand name in UI is **Eventpatro**; internal/code name is **CampusPulse** — both are correct depending on context.
3. `bcryptjs` preferred over `bcrypt` (pure JS, no native bindings needed for a learning project).
4. JWT storage method: **localStorage + Authorization: Bearer token** selected by user for coursework clarity.
5. No TypeScript — plain JavaScript as stated in `rules.md`.
6. Admin accounts created via a one-time seed script, not via the public signup form.
7. Concise code comments (1–2 lines) that clearly explain what the code does for beginner comprehension.
8. Git remote is `https://github.com/codebykashish/eventpatro.git`. Changes committed and pushed at the completion of each milestone with a clear, descriptive message.
9. Cloudinary used for image uploads in production; falls back to local `server/uploads/` if Cloudinary is not configured.
10. Mobile nav uses a footer icon bar (not sidebar) for student-facing pages. Admin uses a sidebar.

---

## Known Issues / Settled Questions
1. **Name settled:** UI brand name is **Eventpatro**. Code files/folders use "campuspulse". Both are correct.
2. **JWT storage settled:** `localStorage` chosen for simplicity and DevTools inspection.
3. **Applied tab removed:** The profile page shows Registered and Attended only. Application-based registrations appear under Registered until attendance is marked.

---

## Last Updated
2026-11-09 — Project complete. All phases done including mobile-responsive design, admin pages, attendance, feedback, profile, and documentation (README.md, requirement.md, memory.md).
