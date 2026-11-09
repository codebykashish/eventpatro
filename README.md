# Eventpatro

A campus event management platform for Sunway College Kathmandu. Students can browse, register, and track events. Admins can create and manage events, review applications, and mark attendance.

---

## What it does

Eventpatro lets the college publish workshops, seminars, competitions, and other events in one place. Students sign up with their college email, browse upcoming events, and register or apply. Admins manage the full lifecycle — from creating an event to selecting applicants and recording attendance. After attending, students can leave feedback.

---

## Features

| Students | Admins |
|---|---|
| Browse and search events | Create, edit, and delete events |
| Filter by category and timeline | Set registration type (open or application-based) |
| Register or apply for events | Build custom application forms |
| Cancel registrations | Review and select/reject applicants |
| View registration code (EP-XXXXXX) | Mark attendance for registered students |
| Track registered and attended events | View and manage all users |
| Submit feedback after attending | View all registrations per event |
| Update profile and profile picture | Delete user accounts |
| Email OTP verification on signup | — |

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend framework | React 19 | UI rendering |
| Build tool | Vite | Local development and asset bundling |
| Routing | React Router v7 | Client-side navigation |
| Styling | Plain CSS | Component and page styles |
| Icons | Lucide React | UI icons |
| HTTP client | Fetch API | Browser-native API communication |
| Backend | Node.js with Express | REST API server |
| Authentication | JWT | Token-based session handling |
| Password hashing | bcryptjs | Secure password hashing |
| Input validation | Zod | Server-side request schema validation |
| Email | Nodemailer | OTP delivery via Gmail SMTP |
| Image storage | Cloudinary | Profile pictures and event cover images |
| Security | Helmet, CORS, express-rate-limit | HTTP protection and rate limiting |
| Database | MongoDB Atlas with Mongoose | Cloud document database and schema modeling |
| Unique codes | crypto / uuid | Registration code generation |
| Environment | dotenv | Configuration and secret management |

---

## Architecture

The project is split into two independent apps — `client` and `server` — that communicate over a REST API.

- The client is a React SPA served by Vite. It stores the JWT in localStorage and sends it as a Bearer token on every authenticated request.
- The server is an Express app. It validates requests with Zod, checks the JWT via middleware, and enforces role-based access (student vs admin) before hitting any controller.
- MongoDB stores all data. Mongoose models define the schema and handle relationships via ObjectId references.

```
Browser  <──fetch──>  Express REST API  <──mongoose──>  MongoDB Atlas
   |                        |
React SPA             JWT middleware
(client/)             Role checks
                      (server/)
```

---

## Folder Structure

```
mern_project/
├── client/
│   └── src/
│       ├── App.jsx               # Route definitions
│       ├── main.jsx              # Entry point
│       ├── index.css             # Global styles
│       ├── context/
│       │   └── AuthContext.jsx   # Auth state (user, token, login, logout)
│       ├── components/
│       │   ├── AuthModal.jsx     # Login/signup/OTP overlay
│       │   ├── CampusIllustration.jsx
│       │   ├── EventCard.jsx     # Reusable event card
│       │   ├── FormBuilder.jsx   # Custom application form builder
│       │   ├── Navbar.jsx        # Top nav + hamburger menu
│       │   └── ProtectedRoute.jsx
│       └── pages/
│           ├── Home.jsx          # Landing page
│           ├── Login.jsx
│           ├── Signup.jsx
│           ├── VerifyOtp.jsx
│           ├── Events.jsx        # Public event listing
│           ├── EventDetail.jsx   # Event detail + registration
│           ├── Dashboard.jsx     # Student dashboard (tabs)
│           ├── CreateEvent.jsx   # Admin: new event form
│           ├── EditEvent.jsx     # Admin: edit event form
│           ├── AdminEventsPage.jsx
│           └── AdminUsersPage.jsx
└── server/
    └── src/
        ├── app.js                # Express app setup (middleware, routes)
        ├── server.js             # HTTP server entry point
        ├── config/
        │   └── db.js             # MongoDB connection
        ├── controllers/
        │   ├── auth.controller.js
        │   ├── event.controller.js
        │   └── registration.controller.js
        ├── middleware/
        │   ├── auth.js           # JWT protect + restrictTo
        │   └── validate.js       # Zod validation wrapper
        ├── models/
        │   ├── User.js
        │   ├── Event.js
        │   └── Registration.js
        ├── routes/
        │   ├── auth.routes.js
        │   ├── event.routes.js
        │   ├── registration.routes.js
        │   └── upload.routes.js
        ├── scripts/
        │   ├── seedAdmin.js      # Create initial admin account
        │   └── seedEvents.js     # Seed sample events
        ├── utils/
        │   ├── AppError.js       # Custom error class
        │   ├── generateToken.js  # JWT signing
        │   └── sendEmail.js      # Nodemailer wrapper
        └── validations/
            ├── auth.validation.js
            └── event.validation.js
```

---

## Database Schema

### User

| Field | Type | Notes |
|---|---|---|
| firstName, lastName | String | required |
| email | String | unique, must be @sunway.edu.np |
| studentId | String | unique (sparse), students only |
| password | String | bcrypt hashed, excluded from queries |
| role | String | `student` or `admin` |
| profilePicture | String | URL |
| isVerified | Boolean | set true after OTP confirmation |
| verificationOtp | String | 6-digit OTP (hashed) |
| verificationOtpExpires | Date | OTP expiry |

### Event

| Field | Type | Notes |
|---|---|---|
| title | String | required |
| description | String | — |
| category | String | academic, cultural, sports, workshop, seminar, social, club, other |
| date | Date | event date/time |
| location | String | — |
| capacity | Number | max registrations |
| registrationDeadline | Date | — |
| registrationType | String | `open` (instant confirm) or `application` (pending → review) |
| formFields | Array | custom form questions (label, type, options, required) |
| coverImage | String | URL |
| isPublished | Boolean | controls visibility |
| createdBy | ObjectId | ref User (admin) |
| spotsLeft | Virtual | capacity minus confirmed registrations |

### Registration

| Field | Type | Notes |
|---|---|---|
| event | ObjectId | ref Event |
| student | ObjectId | ref User |
| status | String | confirmed, pending, selected, attended, rejected, cancelled |
| attendance | String | present, absent, or null |
| answers | Array | form answers (fieldId, label snapshot, value) |
| registrationCode | String | EP-XXXXXX, auto-generated on save |

---

## API Routes

### Auth

| Method | Route | Description | Auth |
|---|---|---|---|
| POST | /api/auth/signup | Register a new student account | — |
| POST | /api/auth/verify-otp | Verify email with OTP code | — |
| POST | /api/auth/resend-otp | Resend OTP to email | — |
| POST | /api/auth/login | Login and receive JWT | — |
| GET | /api/auth/me | Get current user profile | Student / Admin |
| PUT | /api/auth/profile | Update profile / profile picture URL | Student / Admin |
| GET | /api/auth/users | List all users | Admin |
| DELETE | /api/auth/users/:id | Delete a user | Admin |

### Events

| Method | Route | Description | Auth |
|---|---|---|---|
| GET | /api/events | List all published events (with filters) | — |
| GET | /api/events/:id | Get single event details | — |
| POST | /api/events | Create a new event | Admin |
| PUT | /api/events/:id | Update an event | Admin |
| DELETE | /api/events/:id | Delete an event | Admin |

### Registrations

| Method | Route | Description | Auth |
|---|---|---|---|
| POST | /api/events/:id/registrations | Register or apply for an event | Student |
| DELETE | /api/events/:id/registrations | Cancel own registration | Student |
| GET | /api/events/:id/registrations | List all registrations for an event | Admin |
| PATCH | /api/events/:id/registrations/:regId | Update status or attendance | Admin |
| GET | /api/registrations/me | Get own registration history | Student |
| GET | /api/registrations/me/:eventId | Check registration for one event | Student |
| GET | /api/registrations/all | List all registrations | Admin |
| GET | /api/registrations/user/:userId | Registrations for a specific user | Admin |

### Uploads

| Method | Route | Description | Auth |
|---|---|---|---|
| POST | /api/upload | Upload an image (profile or cover) | Student / Admin |

---

## Setup and Run

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas URI)
- Gmail account with App Password (optional, for email OTP)
- Cloudinary account (optional, for image uploads)

### 1. Clone the repository

```bash
git clone <repo-url>
cd mern_project
```

### 2. Configure environment variables

```bash
cp server/.env.example server/.env
```

Edit `server/.env` with your values (see Environment Variables below).

### 3. Install dependencies

```bash
# Server
cd server && npm install

# Client
cd ../client && npm install
```

### 4. Seed the database

```bash
# From the server directory
node src/scripts/seedAdmin.js    # creates the admin account
node src/scripts/seedEvents.js   # loads sample events (optional)
```

### 5. Start the servers

```bash
# Terminal 1 — API server (runs on port 5000)
cd server && npm run dev

# Terminal 2 — React client (runs on port 5173)
cd client && npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Environment Variables

All variables go in `server/.env`. Copy from `server/.env.example`.

| Variable | Required | Description |
|---|---|---|
| PORT | No | Server port (default: 5000) |
| MONGODB_URI | Yes | MongoDB connection string |
| JWT_SECRET | Yes | Secret key for signing JWTs |
| JWT_EXPIRES_IN | No | Token expiry (default: 7d) |
| CLIENT_URL | Yes | Frontend origin for CORS (e.g. http://localhost:5173) |
| NODE_ENV | No | development or production |
| SMTP_HOST | No | SMTP server (default: smtp.gmail.com) |
| SMTP_PORT | No | SMTP port (default: 587) |
| SMTP_USER | No | Gmail address for sending OTPs |
| SMTP_PASS | No | Gmail App Password |
| EMAIL_FROM_NAME | No | Sender display name |
| CLOUDINARY_CLOUD_NAME | No | Cloudinary cloud name |
| CLOUDINARY_API_KEY | No | Cloudinary API key |
| CLOUDINARY_API_SECRET | No | Cloudinary API secret |

If SMTP is not configured, OTP codes are printed to the terminal instead of emailed. If Cloudinary is not configured, images are saved to the local `server/uploads/` directory.
