# CampusPulse — Architecture and Tech Stack

## 1. Architecture Overview

CampusPulse uses the MERN stack.

- **MongoDB:** Stores users, events, registrations, attendance, and feedback.
- **Express:** Handles API routes and backend logic.
- **React:** Displays the pages and user interface.
- **Node.js:** Runs the backend server.

The frontend must not connect directly to MongoDB. It must communicate with the backend through API requests.

## 2. Architecture Diagram

```text
                       USERS
                         |
          +--------------+--------------+
          |              |              |
       Public          Student         Admin
          |              |              |
          +--------------+--------------+
                         |
                  REACT FRONTEND
          Pages, Forms, Dashboard, UI
                         |
                  REST API REQUESTS
                         |
                 NODE.JS + EXPRESS
                         |
          +--------------+--------------+
          |              |              |
     Authentication   Validation    Business Rules
          |              |              |
          +--------------+--------------+
                         |
                    MONGOOSE
                         |
                     MONGODB
                         |
          +--------------+--------------+
          |              |              |
        Users          Events      Registrations
                                        |
                                +-------+-------+
                                |               |
                            Attendance        Feedback
```

## 3. Request Flow

For example, when a student registers for an event:

1. The student opens an event in React.
2. React sends a request to the Express backend.
3. The backend checks the student's login.
4. The backend validates the event and the submitted answers.
5. The backend checks the event's registration type, deadline, capacity, and existing registration.
6. Mongoose saves the registration in MongoDB.
7. The backend returns a success or error response.
8. React displays the updated registration status.

The backend must make the final decision. Do not rely only on frontend checks.

## 4. Suggested Tech Stack

### Frontend

- React — build the user interface.
- React Router — navigate between pages.
- CSS Modules or regular CSS — style the application.
- Native `fetch` — send API requests to the backend.
- React Context only if shared login information needs to be available across many components.

Keep the frontend library list small. Do not add a state-management library unless a real need appears.

### Backend

- Node.js — run JavaScript on the server.
- Express — create API routes.
- Mongoose — work with MongoDB.
- `bcryptjs` or `bcrypt` — hash passwords.
- `jsonwebtoken` — create and verify JWTs.
- `multer` — handle profile-picture uploads.
- `zod` — validate request data.
- `helmet` — add common security-related HTTP headers.
- `cors` — configure which frontend origin can call the backend.
- `express-rate-limit` — limit repeated requests to sensitive endpoints, especially login.

Choose one library for each purpose. Do not install several libraries that do the same job.

### Database

Use MongoDB with Mongoose schemas.

Main collections:

1. `User`
2. `Event`
3. `Registration`
4. `Attendance`
5. `Feedback`

Do not create extra collections unless a clear requirement needs them.

## 5. Database Design

### User

Suggested fields:

- `firstName`
- `lastName`
- `studentId`
- `email`
- `passwordHash`
- `role` — `student` or `admin`
- `profilePicture`
- `createdAt`
- `updatedAt`

Student ID and email must have database-level unique indexes. Handle duplicate-key errors properly.

### Event

Suggested fields:

- `title`
- `description`
- `category`
- `startDate`
- `endDate`
- `venue`
- `registrationDeadline`
- `capacity`
- `registrationType` — `open` or `application`
- `formQuestions`
- `createdBy`
- `createdAt`
- `updatedAt`

Do not add an event image field.

Each form question should have a stable ID, label, type, required setting, and answer options when the type is multiple choice.

### Registration

Suggested fields:

- `student`
- `event`
- `status`
- `registrationCode`
- `answers`
- `submittedQuestions`
- `registeredAt`
- `updatedAt`

Use these status values:

- `Confirmed` — open registration accepted.
- `Pending` — application waiting for admin review.
- `Selected` — application accepted.
- `Rejected` — application not accepted.
- `Cancelled` — registration cancelled when allowed.

The registration code must be unique. A student must not have multiple active registrations for the same event.

`submittedQuestions` should preserve the labels and types of questions at the time of submission, so later edits do not change how existing answers are understood.

### Attendance

Suggested fields:

- `registration`
- `event`
- `student`
- `status` — `present` or `absent`
- `markedBy`
- `markedAt`

Use a unique constraint for the registration so that attendance cannot be recorded twice for the same registration.

### Feedback

Suggested fields:

- `event`
- `student`
- `rating`
- `comment`
- `createdAt`
- `updatedAt`

Only a student with a Present attendance record may submit feedback. Enforce one feedback record per student per event.

## 6. Folder and File Structure

Use this as the starting structure. Create folders as you need them rather than creating every file at once.

```text
campuspulse/
|
|-- requirement.md
|-- architecture.md
|-- rules.md
|-- phases.md
|-- design.md
|-- memory.md
|
|-- client/
|   |-- package.json
|   |-- public/
|   |
|   |-- src/
|       |-- main.jsx
|       |-- App.jsx
|       |
|       |-- assets/
|       |
|       |-- components/
|       |   |-- Navbar.jsx
|       |   |-- Footer.jsx
|       |   |-- EventCard.jsx
|       |   |-- FormField.jsx
|       |   |-- StatusBadge.jsx
|       |   |-- LoadingState.jsx
|       |   |-- ErrorMessage.jsx
|       |
|       |-- pages/
|       |   |-- public/
|       |   |   |-- Home.jsx
|       |   |   |-- EventDetails.jsx
|       |   |
|       |   |-- auth/
|       |   |   |-- Signup.jsx
|       |   |   |-- Login.jsx
|       |   |
|       |   |-- student/
|       |   |   |-- StudentDashboard.jsx
|       |   |   |-- MyRegistrations.jsx
|       |   |   |-- RegistrationDetails.jsx
|       |   |   |-- AttendanceHistory.jsx
|       |   |   |-- Profile.jsx
|       |   |   |-- FeedbackForm.jsx
|       |   |
|       |   |-- admin/
|       |       |-- AdminDashboard.jsx
|       |       |-- EventManagement.jsx
|       |       |-- EventForm.jsx
|       |       |-- FormBuilder.jsx
|       |       |-- ApplicationReview.jsx
|       |       |-- AttendanceManagement.jsx
|       |       |-- FeedbackManagement.jsx
|       |       |-- UserManagement.jsx
|       |
|       |-- context/
|       |   |-- AuthContext.jsx
|       |
|       |-- services/
|       |   |-- api.js
|       |   |-- authService.js
|       |   |-- eventService.js
|       |   |-- registrationService.js
|       |   |-- attendanceService.js
|       |   |-- feedbackService.js
|       |
|       |-- hooks/
|       |
|       |-- styles/
|           |-- global.css
|           |-- variables.css
|
|-- server/
    |-- package.json
    |-- .env
    |-- .env.example
    |-- src/
        |-- server.js
        |-- app.js
        |
        |-- config/
        |   |-- db.js
        |
        |-- models/
        |   |-- User.js
        |   |-- Event.js
        |   |-- Registration.js
        |   |-- Attendance.js
        |   |-- Feedback.js
        |
        |-- routes/
        |   |-- authRoutes.js
        |   |-- eventRoutes.js
        |   |-- registrationRoutes.js
        |   |-- attendanceRoutes.js
        |   |-- feedbackRoutes.js
        |   |-- userRoutes.js
        |
        |-- controllers/
        |   |-- authController.js
        |   |-- eventController.js
        |   |-- registrationController.js
        |   |-- attendanceController.js
        |   |-- feedbackController.js
        |   |-- userController.js
        |
        |-- middleware/
        |   |-- authMiddleware.js
        |   |-- roleMiddleware.js
        |   |-- errorMiddleware.js
        |
        |-- validators/
        |   |-- authValidators.js
        |   |-- eventValidators.js
        |   |-- registrationValidators.js
        |
        |-- services/
        |
        |-- utils/
            |-- AppError.js
            |-- asyncHandler.js
```

Some files can be added, removed, or renamed when there is a clear reason. Keep the overall separation between frontend, backend, database models, routes, and business logic.

## 7. What Each Backend Part Does

- **Routes:** Decide which controller handles each API URL.
- **Controllers:** Read request data, call the required logic, and send responses.
- **Models:** Define how data is stored in MongoDB.
- **Middleware:** Check login, roles, and errors.
- **Validators:** Check whether submitted data is valid.
- **Services:** Hold business logic that is useful in more than one place.
- **Utils:** Hold small reusable helpers.

Do not put the entire backend in one file. Also, do not create layers that do nothing except pass data to another layer without a reason.

## 8. API Route Plan

All routes use the `/api` prefix.

### Authentication
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Events
- `GET /api/events`
- `GET /api/events/:id`
- `POST /api/events` — admin.
- `PATCH /api/events/:id` — admin.
- `DELETE /api/events/:id` — admin.

### Registrations
- `POST /api/events/:id/registrations`
- `GET /api/registrations/my`
- `GET /api/registrations/:id`
- `PATCH /api/registrations/:id/cancel`
- `GET /api/events/:id/registrations` — admin.
- `PATCH /api/registrations/:id/decision` — admin.

### Attendance
- `GET /api/events/:id/attendance` — admin.
- `PUT /api/registrations/:id/attendance` — admin.
- `GET /api/attendance/my`

### Feedback
- `POST /api/events/:id/feedback`
- `GET /api/events/:id/feedback` — admin or permitted public display.
- `GET /api/feedback/my`
- `GET /api/admin/feedback` — admin.

### Users and Profile
- `GET /api/users/me`
- `PATCH /api/users/me`
- `POST /api/users/me/profile-picture`
- Admin-only user-management routes can be added when needed.

This is a planned route list, not a requirement to build all routes immediately. Define request and response formats consistently as you implement them.

## 9. Important Backend Rules

- Public users can only access public event information.
- Students can only access their own private registration, attendance, and profile information.
- Admins can manage events and review registrations.
- Never trust a role sent by the frontend.
- Never trust the student ID in a request to decide who the logged-in user is.
- Check event capacity and registration status on the backend.
- Prevent duplicate active registrations.
- Check authorization before changing attendance or application decisions.
- Validate uploaded profile pictures and restrict their size.
- Never store passwords as plain text.
- Never expose secrets in frontend code.

## 10. Registration and Capacity Safety

If an event has limited seats, the backend must check capacity before confirming a registration.

Do not rely only on the number of seats shown in React. Two students may attempt to register at the same time.

Use an appropriate database-safe approach for capacity checks and avoid confirming more students than the available capacity. If a safe implementation is not yet understood, ask for help before building the registration logic.

## 11. Environment Variables

Keep secret settings in `server/.env`, for example:

- `PORT`
- `MONGODB_URI`
- `JWT_SECRET`
- `CLIENT_URL`
- `NODE_ENV`

Provide matching placeholder names in `.env.example`, but never put real passwords, database credentials, or JWT secrets in that file.

Do not commit `.env` to Git.

## 12. Scope Limit

Do not introduce microservices, Docker, Redis, GraphQL, WebSockets, payment integrations, or complicated cloud architecture unless a clear project requirement is added later. A single Express backend and MongoDB database are enough for this project.