# Eventpatro — Architecture & Deployment Guide

This project is a full-stack MERN (MongoDB, Express, React, Node.js) event management web application. This document details **how the application is deployed, how the infrastructure works, how the CI/CD pipeline runs, and how secrets are handled**.

---

## 1. High-Level Architecture

The production setup uses a single Ubuntu EC2 instance on AWS managed through Infrastructure as Code (CloudFormation) and automated GitHub Actions CI/CD.

```
                      Internet / Users
                             │
                             ▼ (Port 80 HTTP)
             ┌────────────────────────────────┐
             │       AWS EC2 (Ubuntu 24)      │
             │                                │
             │  ┌──────────────────────────┐  │
             │  │       Nginx Proxy        │  │
             │  └──────┬────────────┬──────┘  │
             │         │            │         │
             │         │ /api/*     │ /*      │
             │         ▼            ▼         │
             │  ┌────────────┐ ┌───────────┐  │
             │  │ PM2 Node.js│ │ Static    │  │
             │  │   Express  │ │ React App │  │
             │  │ (Port 5000)│ │  (dist/)  │  │
             │  └──────┬─────┘ └───────────┘  │
             └─────────┼──────────────────────┘
                       ▼
             ┌───────────────────┐
             │   MongoDB Atlas   │
             │ (Database Cloud)  │
             └───────────────────┘
```

### How Traffic Flows:
1. When a user opens `http://<EC2-IP>/`, **Nginx** handles the request and directly serves the compiled, optimized React static files (`/var/www/eventpatro/client/dist`).
2. When the React app makes an API request (e.g., `GET /api/events`), **Nginx** acts as a reverse proxy, forwarding traffic internally to `http://localhost:5000`.
3. The **Express API** (kept running 24/7 by **PM2**) processes the business logic and queries **MongoDB Atlas**.

---

## 2. Infrastructure as Code (AWS CloudFormation)

Instead of manually clicking through the AWS console every time, the infrastructure is defined as code in [`infra/ec2-instance.yaml`](file:///home/kash/year1/training-sem/mern_project/infra/ec2-instance.yaml).

### Resources Provisioned by CloudFormation:
* **EC2 Instance (`t2.micro`)**: Runs Ubuntu 24.04 LTS.
* **Security Group (Firewall)**:
  * Port `22` (SSH): Open for GitHub Actions deployment and manual terminal access.
  * Port `80` (HTTP): Open to the public for web traffic.
  * Port `5000`: Blocked from outside access; only reachable internally by Nginx.
* **EC2 Key Pair (`AWS::EC2::KeyPair`)**: Automatically generates an SSH key pair.
* **SSM Parameter Store**: Stores the generated private SSH key safely in AWS Systems Manager (`/ec2/keypair/<key-id>`) so GitHub Actions can retrieve it without hardcoding keys anywhere.
* **UserData Startup Script**: Automatically runs on initial boot to install Node.js 22, Nginx, PM2, and clone the repository.

---

## 3. Automated CI/CD Pipeline (GitHub Actions)

Every time code is pushed to the `main` branch, the workflow in [`.github/workflows/deploy.yml`](file:///home/kash/year1/training-sem/mern_project/.github/workflows/deploy.yml) triggers automatically.

It runs in two distinct jobs:

### Job 1: Build (Runs in GitHub's Cloud Runner)
1. Checks out the code.
2. Sets up Node.js 22.
3. Installs frontend dependencies (`npm ci` in `client`).
4. Runs `npm run build` with `VITE_API_URL=/api` to compile the React code into static HTML/CSS/JS (`client/dist`).
5. Uploads `client/dist` as a workflow artifact.

### Job 2: Deploy (Provisions & Updates EC2)
1. Authenticates to AWS using temporary or permanent IAM credentials.
2. Runs `aws cloudformation deploy` to create or update the EC2 instance stack.
3. Queries CloudFormation stack outputs to get:
   * The EC2 instance's **Public IP**.
   * The **SSM Parameter Store path** of the SSH private key.
4. Retrieves the SSH private key dynamically from SSM Parameter Store.
5. Waits for SSH port 22 on the EC2 instance to be ready.
6. Connects to EC2 using `appleboy/ssh-action` and runs the deploy script:
   * Pulls the latest code from `main` (`git reset --hard origin/main`).
   * Installs production dependencies in `server` (`npm ci --omit=dev`).
   * Writes the production `.env` file using GitHub repository secrets.
   * Restarts the Node.js backend using **PM2** (`pm2 restart eventpatro-api`).
   * Copies the fresh React `dist/` build and reloads **Nginx** (`sudo systemctl reload nginx`).

---

## 4. Secrets & Configuration Management

To keep credentials secure, **no passwords, tokens, or database strings are committed into GitHub**. Everything is stored in **GitHub Repository Secrets**:

| Secret Name | Purpose | Where It Is Used |
|---|---|---|
| `AWS_ACCESS_KEY_ID` | AWS IAM Access Key | GitHub Actions AWS authentication |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM Secret Key | GitHub Actions AWS authentication |
| `AWS_SESSION_TOKEN` | Required if using AWS Learner Lab / temporary session | AWS CLI configuration |
| `MONGODB_URI` | Connection string to cloud database (MongoDB Atlas) | Written to server's `.env` on EC2 |
| `JWT_SECRET` | Secret key used to sign and verify user auth tokens | Written to server's `.env` on EC2 |
| `SMTP_USER` | Gmail address for sending verification OTPs | Written to server's `.env` on EC2 |
| `SMTP_PASS` | Gmail 16-character App Password | Written to server's `.env` on EC2 |

### On the EC2 Server:
During deployment, GitHub Actions generates `/var/www/eventpatro/server/.env` with these values:
```env
PORT=5000
NODE_ENV=production
MONGODB_URI=<From GitHub Secret>
JWT_SECRET=<From GitHub Secret>
CLIENT_URL=http://<EC2_PUBLIC_IP>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<From GitHub Secret>
SMTP_PASS=<From GitHub Secret>
```

---

## 5. Local Development Quickstart

If you need to run the project locally on your machine:

### Prerequisites:
* Node.js (v18+)
* MongoDB (Local instance or MongoDB Atlas URI)

### Setup:
1. Clone the repo:
   ```bash
   git clone https://github.com/codebykashish/eventpatro.git
   cd mern_project
   ```
2. Setup environment variables:
   ```bash
   cp server/.env.example server/.env
   # Fill in MONGODB_URI and JWT_SECRET in server/.env
   ```
3. Install dependencies:
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```
4. Start both servers:
   ```bash
   # Terminal 1 - Backend (port 5000)
   cd server && npm run dev

   # Terminal 2 - Frontend (port 5173)
   cd client && npm run dev
   ```

---

## 6. Common Operations & Troubleshooting

* **Check backend status on EC2:**
  ```bash
  pm2 status
  pm2 logs eventpatro-api
  ```
* **Check Nginx status on EC2:**
  ```bash
  sudo systemctl status nginx
  sudo nginx -t
  ```
* **Verify API Health:**
  Visit `http://<EC2-IP>/api/health` — it will return:
  ```json
  { "success": true, "message": "Eventpatro server is running." }
  ```
