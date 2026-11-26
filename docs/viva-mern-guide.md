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
5. [Frontend Deep-Dive: What is JSX, Components, Pages, Context & Routing?](#5-frontend-deep-dive-what-is-jsx-components-pages-context--routing)
6. [Backend Deep-Dive: Controllers, Models, Routes, Middleware & server.js vs app.js](#6-backend-deep-dive-controllers-models-routes-middleware--serverjs-vs-appjs)
7. [Where is What? (Codebase Tour & File Guide)](#7-where-is-what-codebase-tour--file-guide)
8. [Authentication & Security Flow (Signup, OTP, Login, JWT)](#8-authentication--security-flow-signup-otp-login-jwt)
9. [Image Uploads: Cloudinary vs Local Disk (How It Works)](#9-image-uploads-cloudinary-vs-local-disk-how-it-works)
10. [Events, Forms & Registrations (Core Business Logic)](#10-events-forms--registrations-core-business-logic)
11. [Data Validation with Zod (Why and Where)](#11-data-validation-with-zod-why-and-where)
12. [Common Teacher Viva Questions & Exact Answers](#12-common-teacher-viva-questions--exact-answers)

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

### Local vs Cloud Database (How We Configure It)

In [`server/.env`](file:///home/kash/year1/training-sem/mern_project/server/.env):
- **For Local Development (on your laptop):**
  ```env
  MONGODB_URI=mongodb://127.0.0.1:27017/campuspulse
  ```
  Here we use **Local MongoDB** running as a local service on port `27017`. All collections (`users`, `events`, `registrations`) live right on your machine in the `campuspulse` database.
- **For Cloud Production Deployment (on AWS EC2):**
  ```env
  MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/campuspulse
  ```
  On AWS EC2, the instance connects to **MongoDB Atlas** (a managed 24/7 cloud cluster) so data isn't wiped out when instances stop or restart.

> **Viva Tip:** If the teacher asks *"Where is your database stored?"*, answer:  
> *"When developing and testing locally on my computer, we use local MongoDB on `127.0.0.1:27017`. When deployed on AWS EC2, we point `MONGODB_URI` to a 24/7 cloud MongoDB Atlas cluster so data persists across server reboots."*

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

## 5. Frontend Deep-Dive: What is JSX, Components, Pages, Context & Routing?

This section answers the exact conceptual questions teachers love to ask about React:

### 1. What is `.jsx`? (Why not `.js` or `.html`?)
- **JSX** stands for **JavaScript XML**.
- In standard JavaScript, writing HTML like `<h1>Hello</h1>` causes a syntax error.
- In pure HTML, you cannot use JavaScript variables, functions, or loops directly inside tags.
- **JSX is the best of both worlds:** It allows us to write HTML-like tags directly inside JavaScript!
- Example:
  ```jsx
  const userName = "Kashish";
  return <h1>Welcome, {userName}!</h1>; // JSX allows {variables} right inside HTML tags
  ```
- Under the hood, the build tool (**Vite**) converts this JSX into standard JavaScript functions (`React.createElement(...)`) so any browser can render it.

---

### 2. Why do we have `components/`, `pages/`, and `context/` folders?
React projects are organized by responsibility so code doesn't become one gigantic, unreadable file:

#### A. The `pages/` Folder (Full Views)
- Contains full-screen views that match a specific URL route.
- Each file here represents a complete "page" a user visits:
  - `Home.jsx` $\rightarrow$ the landing page (`/`).
  - `Login.jsx` & `Signup.jsx` $\rightarrow$ authentication pages (`/login`, `/signup`).
  - `Dashboard.jsx` $\rightarrow$ user or admin dashboard (`/dashboard`, `/admin`).
  - `EventDetail.jsx` $\rightarrow$ viewing a single event (`/events/:id`).
  - `CreateEvent.jsx` $\rightarrow$ the form to create a workshop.
- **Rule of thumb:** If a file represents a destination that has its own route in the browser, it belongs in `pages/`.

#### B. The `components/` Folder (Reusable Building Blocks)
- Contains smaller, reusable UI puzzle pieces used across multiple pages.
- Instead of copying and pasting the same 50 lines of HTML across 5 different pages, we write a Component once and import it anywhere:
  - `Navbar.jsx` $\rightarrow$ the top navigation bar with logo, links, and user avatar. Used on every page.
  - `EventCard.jsx` $\rightarrow$ the card showing an event's picture, date, and "View" button. Used on `Home.jsx` and `Dashboard.jsx`.
  - `AuthModal.jsx` $\rightarrow$ the popup modal for logging in or signing up without leaving the current page.
  - `ProtectedRoute.jsx` $\rightarrow$ a security wrapper component that checks if a user is logged in before rendering a private page.
- **Rule of thumb:** If a UI piece is reused or is just a sub-part of a bigger page, it belongs in `components/`.

#### C. The `context/` Folder (Global Application State)
- In standard React, passing data between pages or deeply nested components requires passing props down manually ("prop drilling").
- `context/` creates a **global broadcast channel** accessible by *any* page or component without passing props:
  - `AuthContext.jsx` $\rightarrow$ Holds the logged-in user's data (`user`, `token`, `isAdmin`). Any page (Navbar, Dashboard, EventDetail) can simply call `useAuth()` to know who is logged in and whether to show login or logout buttons.
  - `ToastContext.jsx` $\rightarrow$ Holds the top notification alerts. Any page or button can call `toastSuccess("Event deleted!")` or `toastError(...)` without creating its own popup HTML.

#### D. The `utils/` Folder (Helper Functions)
- Contains pure JavaScript logic with no visual UI:
  - `api.js` $\rightarrow$ The centralized `fetch` helper that adds the backend base URL and attaches the `Authorization: Bearer <token>` header.
  - `mediaUrl.js` $\rightarrow$ Formats image paths whether they come from Cloudinary (`https://...`) or local disk (`/uploads/...`).

---

### 3. Why are some files outside `src/`? (Root Folder Files)
If you look at the `client/` folder, some files sit outside `src/`:
- **`index.html`** $\rightarrow$ The single HTML page loaded by the browser. It contains `<div id="root"></div>`. React takes over this `div` and dynamically inserts all your pages into it!
- **`package.json`** $\rightarrow$ The project manifest. Lists all installed libraries (`react`, `react-router-dom`, `lucide-react`) and scripts (`npm run dev`, `npm run build`).
- **`vite.config.js`** $\rightarrow$ Configuration for Vite. Tells it how to bundle React and what plugins to use.
- **`node_modules/`** $\rightarrow$ Contains the downloaded source code of all packages installed via `npm`. Ignored by Git.

---

### 4. What is `main.jsx` vs `App.jsx`?
- **`client/src/main.jsx` (The Ignition Key):**
  - The very first JavaScript file that runs.
  - Finds `<div id="root">` in `index.html` using `document.getElementById('root')`.
  - Renders `<App />` inside it using `ReactDOM.createRoot()`.
- **`client/src/App.jsx` (The Master Controller / Router):**
  - Defines the global wrappers: `<BrowserRouter>`, `<AuthProvider>`, `<ToastProvider>`.
  - Defines the routing map (`<Routes>` and `<Route>`): which page shows for which URL.

---

### 5. What is `BrowserRouter` & Client-Side Routing? (SPA Explanation)
- In old traditional websites (PHP/HTML), clicking a link like `<a href="/about">` sends a request to the server, the screen goes white for a second, and the whole page reloads.
- Eventpatro is a **Single Page Application (SPA)**:
  - The browser loads `index.html` only **once**.
  - **`BrowserRouter`** listens to URL changes in the address bar (e.g. `/dashboard` $\rightarrow$ `/events/123`).
  - Instead of asking the server for a new HTML file, React instantly swaps the component on screen using JavaScript!
  - **Result:** Instant page transitions with zero screen flickering or reloading.

---

## 6. Backend Deep-Dive: Controllers, Models, Routes, Middleware & server.js vs app.js

Just like the frontend, the backend is organized into standard layers of responsibility (MVC pattern: Model-View-Controller). Here is what each folder does, why it exists, and why files are placed where they are:

### 1. The Request Journey (How Backend Layers Work Together)
Whenever a user does something (e.g. registers for an event), the request flows through 4 distinct layers:
```
[ Incoming HTTP Request: POST /api/events ]
                     │
                     ▼
       1. [ ROUTES (server/src/routes/) ]
          "Traffic cop": Matches the URL and method (`/api/events`), 
          attaches middlewares, and hands off to the controller.
                     │
                     ▼
       2. [ MIDDLEWARE (server/src/middleware/ & validations/) ]
          "Security & validation checkpoint": 
          - Checks if the user sent a valid JWT token (`auth.js`).
          - Checks if user is an Admin (`requireAdmin`).
          - Validates that request data matches Zod rules before touching database.
                     │
                     ▼
       3. [ CONTROLLERS (server/src/controllers/) ]
          "The brain / business logic":
          - Receives request (`req`), does calculations, enforces limits (e.g. check if seats are full).
          - Calls the database through Models.
          - Sends back JSON response (`res.status(200).json(...)`).
                     │
                     ▼
       4. [ MODELS (server/src/models/) ]
          "The database blueprints":
          - Defines Mongoose schemas for MongoDB (data types, defaults, required fields).
          - Executes actual queries (`Event.create()`, `User.findOne()`, etc.).
```

---

### 2. What Does Each Backend Folder Do?

#### A. The `models/` Folder (Blueprints for MongoDB)
- MongoDB is a schema-less database by nature, meaning it will accept any messy data you throw at it.
- **Mongoose models** give MongoDB strict rules and structure:
  - `User.js` $\rightarrow$ defines fields like `name`, `email` (unique, lowercase), `password` (hashed string), `role` (`student` or `admin`), `isVerified`, `otp`.
  - `Event.js` $\rightarrow$ defines `title`, `date`, `capacity`, `registeredUsers`, `pricing`, `coverImage`, dynamic questions.
  - `Registration.js` $\rightarrow$ links a `user` ID to an `event` ID with a `status` (`pending`, `confirmed`, `attended`).
- **Rule of thumb:** If it defines what data looks like in the database, it belongs in `models/`.

#### B. The `routes/` Folder (The URL Dispatchers)
- Clean URL routers created with `express.Router()`.
- They do **not** write database logic or math. They simply connect a URL path to the right controller function:
  - `auth.routes.js` $\rightarrow$ maps `/register`, `/login`, `/verify-otp`.
  - `event.routes.js` $\rightarrow$ maps `GET /`, `POST /`, `PUT /:id`, `DELETE /:id`.
  - `registration.routes.js` $\rightarrow$ maps event registration and approval actions.
  - `upload.routes.js` $\rightarrow$ maps image upload endpoints.
- **Rule of thumb:** If it maps a URL (`/api/...`) to a function, it belongs in `routes/`.

#### C. The `controllers/` Folder (The Business Logic Brains)
- Contains all the actual backend functions that receive `(req, res)`:
  - `auth.controller.js` $\rightarrow$ hashes passwords with bcrypt, checks credentials, generates OTPs and JWT tokens.
  - `event.controller.js` $\rightarrow$ creates events, checks date limits, handles soft-deletes, filters categories.
  - `registration.controller.js` $\rightarrow$ handles student seat booking, prevents double booking, checks event capacity, confirms/rejects applicants.
- **Rule of thumb:** If it makes business decisions, validates business rules, or communicates with the database, it belongs in `controllers/`.

#### D. The `middleware/` Folder (The Gatekeepers)
- Middlewares are functions that run **between** the incoming request and the final controller:
  - `auth.js` (`authenticate`) $\rightarrow$ reads `req.headers.authorization`, extracts the Bearer token, verifies it with `jwt.verify()`, and attaches `req.user = decoded`. If token is missing/fake, it halts with `401 Unauthorized`.
  - `requireAdmin` $\rightarrow$ checks `if (req.user.role !== 'admin') return res.status(403)`.
  - `upload.js` $\rightarrow$ Multer configuration that intercepts `multipart/form-data` file uploads before passing the file info to the controller.
- **Rule of thumb:** If it intercepts requests to inspect, secure, or transform them, it belongs in `middleware/`.

#### E. The `validations/` Folder (Zod Schemas)
- Validates that the body sent by the user contains what we expect:
  - `event.validation.js` $\rightarrow$ ensures event title is at least 3 characters, date is valid, capacity is a positive number.
  - `auth.validation.js` $\rightarrow$ ensures email format is valid and password has minimum required length.

#### F. The `utils/` Folder (Pure Helper Tools)
- Helper tools that don't belong to any single route or controller:
  - `sendEmail.js` $\rightarrow$ Nodemailer email sender helper for sending 6-digit OTPs.
  - `generateToken.js` $\rightarrow$ Signs new JWT tokens with `jwt.sign()`.

#### G. The `config/` Folder (Setup & Connections)
- Holds static configuration helpers:
  - `db.js` $\rightarrow$ connects Mongoose to MongoDB using `process.env.MONGODB_URI`.

---

### 3. What is `server.js` vs `app.js`? (Why Two Entry Files?)
Teachers often ask: *"Why do you have both `server.js` and `app.js` instead of putting everything into one file?"*

- **`server/src/app.js` (The Express Application Configuration):**
  - Configures all middlewares (`cors()`, `express.json()`, `helmet()`, `express-rate-limit`).
  - Serves static folders (`/uploads` for images).
  - Mounts all routes (`app.use('/api/auth', authRoutes)`, etc.).
  - Configures 404 not found handler and global error handler.
  - **Does NOT start listening on a network port.** It just configures the Express app object.
  - *Why separate it?* This allows automated testing tools (like Jest or Supertest) to test the API routes without actually opening a real network port.

- **`server/src/server.js` (The Ignition & Network Listener):**
  - Loads the environment variables from `.env` (`dotenv.config()`).
  - Calls `connectDB()` to connect to MongoDB.
  - Imports `app` from `app.js`.
  - Calls `app.listen(PORT, ...)` to actually start listening for network requests on port `5000`.

---

### 4. What are the Files Outside `src/` in `server/`?
- **`.env`** $\rightarrow$ Secret environment variables (`PORT=5000`, `MONGODB_URI`, `JWT_SECRET`, `EMAIL_USER`, `EMAIL_PASS`). Never committed to Git.
- **`.env.example`** $\rightarrow$ Safe template committed to Git showing team members and teachers what environment variables are needed, with dummy values.
- **`package.json`** $\rightarrow$ Lists all backend dependencies (`express`, `mongoose`, `jsonwebtoken`, `bcryptjs`, `dotenv`, etc.) and start scripts (`npm start`, `npm run dev`).
- **`package-lock.json`** $\rightarrow$ Locks exact dependency versions so it installs identically on Windows, Linux, and AWS EC2.
- **`ecosystem.config.cjs`** $\rightarrow$ PM2 process manager configuration used on AWS EC2 to keep the Node server running 24/7 and auto-restart on crashes or server reboot.
- **`uploads/`** $\rightarrow$ The local folder on disk where Multer saves event cover banners and payment QR codes when not using cloud storage.

---

## 7. Where is What? (Codebase Tour & File Guide)

Whenever your teacher asks: *"Where is the code that does X?"*, here is your cheat sheet:

### Frontend (`client/`)

| File / Folder | What it does |
|---|---|
| [`client/src/App.jsx`](file:///home/kash/year1/training-sem/mern_project/client/src/App.jsx) | The main router. Defines all pages and URL routes (`/`, `/login`, `/dashboard`, `/admin`, etc.) and handles role-based redirects. |
| [`client/src/context/AuthContext.jsx`](file:///home/kash/year1/training-sem/mern_project/client/src/context/AuthContext.jsx) | Global state for the logged-in user. Stores user info, JWT token in `localStorage`, and provides `login()`, `logout()`, `user`, and `isAuthenticated` to all pages. |
| [`client/src/context/ToastContext.jsx`](file:///home/kash/year1/training-sem/mern_project/client/src/context/ToastContext.jsx) | Global toast alert provider. Provides top-of-screen green (positive) and red (negative) feedback for all actions (create, edit, delete, status change). |
| [`client/src/utils/api.js`](file:///home/kash/year1/training-sem/mern_project/client/src/utils/api.js) | Central file for all HTTP requests to the backend. Automatically attaches `Authorization: Bearer <token>` to requests. |
| [`client/src/utils/mediaUrl.js`](file:///home/kash/year1/training-sem/mern_project/client/src/utils/mediaUrl.js) | Helper that resolves image URLs (handles relative `/uploads/` paths and strips local URLs). |
| [`client/src/components/Navbar.jsx`](file:///home/kash/year1/training-sem/mern_project/client/src/components/Navbar.jsx) | Reusable top navigation bar with brand logo, links, and avatar / logout trigger. |
| [`client/src/components/EventCard.jsx`](file:///home/kash/year1/training-sem/mern_project/client/src/components/EventCard.jsx) | Reusable card displaying an event summary (image, dates, seats, registration button). |
| [`client/src/components/ProtectedRoute.jsx`](file:///home/kash/year1/training-sem/mern_project/client/src/components/ProtectedRoute.jsx) | Route wrapper preventing unauthorized or non-admin access to protected pages. |
| [`client/src/pages/Home.jsx`](file:///home/kash/year1/training-sem/mern_project/client/src/pages/Home.jsx) | Landing page. Shows upcoming events, quick registration form, and redirects logged-in users to `/dashboard` or `/admin`. |
| [`client/src/pages/Dashboard.jsx`](file:///home/kash/year1/training-sem/mern_project/client/src/pages/Dashboard.jsx) | Unified dashboard for both students and admins (shows registered events, tickets, stats, approval queues). |
| [`client/src/pages/AdminEventsPage.jsx`](file:///home/kash/year1/training-sem/mern_project/client/src/pages/AdminEventsPage.jsx) | Admin management view for all events, attendee lists, attendance marking, and deletion. |
| [`client/src/pages/AdminUsersPage.jsx`](file:///home/kash/year1/training-sem/mern_project/client/src/pages/AdminUsersPage.jsx) | Admin view of all registered student accounts, attendance metrics, and profile details. |
| [`client/src/pages/CreateEvent.jsx`](file:///home/kash/year1/training-sem/mern_project/client/src/pages/CreateEvent.jsx) | Admin page to create new events, upload cover photos, payment QR codes, and dynamically build custom questions. |
| [`client/src/pages/EditEvent.jsx`](file:///home/kash/year1/training-sem/mern_project/client/src/pages/EditEvent.jsx) | Admin page to update existing events. |
| [`client/src/pages/EventDetail.jsx`](file:///home/kash/year1/training-sem/mern_project/client/src/pages/EventDetail.jsx) | Detailed view of an individual event, registration form submission, ticket preview, and admin applicant manager. |
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
