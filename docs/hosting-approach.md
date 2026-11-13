# Eventpatro – Hosting Approach & DevOps Documentation

This document explains everything we did to host the Eventpatro MERN application on AWS EC2, why we made the choices we did, and how to maintain the live server going forward.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Tools and Services Used](#tools-and-services-used)
3. [Our Approach vs Teacher's Approach](#our-approach-vs-teachers-approach)
4. [Files Created and Their Purpose](#files-created-and-their-purpose)
5. [GitHub Secrets Required](#github-secrets-required)
6. [How the CI/CD Pipeline Works](#how-the-cicd-pipeline-works)
7. [How the Server is Structured](#how-the-server-is-structured)
8. [Issues We Hit and How We Fixed Them](#issues-we-hit-and-how-we-fixed-them)
9. [What Happens When the Learner Lab Session Expires](#what-happens-when-the-learner-lab-session-expires)
10. [Recovery Guide (New EC2 Instance)](#recovery-guide-new-ec2-instance)
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

**Key idea:** Nginx is the public-facing entry point on port 80. It handles two things:
- Serving the compiled React frontend as static HTML/JS/CSS files.
- Forwarding any request to `/api/...` to the Express backend running internally on port 5000.

The Express backend never talks directly to the internet. Only Nginx does.

---

## Tools and Services Used

| Tool / Service | What it does | Why we used it |
|---|---|---|
| **AWS EC2 t2.micro** | Virtual machine that runs our app | Free tier eligible, available in Learner Lab |
| **Ubuntu 24.04 LTS** | Operating system on EC2 | Stable, widely documented |
| **Node.js 22** | Runs the Express backend and builds the React frontend | Current LTS version |
| **PM2** | Process manager that keeps Node.js running 24/7 | Auto-restarts on crash, survives server reboots |
| **Nginx** | Web server and reverse proxy | Serves static files fast, cleanly proxies /api to Express |
| **MongoDB Atlas (M0)** | Cloud-hosted MongoDB database | Free tier is persistent — not tied to Learner Lab sessions |
| **GitHub Actions** | CI/CD pipeline — auto-deploys on every push to main | Zero-cost for public repos, integrates with our GitHub repo |
| **appleboy/ssh-action** | GitHub Action that SSH-es into EC2 and runs commands | No AWS credentials needed — just an SSH key |
| **Gmail App Password (SMTP)** | Sends OTP verification emails | Free, works without domain or paid email service |

---

## Our Approach vs Teacher's Approach

The teacher's reference repository used AWS CloudFormation and the AWS CLI to deploy infrastructure. We deliberately chose a different, simpler approach.

| Aspect | Teacher's Approach | Our Approach |
|---|---|---|
| **Deployment method** | `aws cloudformation deploy` via GitHub Actions | SSH into EC2 via `appleboy/ssh-action` |
| **AWS credentials needed in CI** | Yes — `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` | No — only an SSH key pair |
| **Learner Lab compatibility** | Poor — AWS keys expire every 4 hours; CI/CD breaks constantly | Good — SSH key never expires |
| **Infrastructure complexity** | CloudFormation stack with templates | Manual EC2 setup + shell script (`setup-ubuntu.sh`) |
| **Learning curve** | Higher (CloudFormation YAML, IAM roles, stacks) | Lower (standard Linux, Nginx, PM2) |
| **Cost** | Same EC2 t2.micro pricing | Same |
| **Portability** | AWS-locked (CloudFormation only works on AWS) | Works anywhere with SSH (DigitalOcean, Linode, etc.) |

**Why SSH-based CI/CD is better for Learner Lab:**
AWS Learner Lab sessions expire every 4 hours. When a session expires, the temporary AWS access keys (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`) also expire. If you store these in GitHub Secrets and the session expires, every GitHub Actions run will fail with an authentication error. The only fix is to restart the session and update the secrets manually — every 4 hours.

With SSH-based deployment, GitHub Actions connects to EC2 using an SSH key (`.pem` file). SSH keys do not expire with the Learner Lab session. As long as the EC2 instance is running, deployment works. The only thing that changes when a session expires is the **public IP address** of the EC2 instance.

---

## Files Created and Their Purpose

### `.github/workflows/deploy.yml`
The GitHub Actions CI/CD pipeline. Triggers on every push to the `main` branch.

**What it does:**
1. SSH-es into the EC2 instance.
2. Pulls the latest code from GitHub.
3. Writes the `.env` file for the backend using secrets stored in GitHub.
4. Installs backend dependencies (`npm install` in `/server`).
5. Builds the React frontend (`npm run build` in `/client`).
6. Restarts the PM2 process with `--update-env` so new environment variables are loaded.

### `infra/nginx.conf`
Nginx site configuration for the Eventpatro app.

**Key rules:**
- `location /` — serves files from the React build output directory. If the file doesn't exist (e.g. a React Router path like `/dashboard`), falls back to `index.html` so React Router can handle it.
- `location /api/` — strips the `/api` prefix and proxies the request to `http://localhost:5000`.

### `infra/setup-ubuntu.sh`
One-command provisioning script for a fresh Ubuntu 24.04 EC2 instance.

**What it installs:**
- Node.js 22 (via NodeSource)
- PM2 globally
- Nginx
- Creates the app directory at `/var/www/eventpatro`
- Clones the GitHub repo
- Sets up the Nginx config
- Enables and starts Nginx

Run this once on a brand-new EC2 instance:
```bash
bash infra/setup-ubuntu.sh
```

### `server/ecosystem.config.cjs`
PM2 configuration file. Tells PM2 how to start the Express backend.

**Key settings:**
- Entry point: `src/server.js`
- Working directory: `/var/www/eventpatro/server`
- App name: `eventpatro-backend`
- `watch: false` — PM2 does not restart on file changes (restarts are handled by the CI/CD pipeline)

### `client/.env.production`
Environment variable file used only during the Vite production build.

**Content:**
```
VITE_API_URL=/api
```

This tells the React frontend to call `/api/...` instead of `http://localhost:5000/api/...`. Without this, the production build would try to connect to the developer's local machine from the user's browser.

### `docs/aws-ec2-deployment-guide.md`
Step-by-step guide for deploying from scratch. Covers launching the EC2 instance, SSH access, running the setup script, and updating GitHub Secrets.

---

## GitHub Secrets Required

These must be set in **GitHub → Repository → Settings → Secrets and variables → Actions**.

| Secret Name | Description |
|---|---|
| `EC2_HOST` | Public IP address of the EC2 instance (e.g. `3.92.194.55`) |
| `EC2_USER` | SSH username on EC2 (`ubuntu` for Ubuntu AMIs) |
| `EC2_SSH_KEY` | Full contents of the `.pem` private key file |
| `MONGODB_URI` | Full MongoDB Atlas connection string including username, password, and database name |
| `JWT_SECRET` | Secret string used to sign JWT tokens — keep this long and random |
| `CLIENT_URL` | Full URL of the frontend (e.g. `http://3.92.194.55`) — used in CORS config |
| `SMTP_USER` | Gmail address used to send OTP emails |
| `SMTP_PASS` | Gmail App Password (16-character password, may contain spaces) |

> **Important:** When the EC2 instance gets a new IP (after Learner Lab session expires), you must update both `EC2_HOST` and `CLIENT_URL`.

---

## How the CI/CD Pipeline Works

```
Developer pushes to main
         |
         v
GitHub Actions triggers deploy.yml
         |
         v
appleboy/ssh-action connects to EC2 via SSH
         |
         v
On EC2 (all inside one SSH session):
  1. cd /var/www/eventpatro
  2. git pull origin main
  3. Write /server/.env using printf (not heredoc — see quirks)
  4. cd server && npm install
  5. cd ../client && npm install && npm run build
  6. pm2 restart all --update-env
         |
         v
App is live with the latest code and environment variables
```

The pipeline uses secrets stored in GitHub — they are never printed in logs and are injected as environment variables at runtime.

---

## How the Server is Structured

On the EC2 instance, everything lives at `/var/www/eventpatro/`:

```
/var/www/eventpatro/
  server/
    src/
      server.js         <-- Express entry point
    .env               <-- Written by CI/CD pipeline every deploy
    ecosystem.config.cjs
    node_modules/
  client/
    dist/              <-- React production build (served by Nginx)
    node_modules/
  infra/
    nginx.conf
    setup-ubuntu.sh
  .github/
    workflows/
      deploy.yml
```

Nginx reads static files from `/var/www/eventpatro/client/dist/`.
PM2 runs `server.js` from `/var/www/eventpatro/server/`.

---

## Issues We Hit and How We Fixed Them

### 1. MongoDB Atlas blocked the EC2 IP
**Symptom:** Backend crashed immediately after start. Logs showed `MongoNetworkError: connection timed out`.

**Cause:** MongoDB Atlas has an IP whitelist. The EC2 IP was not on it.

**Fix:** In MongoDB Atlas → Network Access → Add `0.0.0.0/0` (allow all IPs). For production apps this should be restricted, but for a Learner Lab project where the IP changes constantly this is the practical solution.

---

### 2. React frontend was calling `localhost:5000` in production
**Symptom:** Users saw a blank dashboard. Browser console showed `net::ERR_CONNECTION_REFUSED` for `http://localhost:5000/api/...`.

**Cause:** `client/src/utils/api.js` had `http://localhost:5000/api` hardcoded as a fallback. When Vite builds for production, this string gets baked into the JavaScript bundle. The user's browser then tried to connect to `localhost:5000` — their own machine, not the server.

**Fix:** Changed `api.js` and `mediaUrl.js` to check `import.meta.env.PROD`:
```js
const BASE_URL = import.meta.env.PROD ? '/api' : 'http://localhost:5000/api';
```
In production, the browser calls `/api/...` which Nginx receives and proxies to Express.

---

### 3. SMTP environment variables were empty after deploy
**Symptom:** OTP emails were not being sent. The backend logged `SMTP_USER: undefined`.

**Cause 1 (heredoc):** The original `deploy.yml` used a heredoc (`cat << 'EOF'`) to write the `.env` file. The `appleboy/ssh-action` runner injects a variable called `DRONE_SSH_PREV_COMMAND_EXIT_CODE` into the shell, and this gets inserted as an extra line in the heredoc output — corrupting the `.env` file.

**Fix 1:** Changed from heredoc to `printf "%s\n"` for each line of the `.env` file:
```bash
printf "%s\n" \
  "MONGODB_URI=${{ secrets.MONGODB_URI }}" \
  "JWT_SECRET=${{ secrets.JWT_SECRET }}" \
  ... > /var/www/eventpatro/server/.env
```

**Cause 2 (PM2 caching):** Even with a correct `.env` file, PM2 caches environment variables from when the process first started. `pm2 startOrRestart` does NOT reload the `.env` file.

**Fix 2:** Changed the restart command to:
```bash
pm2 restart all --update-env
```
The `--update-env` flag forces PM2 to re-read the environment variables from the current shell session.

---

### 4. EC2 instance lost when Learner Lab session expired
**Symptom:** Logged into Learner Lab — instance was gone (or stopped with a new IP on restart).

**Cause:** AWS Learner Lab may stop or terminate EC2 instances when a session ends.

**Fix:** Launched a new EC2 instance, re-ran `setup-ubuntu.sh`, updated `EC2_HOST` and `CLIENT_URL` in GitHub Secrets, re-triggered the GitHub Actions pipeline. Full steps are in the [Recovery Guide](#recovery-guide-new-ec2-instance) section below.

---

### 5. GitHub Actions showed `missing server host`
**Symptom:** GitHub Actions deploy job failed immediately with `missing server host`.

**Cause:** The `EC2_HOST` secret was not set in GitHub.

**Fix:** Added `EC2_HOST` in GitHub → Settings → Secrets and variables → Actions.

---

## What Happens When the Learner Lab Session Expires

This is the most important operational concern for this project.

When your AWS Learner Lab session expires (after 4 hours of inactivity or when you end it):

1. The EC2 instance may be **stopped** or **terminated**.
2. If stopped and restarted, it gets a **new public IP address**.
3. The old IP (`EC2_HOST` in GitHub Secrets) no longer points to your instance.
4. GitHub Actions deploys will fail because they cannot SSH to the old IP.
5. The website goes offline because no one is serving traffic at the old IP.

**What does NOT change:**
- MongoDB Atlas (it is not on AWS Learner Lab — it is a separate service and runs 24/7 for free).
- Your GitHub repository and all secrets.
- The `.pem` SSH key file on your computer (as long as you saved it).
- All code on the EC2 instance (if stopped, not terminated — the disk is preserved).

---

## Recovery Guide (New EC2 Instance)

Follow these steps every time the Learner Lab session expires and you need to redeploy.

### Step 1: Start a new Learner Lab session
Log into your AWS Academy Learner Lab and click **Start Lab**.

### Step 2: Launch a new EC2 instance (if the old one was terminated)

1. Go to **EC2 → Instances → Launch Instances**
2. Name: `eventpatro`
3. AMI: **Ubuntu Server 24.04 LTS**
4. Instance type: `t2.micro`
5. Key pair: Select the existing key pair named `eventpatro-key` (or create a new one and download it)
6. Network settings: Allow SSH (port 22) and HTTP (port 80) from anywhere
7. Click **Launch Instance**

### Step 3: Get the new public IP

In EC2 → Instances, click on your instance and copy the **Public IPv4 address**.

### Step 4: SSH into the instance

```bash
chmod 400 ~/Downloads/eventpatro-key.pem
ssh -i ~/Downloads/eventpatro-key.pem ubuntu@<NEW_IP>
```

Replace `<NEW_IP>` with the actual IP.

### Step 5: Run the setup script (only if the instance is brand new)

If you are reusing a stopped instance (not terminated), skip this step — your files are still there.

```bash
# On the EC2 instance:
git clone https://github.com/codebykashish/eventpatro.git /var/www/eventpatro
cd /var/www/eventpatro
bash infra/setup-ubuntu.sh
```

### Step 6: Update GitHub Secrets

Go to **GitHub → Repository → Settings → Secrets and variables → Actions** and update:

- `EC2_HOST` → new public IP (e.g. `3.92.194.55`)
- `CLIENT_URL` → `http://<NEW_IP>`

### Step 7: Trigger a new deployment

Go to **GitHub → Actions → Deploy to EC2** and click **Run workflow**, or push any commit to `main`.

### Step 8: Seed the database (only if Atlas data was wiped)

MongoDB Atlas data persists — you should not need to reseed unless you dropped the database.

```bash
# On EC2:
cd /var/www/eventpatro/server
npm run seed:admin
npm run seed:events
```

Default admin credentials: `admin@sunway.edu.np` / `Admin1234!`

### Step 9: Verify

Open `http://<NEW_IP>` in a browser. The app should be live.

---

## Cost Breakdown

| Resource | Cost |
|---|---|
| EC2 t2.micro | \$0.0116 per hour |
| EC2 storage (8 GB gp2) | ~\$0.80 per month |
| MongoDB Atlas M0 | \$0 (free tier, permanent) |
| GitHub Actions | \$0 (free for public repos) |
| Data transfer (low traffic) | ~\$0 |
| **Total per month (always on)** | **~\$9** |

The AWS Learner Lab gives approximately \$20 of credit. At \$0.0116/hr, a t2.micro runs for about **1,724 hours** on \$20 — that is over 70 days if left on 24/7, or several months if you only run it during working hours.

---

## Known Quirks to Watch Out For

### SMTP_PASS with spaces
Gmail App Passwords are 16 characters with spaces (e.g. `dogj luni umza llqc`). These spaces are part of the password. When writing the `.env` file in a shell script, you must quote the value correctly. The `printf` approach in our `deploy.yml` handles this correctly. Do not modify that section without testing.

### PM2 always needs `--update-env`
If you ever manually restart PM2 and expect new environment variables to be loaded, always use:
```bash
pm2 restart all --update-env
```
Plain `pm2 restart all` or `pm2 reload all` will not update the environment.

### MongoDB Atlas IP whitelist
The Atlas cluster must have `0.0.0.0/0` in Network Access. If you accidentally remove it and restrict to specific IPs, the EC2 instance (which changes IPs) will be blocked and the backend will crash.

### React Router and Nginx
The Nginx config has this line:
```nginx
try_files $uri $uri/ /index.html;
```
This is essential. Without it, refreshing the page on a React Router path like `/dashboard` returns a 404 from Nginx (because there is no actual file at that path — React Router handles it in JavaScript). The `try_files` rule tells Nginx to serve `index.html` for any path that does not match a real file, letting React Router take over.

### EC2 key pair — save your `.pem` file
AWS only lets you download the `.pem` file once at creation time. If you lose it, you cannot SSH into the instance. You would need to terminate the instance and create a new one. Keep a secure backup of `eventpatro-key.pem`.

---

## Quick Reference Commands

### SSH into the server
```bash
ssh -i ~/Downloads/eventpatro-key.pem ubuntu@3.92.194.55
```

### Check if the backend is running
```bash
pm2 status
pm2 logs eventpatro-backend --lines 50
```

### Restart the backend manually
```bash
pm2 restart all --update-env
```

### Check the .env file on the server
```bash
cat /var/www/eventpatro/server/.env
```

### Check Nginx status
```bash
sudo systemctl status nginx
sudo nginx -t
```

### Reload Nginx after config changes
```bash
sudo systemctl reload nginx
```

### View Nginx error log
```bash
sudo tail -50 /var/log/nginx/error.log
```

### Pull latest code and rebuild manually (without CI/CD)
```bash
cd /var/www/eventpatro
git pull origin main
cd server && npm install
cd ../client && npm install && npm run build
pm2 restart all --update-env
```

### Seed admin user and events
```bash
cd /var/www/eventpatro/server
npm run seed:admin
npm run seed:events
```

---

*Document last updated: November 2026. Live URL at time of writing: `http://3.92.194.55`*
