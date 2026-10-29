# CampusPulse — Development Phases

## How to Use This Plan

Build the project one phase at a time.

Do not begin the next major phase until the current phase works and has been tested. Small fixes and necessary improvements to earlier features are allowed.

The AI must check this document and `memory.md` before deciding what to work on next.

## Phase 0 — Project Setup

### Goal
Prepare the frontend, backend, and database connection.

### Tasks
- Create the main `campuspulse` folder.
- Create the `client` React application.
- Create the `server` Node.js and Express application.
- Install only the required starting dependencies.
- Set up environment variables.
- Connect the backend to MongoDB.
- Add a basic health-check API route.
- Set up the global error-handling structure.
- Confirm that the frontend and backend can run.

### Completion Check
- Frontend opens successfully.
- Backend starts without errors.
- MongoDB connection works.
- The frontend can make a test request to the backend.
- Secret values are stored in `.env`, not committed to Git.

## Phase 1 — Signup, Login, and Roles

### Goal
Allow students to create accounts and log in securely.

### Tasks
- Create the User model.
- Create signup and login API routes.
- Validate first name, last name, student ID, email, password, and confirm password.
- Check for duplicate student IDs and emails.
- Hash passwords.
- Add JWT authentication.
- Add authentication middleware.
- Add student and admin roles.
- Build signup and login pages.
- Add logout functionality.
- Create protected frontend routes.
- Set up a secure process for creating the first admin.

### Completion Check
- A student can sign up and log in.
- Duplicate student IDs and emails are rejected.
- Invalid credentials show a helpful message.
- Passwords are not stored as plain text.
- Logged-out users cannot access protected APIs.
- Students cannot perform admin actions.
- Users cannot make themselves admins by editing a signup request.

## Phase 2 — Public Event Discovery and Event CRUD

### Goal
Allow visitors to browse events and admins to manage them.

### Tasks
- Create the Event model.
- Build the public event listing page.
- Build event detail pages.
- Add search and category filtering.
- Add relevant date filters if they remain simple.
- Build the admin event list.
- Build the create-event form.
- Build event editing and deletion.
- Add event dates, venue, category, deadline, capacity, and registration type.
- Validate event data on the backend.
- Add loading, empty, error, and success states.

### Completion Check
- Public visitors can view events without logging in.
- Admins can create, edit, view, and delete events.
- Students and public visitors cannot change events.
- Search and filters work.
- Invalid event information is rejected.
- Events display correct dates and details.

## Phase 3 — Registration Forms and Student Registration

### Goal
Allow students to register for or apply to events.

### Tasks
- Create the Registration model.
- Implement the simple registration form builder.
- Support short answer, paragraph, and multiple-choice questions.
- Support required and optional questions.
- Display the correct form on the event page.
- Save submitted answers in MongoDB.
- Preserve the submitted question labels and types.
- Generate a unique registration code.
- Prevent duplicate active registrations.
- Check deadlines and event capacity.
- Implement open registration.
- Implement application-based registration.
- Add a cancel-registration action where permitted.

### Completion Check
- Open registration can become Confirmed when allowed.
- Application-based registration starts as Pending.
- Required questions are validated.
- Submitted answers are saved correctly.
- Students cannot register after the deadline.
- Full events cannot exceed their capacity.
- Students cannot register twice for the same event while an active registration exists.
- Registration codes are unique.

## Phase 4 — Admin Application Review

### Goal
Allow admins to review applications and make decisions.

### Tasks
- Build the event participant and application list.
- Display student details needed for review.
- Display the answers submitted by each applicant.
- Add a Select action.
- Add a Reject action.
- Save the admin's decision.
- Display updated statuses to students.
- Restrict decision-making to admins.

### Completion Check
- Admins can read application answers.
- Admins can select or reject applicants.
- Application statuses update correctly.
- Students can see their own status.
- Students cannot change their own status.
- Open registrations do not require an unnecessary selection process.

## Phase 5 — Student Dashboard and Profile

### Goal
Give students one place to view their activity.

### Tasks
- Build the student dashboard.
- Show upcoming registrations.
- Show past events.
- Show registration and application statuses.
- Build the My Registrations page.
- Display each registration's unique code.
- Build the profile page.
- Display first name, last name, student ID, and email.
- Allow students to update permitted profile information.
- Add profile-picture upload.
- Validate profile-picture type and size.
- Show clear upload errors and success messages.

### Completion Check
- Students see only their own private information.
- Dashboard information comes from the backend.
- Registration codes match the saved registrations.
- Profile changes are saved correctly.
- Invalid profile-picture uploads are rejected.
- Students cannot change their role or student ID through profile editing.

## Phase 6 — Attendance Management

### Goal
Allow admins to record attendance and students to view their attendance history.

### Tasks
- Create the Attendance model.
- Build the admin attendance list.
- Display eligible event participants.
- Allow admins to mark Present or Absent.
- Prevent duplicate attendance records.
- Build the student's attendance history.
- Calculate the attended-event count from Present records.

### Completion Check
- Only admins can mark attendance.
- Attendance is linked to the correct event and registration.
- Students can see their own attendance history.
- The attended-event count is calculated from saved attendance records.
- Students cannot edit attendance themselves.

## Phase 7 — Feedback and Ratings

### Goal
Allow verified attendees to share feedback.

### Tasks
- Create the Feedback model.
- Build a feedback form with a 1–5 star rating and written comment.
- Check that the student attended the event.
- Prevent duplicate feedback for the same event.
- Build the admin feedback page.
- Calculate average ratings and rating counts.
- Optionally display permitted feedback on the public event page.

### Completion Check
- Students marked Present can submit feedback.
- Other students cannot submit feedback.
- A student cannot submit feedback twice for the same event.
- Admins can view comments and ratings.
- Average ratings and rating counts are correct.

## Phase 8 — Design, Error Handling, and Final Testing

### Goal
Make the application consistent, understandable, and reliable.

### Tasks
- Review the application against `design.md`.
- Make layouts work on desktop and mobile.
- Check navigation and page consistency.
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

## Phase 9 — Optional Improvements

Only consider these after the core project works:

- Better sorting and pagination.
- More detailed event filters.
- Improved admin summaries.
- Automated tests for important API routes.
- A more polished mobile layout.

Do not automatically add payments, QR scanning, chat, AI features, or external integrations.

## Working Rule

At the start of each work session:
1. Read `memory.md`.
2. Identify the current phase.
3. Choose one small task.
4. Explain which files will be changed.
5. Implement and test the task.
6. Update `memory.md` after meaningful progress.

If a phase is only partly finished, continue it instead of moving forward just to reach the next phase.