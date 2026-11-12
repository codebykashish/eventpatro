# Eventpatro — Ubuntu EC2 Deployment Guide

This guide explains how to set up your AWS Ubuntu EC2 instance and connect it to GitHub Actions for automatic deployment.

---

## Part 1: Launch your AWS EC2 Instance

1. Log into your **AWS Academy / Learner Lab** console.
2. Go to **EC2** → **Launch Instance**:
   - **Name:** `eventpatro-server`
   - **OS:** Ubuntu 24.04 LTS (64-bit x86)
   - **Instance type:** `t2.micro` (free-tier eligible in Learner Lab)
   - **Key pair:** Create or select an existing `.pem` key pair (e.g. `eventpatro-key.pem`). Save this file on your computer.
   - **Network settings / Security Group:**
     - Check **Allow SSH traffic** from `0.0.0.0/0` (or your IP).
     - Check **Allow HTTP traffic from the internet** (Port 80).
     - (Optional) Check **Allow HTTPS traffic** (Port 443).
   - **Storage:** 15–20 GB gp3 root volume.
3. Click **Launch instance**.
4. Note your instance's **Public IPv4 address** (e.g., `54.210.xx.xx`).

---

## Part 2: One-Time Server Setup on EC2

1. Open your computer's terminal and SSH into the instance:
   ```bash
   chmod 400 eventpatro-key.pem
   ssh -i eventpatro-key.pem ubuntu@<YOUR_EC2_PUBLIC_IP>
   ```

2. Clone your repository into `/var/www/eventpatro`:
   ```bash
   sudo mkdir -p /var/www/eventpatro
   sudo chown -R ubuntu:ubuntu /var/www/eventpatro
   git clone https://github.com/codebykashish/eventpatro.git /var/www/eventpatro
   ```

3. Run the provisioning script:
   ```bash
   cd /var/www/eventpatro/infra
   chmod +x setup-ubuntu.sh
   sudo ./setup-ubuntu.sh
   ```

---

## Part 3: Configure GitHub Secrets

Go to your repository on GitHub:
**Settings → Secrets and variables → Actions → New repository secret**

Add the following secrets:

| Secret Name | Value / Description |
|---|---|
| `EC2_HOST` | Your EC2 Public IPv4 address (e.g. `54.210.xx.xx`) |
| `EC2_USER` | `ubuntu` |
| `EC2_SSH_KEY` | Entire contents of your `eventpatro-key.pem` file (including `-----BEGIN RSA PRIVATE KEY-----`) |
| `CLIENT_URL` | `http://<YOUR_EC2_PUBLIC_IP>` |
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | A secure random string for JWT signing |
| `SMTP_USER` | Your Gmail address (for email OTP verification) |
| `SMTP_PASS` | Your Gmail 16-character App Password |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

---

## Part 4: Automatic CI/CD Pipeline

Once the secrets are in place:
- Every time you push to `main` (`git push origin main`), GitHub Actions will automatically:
  1. Test and build the client and server.
  2. SSH into your EC2 instance.
  3. Pull the latest code, update the `.env`, and rebuild.
  4. Restart PM2 and reload Nginx with zero manual work.
