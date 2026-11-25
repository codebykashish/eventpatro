# Eventpatro — MERN Stack Architecture & Viva Guide

> **Viva & Demo Cheat Sheet**  
> Written in plain, simple English with zero confusing jargon.  
> Read this to understand how your code works, where every file is located, how data flows, and how to answer your teacher's questions.

---

## Table of Contents

1. [What is MERN? (The 1-Minute Explanation)](#1-what-is-mern-the-1-minute-explanation)
2. [Project Initialization & Packages Installed (From Scratch)](#2-project-initialization--packages-installed-from-scratch)
3. [Package Dictionary: What Every Library Does and Why](#3-package-dictionary-what-every-library-does-and-why)
4. [High-Level Architecture (How Everything Connects)](#4-high-level-architecture-how-everything-connects)
5. [Where is What? (Codebase Tour & File Guide)](#5-where-is-what-codebase-tour--file-guide)
6. [Authentication & Security Flow (Signup, OTP, Login, JWT)](#6-authentication--security-flow-signup-otp-login-jwt)
7. [Image Uploads: Cloudinary vs Local Disk (How It Works)](#7-image-uploads-cloudinary-vs-local-disk-how-it-works)
8. [Events, Forms & Registrations (Core Business Logic)](#8-events-forms--registrations-core-business-logic)
9. [Data Validation with Zod (Why and Where)](#9-data-validation-with-zod-why-and-where)
10. [Common Teacher Viva Questions & Exact Answers](#10-common-teacher-viva-questions--exact-answers)

---

## 1. What is MERN? (The 1-Minute Explanation)

MERN is an acronym for four technologies working together to make a full-stack web application:

```
[ M ] MongoDB      -> The Database: Stores users, events, and bookings in JSON-like documents.
[ E ] Express.js   -> The Server Framework: Sets up routing, handles requests, sends responses.
[ R ] React.js     -> The Frontend: The user interface you see and interact with in the browser.
[ N ] Node.js      -> The Runtime: Lets JavaScript run on the server/computer, not just in the browser.
```

- **Frontend (Client):** Lives in the `client/` folder. Built using React + Vite. Runs in the user's browser.
- **Backend (Server):** Lives in the `server/` folder. Built using Node.js + Express. Runs on port `5000`.
- **Bridge between them:** The browser sends HTTP requests (GET, POST, PUT, DELETE) using JavaScript `fetch` / Axios to `/api/...`, and Express replies with JSON data.

---

## 2. Project Initialization & Packages Installed (From Scratch)

If your teacher asks: *"How did you start this project from an empty folder?"* or *"Show me how to create a Vite React app and initialize an Express server"*, here are the exact commands:

### Part A: Initializing the Frontend (`client/`)

```bash
# 1. Create the React + Vite frontend inside a folder called 'client'
npm create vite@latest client -- --template react

# 2. Move into the client folder
cd client

# 3. Install core dependencies
npm install react-router-dom lucide-react

# 4. Install dev dependencies (development tools)
npm install -D vite @vitejs/plugin-react oxlint

# 5. Start the frontend development server
npm run dev
# -> Opens http://localhost:5173
```

### Part B: Initializing the Backend (`server/`)

```bash
# 1. Create and move into the server folder
mkdir server
cd server

# 2. Initialize a Node.js project (creates package.json)
npm init -y

# 3. Install all production packages
npm install express mongoose dotenv cors bcryptjs jsonwebtoken zod multer nodemailer cloudinary helmet express-rate-limit

# 4. Install development tool (Nodemon for auto-reloading on save)
npm install -D nodemon

# 5. Add scripts to package.json:
# "scripts": {
#   "start": "node src/server.js",
#   "dev": "nodemon src/server.js"
# }

# 6. Start the backend development server
npm run dev
# -> Server running on http://localhost:5000
```

---

## 3. Package Dictionary: What Every Library Does and Why

If the teacher points to any package in `package.json` and asks: *"What does this package do in your project?"*, give them these exact 1-sentence answers:

### Backend Packages (`server/package.json`)

| Package Name | What it does in Eventpatro | Why we need it |
|---|---|---|
| **`express`** | The web server framework for Node.js. | Allows us to define URL routes (like `app.get('/api/events')`), middleware, and handle HTTP JSON requests. |
| **`mongoose`** | Object Data Modeling (ODM) library for MongoDB. | Lets us write structured JavaScript schemas/models (`User.js`, `Event.js`) to interact with MongoDB collections easily. |
| **`dotenv`** | Environment variable loader. | Reads the `.env` file and loads sensitive secrets (like `MONGODB_URI`, `JWT_SECRET`, and email passwords) into `process.env`. |
| **`cors`** | Cross-Origin Resource Sharing middleware. | Allows the frontend on port 5173 to request data from the backend on port 5000 during local development without browser security blocks. |
| **`bcryptjs`** | Password hashing library. | Securely hashes passwords with 10 salt rounds before saving to the database so passwords are never stored in plain text. |
| **`jsonwebtoken`** | JSON Web Token (JWT) generator and verifier. | Signs secure digital tokens on user login so the server can authenticate subsequent requests without database session lookups. |
| **`zod`** | TypeScript-first schema validation library. | Validates incoming form request bodies (checking string lengths, email formats, future event dates) before controllers process them. |
| **`multer`** | Multipart/form-data middleware for file uploads. | Handles incoming file uploads (event cover photos, payment QR receipts) in memory so they can be processed or saved. |
| **`nodemailer`** | Email sending utility for Node.js. | Connects to Gmail SMTP to send 6-digit OTP codes to students during signup and password verification. |
| **`cloudinary`** | Cloud-based media storage SDK. | Automatically uploads event cover images to Cloudinary's global media servers when API credentials are provided. |
| **`helmet`** | HTTP security headers middleware. | Sets secure HTTP headers (like hiding `X-Powered-By: Express` and preventing clickjacking) to guard against web vulnerabilities. |
| **`express-rate-limit`** | Rate limiting middleware. | Limits how many requests an IP can make per minute to protect the API and login routes from brute-force spam attacks. |
| **`nodemon`** (devDep) | Development server watcher. | Automatically restarts the Node server whenever we save changes in backend files, speeding up development. |

### Frontend Packages (`client/package.json`)

| Package Name | What it does in Eventpatro | Why we need it |
|---|---|---|
| **`react`** | The core React UI library. | Lets us build reusable, component-based user interfaces with state (`useState`, `useEffect`). |
| **`react-dom`** | React rendering engine for browsers. | Renders React components directly into the browser's Document Object Model (DOM). |
| **`react-router-dom`** | Client-side routing library for React. | Enables multi-page navigation (`/`, `/dashboard`, `/admin`, `/login`) without reloading the browser tab (Single Page Application). |
| **`lucide-react`** | Modern SVG icon library for React. | Provides clean, lightweight icons (Calendar, MapPin, Search, Clock, Eye, AlertCircle) used across the UI. |
| **`vite`** (devDep) | Lightning-fast frontend build tool and dev server. | Provides instant Hot Module Replacement (HMR) during coding and compiles React into optimized static JS/CSS for production. |
| **`@vitejs/plugin-react`** (devDep) | Vite plugin for React. | Enables JSX parsing and Fast Refresh in Vite. |
| **`oxlint`** (devDep) | Ultra-fast JavaScript linter. | Catches code syntax bugs and bad practices across the frontend code. |

---

## 4. High-Level Architecture (How Everything Connects)

```
[ USER BROWSER ] 
       │
       ▼ (User clicks button or submits form)
[ React (client/src/pages/...) ]
       │
       ▼ (Calls API helper function)
[ client/src/utils/api.js ]  ──(Sends HTTP POST /api/events with JSON & JWT Token)──┐
                                                                                    │
                                                                                    ▼
                                                         [ Nginx Reverse Proxy (Port 80) ]
                                                                                    │
                                                                                    ▼ (Forwards to port 5000)
                                                                 [ Express App (server/src/app.js) ]
                                                                                    │
                                                       ┌────────────────────────────┴────────────────────────────┐
                                                       ▼                                                         ▼
                                          [ Middleware (server/src/middleware/auth.js) ]           [ Validation (Zod schemas) ]
                                          - Checks if JWT token is valid                          - Checks if title, date, etc. are valid
                                                       │
                                                       ▼
                                          [ Controller (server/src/controllers/...) ]
                                          - Runs business logic
                                                       │
                                                       ▼
                                          [ Model / Mongoose (server/src/models/...) ]
                                          - Defines MongoDB schema structure
                                                       │
                                                       ▼
                                          [ MongoDB Atlas (Cloud Database) ]
                                          - Saves or reads data
```

---

## 5. Where is What? (Codebase Tour & File Guide)

Whenever your teacher asks: *"Where is the code that does X?"*, here is your cheat sheet:

### Frontend (`client/`)

| File / Folder | What it does |
|---|---|
| [`client/src/App.jsx`](file:///home/kash/year1/training-sem/mern_project/client/src/App.jsx) | The main router. Defines all pages and URL routes (`/`, `/login`, `/dashboard`, `/admin`, etc.) and handles role-based redirects. |
| [`client/src/context/AuthContext.jsx`](file:///home/kash/year1/training-sem/mern_project/client/src/context/AuthContext.jsx) | Global state for the logged-in user. Stores user info, JWT token in `localStorage`, and provides `login()`, `logout()`, `user`, and `isAuthenticated` to all pages. |
| [`client/src/utils/api.js`](file:///home/kash/year1/training-sem/mern_project/client/src/utils/api.js) | Central file for all HTTP requests to the backend. Automatically attaches `Authorization: Bearer <token>` to requests. |
| [`client/src/utils/mediaUrl.js`](file:///home/kash/year1/training-sem/mern_project/client/src/utils/mediaUrl.js) | Helper that resolves image URLs (handles relative `/uploads/` paths and strips local URLs). |
| [`client/src/pages/Home.jsx`](file:///home/kash/year1/training-sem/mern_project/client/src/pages/Home.jsx) | Landing page. Shows upcoming events, quick registration form, and redirects logged-in users to `/dashboard` or `/admin`. |
| [`client/src/pages/Dashboard.jsx`](file:///home/kash/year1/training-sem/mern_project/client/src/pages/Dashboard.jsx) | Unified dashboard for both students and admins (shows registered events, tickets, stats, approval queues). |
| [`client/src/pages/CreateEvent.jsx`](file:///home/kash/year1/training-sem/mern_project/client/src/pages/CreateEvent.jsx) | Admin page to create new events, upload cover photos, payment QR codes, and dynamically build custom questions. |
| [`client/src/pages/EditEvent.jsx`](file:///home/kash/year1/training-sem/mern_project/client/src/pages/EditEvent.jsx) | Admin page to update existing events. |
| [`client/src/pages/Login.jsx`](file:///home/kash/year1/training-sem/mern_project/client/src/pages/Login.jsx) & [`Signup.jsx`](file:///home/kash/year1/training-sem/mern_project/client/src/pages/Signup.jsx) | Authentication screens. |
| [`client/src/pages/VerifyOtp.jsx`](file:///home/kash/year1/training-sem/mern_project/client/src/pages/VerifyOtp.jsx) | OTP input page where users enter the 6-digit code received via email to activate their account. |

### Backend (`server/`)

| File / Folder | What it does |
|---|---|
| [`server/src/server.js`](file:///home/kash/year1/training-sem/mern_project/server/src/server.js) | Server entry point. Loads `.env`, connects to MongoDB via `connectDB()`, and starts listening on port `5000`. |
| [`server/src/app.js`](file:///home/kash/year1/training-sem/mern_project/server/src/app.js) | Configures Express: CORS, JSON parser, static upload folders, attaches routes, and 404/error handling middleware. |
| [`server/src/config/db.js`](file:///home/kash/year1/training-sem/mern_project/server/src/config/db.js) | Mongoose connection helper connecting to `process.env.MONGODB_URI`. |
| [`server/src/models/User.js`](file:///home/kash/year1/training-sem/mern_project/server/src/models/User.js) | User schema: name, email, hashed password, role (`student` or `admin`), `isVerified`, `otp`, `otpExpires`. |
| [`server/src/models/Event.js`](file:///home/kash/year1/training-sem/mern_project/server/src/models/Event.js) | Event schema: title, date, location, category, capacity, coverImage, dynamic form fields, pricing, qrCode. |
| [`server/src/models/Registration.js`](file:///home/kash/year1/training-sem/mern_project/server/src/models/Registration.js) | Stores student event signups, custom form answers, status (`pending`, `confirmed`, `attended`, `cancelled`), and payment screenshot. |
| [`server/src/routes/`](file:///home/kash/year1/training-sem/mern_project/server/src/routes/) | Maps URLs to controllers (`auth.routes.js`, `event.routes.js`, `registration.routes.js`, `upload.routes.js`, `user.routes.js`). |
| [`server/src/controllers/`](file:///home/kash/year1/training-sem/mern_project/server/src/controllers/) | Contains the actual business logic functions (e.g. `registerUser`, `loginUser`, `createEvent`, `registerForEvent`). |
| [`server/src/middleware/auth.js`](file:///home/kash/year1/training-sem/mern_project/server/src/middleware/auth.js) | Protects private routes. Reads `Authorization: Bearer <token>`, verifies JWT, checks user role (`admin` or `student`). |
| [`server/src/utils/sendEmail.js`](file:///home/kash/year1/training-sem/mern_project/server/src/utils/sendEmail.js) | Sends emails using `nodemailer` and Gmail SMTP credentials to deliver the 6-digit OTP. |
| [`server/src/utils/generateToken.js`](file:///home/kash/year1/training-sem/mern_project/server/src/utils/generateToken.js) | Signs a new JWT token using `process.env.JWT_SECRET` with user `id` and `role`. |
| [`server/src/validations/`](file:///home/kash/year1/training-sem/mern_project/server/src/validations/) | Zod validation schemas (`auth.validation.js`, `event.validation.js`) to reject bad requests before touching the database. |

---

## 6. Authentication & Security Flow (Signup, OTP, Login, JWT)

### Step 1: User Signup
1. User enters name, email (`@sunway.edu.np` or standard email), student ID, and password on `Signup.jsx`.
2. Frontend calls `POST /api/auth/register`.
3. In [`auth.controller.js`](file:///home/kash/year1/training-sem/mern_project/server/src/controllers/auth.controller.js):
   - The password is encrypted using **`bcryptjs`** (with 10 salt rounds). We **never** store plain text passwords in the database!
   - A random 6-digit OTP is generated: `Math.floor(100000 + Math.random() * 900000)`.
   - The OTP is saved in the user's document along with an expiration time of 10 minutes (`Date.now() + 10 * 60 * 1000`).
   - `isVerified` is set to `false`.
   - [`sendEmail.js`](file:///home/kash/year1/training-sem/mern_project/server/src/utils/sendEmail.js) triggers `nodemailer` to email the code to the user.

### Step 2: OTP Verification
1. User enters the 6-digit code on `VerifyOtp.jsx`.
2. Frontend calls `POST /api/auth/verify-otp`.
3. Backend checks:
   - Does the user exist?
   - Is `user.otp === enteredOtp`?
   - Is `user.otpExpires > Date.now()`?
4. If valid, backend sets `isVerified = true`, clears the OTP fields, generates a JWT token, and logs the user in!

### Step 3: Login & JWT (JSON Web Token)
1. User enters email and password on `Login.jsx`.
2. Backend finds user by email.
3. Compares entered password with hashed password using `bcrypt.compare()`.
4. Checks if `user.isVerified === true`.
5. If valid, signs a JWT token containing `{ id: user._id, role: user.role }` signed with `process.env.JWT_SECRET`.
6. Frontend receives the token and stores it in browser `localStorage`.
7. For every subsequent request (e.g. creating an event, registering), the frontend attaches the header:  
   `Authorization: Bearer <token>`.
8. Middleware [`server/src/middleware/auth.js`](file:///home/kash/year1/training-sem/mern_project/server/src/middleware/auth.js) intercepts the request, verifies the token with `jwt.verify()`, and attaches `req.user` so controllers know who is making the request.

---

## 7. Image Uploads: Cloudinary vs Local Disk (How It Works)

Our upload system in [`server/src/routes/upload.routes.js`](file:///home/kash/year1/training-sem/mern_project/server/src/routes/upload.routes.js) has an **intelligent dual-mode design**:

```
Upload Request (multipart/form-data)
                 │
                 ▼
     [ Multer Memory Storage ]
                 │
                 ▼
Are Cloudinary API keys present in .env?
        │                     │
       YES                    NO
        │                     │
        ▼                     ▼
[ Upload to Cloudinary ]   [ Fallback: Save to server/uploads/ disk ]
Returns: https://res.      Returns relative URL: /uploads/event-123.jpg
cloudinary.com/...         Nginx proxies /uploads/ to Express static folder
```

- **Why this is smart:** If Cloudinary keys are configured, images are hosted in the cloud. If not, the application automatically falls back to saving files directly in `server/uploads/` on the server disk, so image uploads **never fail**.
- **Nginx rule:** In `infra/nginx.conf`, we use `location ^~ /uploads/` so Nginx forwards all image requests directly to Express without conflicting with static file caching.

---

## 8. Events, Forms & Registrations (Core Business Logic)

### Dynamic Form Builder
Unlike simple apps that only collect name and email, Eventpatro allows admins to build **custom registration forms** per event:
- When creating an event (`CreateEvent.jsx`), the admin can add custom questions: text fields, radio buttons, checkboxes, multiple choice, or file uploads (e.g. ID card photo or payment receipt).
- These fields are saved in MongoDB inside the `Event.formFields` array.
- When a student registers, the form dynamically renders those exact questions, validates answers, and saves them inside the `Registration.customAnswers` array.

### Past Date Validation
- Events cannot be booked in the past!
- **Frontend:** Datetime inputs have a `min={currentDateTime}` attribute so the browser's date picker greys out past dates. Form submit also verifies `eventDate > Date.now()`.
- **Backend:** Zod schema [`server/src/validations/event.validation.js`](file:///home/kash/year1/training-sem/mern_project/server/src/validations/event.validation.js) enforces `(d) => d.getTime() > Date.now()` and checks that `registrationDeadline < eventDate`.

---

## 9. Data Validation with Zod (Why and Where)

Instead of relying solely on Mongoose or letting bad data crash the server, we use **Zod** schema validation middleware:
- Located in `server/src/validations/`.
- Validates the incoming `req.body` **before** the controller runs.
- If a user sends a title shorter than 3 letters or invalid email, Zod immediately returns HTTP `400 Bad Request` with an exact error message.
- Prevents database corruption, injection attacks, and server crashes.

---

## 10. Common Teacher Viva Questions & Exact Answers

### Q1: What is the difference between SQL and NoSQL (MongoDB)?
> **Answer:** "SQL databases (like MySQL/PostgreSQL) are relational and store data in rigid tables with fixed rows and columns. MongoDB is a NoSQL database that stores data in flexible, JSON-like BSON documents. We chose MongoDB because our data structures—like custom event form questions and nested registrations—are dynamic and schema-flexible."

### Q2: What is JWT and how does it work in your app?
> **Answer:** "JWT stands for JSON Web Token. It is a stateless authentication mechanism. When a user logs in, the backend signs a token containing the user's ID and role using a secret key (`JWT_SECRET`). The frontend stores this token in `localStorage` and sends it in the `Authorization: Bearer` header on every request. The server verifies the token's digital signature without needing to look up session data in a database on every call."

### Q3: Why do you hash passwords with bcrypt? Why not store them plainly?
> **Answer:** "Storing passwords in plain text is a severe security vulnerability. If the database is compromised, attackers would see everyone's passwords. With `bcryptjs`, passwords are run through a one-way mathematical hashing algorithm with 10 salt rounds. Even if someone steals the database, the original password cannot be reversed."

### Q4: How does CORS work, and why do we need it?
> **Answer:** "CORS stands for Cross-Origin Resource Sharing. Browsers have a security mechanism that blocks a website hosted on Origin A from requesting data from Origin B. During local development, React is on `localhost:5173` and Express is on `localhost:5000` (two different origins), so we use Express `cors()` middleware. In production, Nginx proxies both `/` and `/api` on the same port (80), meaning there are zero CORS issues."

### Q5: What is Middleware in Express? Give two examples in your code.
> **Answer:** "Middleware is a function that runs in the middle of a request and response cycle. It can inspect, modify, or block requests before they reach the controller. Two examples in our code:  
> 1. `auth.js` (`protect` middleware): Checks if a valid JWT token exists; blocks unauthenticated users with 401.  
> 2. `express.json()`: Parses incoming JSON bodies from requests into `req.body`."

### Q6: What is the role of `localStorage` vs `State` in React?
> **Answer:** "React state (like `useState`) is temporary and held in computer memory; refreshing the browser tab resets state. `localStorage` is persistent key-value storage in the browser that survives page refreshes and browser restarts. We save the JWT token in `localStorage` so users stay logged in when they refresh the page or return later."

### Q7: What are React Hooks, and which ones did you use?
> **Answer:** "Hooks are functions that let React functional components use state and lifecycle features. In Eventpatro, we used:  
> - `useState`: For local form values, loading spinners, and error alerts.  
> - `useEffect`: To fetch event data on page load and handle automatic navigation.  
> - `useContext`: Via `AuthContext` to share user authentication status globally.  
> - `useNavigate` & `useLocation`: From React Router for page navigation."
