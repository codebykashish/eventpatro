# CampusPulse — Development Rules

## 1. Main Rule

Build CampusPulse according to `requirement.md`, `architecture.md`, `phases.md`, and `design.md`.

These documents are the main source of truth for the project.

Do not invent new features or change the planned scope without asking first.

Keep the project suitable for a student learning the MERN stack. The code should be understandable, maintainable, and easy to explain to a teacher.

## 2. Rules for AI-Assisted Coding

When helping with this project, the AI must:

1. Read the relevant project documents before starting a new feature.
2. Follow the current development phase in `phases.md`.
3. Work on one small feature or task at a time.
4. Explain what a change does in simple English.
5. Explain where each new file belongs.
6. Explain which existing files need changes.
7. Avoid rewriting unrelated files.
8. Avoid changing the project's architecture without permission.
9. Avoid adding features that are not in the requirements.
10. Explain any new library before recommending it.
11. Use code that a beginner learning React, Node.js, Express, and MongoDB can understand.
12. Tell the user which commands to run and where to run them.
13. Never claim that code has been tested unless it has actually been tested.
14. Mention any setup steps, environment variables, or database changes needed.
15. Ask before making a major decision that is not covered by the documents.

Do not generate the entire application in one response. Build and test it in small steps.

## 3. Coding Style

- Use clear and meaningful variable and function names.
- Keep functions focused on one main task.
- Avoid unnecessary abstractions and overly clever code.
- Use `async/await` for asynchronous backend operations.
- Use consistent naming across files.
- Keep frontend UI components separate from API communication where practical.
- Keep database models separate from routes and controllers.
- Add comments when logic may be difficult for a beginner to understand.
- Do not add comments that simply repeat obvious code.
- Avoid duplicating the same business rules in many files.
- Do not use fake data as if it came from the real database.
- Remove temporary debugging logs before completing a feature.

Use plain JavaScript unless the project owner explicitly decides to use TypeScript.

## 4. Libraries: What to Use and Avoid

### Approved starting libraries

| Purpose | Library |
|---|---|
| Frontend | React |
| Frontend routing | React Router |
| Backend | Express |
| Database | Mongoose |
| Password hashing | bcrypt or bcryptjs |
| Login tokens | jsonwebtoken |
| Input validation | Zod |
| Profile-picture upload | Multer |
| Security headers | Helmet |
| Cross-origin requests | CORS |
| Request limiting | express-rate-limit |

Use `fetch` for frontend API requests at the beginning. It is built into modern browsers and avoids adding another dependency.

For styling, use CSS or CSS Modules. A styling framework can be considered if the project owner chooses it, but do not install one automatically.

### Optional libraries

Libraries for icons, date formatting, notifications, or form handling may be considered if they solve a real problem.

Before adding one, explain:
- What it does.
- Why the project needs it.
- Whether the same result can be achieved with existing tools.
- Whether it makes the code harder to understand.

### Avoid unless explicitly approved

- Redux or another large state-management library.
- Multiple form libraries at once.
- Multiple validation libraries for the same purpose.
- UI component libraries that force a complete design.
- AI APIs or AI-powered features.
- Payment gateway libraries.
- QR-code scanning libraries.
- Real-time communication tools.
- Complex state-management patterns.
- Unnecessary animation libraries.
- Large packages added for a single small task.

Do not install a package just because it is popular.

## 5. Error Handling Rules

CampusPulse must handle errors properly on both the frontend and backend.

### Backend

- Validate request data before saving it.
- Handle invalid MongoDB IDs.
- Handle missing records.
- Handle duplicate email and student ID errors.
- Handle incorrect login credentials without revealing sensitive information.
- Handle expired or invalid JWTs.
- Handle unauthorized access.
- Handle event capacity and registration conflicts.
- Handle file-upload errors.
- Handle database connection and query errors.
- Use centralized error-handling middleware.
- Return a suitable HTTP status code and a clear, consistent error response.
- Do not send stack traces, database internals, passwords, or secret values to users.

A standard error response can look like this:

```json
{
  "success": false,
  "message": "This event has reached its capacity."
}
```

Validation errors may include a list of field errors when needed. Do not expose technical details that users do not need.

### Frontend

- Show validation messages beside relevant form fields.
- Show a clear message when login or signup fails.
- Show loading indicators while requests are running.
- Show an empty state when no events or registrations are found.
- Show an error message when data cannot be loaded.
- Disable submit buttons while a request is processing to reduce accidental duplicate submissions.
- Show a success message after a successful action.
- Do not display raw backend stack traces to users.
- Do not leave the user looking at a blank page when a request fails.

### Error Message Examples

- "Please enter a valid email address."
- "This student ID is already registered."
- "Your email or password is incorrect."
- "This event is no longer accepting registrations."
- "This event has reached its capacity."
- "You do not have permission to perform this action."
- "We could not load the events. Please try again."

Messages should be helpful without exposing private information.

## 6. Authentication and Security Rules

- Hash passwords using bcrypt or bcryptjs.
- Never store plain-text passwords.
- Never return password hashes from APIs.
- Validate data on the backend even if React already validates it.
- Verify JWTs on protected routes.
- Check the user's role on the backend.
- Students must not access other students' private records by changing an ID in the URL.
- Do not allow signup requests to choose the admin role.
- Create the first admin through a controlled setup process, such as a one-time seed script or a secure manual database operation.
- Never expose `JWT_SECRET` or `MONGODB_URI` in frontend code.
- Configure CORS for the intended frontend origin.
- Add rate limiting to login and other sensitive endpoints.
- Restrict profile-picture file types and sizes.
- Do not trust the file extension alone when validating uploads.
- Do not log passwords, authentication tokens, or other sensitive information.

For a browser-based application, consider secure, HTTP-only cookies for JWT storage. Do not put authentication tokens in local storage without discussing the security trade-offs first. Configure cookie, CORS, and CSRF protections appropriately if cookie-based authentication is used.

## 7. Data and Business Rules

- Student IDs and emails must be unique.
- A student cannot create duplicate active registrations for the same event.
- Open registration and application-based registration must follow different rules.
- Application-based registrations begin as Pending.
- Only admins can select or reject applicants.
- Only admins can mark attendance.
- Only students marked Present can submit feedback.
- A student can submit feedback once per event.
- Students cannot manually change their attendance count.
- Registration codes must be unique.
- The backend must check capacity before confirming a registration.
- Deleted or edited form questions must not make previously submitted answers unreadable.

Do not rely on hidden buttons or frontend page restrictions as security. The backend must enforce all important rules.

## 8. CRUD Rules

For every CRUD feature:

1. Create: validate data before saving.
2. Read: return only the information the current user is allowed to access.
3. Update: validate changes and check permissions.
4. Delete: check permissions and handle related records safely.

Before deleting an event, check whether it has registrations, attendance records, or feedback. Do not silently destroy related information. If safe deletion is complicated, ask before deciding whether to restrict deletion or use a clear alternative.

## 9. Testing Rules

After implementing a feature:

- Test its normal successful use.
- Test missing or invalid input.
- Test what happens when the user is not logged in.
- Test what happens when a student tries an admin action.
- Test empty results and failed requests.
- Check that existing features still work.
- Fix errors before starting a large new feature.

Use simple manual testing first. Add automated tests gradually when the core application is working.

## 10. Rules for Making Changes

Before a significant change, the AI must explain:

- What will change.
- Why the change is needed.
- Which files will be affected.
- Whether the database structure changes.
- Whether a new library is required.
- How the change will be tested.

Do not replace an entire file when a small edit is enough.

If an error occurs, investigate its cause before rewriting working code.

If the project documents conflict, stop and ask which requirement should take priority.

## 11. Memory File Rules

The AI should create and maintain `memory.md` as development progresses.

It must record:
- The current project phase.
- Features completed and tested.
- Features started but not finished.
- The file currently being worked on.
- The next small task.
- Important decisions already made.
- Known errors or unresolved problems.
- Commands or setup steps that are important to remember.

Update `memory.md` after a meaningful milestone or completed work session.

Do not claim a feature is complete just because code was generated. Mark it complete only after the required checks have passed.

Keep the memory file short, factual, and up to date. Do not copy the entire requirements document into it.

If `memory.md` does not exist yet, create it when development begins. Do not invent progress before any code has been written.

## 12. Final Rule

When unsure, ask rather than assume.

The goal is to finish a working, understandable CampusPulse application—not to create the most complicated application possible.