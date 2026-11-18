# Universal MERN DevOps & AWS EC2 Deployment Guide
### CloudFormation + Systems Manager (SSM) + GitHub Actions CI/CD + Nginx + PM2

> **About this document:**  
> This guide outlines the complete, production-grade DevOps and deployment pipeline implemented for the **Eventpatro** MERN project.  
> It is structured as a **Universal Master Guide** so any student or developer can adapt the exact same architecture, files, and step-by-step workflow to **any MERN stack application** (single frontend, admin portals, or custom ports).

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Why This Approach? (Advantages over Manual Hosting)](#2-why-this-approach-advantages-over-manual-hosting)
3. [Universal Project Mapping (How to adapt for YOUR repo)](#3-universal-project-mapping)
4. [The 4 Reusable Infrastructure Files](#4-the-4-reusable-infrastructure-files)
   - [File 1: CloudFormation Template (`infra/ec2-instance.yaml`)](#file-1-infraec2-instanceyaml)
   - [File 2: Nginx Reverse Proxy Config (`infra/nginx.conf`)](#file-2-infranginxconf)
   - [File 3: PM2 Process Config (`server/ecosystem.config.cjs`)](#file-3-serverecosystemconfigcjs)
   - [File 4: GitHub Actions Workflow (`.github/workflows/deploy.yml`)](#file-4-githubworkflowsdeployyml)
5. [Prerequisites & One-Time Setup](#5-prerequisites--one-time-setup)
   - [Step 1: MongoDB Atlas (Free Cloud Database)](#step-1-mongodb-atlas-free-cloud-database)
   - [Step 2: SMTP / Email Authentication (Optional / As needed)](#step-2-smtp--email-authentication)
   - [Step 3: AWS Learner Lab Credentials](#step-3-aws-learner-lab-credentials)
   - [Step 4: Configure GitHub Secrets & Variables](#step-4-configure-github-secrets--variables)
6. [Step-by-Step: Deploying for the First Time](#6-step-by-step-deploying-for-the-first-time)
7. [Operational Guide: Handling Learner Lab 4-Hour Timeouts](#7-operational-guide-handling-learner-lab-timeouts)
8. [Real-World Issues Encountered & Concrete Fixes](#8-real-world-issues-encountered--concrete-fixes)
9. [Copy-and-Paste AI Prompt for Your Friends](#9-copy-and-paste-ai-prompt-for-your-friends)
10. [Quick-Reference Server Commands](#10-quick-reference-server-commands)

---

## 1. Architecture Overview

```
                      [ USER / BROWSER ]
                              │
                              │ HTTP (Port 80)
                              ▼
            ┌────────────────────────────────────┐
            │       NGINX (Reverse Proxy)        │
            │          on AWS EC2                │
            └──────────────┬─────────────────────┘
                           │
             ┌─────────────┴─────────────┐
             │                           │
             ▼                           ▼
    [ STATIC FRONTEND ]          [ EXPRESS BACKEND ]
    Compiled Vite/React          Node.js API (Port 5000 / 4000)
    (/var/www/.../dist)          Managed 24/7 by PM2 (Fork Mode)
                                         │
                                         │ Mongoose Connection
                                         ▼
                               [ MONGODB ATLAS (Cloud) ]
                               (Persistent M0 24/7 Database)
```

### Deployment Pipeline Workflow:

```
[ Developer pushes to main ]
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│                   GITHUB ACTIONS CI/CD                      │
├─────────────────────────────────────────────────────────────┤
│ 1. BUILD JOB:                                               │
│    - Checkout code & setup Node.js                          │
│    - Install dependencies & compile React (npm run build)   │
│    - Upload 'dist' artifact                                 │
│                                                             │
│ 2. DEPLOY JOB:                                              │
│    - Authenticate to AWS using Learner Lab credentials      │
│    - Run CloudFormation (Creates/updates EC2 & Security Grp)│
│    - Read dynamically generated Public IP from Stack Output │
│    - Retrieve SSH Key from AWS SSM Parameter Store          │
│    - Wait for EC2 cloud-init (UserData) setup to finish     │
│    - SSH into EC2 (via appleboy/ssh-action):                │
│        • git pull latest code                               │
│        • Install production backend dependencies (npm ci)   │
│        • Inject secure .env from GitHub Secrets             │
│        • Build React frontend bundle                        │
│        • Start/Reload PM2 service cleanly in fork mode      │
│        • Test & reload Nginx configuration                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Why This Approach? (Advantages over Manual Hosting)

| Feature | Manual EC2 Hosting (Traditional) | Our CloudFormation + SSM Approach |
|---|---|---|
| **EC2 Creation** | Manual clicking in AWS Console | **Infrastructure as Code (IaC)** via 1 YAML file |
| **Learner Lab Reset** | Instance terminates $\rightarrow$ must recreate from scratch | Run GitHub Action $\rightarrow$ **Recreates instance automatically** |
| **Changing IP Handling** | Must manually update `EC2_HOST` in secrets every restart | **Zero manual updates**: IP is fetched dynamically from CloudFormation outputs |
| **SSH Key Security** | Download `.pem` $\rightarrow$ copy into GitHub Secrets | **AWS SSM Parameter Store** stores and provides key dynamically |
| **Server Crash Protection** | Backend crashes $\rightarrow$ site stays offline | **PM2 process manager** restarts backend instantly on crash or reboot |
| **Routing & SPA Support** | Refreshing `/dashboard` or `/login` returns 404 | Nginx `try_files $uri /index.html;` ensures React Router works |

---

## 3. Universal Project Mapping

Different MERN projects have slightly different folder structures. Use this reference table to map paths for your specific application:

| Component | Eventpatro (This Repo) | Standard MERN (Alternative) | Dual Frontend (Customer + Admin) |
|---|---|---|---|
| **Frontend Directory** | `client/` | `frontend/` | `frontend/` (Customer) & `admin/` (Admin) |
| **Backend Directory** | `server/` | `backend/` | `backend/` |
| **Backend Port** | `5000` | `5000` or `4000` | `4000` |
| **Build Output** | `client/dist` | `frontend/dist` or `build` | `frontend/dist` & `admin/dist` |
| **Nginx Document Root** | `/var/www/eventpatro/client/dist` | `/var/www/<project>/frontend/dist` | `/var/www/<project>/frontend/dist` |
| **Admin Sub-path** | N/A (Admin is a page) | N/A | `/admin/` (Vite base: `'/admin/'`) |
| **Uploaded Files** | `server/uploads/` | `backend/uploads/` | `backend/uploads/` |

---

## 4. The 4 Reusable Infrastructure Files

Place these 4 configuration files in your repository. They contain zero secrets and can be committed directly to Git.

### File 1: `infra/ec2-instance.yaml`
*Provisions the EC2 instance, security firewall, and SSH key pair automatically in AWS.*

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: >
  MERN stack infrastructure: EC2 key pair (private key stored in SSM Parameter Store),
  Security Group (ports 80 & 22), and Ubuntu 24.04 EC2 instance with Node.js, PM2, and Nginx.

Parameters:
  InstanceType:
    Type: String
    Default: t2.micro
    Description: EC2 instance type (t2.micro is free-tier eligible in Learner Lab)

  UbuntuAMI:
    Type: String
    Default: ami-0e86e20dae9224db8
    Description: Ubuntu 24.04 LTS AMI for us-east-1

  SSHLocation:
    Type: String
    Default: 0.0.0.0/0
    Description: Allow SSH from anywhere (required because GitHub runner IPs change)

Resources:
  # 1. Key Pair automatically saved in AWS Systems Manager (SSM)
  ServerKeyPair:
    Type: AWS::EC2::KeyPair
    Properties:
      KeyName: !Sub "${AWS::StackName}-key"

  # 2. Security Group allowing Web (80) and SSH (22)
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

  # 3. Ubuntu EC2 Instance with First-Boot Provisioning Script
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

          apt-get update -y
          curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
          apt-get install -y nodejs nginx git

          npm install -g pm2

          mkdir -p /var/www/app
          # Replace with your repository URL:
          git clone https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPO_NAME>.git /var/www/app

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
    Description: Public IP address of the EC2 instance
    Value: !GetAtt ServerInstance.PublicIp

  PublicURL:
    Description: Live HTTP URL
    Value: !Sub "http://${ServerInstance.PublicIp}"

  SSMKeyPath:
    Description: Path in SSM Parameter Store where private key is stored
    Value: !Sub "/ec2/keypair/${ServerKeyPair.KeyPairId}"
```

---

### File 2: `infra/nginx.conf`
*Routes traffic between compiled frontend static assets, uploaded media, and Express backend.*

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name _;

    # Maximum file upload size (e.g. for profile/cover photos)
    client_max_body_size 15M;

    # 1. FRONTEND: Serve compiled React/Vite assets
    root /var/www/app/client/dist; # <-- adjust to your frontend dist path
    index index.html;

    # React Router fallback: prevent 404 on page refresh
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 2. BACKEND API: Reverse proxy to Express
    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/; # <-- adjust port to match backend
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 3. UPLOADS: Priority reverse proxy for local uploaded images
    # The '^~' ensures this rule takes precedence over static regex caching
    location ^~ /uploads/ {
        proxy_pass http://127.0.0.1:5000/uploads/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 4. STATIC ASSET CACHING: Improves performance for JS/CSS/Fonts
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
```

---

### File 3: `server/ecosystem.config.cjs`
*Configures PM2 daemon to keep the backend running reliably without memory leaks or SIGINT crashes.*

```javascript
module.exports = {
  apps: [
    {
      name: 'mern-backend',
      script: 'src/server.js',                // Entry point
      cwd: '/var/www/app/server',             // Backend working directory on EC2
      exec_mode: 'fork',                      // MUST be 'fork' on single-core t2.micro
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
*Automated GitHub Actions CI/CD pipeline triggering on push to `main`.*

```yaml
name: Deploy MERN Application (CloudFormation + SSH)

on:
  push:
    branches:
      - main
  workflow_dispatch:

env:
  AWS_REGION: us-east-1
  STACK_NAME: mern-app-stack

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
          echo "Deploying to IP: $IP"

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

      - name: Deploy Code & Restart PM2 via SSH
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
            echo ">>> [1/6] Waiting for initial cloud-init bootstrap to finish..."
            sudo cloud-init status --wait || true

            echo ">>> [2/6] Pulling latest changes from git..."
            cd /var/www/app
            git fetch origin main
            git reset --hard origin/main

            echo ">>> [3/6] Installing backend dependencies..."
            cd /var/www/app/server
            npm ci --omit=dev

            echo ">>> [4/6] Injecting environment variables..."
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
        run: echo "🎉 Application is live at http://${{ steps.get-ip.outputs.EC2_IP }}"

      - name: Cleanup Temporary Key
        if: always()
        run: rm -f /tmp/server-key.pem
```

---

## 5. Prerequisites & One-Time Setup

### Step 1: MongoDB Atlas (Free Cloud Database)
1. Log into [MongoDB Atlas](https://cloud.mongodb.com/).
2. Create a free **M0 Cluster** (permanent free tier).
3. Under **Security $\rightarrow$ Database Access**: Create a username and password.
4. Under **Security $\rightarrow$ Network Access**: Click **Add IP Address** $\rightarrow$ Select **Allow Access from Anywhere (`0.0.0.0/0`)**.
   > *Why?* Because AWS Learner Lab changes public IP addresses on each reset; restricting access to a specific IP will cause backend crashes when the IP changes.
5. Under **Database $\rightarrow$ Connect $\rightarrow$ Drivers**: Copy your connection URI string:
   ```
   mongodb+srv://<USERNAME>:<PASSWORD>@<CLUSTER>.mongodb.net/<DB_NAME>?retryWrites=true&w=majority
   ```

### Step 2: SMTP / Email Authentication (Optional)
If your app sends emails (e.g., OTP verification):
1. In Google Account: Navigate to **Security $\rightarrow$ 2-Step Verification $\rightarrow$ App Passwords**.
2. Generate an App Password for "Mail".
3. Save the 16-character code (e.g. `abcd efgh ijkl mnop`).

### Step 3: AWS Learner Lab Credentials
1. In AWS Academy / VocLabs: Click **Start Lab** and wait for the circle to turn **green**.
2. Click **AWS Details** $\rightarrow$ Click **Show** next to AWS CLI.
3. Keep the 3 lines from the `[default]` block open:
   - `aws_access_key_id`
   - `aws_secret_access_key`
   - `aws_session_token` (long string)

### Step 4: Configure GitHub Secrets & Variables
In your GitHub Repository, navigate to **Settings $\rightarrow$ Secrets and variables $\rightarrow$ Actions**:

#### Add Repository Secrets:
| Secret Name | Value | Description |
|---|---|---|
| `AWS_ACCESS_KEY_ID` | `ASIA...` | Temporary AWS access key from Learner Lab |
| `AWS_SECRET_ACCESS_KEY` | `xxxx...` | Temporary AWS secret key |
| `AWS_SESSION_TOKEN` | `FwoGZX...` | Temporary AWS session token |
| `MONGODB_URI` | `mongodb+srv://...` | Full MongoDB Atlas connection string |
| `JWT_SECRET` | `your_secret_string` | Random long string used for signing authentication tokens |

*(Add any additional project secrets as needed, such as `SMTP_USER`, `SMTP_PASS`, or Cloudinary keys).*

#### Add Repository Variable:
Under the **Variables** tab (next to Secrets):
- Name: `AWS_REGION`
- Value: `us-east-1`

---

## 6. Step-by-Step: Deploying for the First Time

1. **Commit and Push Infrastructure Files:**
   Add `infra/ec2-instance.yaml`, `infra/nginx.conf`, `server/ecosystem.config.cjs`, and `.github/workflows/deploy.yml` to your Git repo and push to `main`.
2. **Trigger Workflow:**
   Navigate to GitHub $\rightarrow$ **Actions** $\rightarrow$ Select **Deploy MERN Application** $\rightarrow$ Click **Run workflow**.
3. **Monitor the First Run:**
   - The first run takes **6 to 8 minutes** because AWS creates the virtual machine, sets up the security group, and `cloud-init` installs Node.js, PM2, and Nginx.
   - Subsequent code-only deployments take **under 2 minutes** because CloudFormation detects the server already exists and skips directly to pulling and restarting the app.
4. **Access the Application:**
   Click on the completed job, open the **Print Live Web Application URL** step, and open the URL in your browser!

---

## 7. Operational Guide: Handling Learner Lab Timeouts

In student environments like AWS Academy Learner Lab or VocLabs, sessions automatically expire after 4 hours.

### What happens when the lab times out?
- The EC2 instance powers off.
- The previous AWS temporary keys expire (resulting in `voc-cancel-cred` or `403 AccessDenied`).
- The website temporarily becomes unreachable.

### How to bring it back up in 60 seconds:
1. Open Learner Lab and click **Start Lab**.
2. Click **AWS Details $\rightarrow$ Show** and copy the fresh `[default]` credentials.
3. In GitHub Settings $\rightarrow$ Secrets, update:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_SESSION_TOKEN`
4. In GitHub Actions, click **Re-run all jobs** on the latest workflow.
5. CloudFormation will detect the instance, start it up, update the IP address, deploy your code, and your site is back online!

---

## 8. Real-World Issues Encountered & Concrete Fixes

Below are the 8 real-world issues encountered and resolved during implementation. This troubleshooting section serves as a direct reference for common bugs:

### 1. Hardcoded `localhost:5000` in React Production Build
* **Symptom:** The site loads, but API calls fail with `ERR_CONNECTION_REFUSED localhost:5000`.
* **Cause:** Frontend utility files (like `api.js` or Axios instances) had `http://localhost:5000` hardcoded. When built for production, the user's browser tried to reach their own laptop instead of the server.
* **Fix:** Use relative paths in production:
  ```javascript
  const API_BASE = import.meta.env.PROD ? '/api' : 'http://localhost:5000/api';
  ```

### 2. Uploaded Media / Images Returning 404
* **Symptom:** Images uploaded to `/uploads/` do not render or return 404.
* **Cause:** In Nginx, regex rules like `location ~* \.(jpg|png)` take priority over standard prefix rules like `location /uploads/`. Nginx looked for uploaded files in the frontend's static `dist/` directory instead of forwarding to Express.
* **Fix:** Add the `^~` priority modifier in Nginx:
  ```nginx
  location ^~ /uploads/ {
      proxy_pass http://127.0.0.1:5000/uploads/;
  }
  ```

### 3. PM2 Cluster Mode Unstable Restarts (SIGINT / Exit Code 0)
* **Symptom:** Backend repeatedly restarts in PM2 logs: `Script had too many unstable restarts (16). Stopped. "errored"`.
* **Cause:** On single-vCPU instances (`t2.micro`), cluster mode attempts multi-core IPC messaging that can trigger immediate SIGINT shutdowns.
* **Fix:** Explicitly configure fork mode in `ecosystem.config.cjs`:
  ```javascript
  exec_mode: 'fork',
  instances: 1,
  ```

### 4. Zod `.partial()` Crash on Refined Schemas
* **Symptom:** Express crashed on startup with `Error: .partial() cannot be used on object schemas containing refinements`.
* **Cause:** Calling `.refine()` directly on an object schema turns it into a `ZodEffects` wrapper, which does not support `.partial()`.
* **Fix:** Define the base schema first:
  ```javascript
  const baseEventSchema = z.object({ ... });
  const createEventSchema = baseEventSchema.refine(...);
  const updateEventSchema = baseEventSchema.partial().refine(...);
  ```

### 5. `502 Bad Gateway` / `Unexpected token '<'`
* **Symptom:** Logging in or fetching data returns an HTML error page instead of JSON.
* **Cause:** Nginx is running, but Express on port 5000 crashed or stopped (frequently due to MongoDB connection failure or lab timeout).
* **Fix:** Verify `0.0.0.0/0` is active in MongoDB Atlas Network Access, verify credentials, and inspect logs on EC2: `pm2 logs --lines 50`.

### 6. Drone-SSH Heredoc Injection Corrupting `.env`
* **Symptom:** Secrets contained trailing strings like `DRONE_SSH_PREV_COMMAND_EXIT_CODE`.
* **Cause:** The `appleboy/ssh-action` runner injects shell status variables when using multiline `cat << 'EOF'`.
* **Fix:** Use formatted `printf "%s\n"` statements instead of heredocs when writing `.env` files.

### 7. PM2 Caching Old Environment Variables
* **Symptom:** Updated GitHub Secrets were not reflected on the server after redeploying.
* **Cause:** Running plain `pm2 restart` retains cached environment variables from the initial launch.
* **Fix:** Always include the `--update-env` flag when restarting PM2:
  ```bash
  pm2 restart all --update-env
  ```

### 8. Premature SSH Execution Before EC2 Bootstrap Finishes
* **Symptom:** Deployments failed with `cd: /var/www/...: No such file or directory`.
* **Cause:** SSH opened before the initial `UserData` script finished cloning the repo and installing packages.
* **Fix:** Add `sudo cloud-init status --wait || true` at the beginning of the deployment script.

---

## 9. Copy-and-Paste AI Prompt for Your Friends

If a friend wants their AI coding assistant to implement this architecture in their own project repository, they can copy and paste the prompt below:

```markdown
I want to host my MERN stack application on AWS EC2 using an automated CloudFormation + GitHub Actions CI/CD pipeline.

Please inspect my repository structure and implement the following architecture:

1. CloudFormation Template (infra/ec2-instance.yaml):
   - Provisions an Ubuntu 24.04 LTS t2.micro EC2 instance.
   - Creates a key pair automatically stored in AWS Systems Manager (SSM) Parameter Store (/ec2/keypair/*).
   - Configures a Security Group allowing port 80 (HTTP) and port 22 (SSH).
   - Includes UserData to install Node.js 22, PM2, Git, and Nginx, clones this repository, and links Nginx configs.
   - Exports PublicIP, PublicURL, and SSMKeyPath.

2. Nginx Reverse Proxy (infra/nginx.conf):
   - Serves the compiled React frontend from the production build directory with try_files $uri $uri/ /index.html.
   - Reverse proxies /api/ requests to Express on internal port (e.g. 5000 or 4000).
   - Uses location ^~ /uploads/ priority proxying so uploaded files are served from Express without getting blocked by static asset caching regexes.

3. PM2 Process Manager (server/ecosystem.config.cjs or backend/ecosystem.config.cjs):
   - Sets exec_mode: 'fork' and instances: 1 to ensure stability on single-core t2.micro instances.

4. GitHub Actions CI/CD (.github/workflows/deploy.yml):
   - Triggers on push to main.
   - Build job: compiles the frontend bundle.
   - Deploy job: authenticates using temporary AWS credentials, runs aws cloudformation deploy, retrieves the PublicIP dynamically from stack outputs, fetches the SSH key from SSM, waits for cloud-init bootstrap, SSH-es into EC2, pulls code, injects .env from GitHub Secrets, builds frontend, and restarts PM2 with --update-env.

Please adapt paths and ports to match my repository structure, and guide me through the required GitHub Secrets.
```

---

## 10. Quick-Reference Server Commands

Connect to your EC2 instance via **EC2 Instance Connect** (AWS Console) or SSH, and use these commands for live maintenance:

```bash
# Check status of Express backend
pm2 status

# View live backend console logs
pm2 logs --lines 50

# Restart backend and force reload fresh .env variables
pm2 restart all --update-env

# Inspect active environment variables
cat /var/www/app/server/.env

# Monitor live web traffic arriving through Nginx in real-time
sudo tail -f /var/log/nginx/access.log

# Monitor live Nginx errors (e.g. 502 Bad Gateway)
sudo tail -f /var/log/nginx/error.log

# Test and reload Nginx configuration
sudo nginx -t && sudo systemctl reload nginx
```

---

*Universal MERN DevOps Guide — Maintained and tested with AWS CloudFormation & GitHub Actions CI/CD.*
