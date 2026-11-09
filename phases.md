# Eventpatro — Development Phases

## How to Use This Plan

Build the project one phase at a time.

Do not begin the next major phase until the current phase works and has been tested. Small fixes and necessary improvements to earlier features are allowed.

The AI must check this document and `memory.md` before deciding what to work on next.

---

## Phase 0 — Project Setup ✅ COMPLETE

### Goal
Prepare the frontend, backend, and database connection.

### Tasks
- Create the main `mern_project` folder with `client` and `server` subfolders.
- Create the `client` React application (Vite + React).
- Create the `server` Node.js and Express application.
- Install only the required starting dependencies.
- Set up environment variables.
- Connect the backend to MongoDB.
- Add a basic health-check API route.
- Set up the global error-handling structure.
- Confirm that the frontend and backend can run.

### Completion Check ✅
- Frontend opens successfully via Vite dev server.
- Backend starts without errors on port 5050.
- MongoDB connection works (Atlas).
- The frontend can make a test request to the backend.
- Secret values are stored in `.env`, not committed to Git.

---

## Phase 1 — Signup, Login, and Roles ✅ COMPLETE

### Goal
Allow students to create accounts and log in securely.

### Tasks
- Create the User model with firstName, lastName, studentId, email, password, role, profilePicture.
- Create signup and login API routes.
- Validate first name, last name, student ID, email, password, and confirm password.
- Check for duplicate student IDs and emails.
- Hash passwords with bcryptjs.
- Add JWT authentication.
- Add authentication middleware.
- Add student and admin roles.
- Build signup and login UI inside a slide-up modal (`AuthModal`).
- Add OTP email verification on signup (via Nodemailer + Gmail SMTP).
- Add logout functionality.
- Create protected frontend routes.
- Set up a secure process for creating the first admin (seed script).

### Completion Check ✅
- A student can sign up, verify via OTP, and log in.
- Duplicate student IDs and emails are rejected.
- Invalid credentials show a helpful message.
- Passwords are not stored as plain text.
- Logged-out users cannot access protected APIs.
- Students cannot perform admin actions.
- Users cannot make themselves admins by editing a signup request.

---

## Phase 2 — Public Event Discovery and Event CRUD ✅ COMPLETE

### Goal
Allow visitors to browse events and admins to manage them.

### Tasks
- Create the Event model (title, description, category, date, endDate, venue, deadline, capacity, registrationType, customQuestions, coverImage, status).
- Build the public Events listing page with search, category filter, and timeline filter.
- Build the EventDetail page (two-column desktop layout: left content tabs, right sticky summary card).
- Add event image/poster uploads using Multer + local file storage.
- Build the admin event list inside the portal Dashboard.
- Build the create-event form (EventForm) with a separate FormBuilder for custom questions.
- Build event editing (edit modal) and deletion.
- Validate event data on the backend.
- Add loading, empty, error, and success states.

### Completion Check ✅
- Public visitors can view events without logging in.
- Admins can create, edit, view, and delete events.
- Students and public visitors cannot change events.
- Search, category, and timeline filters work.
- Invalid event information is rejected.
- Events display correct dates, details, and cover images.

---

## Phase 3 — Registration Forms and Student Registration ✅ COMPLETE

### Goal
Allow students to register for or apply to events.

### Tasks
- Create the Registration model (event, student, status, answers, registrationCode, cancelledAt).
- Implement the registration form builder inside EventForm (FormBuilder component).
- Support short answer, paragraph, and multiple-choice question types.
- Support required and optional questions.
- Display the correct form on the EventDetail page via a questionnaire modal.
- Save submitted answers in MongoDB (each answer stores its question label and type snapshot).
- Generate a unique registration code (UUID).
- Prevent duplicate active registrations.
- Check deadlines and event capacity.
- Implement open registration (auto-Confirmed status).
- Implement application-based registration (Pending status, admin reviews).
- Add a cancel-registration action where permitted.

### Completion Check ✅
- Open registration creates a Confirmed registration.
- Application-based registration starts as Pending.
- Required questions are validated before submission.
- Submitted answers are saved correctly with question snapshots.
- Students cannot register after the deadline.
- Full events cannot exceed their capacity.
- Students cannot register twice for the same event while an active registration exists.
- Registration codes are unique.

---

## Phase 4 — Admin Application Review ✅ COMPLETE

### Goal
Allow admins to review applications and make decisions.

### Tasks
- Build the event participant and application list inside the admin Dashboard.
- Display student details needed for review.
- Display the answers submitted by each applicant.
- Add a Select action (changes status to Confirmed).
- Add a Reject action (changes status to Rejected).
- Save the admin's decision and enforce capacity on Select.
- Display updated statuses to students.
- Restrict decision-making to admins.

### Completion Check ✅
- Admins can read application answers inside a modal.
- Admins can select or reject applicants.
- Selecting an applicant beyond capacity is prevented.
- Application statuses update correctly.
- Students can see their own status.
- Students cannot change their own status.
- Open registrations do not go through the application review flow.

---

## Phase 5 — Student Dashboard and Profile ✅ COMPLETE

### Goal
Give students one place to view their activity.

### Tasks
- Build the student portal (Dashboard.jsx) with a hover-expand sidebar nav.
- Sidebar items: Home, Explore, My Registrations, Notifications, Profile.
- Home tab: welcome card, upcoming confirmed registrations, quick stats.
- Explore tab: browse all events with filters, mobile filter chips.
- My Registrations tab: Attended / Registered / Applied sub-tabs (Instagram-style profile tabs).
- Profile tab: avatar, name, student ID, email, attended count, editable name fields, profile picture upload.
- Display each registration's unique code (passcode) on confirmed registrations.
- Validate profile-picture type and size (Multer, max 5MB, jpg/png/gif/webp).
- Show clear upload errors and success messages.

### Completion Check ✅
- Students see only their own private information.
- Dashboard information comes from the backend.
- Registration codes match the saved registrations.
- Profile changes are saved correctly.
- Invalid profile-picture uploads are rejected.
- Students cannot change their role or student ID through profile editing.
- Three separate sub-tabs (Attended, Registered, Applied) show correct event cards.

---

## Phase 6 — Attendance Management ⬜ NOT STARTED

### Goal
Allow admins to record attendance and students to view their attendance history.

### Tasks
- Create the Attendance model.
- Build the admin attendance list (per event, per confirmed participant).
- Allow admins to mark Present or Absent.
- Prevent duplicate attendance records.
- Build the student's attendance history (drives the Attended tab on the profile).
- Calculate the attended-event count from Present records.

### Completion Check
- Only admins can mark attendance.
- Attendance is linked to the correct event and registration.
- Students can see their own attendance history.
- The attended-event count is calculated from saved attendance records.
- Students cannot edit attendance themselves.

---

## Phase 7 — Feedback and Ratings ⬜ NOT STARTED

### Goal
Allow verified attendees to share feedback.

### Tasks
- Create the Feedback model.
- Build a feedback form with a 1–5 star rating and written comment.
- Check that the student attended the event (attendance = Present).
- Prevent duplicate feedback for the same event.
- Build the admin feedback page.
- Calculate average ratings and rating counts.
- Display feedback on the public event detail page where appropriate.

### Completion Check
- Students marked Present can submit feedback.
- Other students cannot submit feedback.
- A student cannot submit feedback twice for the same event.
- Admins can view comments and ratings.
- Average ratings and rating counts are correct.

---

## Phase 8 — Mobile Responsive Design 🔄 IN PROGRESS

### Goal
Make the application fully usable on mobile screens (390px × 844px — iPhone 14 Pro size).

### Design decisions
- Desktop layout is NOT changed. Mobile styles are added via `@media (max-width: 430px)` only.
- Landing page: floating frosted-glass navbar collapses to a hamburger menu that opens a full-height slide-in drawer.
- Portal: sidebar is hidden on mobile. A fixed bottom tab bar replaces it with five icon+label tabs.
- Explore tab: the left filter sidebar is hidden on mobile; a horizontal scrollable chip row appears above the event grid.
- Modals (register, auth, delete, etc.): become bottom sheets that slide up from the bottom of the screen.

### Files modified
| File | What changed |
|---|---|
| `client/src/components/Navbar.jsx` | Hamburger button, mobile drawer JSX, body-scroll lock |
| `client/src/components/Navbar.css` | Hamburger styles, slide-in drawer, mobile nav links |
| `client/src/pages/Dashboard.jsx` | Bottom tab bar JSX, mobile explore chip row |
| `client/src/pages/Dashboard.css` | Full `@media (max-width: 430px)` block: layout, tabs, cards, modals |
| `client/src/pages/Home.css` | Full `@media (max-width: 430px)` block: hero, search, sections, footer |
| `client/src/pages/EventDetail.css` | Full `@media (max-width: 430px)` block: single-col, sticky un-stick, tabs scroll |
| `client/src/pages/Events.css` | Full `@media (max-width: 430px)` block: 1-col grid, scrollable pills |
| `client/src/components/EventCard.css` | Compact touch CTA |
| `client/src/components/AuthModal.css` | Bottom sheet slide-up |
| `client/src/pages/EventForm.css` | Single-col form rows, bottom sheet edit modal |
| `client/src/pages/AdminEventsPage.css` | 2×2 stats grid, table horizontal scroll |
| `client/src/pages/AdminUsersPage.css` | Table scroll, hide extra columns |

### Completion Check
- Landing page hamburger menu opens/closes cleanly.
- Portal bottom tab bar navigates between sections.
- All major pages render correctly at 390px without horizontal scroll.
- Modals become bottom sheets.
- Text, buttons, and inputs are comfortably touch-sized.

---

## Phase 9 — Final Testing and Polish ⬜ NOT STARTED

### Goal
Make the application consistent, understandable, and reliable.

### Tasks
- Review the application against `design.md`.
- Check navigation and page consistency on desktop and mobile.
- Check loading and empty states.
- Check form validation and error messages.
- Test protected routes and backend permissions.
- Test event deadlines and capacity limits.
- Test registration status changes.
- Test attendance and feedback restrictions.
- Fix bugs found during testing.
- Remove unused packages and temporary code.
- Update `memory.md`.

### Completion Check
- Main user journeys work from beginning to end.
- Errors are handled clearly.
- No major feature relies only on frontend security.
- Students cannot access another student's private information.
- No known critical errors remain in the tested flows.
- Project documentation matches the implementation.

---

## Optional Improvements (Post-Phase 9)

Only consider these after the core project works:

- Better sorting and pagination on the events listing page.
- More detailed event filters (price, format, etc.).
- Improved admin dashboard summaries and charts.
- Automated tests for important API routes.
- Search icon button in mobile portal topbar that expands a full-width search bar.
- Admin explore tab mobile filter chips (currently only student explore has them).
- FormBuilder.jsx / FormBuilder.css mobile styles review.

Do not automatically add payments, QR scanning, chat, AI features, or external integrations.

---

## Working Rule

At the start of each work session:
1. Read `memory.md`.
2. Identify the current phase.
3. Choose one small task.
4. Explain which files will be changed.
5. Implement and test the task.
6. Update `memory.md` after meaningful progress.

If a phase is only partly finished, continue it instead of moving forward just to reach the next phase.
