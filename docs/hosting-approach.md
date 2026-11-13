# Eventpatro – Hosting Approach & DevOps Documentation

This document explains exactly what we did to host the Eventpatro MERN application on AWS EC2 using CloudFormation and GitHub Actions, step by step.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Tools and Services Used](#tools-and-services-used)
3. [Files Created and Their Purpose](#files-created-and-their-purpose)
4. [Step-by-Step: How We Set Everything Up](#step-by-step-how-we-set-everything-up)
5. [GitHub Secrets Required](#github-secrets-required)
6. [How the CI/CD Pipeline Works](#how-the-cicd-pipeline-works)
7. [How the Server is Structured on EC2](#how-the-server-is-structured-on-ec2)
8. [What Happens When the Learner Lab Session Expires](#what-happens-when-the-learner-lab-session-expires)
9. [Recovery Guide](#recovery-guide)
10. [Issues We Hit and How We Fixed Them](#issues-we-hit-and-how-we-fixed-them)
11. [Cost Breakdown](#cost-breakdown)
12. [Known Quirks to Watch Out For](#known-quirks-to-watch-out-for)
13. [Quick Reference Commands](#quick-reference-commands)

---

## Architecture Overview

```
Browser (User)
     |
     | HTTP :80
     v
[ Nginx on EC2 ]   <-- reverse proxy
     |
     |-- /          --> serves React build (static files in /var/www/eventpatro/client/dist)
     |-- /api/*     --> proxies to Express on port 5000
     |
     v
[ Express + PM2 ]  <-- Node.js backend, kept alive by PM2
     |
     v
[ MongoDB Atlas ]  <-- cloud-hosted MongoDB (M0 free tier, always on)
```

How the deployment pipeline connects to it:

```
push to main on GitHub
     |
     v
GitHub Actions
     |
     |--> aws cloudformation deploy  --> creates/updates EC2 instance
     |--> aws ssm get-parameter      --> fetches SSH private key from SSM
     |--> appleboy/ssh-action         --> SSH into EC2, deploys code
```

**Key ideas:**
- Nginx is the public-facing entry point on port 80. It serves the React frontend as static files and proxies `/api/...` requests to Express on port 5000.
- CloudFormation creates the EC2 instance, key pair, and security group. The private SSH key is stored in AWS SSM Parameter Store automatically — no `.pem` file to manage manually.
- MongoDB Atlas is separate from AWS — it is a free cloud database that runs 24/7 and does not depend on the Learner Lab session.

---

## Tools and Services Used

| Tool / Service | What it does | Why we used it |
|---|---|---|
| **AWS EC2 t2.micro** | Virtual machine that runs our app | Free tier eligible, available in Learner Lab |
| **AWS CloudFormation** | Infrastructure-as-code — creates EC2, key pair, security group from a YAML template | Automates infrastructure creation, no manual clicking in the EC2 console |
| **AWS SSM Parameter Store** | Stores the SSH private key securely | GitHub Actions can fetch it programmatically — no `.pem` file to manage |
| **Ubuntu 24.04 LTS** | Operating system on EC2 | Stable, widely documented |
| **Node.js 22** | Runs the Express backend and builds the React frontend | Current LTS version |
| **PM2** | Process manager that keeps Node.js running 24/7 | Auto-restarts on crash, survives server reboots |
| **Nginx** | Web server and reverse proxy | Serves static files fast, cleanly proxies /api to Express |
| **MongoDB Atlas (M0)** | Cloud-hosted MongoDB database | Free tier is persistent — not tied to Learner Lab sessions |
| **GitHub Actions** | CI/CD pipeline — auto-deploys on every push to main | Zero-cost for public repos, integrates with our GitHub repo |
| **Gmail App Password (SMTP)** | Sends OTP verification emails | Free, works without domain or paid email service |

---

## Files Created and Their Purpose

### `infra/ec2-instance.yaml` — CloudFormation Template
This is the infrastructure-as-code file. Instead of manually launching an EC2 instance through the AWS console, this YAML file tells CloudFormation exactly what to create:

1. **Key Pair** (`eventpatro-cf-key`) — the SSH key pair. The private key is automatically stored in SSM Parameter Store by AWS. GitHub Actions reads it from there to SSH into the instance.
2. **Security Group** — firewall rules allowing HTTP (port 80) and SSH (port 22) from anywhere.
3. **EC2 Instance** — Ubuntu 24.04, t2.micro, with a UserData script that runs on first boot and installs Node.js, PM2, Nginx, and clones the GitHub repo.

The template also defines **Outputs** — values that GitHub Actions can read after the stack is created:
- `PublicIP` — the EC2 instance's public IP address
- `SSMKeyPath` — the path in SSM Parameter Store where the SSH private key is stored

### `.github/workflows/deploy.yml` — CI/CD Pipeline
The GitHub Actions workflow. Two jobs:

1. **build** — runs in GitHub's cloud, builds the React frontend, uploads the output as an artifact.
2. **deploy** — authenticates to AWS, runs CloudFormation, fetches the SSH key from SSM, SSH-es into EC2, and deploys the latest code.

### `infra/nginx.conf` — Nginx Configuration
Nginx site configuration:
- `location /` — serves files from the React build directory. Falls back to `index.html` for React Router paths.
- `location /api/` — proxies requests to Express on port 5000.

### `server/ecosystem.config.cjs` — PM2 Configuration
Tells PM2 how to run the Express backend:
- Entry point: `src/server.js`
- Working directory: `/var/www/eventpatro/server`
- App name: `eventpatro-backend`

### `client/.env.production` — React Production Environment
Sets `VITE_API_URL=/api` so the React frontend calls `/api/...` (relative path, handled by Nginx) instead of `http://localhost:5000/api` (which would fail in production because it would try to connect to the user's own computer).

### `infra/setup-ubuntu.sh` — Manual Setup Script (legacy)
One-command provisioning script for when you manually launch an EC2 instance. No longer needed with CloudFormation — the UserData in `ec2-instance.yaml` does the same job automatically.

---

## Step-by-Step: How We Set Everything Up

This is the exact sequence of steps to go from zero to a fully deployed Eventpatro app.

### Step 1: Set Up MongoDB Atlas (One-Time, Free)

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) and create a free account.
2. Create a free M0 cluster. Name: `eventpatro-db`. Region: any.
3. Create a database user (username and password). Save the password.
4. Go to **Network Access** and add `0.0.0.0/0` (allow connections from any IP). This is needed because the EC2 instance's IP changes whenever the Learner Lab session expires.
5. Go to **Database** → **Connect** → **Drivers** and copy the connection string. Replace `<password>` with your database user's password. Replace the default database name with `campuspulse`. The final string follows this pattern:
   ```
   mongodb+srv://<USERNAME>:<PASSWORD>@<CLUSTER>.mongodb.net/campuspulse?retryWrites=true&w=majority
   ```
   Replace `<USERNAME>`, `<PASSWORD>`, and `<CLUSTER>` with your actual values from Atlas.

### Step 2: Set Up Gmail App Password (One-Time)

1. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
2. Select **Mail** and generate an app password.
3. Copy the 16-character password (has spaces like `dogj luni umza llqc` — the spaces are part of it).

### Step 3: Start the AWS Learner Lab Session

1. Go to your AWS Academy Learner Lab.
2. Click **Start Lab** and wait for the green dot.
3. Click **AWS Details** → **Show** next to **AWS CLI**.
4. You will see three values under `[default]`:
   ```
   [default]
   aws_access_key_id = ASIA...
   aws_secret_access_key = xxxxxxx...
   aws_session_token = FwoGZX...  (very long — 500+ characters)
   ```
   Keep this page open — you will copy these into GitHub Secrets.

### Step 4: Set Up GitHub Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**.

Add these secrets:

| Secret Name | Value | Where to get it |
|---|---|---|
| `AWS_ACCESS_KEY_ID` | `ASIA...` | Learner Lab → AWS Details → Show → `[default]` block |
| `AWS_SECRET_ACCESS_KEY` | `xxxxxxx...` | Same place, second line |
| `AWS_SESSION_TOKEN` | `FwoGZX...` (very long) | Same place, third line. Copy the **entire** string. |
| `MONGODB_URI` | `mongodb+srv://...` | From Step 1 |
| `JWT_SECRET` | Any long random string | Make one up (e.g. `sunway_eventpatro_production_secret_jwt_key_2026_secure`) |
| `SMTP_USER` | Your Gmail address | e.g. `yourname@gmail.com` |
| `SMTP_PASS` | The 16-char app password | From Step 2 (include spaces) |

### Step 5: Run the GitHub Actions Pipeline (First Time)

1. Go to your GitHub repo → **Actions** tab.
2. Click **Deploy Eventpatro (CloudFormation + SSH)** on the left.
3. Click **Run workflow** → **Run workflow** (green button).
4. Wait about 8-10 minutes. The first run takes longer because:
   - CloudFormation creates the EC2 instance, key pair, and security group.
   - The EC2 UserData script installs Node.js, PM2, Nginx, and clones the repo.
   - Then the deploy step SSH-es in and installs dependencies, builds, and starts PM2.
5. At the end of the Actions log, you will see:
   ```
   Site is live at http://X.X.X.X
   ```
   Open that URL — your app is running.

### Step 6: Seed the Database

SSH into the EC2 instance to create the admin user and sample events. The SSH key is managed by CloudFormation, so you need to get it from SSM first:

**Option A: Through AWS Console**
1. Go to AWS Console → EC2 → Instances → Click on `eventpatro` instance.
2. Click **Connect** → **EC2 Instance Connect** → **Connect**. This gives you a browser-based terminal.
3. Run:
   ```bash
   cd /var/www/eventpatro/server
   npm run seed:admin
   npm run seed:events
   ```

**Option B: SSH from your terminal (advanced)**
1. In the Learner Lab terminal or your local terminal with AWS CLI configured:
   ```bash
   # Get the SSM key path from CloudFormation
   SSM_PATH=$(aws cloudformation describe-stacks \
     --stack-name eventpatro-stack \
     --query "Stacks[0].Outputs[?OutputKey=='SSMKeyPath'].OutputValue" \
     --output text)

   # Download the private key
   aws ssm get-parameter --name "$SSM_PATH" --with-decryption \
     --query "Parameter.Value" --output text > eventpatro-key.pem
   chmod 400 eventpatro-key.pem

   # Get the IP
   IP=$(aws cloudformation describe-stacks \
     --stack-name eventpatro-stack \
     --query "Stacks[0].Outputs[?OutputKey=='PublicIP'].OutputValue" \
     --output text)

   # SSH in
   ssh -i eventpatro-key.pem ubuntu@$IP
   ```
2. Then seed:
   ```bash
   cd /var/www/eventpatro/server
   npm run seed:admin
   npm run seed:events
   ```

Default admin login: `admin@sunway.edu.np` / `Admin1234!`

### Step 7: Done

From now on, every push to `main` automatically:
1. Builds the React frontend
2. Checks the CloudFormation stack (no changes = skip)
3. SSH-es into EC2
4. Pulls latest code, writes `.env`, installs deps, builds, restarts PM2

---

## GitHub Secrets Required

| Secret Name | Description |
|---|---|
| `AWS_ACCESS_KEY_ID` | Learner Lab temporary AWS access key (changes every session) |
| `AWS_SECRET_ACCESS_KEY` | Learner Lab temporary AWS secret key (changes every session) |
| `AWS_SESSION_TOKEN` | Learner Lab temporary session token (changes every session, very long string) |
| `MONGODB_URI` | Full MongoDB Atlas connection string with username, password, and database name |
| `JWT_SECRET` | Secret string used to sign JWT tokens |
| `SMTP_USER` | Gmail address used to send OTP emails |
| `SMTP_PASS` | Gmail App Password (16 characters, may include spaces) |

> **Note:** `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `AWS_SESSION_TOKEN` must be updated every time you start a new Learner Lab session. All other secrets stay the same forever.

---

## How the CI/CD Pipeline Works

```
Developer pushes to main
         |
         v
GitHub Actions triggers deploy.yml
         |
    build job:
    |   - checkout code
    |   - npm ci (client)
    |   - npm run build (React)
    |   - upload dist/ as artifact
         |
    deploy job (after build finishes):
        - checkout code
        - download dist/ artifact
        - configure AWS credentials (from GitHub Secrets)
        - aws cloudformation deploy (creates EC2 on first run, skips after)
        - read EC2 public IP from CloudFormation stack outputs
        - read SSH private key from SSM Parameter Store
        - wait for SSH to be ready on EC2
        - SSH into EC2:
            1. git pull origin main
            2. npm ci --omit=dev (server)
            3. write .env from secrets
            4. npm ci + npm run build (client)
            5. pm2 restart all --update-env
            6. nginx -t && systemctl reload nginx
        - print live URL
        - clean up SSH key from runner
```

---

## How the Server is Structured on EC2

```
/var/www/eventpatro/
  server/
    src/
      server.js           <-- Express entry point
    .env                  <-- Written by CI/CD every deploy
    ecosystem.config.cjs  <-- PM2 configuration
    node_modules/
  client/
    dist/                 <-- React production build (served by Nginx)
    node_modules/
  infra/
    ec2-instance.yaml     <-- CloudFormation template
    nginx.conf            <-- Nginx site config
    setup-ubuntu.sh       <-- Manual setup script (legacy)
  .github/
    workflows/
      deploy.yml          <-- CI/CD pipeline
```

Nginx config lives at `/etc/nginx/sites-available/eventpatro` (symlinked to `sites-enabled`).
PM2 runs `server.js` as the process `eventpatro-backend`.

---

## What Happens When the Learner Lab Session Expires

When your Learner Lab session expires (4-hour timer or manual stop):

**What breaks:**
1. AWS temporary credentials expire. GitHub Actions cannot authenticate to AWS.
2. The EC2 instance may be stopped or terminated. The public IP changes.
3. The website goes offline.

**What does NOT break:**
- MongoDB Atlas — it is a separate service, completely independent of AWS Learner Lab. Your data is safe.
- Your GitHub repository — all code and secrets are intact.
- The CloudFormation template — on next run, it recreates everything from scratch.

---

## Recovery Guide

Every time the Learner Lab session expires and you need to redeploy:

### 1. Start a new Learner Lab session
Click **Start Lab** and wait for the green dot.

### 2. Get the new AWS credentials
Click **AWS Details** → **Show** → copy all three values from the `[default]` block.

### 3. Update GitHub Secrets
Go to GitHub → Settings → Secrets → Actions. Update:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_SESSION_TOKEN`

### 4. Run the pipeline
Go to GitHub → Actions → **Run workflow**. Or push any commit to `main`.

If the old EC2 instance was terminated, CloudFormation creates a new one (8-10 min).
If it was just stopped, CloudFormation detects it exists and the deploy step SSH-es in directly (3-4 min).

### 5. Seed (only if database was wiped)
MongoDB Atlas data persists. You only need to re-seed if you dropped the database:
```bash
cd /var/www/eventpatro/server
npm run seed:admin
npm run seed:events
```

---

## Issues We Hit and How We Fixed Them

### 1. MongoDB Atlas blocked the EC2 IP
**Symptom:** Backend crashed. Logs showed `MongoNetworkError: connection timed out`.
**Cause:** MongoDB Atlas has an IP whitelist. The EC2 IP was not on it.
**Fix:** In MongoDB Atlas → Network Access → Add `0.0.0.0/0` (allow all IPs). Necessary because the EC2 IP changes with every Learner Lab session.

### 2. React frontend was calling localhost:5000 in production
**Symptom:** Blank dashboard. Browser console showed `net::ERR_CONNECTION_REFUSED` for `http://localhost:5000/api/...`.
**Cause:** `client/src/utils/api.js` had `http://localhost:5000/api` hardcoded. Vite bakes this into the JavaScript bundle at build time. Users' browsers tried connecting to their own machine, not the server.
**Fix:** Changed to check `import.meta.env.PROD`:
```js
const BASE_URL = import.meta.env.PROD ? '/api' : 'http://localhost:5000/api';
```

### 3. SMTP environment variables were empty after deploy
**Symptom:** OTP emails were not sending. Backend logged `SMTP_USER: undefined`.
**Cause 1:** The original deploy script used a heredoc (`cat << 'EOF'`) to write the `.env` file. The `appleboy/ssh-action` runner injects `DRONE_SSH_PREV_COMMAND_EXIT_CODE` lines into the heredoc, corrupting the file.
**Fix 1:** Changed to `printf "%s\n"` approach.
**Cause 2:** PM2 caches environment variables. `pm2 restart` does not reload them.
**Fix 2:** Changed to `pm2 restart all --update-env`.

### 4. EC2 instance lost when Learner Lab session expired
**Symptom:** Instance gone or stopped with new IP.
**Fix:** With CloudFormation, this is now handled automatically. Run the pipeline again and CloudFormation recreates the instance if needed.

### 5. Uploaded images not rendering on the website
**Symptom:** Created an event and uploaded a cover photo, but the image broke or returned 404 in the browser.
**Cause 1:** Backend upload route was returning `http://localhost:5000/uploads/...` because `API_PUBLIC_URL` wasn't set. The browser was trying to fetch images from the client's local computer.
**Fix 1:** Changed `server/src/routes/upload.routes.js` to return relative path `/uploads/${filename}`, and updated `client/src/utils/mediaUrl.js` to automatically clean legacy `localhost:5000` URLs.
**Cause 2:** In Nginx, regex matching for static files (`location ~* \.(jpg|png...)`) took precedence over `location /uploads/`, so Nginx looked for uploaded files in the React `dist/` directory instead of forwarding to Express.
**Fix 2:** Added the `^~` modifier (`location ^~ /uploads/`) in `infra/nginx.conf` so Nginx immediately routes all `/uploads/` traffic directly to Express.

### 6. Unexpected token '<', "<html>... is not valid JSON" (502 Bad Gateway on Login)
**Symptom:** Clicking Login throws a JSON parse error.
**Cause:** Nginx returned an HTML error page (502 Bad Gateway) because Express on port 5000 was offline or restarting. This happens if MongoDB connection failed, or if the Learner Lab session timed out and revoked credentials.
**Fix:** Verify MongoDB Atlas Network Access has `0.0.0.0/0` active, ensure AWS credentials in GitHub Secrets are refreshed from an active Learner Lab session, and check PM2 logs (`pm2 logs --lines 50`).

---

## Cost Breakdown

| Resource | Cost |
|---|---|
| EC2 t2.micro | \$0.0116 per hour |
| EC2 storage (8 GB gp2) | ~\$0.80 per month |
| MongoDB Atlas M0 | \$0 (free tier, permanent) |
| GitHub Actions | \$0 (free for public repos) |
| CloudFormation | \$0 (you only pay for the resources it creates) |
| **Total per month (24/7)** | **~\$9** |

AWS Learner Lab gives approximately \$20 of credit. A t2.micro running 24/7 uses about \$8.35/month, so the budget lasts over 2 months.

---

## Known Quirks to Watch Out For

### SMTP_PASS with spaces
Gmail App Passwords have spaces (e.g. `dogj luni umza llqc`). The spaces are part of the password. The `printf` approach in `deploy.yml` handles this correctly. Do not change the `.env` writing method without testing.

### PM2 always needs --update-env
If you ever restart PM2 manually and expect new environment variables:
```bash
pm2 restart all --update-env
```
Plain `pm2 restart all` uses cached old values.

### MongoDB Atlas must allow 0.0.0.0/0
The EC2 IP changes every time CloudFormation creates a new instance. If Atlas is restricted to specific IPs, the backend will crash.

### React Router and Nginx
The Nginx config has `try_files $uri $uri/ /index.html;`. Without this, refreshing the page on a React Router path like `/dashboard` returns a 404. The rule tells Nginx to serve `index.html` for any path that is not a real file, letting React Router handle routing in the browser.

### AWS session token is very long
The `AWS_SESSION_TOKEN` can be 500+ characters. When pasting it into GitHub Secrets, make sure you copy the **entire** string — partial tokens cause authentication errors.

### First deploy takes longer
The first `aws cloudformation deploy` run takes 8-10 minutes because it creates the EC2 instance and runs the UserData script (installing Node.js, PM2, Nginx). Every run after that takes 3-4 minutes because CloudFormation detects no infrastructure changes and skips straight to the SSH deploy step.

---

## Quick Reference Commands

### Check if the backend is running (on EC2)
```bash
pm2 status
pm2 logs eventpatro-backend --lines 50
```

### Restart the backend manually (on EC2)
```bash
pm2 restart all --update-env
```

### Check the .env file on the server (on EC2)
```bash
cat /var/www/eventpatro/server/.env
```

### Check Nginx status (on EC2)
```bash
sudo systemctl status nginx
sudo nginx -t
```

### View Nginx live web traffic as it happens (on EC2)
```bash
sudo tail -f /var/log/nginx/access.log
```

### View Nginx error log (on EC2)
```bash
sudo tail -f /var/log/nginx/error.log
```

### View Nginx configuration (on EC2)
```bash
cat /etc/nginx/sites-available/eventpatro
```

### Pull latest code and rebuild manually, without CI/CD (on EC2)
```bash
cd /var/www/eventpatro
git pull origin main
cd server && npm ci --omit=dev
cd ../client && npm ci && npm run build
cd ../server
pm2 restart all --update-env
```

### Seed admin user and events (on EC2)
```bash
cd /var/www/eventpatro/server
npm run seed:admin
npm run seed:events
```

---

*Document last updated: November 2026.*
*Deployment method: AWS CloudFormation + GitHub Actions CI/CD.*
*CloudFormation stack name: `eventpatro-stack`.*
