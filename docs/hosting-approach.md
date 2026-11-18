# Web Application Hosting & DevOps Deployment Guide
### Production Hosting on AWS EC2 with CloudFormation, Nginx, PM2 & GitHub Actions CI/CD

This document is a complete, step-by-step **Hosting & Infrastructure Guide** for deploying any full-stack web application (Node.js/Express backend + React/Vite/SPA frontend + Cloud Database) onto AWS EC2 using Infrastructure-as-Code and automated CI/CD.

Anyone can follow this guide to host their website on AWS from scratch without manual server configuration.

---

## Table of Contents

1. [Hosting Architecture Overview](#1-hosting-architecture-overview)
2. [Hosting Prerequisites & Requirements](#2-hosting-prerequisites--requirements)
3. [The 4 Infrastructure Files Needed](#3-the-4-infrastructure-files-needed)
   - [File 1: CloudFormation Infrastructure (`infra/ec2-instance.yaml`)](#file-1-infraec2-instanceyaml)
   - [File 2: Nginx Web Server & Reverse Proxy (`infra/nginx.conf`)](#file-2-infranginxconf)
   - [File 3: Process Manager Config (`server/ecosystem.config.cjs`)](#file-3-serverecosystemconfigcjs)
   - [File 4: Automated CI/CD Pipeline (`.github/workflows/deploy.yml`)](#file-4-githubworkflowsdeployyml)
4. [Step-by-Step Hosting Setup (From Scratch)](#4-step-by-step-hosting-setup-from-scratch)
   - [Step 1: Set Up Cloud Database (MongoDB Atlas)](#step-1-set-up-cloud-database-mongodb-atlas)
   - [Step 2: Collect AWS Credentials](#step-2-collect-aws-credentials)
   - [Step 3: Configure GitHub Secrets & Variables](#step-3-configure-github-secrets--variables)
   - [Step 4: Push Infrastructure Files & Deploy](#step-4-push-infrastructure-files--deploy)
   - [Step 5: Verify Live Website](#step-5-verify-live-website)
5. [Adapting Paths for Any Project Repository](#5-adapting-paths-for-any-project-repository)
6. [Handling AWS Lab Expiration & Automatic Server Recovery](#6-handling-aws-lab-expiration--automatic-server-recovery)
7. [Common Hosting Issues & Fixes](#7-common-hosting-issues--fixes)
8. [Live Server Maintenance & Useful Commands](#8-live-server-maintenance--useful-commands)
9. [Copy-Paste AI Prompt to Host Any Repository](#9-copy-paste-ai-prompt-to-host-any-repository)

---

## 1. Hosting Architecture Overview

When a visitor opens your website in their browser, here is how traffic flows through the server:

```
                            [ USER / BROWSER ]
                                    │
                                    │ HTTP Request (Port 80)
                                    ▼
                  ┌───────────────────────────────────┐
                  │          AWS EC2 INSTANCE         │
                  │         (Ubuntu 24.04 LTS)        │
                  │                                   │
                  │   ┌───────────────────────────┐   │
                  │   │    NGINX (Reverse Proxy)  │   │
                  │   └─────────────┬─────────────┘   │
                  │                 │                 │
                  │    ┌────────────┴───────────┐     │
                  │    │                        │     │
                  │    ▼                        ▼     │
                  │  Static Files           Backend   │
                  │  (Frontend React)       API (PM2) │
                  │  /var/www/app/.../dist  Port 5000 │
                  └─────────────────────────────┬─────┘
                                                │
                                                │ Database Connection
                                                ▼
                                    [ CLOUD DATABASE ]
                                    (MongoDB Atlas M0 - 24/7)
```

### Key Principles of this Hosting Setup:
1. **Nginx Web Server (Port 80):** The public entry point. It serves the frontend static build files (HTML, JS, CSS) at lightning speed, and routes all `/api/*` and `/uploads/*` requests to the internal Node.js backend.
2. **PM2 Process Manager:** Keeps the backend running continuously in the background. If the server reboots or code crashes, PM2 automatically revives it.
3. **AWS CloudFormation (Infrastructure-as-Code):** You don't have to manually launch instances, configure security groups, or manage `.pem` keys in the AWS console. A single YAML template creates the EC2 instance and key pair automatically.
4. **AWS Systems Manager (SSM) Parameter Store:** Stores the SSH private key inside AWS. GitHub Actions retrieves it dynamically on every deployment—no manual key copying.
5. **GitHub Actions CI/CD:** Every time you push code to `main`, GitHub builds the frontend, verifies the EC2 server, SSH-es in, updates code, and reloads PM2 automatically.

---

## 2. Hosting Prerequisites & Requirements

Before deploying, ensure you have:

| Requirement | Purpose | Cost |
|---|---|---|
| **AWS Account / Learner Lab** | Hosts the EC2 virtual machine (Ubuntu 24.04, `t2.micro`) | Free Tier / Lab Credits |
| **MongoDB Atlas Account** | 24/7 Cloud Database (not tied to EC2, persists across reboots) | 100% Free (M0 Cluster) |
| **GitHub Repository** | Source code hosting and automated CI/CD deployment runner | Free for public repos |
| **Node.js 20 or 22** | Runtime environment on the server | Open source |

---

## 3. The 4 Infrastructure Files Needed

To host your project, add these 4 files to your repository:

### File 1: `infra/ec2-instance.yaml`
*CloudFormation template that provisions the EC2 instance, security group, and key pair.*

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: MERN Stack Hosting Infrastructure (EC2 + SSM KeyPair + Security Group)

Parameters:
  InstanceType:
    Type: String
    Default: t2.micro
    Description: EC2 instance type (t2.micro is free-tier eligible)

  UbuntuAMI:
    Type: String
    Default: ami-0e86e20dae9224db8
    Description: Ubuntu 24.04 LTS AMI in us-east-1

  SSHLocation:
    Type: String
    Default: 0.0.0.0/0
    Description: Allow SSH from anywhere for GitHub Actions runners

Resources:
  # 1. SSH KeyPair auto-saved to Systems Manager Parameter Store
  ServerKeyPair:
    Type: AWS::EC2::KeyPair
    Properties:
      KeyName: !Sub "${AWS::StackName}-key"

  # 2. Security Group opening Port 80 (HTTP) and Port 22 (SSH)
  ServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Allow HTTP and SSH
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref SSHLocation

  # 3. Ubuntu Virtual Machine with Startup Bootstrap (UserData)
  ServerInstance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !Ref UbuntuAMI
      InstanceType: !Ref InstanceType
      KeyName: !Ref ServerKeyPair
      SecurityGroupIds:
        - !GetAtt ServerSecurityGroup.GroupId
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-server"
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          set -e
          exec > /var/log/userdata.log 2>&1

          # Install Node.js 22, Git, Nginx, PM2
          apt-get update -y
          curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
          apt-get install -y nodejs nginx git
          npm install -g pm2

          # Clone repository into web directory
          mkdir -p /var/www/app
          git clone https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPO_NAME>.git /var/www/app

          # Enable Nginx configuration
          cp /var/www/app/infra/nginx.conf /etc/nginx/sites-available/app
          ln -sf /etc/nginx/sites-available/app /etc/nginx/sites-enabled/app
          rm -f /etc/nginx/sites-enabled/default

          nginx -t
          systemctl enable nginx
          systemctl restart nginx

          chown -R ubuntu:ubuntu /var/www/app
          sudo -u ubuntu pm2 startup systemd -u ubuntu --hp /home/ubuntu | tail -1 | bash

Outputs:
  PublicIP:
    Description: Public IP of the server
    Value: !GetAtt ServerInstance.PublicIp

  PublicURL:
    Description: Live Web Application URL
    Value: !Sub "http://${ServerInstance.PublicIp}"

  SSMKeyPath:
    Description: Parameter Store path for private SSH key
    Value: !Sub "/ec2/keypair/${ServerKeyPair.KeyPairId}"
```

---

### File 2: `infra/nginx.conf`
*Nginx web server configuration file.*

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name _;

    client_max_body_size 15M;

    # 1. FRONTEND: Serve compiled React static files
    root /var/www/app/client/dist; # <-- adjust to your frontend dist path
    index index.html;

    # SPA routing fallback: prevents 404 error when refreshing pages
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 2. BACKEND API: Reverse proxy requests to Express on internal port
    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/; # <-- adjust port if backend uses 4000
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 3. UPLOADS: Serve uploaded user media/images
    # '^~' gives priority so static regex caching doesn't intercept it
    location ^~ /uploads/ {
        proxy_pass http://127.0.0.1:5000/uploads/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 4. STATIC CACHING: Speeds up CSS, JS, fonts, and images
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
```

---

### File 3: `server/ecosystem.config.cjs`
*PM2 configuration to manage and run the backend continuously.*

```javascript
module.exports = {
  apps: [
    {
      name: 'web-backend',
      script: 'src/server.js',          // Path to your backend start file
      cwd: '/var/www/app/server',       // Backend folder on the server
      exec_mode: 'fork',                // MUST be 'fork' on single-core t2.micro
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
    },
  ],
}
```

---

### File 4: `.github/workflows/deploy.yml`
*Automated GitHub Actions CI/CD deployment pipeline.*

```yaml
name: Deploy Web Application (CloudFormation + SSH)

on:
  push:
    branches:
      - main
  workflow_dispatch:

env:
  AWS_REGION: us-east-1
  STACK_NAME: web-app-stack

jobs:
  build:
    name: Build Frontend
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: client/package-lock.json

      - name: Install & Build Frontend
        env:
          VITE_API_URL: /api
        run: |
          cd client
          npm ci
          npm run build

  deploy:
    name: Deploy to EC2
    runs-on: ubuntu-latest
    needs: build

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-session-token: ${{ secrets.AWS_SESSION_TOKEN }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Deploy CloudFormation Stack (Create or Update EC2)
        run: |
          aws cloudformation deploy \
            --stack-name ${{ env.STACK_NAME }} \
            --template-file infra/ec2-instance.yaml \
            --parameter-overrides InstanceType=t2.micro \
            --no-fail-on-empty-changeset \
            --region ${{ env.AWS_REGION }}

      - name: Retrieve EC2 Public IP
        id: get-ip
        run: |
          IP=$(aws cloudformation describe-stacks \
            --stack-name ${{ env.STACK_NAME }} \
            --region ${{ env.AWS_REGION }} \
            --query "Stacks[0].Outputs[?OutputKey=='PublicIP'].OutputValue" \
            --output text)
          echo "EC2_IP=$IP" >> $GITHUB_OUTPUT
          echo "Server Public IP: $IP"

      - name: Retrieve SSH Key from SSM Parameter Store
        id: get-key
        run: |
          SSM_PATH=$(aws cloudformation describe-stacks \
            --stack-name ${{ env.STACK_NAME }} \
            --region ${{ env.AWS_REGION }} \
            --query "Stacks[0].Outputs[?OutputKey=='SSMKeyPath'].OutputValue" \
            --output text)
          aws ssm get-parameter \
            --name "$SSM_PATH" \
            --with-decryption \
            --region ${{ env.AWS_REGION }} \
            --query "Parameter.Value" \
            --output text > /tmp/server-key.pem
          chmod 600 /tmp/server-key.pem

      - name: Wait for SSH Availability
        run: |
          IP=${{ steps.get-ip.outputs.EC2_IP }}
          for i in $(seq 1 36); do
            if nc -zw5 "$IP" 22 2>/dev/null; then
              echo "SSH port 22 is open!"
              exit 0
            fi
            echo "Waiting for SSH on $IP... ($i/36)"
            sleep 10
          done
          exit 1

      - name: Deploy Code & Restart Services via SSH
        uses: appleboy/ssh-action@v1.2.0
        env:
          EC2_IP: ${{ steps.get-ip.outputs.EC2_IP }}
          MONGODB_URI: ${{ secrets.MONGODB_URI }}
          JWT_SECRET: ${{ secrets.JWT_SECRET }}
        with:
          host: ${{ steps.get-ip.outputs.EC2_IP }}
          username: ubuntu
          key_path: /tmp/server-key.pem
          script_stop: true
          envs: EC2_IP,MONGODB_URI,JWT_SECRET
          script: |
            echo ">>> [1/6] Waiting for cloud-init instance bootstrap..."
            sudo cloud-init status --wait || true

            echo ">>> [2/6] Pulling latest code..."
            cd /var/www/app
            git fetch origin main
            git reset --hard origin/main

            echo ">>> [3/6] Installing backend dependencies..."
            cd /var/www/app/server
            npm ci --omit=dev

            echo ">>> [4/6] Generating server .env file..."
            printf "%s\n" \
              "PORT=5000" \
              "NODE_ENV=production" \
              "CLIENT_URL=http://$EC2_IP" \
              "MONGODB_URI=$MONGODB_URI" \
              "JWT_SECRET=$JWT_SECRET" \
              > /var/www/app/server/.env

            echo ">>> [5/6] Building React frontend..."
            cd /var/www/app/client
            npm ci
            npm run build

            echo ">>> [6/6] Reloading PM2 and Nginx..."
            cd /var/www/app/server
            pm2 delete all 2>/dev/null || true
            pm2 start ecosystem.config.cjs --update-env
            pm2 save
            sudo cp /var/www/app/infra/nginx.conf /etc/nginx/sites-available/app
            sudo nginx -t && sudo systemctl reload nginx

      - name: Print Live Web Application URL
        run: echo "🎉 Website is live at http://${{ steps.get-ip.outputs.EC2_IP }}"

      - name: Clean up temporary SSH key
        if: always()
        run: rm -f /tmp/server-key.pem
```

---

## 4. Step-by-Step Hosting Setup (From Scratch)

Follow these 5 steps to take your project from local files to live hosting on the internet:

### Step 1: Set Up Cloud Database (MongoDB Atlas)
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/) and create a free account.
2. Create an **M0 Free Cluster**.
3. Under **Database Access**: Create a database user and password.
4. Under **Network Access**: Click **Add IP Address** $\rightarrow$ Click **Allow Access from Anywhere (`0.0.0.0/0`)** $\rightarrow$ Confirm.  
   *(Crucial: EC2 IP changes when restarted; this ensures the server never gets blocked).*
5. Under **Database $\rightarrow$ Connect $\rightarrow$ Drivers**: Copy your connection string:
   ```
   mongodb+srv://<USERNAME>:<PASSWORD>@<CLUSTER>.mongodb.net/<DB_NAME>?retryWrites=true&w=majority
   ```

### Step 2: Collect AWS Credentials
1. In your AWS Learner Lab / VocLabs console: Click **Start Lab** and wait for the circle to turn **green**.
2. Click **AWS Details $\rightarrow$ Show** (next to AWS CLI).
3. Copy the 3 values from the `[default]` block:
   - `aws_access_key_id`
   - `aws_secret_access_key`
   - `aws_session_token` (very long string)

### Step 3: Configure GitHub Secrets & Variables
In your GitHub Repository, open **Settings $\rightarrow$ Secrets and variables $\rightarrow$ Actions**:

#### Add Repository Secrets:
| Secret Name | Value |
|---|---|
| `AWS_ACCESS_KEY_ID` | `ASIA...` (from Step 2) |
| `AWS_SECRET_ACCESS_KEY` | `xxxx...` (from Step 2) |
| `AWS_SESSION_TOKEN` | `FwoGZX...` (full long string from Step 2) |
| `MONGODB_URI` | Full connection string (from Step 1) |
| `JWT_SECRET` | Any long random string for auth tokens |

#### Add Repository Variable:
Click the **Variables** tab $\rightarrow$ Click **New repository variable**:
- Name: `AWS_REGION`
- Value: `us-east-1`

### Step 4: Push Infrastructure Files & Deploy
1. Place the 4 files (`infra/ec2-instance.yaml`, `infra/nginx.conf`, `server/ecosystem.config.cjs`, `.github/workflows/deploy.yml`) into your repository.
2. Commit and push to `main`:
   ```bash
   git add .
   git commit -m "feat(hosting): add AWS CloudFormation and automated CI/CD pipeline"
   git push origin main
   ```
3. Open your GitHub repository $\rightarrow$ Click the **Actions** tab.
4. The workflow will run automatically! (First run takes 6–8 minutes to create the server).

### Step 5: Verify Live Website
Once the workflow has a green checkmark:
- Expand the step **Print Live Web Application URL**.
- Click the printed link (e.g. `http://54.x.x.x`) to view your live, running web application!

---

## 5. Adapting Paths for Any Project Repository

If your project folders differ from this template, adjust these exact lines:

| What to change | Where to change it | What to change it to |
|---|---|---|
| **Frontend folder is `frontend/` instead of `client/`** | `deploy.yml` & `nginx.conf` | Change `cd client` to `cd frontend`, and root to `/var/www/app/frontend/dist` |
| **Backend folder is `backend/` instead of `server/`** | `deploy.yml` & `ecosystem.config.cjs` | Change `cd server` to `cd backend`, and `cwd` to `/var/www/app/backend` |
| **Backend runs on port 4000 instead of 5000** | `nginx.conf`, `deploy.yml`, `ecosystem.config.cjs` | Change `5000` to `4000` |
| **App has an Admin portal (e.g. `/admin`)** | `nginx.conf` | Add: `location /admin/ { try_files $uri $uri/ /admin/index.html; }` |

---

## 6. Handling AWS Lab Expiration & Automatic Server Recovery

In student environments (VocLabs / AWS Academy), sessions automatically expire after 4 hours.

### What happens when the lab times out?
AWS shuts down the virtual machine and revokes the temporary credentials.

### How to bring your website back up in 60 seconds:
1. Open the lab and click **Start Lab**.
2. Click **AWS Details $\rightarrow$ Show** and copy the new `[default]` keys.
3. Update `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `AWS_SESSION_TOKEN` in GitHub Secrets.
4. Go to **Actions** in GitHub and click **Re-run all jobs**.
5. CloudFormation automatically finds your instance, updates the IP, and brings your site back online!

---

## 7. Common Hosting Issues & Fixes

### 1. `ERR_CONNECTION_REFUSED localhost:5000`
* **Cause:** Frontend code calls `http://localhost:5000/api` directly instead of a relative path. In production, this tells the user's browser to connect to their own computer!
* **Fix:** In your frontend API utility, use relative paths in production:
  ```javascript
  const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:5000/api';
  ```

### 2. `502 Bad Gateway` / `Unexpected token '<'`
* **Cause:** Nginx is running, but Express is down or crashed on port 5000.
* **Fix:** Connect to EC2 and inspect backend error logs: `pm2 logs --lines 50`. Usually caused by a missing `.env` variable or MongoDB Atlas blocking the connection.

### 3. Uploaded Images Return 404
* **Cause:** Nginx static regex rules (`\.(jpg|png)`) intercept image requests before the `/uploads/` rule.
* **Fix:** Use the `^~` modifier in `nginx.conf`:
  ```nginx
  location ^~ /uploads/ {
      proxy_pass http://127.0.0.1:5000/uploads/;
  }
  ```

### 4. PM2 Crashes with `SIGINT` (16 Restarts Errored)
* **Cause:** Running PM2 in cluster mode on a single-core `t2.micro` machine.
* **Fix:** Always set `exec_mode: 'fork'` and `instances: 1` in `ecosystem.config.cjs`.

### 5. Page Refresh Returns 404 on React Router Paths
* **Cause:** Nginx looks on disk for a folder named `/dashboard`, which doesn't exist.
* **Fix:** Ensure `try_files $uri $uri/ /index.html;` is present in `nginx.conf`.

---

## 8. Live Server Maintenance & Useful Commands

Connect to your EC2 instance via **EC2 Instance Connect** in the AWS Console and run these commands to inspect the live server:

```bash
# Check if the Node.js backend is running
pm2 status

# View live backend error and console logs
pm2 logs --lines 50

# Restart backend with fresh environment variables
pm2 restart all --update-env

# View real-time incoming web traffic through Nginx
sudo tail -f /var/log/nginx/access.log

# View Nginx web server error logs
sudo tail -f /var/log/nginx/error.log

# Test Nginx syntax and reload after configuration changes
sudo nginx -t && sudo systemctl reload nginx
```

---

## 9. Copy-Paste AI Prompt to Host Any Repository

If your classmates or friends want their AI assistant to set up this exact hosting pipeline for their repository, they can copy and paste this prompt:

```markdown
I want to host my full-stack web application on AWS EC2 using an automated CloudFormation + GitHub Actions CI/CD pipeline.

Please inspect my repository structure and implement the following hosting architecture:

1. CloudFormation Template (infra/ec2-instance.yaml):
   - Provisions an Ubuntu 24.04 LTS t2.micro EC2 instance.
   - Automatically generates an SSH KeyPair stored in AWS Systems Manager Parameter Store (/ec2/keypair/*).
   - Configures a Security Group opening Port 80 (HTTP) and Port 22 (SSH).
   - Injects UserData script to install Node.js 22, Git, Nginx, PM2, and clone this repository.
   - Outputs PublicIP, PublicURL, and SSMKeyPath.

2. Nginx Web Server (infra/nginx.conf):
   - Serves the compiled frontend build with try_files $uri $uri/ /index.html (SPA routing).
   - Reverse proxies /api/ requests to Express on internal port (e.g. 5000 or 4000).
   - Reverse proxies /uploads/ with the '^~' priority modifier so media uploads are not blocked by static regex rules.

3. PM2 Configuration (server/ecosystem.config.cjs or backend/ecosystem.config.cjs):
   - Configures exec_mode: 'fork' and instances: 1 to ensure stability on single-core t2.micro instances.

4. GitHub Actions Workflow (.github/workflows/deploy.yml):
   - Build job: compiles the frontend bundle.
   - Deploy job: authenticates to AWS, deploys CloudFormation stack, dynamically retrieves PublicIP and SSM SSH key, waits for cloud-init bootstrap, connects via SSH, pulls code, generates .env from GitHub Secrets, builds frontend, and restarts PM2 cleanly with --update-env.

Please adapt all directory paths and ports to match my specific project structure, and list the exact GitHub Secrets I need to configure.
```

---

*Web Application Hosting & DevOps Deployment Guide — Automated with AWS CloudFormation, SSM Parameter Store, Nginx, PM2 & GitHub Actions.*
