# Eventpatro — AWS Hosting & DevOps Deployment Viva Guide

> **DevOps & Cloud Viva Cheat Sheet**  
> Written in plain, simple English with zero confusing jargon.  
> Read this to understand how your site is hosted on AWS, why we chose this architecture, how GitHub Actions deploys code, and how to answer your teacher's DevOps questions.

---

## Table of Contents

1. [High-Level Hosting Architecture (The Big Picture)](#1-high-level-hosting-architecture-the-big-picture)
2. [The DevOps Stack: What Each Tool Does and Why](#2-the-devops-stack-what-each-tool-does-and-why)
3. [Where is What? (DevOps Files Tour)](#3-where-is-what-devops-files-tour)
4. [The CI/CD Deployment Pipeline (Step-by-Step)](#4-the-cicd-deployment-pipeline-step-by-step)
5. [Why This Architecture is Superior to Manual Hosting](#5-why-this-architecture-is-superior-to-manual-hosting)
6. [Handling AWS Learner Lab Timeouts (The 4-Hour Reset)](#6-handling-aws-learner-lab-timeouts-the-4-hour-reset)
7. [Real Problems We Hit and Fixed (Great Talking Points!)](#7-real-problems-we-hit-and-fixed-great-talking-points)
8. [Common Teacher Viva Questions & Exact Answers](#8-common-teacher-viva-questions--exact-answers)

---

## 1. High-Level Hosting Architecture (The Big Picture)

```
                            [ USER / BROWSER ]
                                    │
                                    │ HTTP Request (Port 80)
                                    ▼
                  ┌───────────────────────────────────┐
                  │          AWS EC2 INSTANCE         │
                  │       (Ubuntu 24.04, t2.micro)    │
                  │                                   │
                  │   ┌───────────────────────────┐   │
                  │   │    NGINX (Reverse Proxy)  │   │
                  │   └─────────────┬─────────────┘   │
                  │                 │                 │
                  │    ┌────────────┴───────────┐     │
                  │    │                        │     │
                  │    ▼                        ▼     │
                  │  Static Files           Express   │
                  │  (Frontend React)       Backend   │
                  │  /var/www/eventpatro/   Port 5000 │
                  │  client/dist            (via PM2) │
                  └─────────────────────────────┬─────┘
                                                │
                                                │ Database Connection
                                                ▼
                                    [ CLOUD DATABASE ]
                                    (MongoDB Atlas M0 - 24/7)
```

### In Plain Words:
1. When a user opens `http://<EC2-IP>`, the request hits **Port 80**.
2. **Nginx** receives the request first.
   - If the user asks for a website page (like `/`, `/dashboard`, or CSS/JS), Nginx serves the compiled React files from `/var/www/eventpatro/client/dist`.
   - If the user asks for API data (like `/api/events` or `/api/auth/login`), Nginx immediately forwards the request to **Express** running internally on Port 5000.
3. **PM2** ensures the Express server runs 24/7. If Express crashes, PM2 restarts it in milliseconds.
4. Express connects across the internet to **MongoDB Atlas**, where your data is permanently and securely stored.

---

## 2. The DevOps Stack: What Each Tool Does and Why

| Tool / Service | What it is | Why we used it |
|---|---|---|
| **AWS EC2 (t2.micro)** | A virtual computer in Amazon's data center running Ubuntu 24.04 Linux. | Free-tier eligible in AWS Learner Lab; reliable virtual server. |
| **AWS CloudFormation** | **Infrastructure-as-Code (IaC)**. A tool that reads a YAML file and creates the server, firewall, and SSH keys automatically. | Eliminates manual clicking in the AWS Console. Reproducible and automated. |
| **AWS SSM Parameter Store** | A secure cloud vault inside AWS for storing secrets and keys. | CloudFormation stores the generated SSH private key here. GitHub Actions retrieves it dynamically—no manual `.pem` files to handle! |
| **Nginx** | High-performance open-source web server and reverse proxy. | Handles static file caching, routes traffic, handles SPA React Router history fallback (`try_files`), and shields Node.js from direct internet exposure. |
| **PM2** | Production process manager for Node.js. | Keeps Node.js alive 24/7, restarts on crash or server reboot, and manages log output. |
| **GitHub Actions** | Automated CI/CD (Continuous Integration / Continuous Deployment) runner. | Auto-deploys every time code is pushed to `main`. Tests, builds, and deploys without human intervention. |
| **MongoDB Atlas** | Managed cloud MongoDB database cluster. | Runs 24/7 in the cloud; persistent data that survives AWS Learner Lab resets. |

---

## 3. Where is What? (DevOps Files Tour)

| File | Exact Purpose |
|---|---|
| [`infra/ec2-instance.yaml`](file:///home/kash/year1/training-sem/mern_project/infra/ec2-instance.yaml) | **CloudFormation template.** Defines the EC2 instance, Security Group (ports 80 & 22), auto-generated key pair, and the `UserData` startup script that installs Node 22, Nginx, and PM2 on first boot. |
| [`infra/nginx.conf`](file:///home/kash/year1/training-sem/mern_project/infra/nginx.conf) | **Nginx configuration.** Configures document root `/var/www/eventpatro/client/dist`, sets `try_files $uri /index.html;` for React Router, proxies `/api/` to port 5000, and uses `^~ /uploads/` for media uploads. |
| [`server/ecosystem.config.cjs`](file:///home/kash/year1/training-sem/mern_project/server/ecosystem.config.cjs) | **PM2 configuration.** Defines process name `eventpatro-backend`, entry point `src/server.js`, and sets `exec_mode: 'fork'` with `instances: 1` for stability on single-core instances. |
| [`.github/workflows/deploy.yml`](file:///home/kash/year1/training-sem/mern_project/.github/workflows/deploy.yml) | **CI/CD pipeline.** Two-stage workflow (`build` job compiles React in GitHub's cloud; `deploy` job provisions EC2, fetches SSM keys, and SSH-es in to update code). |

---

## 4. The CI/CD Deployment Pipeline (Step-by-Step)

When you run `git push origin main`, here is the automated sequence:

```
Developer pushes code to main
             │
             ▼
┌────────────────────────────────────────────────────────────────────────┐
│ STAGE 1: BUILD JOB (Runs on GitHub's Ubuntu Runner)                   │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Checks out repository code.                                         │
│ 2. Sets up Node.js 22 with npm cache.                                  │
│ 3. Installs client dependencies: cd client && npm ci                   │
│ 4. Compiles React for production: npm run build with VITE_API_URL=/api │
│ 5. Saves the compiled client/dist/ as an artifact.                     │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│ STAGE 2: DEPLOY JOB (Needs Build to Succeed)                           │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Logs into AWS CLI using temporary Learner Lab secrets.              │
│ 2. Runs aws cloudformation deploy to create or verify the EC2 stack.   │
│ 3. Queries CloudFormation output for the live Public IP.               │
│ 4. Downloads the private SSH key from AWS SSM Parameter Store.         │
│ 5. Waits for EC2 port 22 (SSH) to become reachable.                   │
│ 6. Connects over SSH (appleboy/ssh-action) and executes on EC2:        │
│      • Waits for cloud-init bootstrap to finish                        │
│      • git pull origin main (pulls latest code)                        │
│      • npm ci --omit=dev (installs production backend dependencies)    │
│      • Generates server/.env safely from GitHub Secrets                │
│      • Compiles frontend and moves assets to Nginx web root            │
│      • pm2 restart all --update-env (reloads backend with fresh env)   │
│      • sudo nginx -t && sudo systemctl reload nginx                    │
│ 7. Prints: "Site is live at http://<EC2-IP>"                           │
│ 8. Deletes the temporary SSH key from the runner memory.               │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Why This Architecture is Superior to Manual Hosting

If your teacher asks: *"Why did you use CloudFormation and GitHub Actions instead of just launching an EC2 manually and SSH-ing from your laptop?"*

Here are the key advantages to explain:

1. **Automation & Speed:** Manual deployment requires typing 15+ terminal commands, uploading files over slow home Wi-Fi, and configuring Nginx by hand. With our CI/CD, one `git push` does everything in under 2 minutes.
2. **Infrastructure as Code (IaC):** The server is defined in a YAML file (`infra/ec2-instance.yaml`). If the virtual machine is accidentally terminated, CloudFormation recreates the exact same server with one click.
3. **No Stolen or Leaked `.pem` Keys:** In traditional setups, students paste sensitive private keys into GitHub Secrets or accidentally commit them. CloudFormation stores the key in **AWS SSM Parameter Store**, and GitHub Actions fetches it dynamically at deploy time.
4. **Dynamic IP Extraction:** Learner Lab assigns a new IP address every time it resets. Our pipeline automatically extracts the new IP from CloudFormation stack outputs—no manual secret editing is required.

---

## 6. Handling AWS Learner Lab Timeouts (The 4-Hour Reset)

### What happens when the 4-hour lab timer expires?
- AWS automatically issues a `poweroff` command to the EC2 instance.
- Temporary AWS credentials expire (AWS attaches the `voc-cancel-cred` policy).
- The website becomes temporarily unreachable.

### How we recover in 60 seconds:
1. Open AWS Academy Learner Lab and click **Start Lab**.
2. Click **AWS Details $\rightarrow$ Show** and copy the 3 keys (`aws_access_key_id`, `aws_secret_access_key`, `aws_session_token`).
3. Update those 3 secrets in GitHub Repository **Settings $\rightarrow$ Secrets $\rightarrow$ Actions**.
4. In GitHub Actions, click **Re-run all jobs**.
5. The pipeline automatically restarts the EC2 instance, updates the IP, pulls any new code, and your site is live!

---

## 7. Real Problems We Hit and Fixed (Great Talking Points!)

Sharing real troubleshooting during your demo proves you understand how the system works:

### 1. The `localhost:5000` Production Bundle Trap
- **The Problem:** The website loaded, but when clicking "Create Event" or "Login", the browser returned `ERR_CONNECTION_REFUSED localhost:5000`.
- **The Cause:** Frontend code had `http://localhost:5000/api` hardcoded. Vite baked that string into the JavaScript bundle, so the user's browser tried to reach their own laptop instead of our EC2 server!
- **The Fix:** Updated `api.js` to use `import.meta.env.PROD ? '/api' : 'http://localhost:5000/api'`. In production, all API calls use relative `/api`, which Nginx forwards to port 5000.

### 2. Uploaded Images Returning 404 in Nginx
- **The Problem:** Event cover photos uploaded by users showed broken image icons on the live site.
- **The Cause:** In Nginx, regex rules (`location ~* \.(jpg|png)`) take priority over standard prefix rules (`location /uploads/`). Nginx was searching for uploaded photos inside React's `client/dist/` folder instead of forwarding to Express!
- **The Fix:** Added the `^~` priority modifier in `nginx.conf`:
  ```nginx
  location ^~ /uploads/ {
      proxy_pass http://127.0.0.1:5000/uploads/;
  }
  ```
  The `^~` tells Nginx: "Stop checking regex rules; forward all `/uploads/` directly to Express!"

### 3. PM2 Cluster Mode Crash Loop (`SIGINT` on t2.micro)
- **The Problem:** PM2 repeatedly restarted Express: `Script had too many unstable restarts (16). Stopped. "errored"`.
- **The Cause:** Our `t2.micro` instance has 1 vCPU. Running PM2 in cluster mode attempts multi-core IPC messaging that triggers immediate `SIGINT` shutdowns on single-core instances.
- **The Fix:** In `ecosystem.config.cjs`, explicitly set `exec_mode: 'fork'` and `instances: 1`.

### 4. Zod `.partial()` Crash on Refined Schemas
- **The Problem:** Express crashed on startup with `Error: .partial() cannot be used on object schemas containing refinements`.
- **The Cause:** Calling `.refine()` directly on an object schema wraps it in a `ZodEffects` instance, which prevents `.partial()` from creating an update schema.
- **The Fix:** Defined `baseEventSchema` first, then called `.partial()` on the clean base schema before applying `.refine()`.

---

## 8. Common Teacher Viva Questions & Exact Answers

### Q1: What is a Reverse Proxy, and why did you use Nginx?
> **Answer:** "A reverse proxy is a server that sits in front of backend web applications and forwards client requests to those backends. We used Nginx because:  
> 1. It serves static React files with caching and gzip compression.  
> 2. It handles Single Page Application routing with `try_files $uri /index.html;` so page refreshes don't return 404s.  
> 3. It shields Node.js from direct internet exposure and safely proxies `/api/` requests to port 5000."

### Q2: Why is PM2 needed if we already have `node server.js`?
> **Answer:** "Running `node server.js` directly in a terminal has two fatal flaws: if the terminal closes, the app dies; and if an uncaught exception occurs, the server crashes and stays dead. PM2 runs the app as a background daemon, automatically revives the process if it crashes, and starts Express on system reboot."

### Q3: What is the difference between CI and CD in GitHub Actions?
> **Answer:** "Continuous Integration (CI) is the automated testing and compiling of code every time a developer pushes changes (in our `build` job, React dependencies are installed and compiled). Continuous Deployment (CD) is the automated release and deployment of that verified build directly to the live server (in our `deploy` job, CloudFormation and SSH deploy the code to EC2)."

### Q4: Why must MongoDB Atlas Network Access have `0.0.0.0/0` in Learner Lab?
> **Answer:** "In AWS Academy Learner Lab, every time a session resets or an EC2 instance restarts, AWS assigns a completely new, unpredictable public IPv4 address. If Atlas is restricted to a single specific IP, the database blocks connections as soon as the IP changes. Allowing `0.0.0.0/0` ensures the server can connect across restarts, protected by strong database user credentials."

### Q5: What does `cloud-init` do in your deployment?
> **Answer:** "`cloud-init` is Ubuntu's first-boot automation engine. When CloudFormation launches a new EC2 instance, `cloud-init` executes our `UserData` script to install Node.js 22, Git, Nginx, and PM2, and clones the repository. In our GitHub Actions pipeline, we run `cloud-init status --wait` so deployment doesn't attempt to start before initial installation finishes."
