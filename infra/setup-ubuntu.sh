#!/usr/bin/env bash
# ==============================================================================
# Eventpatro — Ubuntu 24.04 / 22.04 Initial Server Provisioning Script
# Run this once on your fresh Ubuntu EC2 instance:
#   chmod +x setup-ubuntu.sh && sudo ./setup-ubuntu.sh
# ==============================================================================

set -euo pipefail

echo ">>> [1/5] Updating system packages..."
sudo apt-get update -y && sudo apt-get upgrade -y
sudo apt-get install -y curl git nginx ufw build-essential

echo ">>> [2/5] Installing Node.js 22 LTS..."
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

echo ">>> [3/5] Installing PM2 process manager globally..."
sudo npm install -g pm2
pm2 startup systemd -u ubuntu --hp /home/ubuntu || true

echo ">>> [4/5] Preparing /var/www/eventpatro directories..."
sudo mkdir -p /var/www/eventpatro/client/dist
sudo mkdir -p /var/www/eventpatro/server/uploads
sudo chown -R ubuntu:ubuntu /var/www/eventpatro

echo ">>> [5/5] Configuring Nginx..."
# Copy configuration to sites-available
if [ -f "/var/www/eventpatro/infra/nginx.conf" ]; then
    sudo cp /var/www/eventpatro/infra/nginx.conf /etc/nginx/sites-available/eventpatro
    sudo rm -f /etc/nginx/sites-enabled/default
    sudo ln -sf /etc/nginx/sites-available/eventpatro /etc/nginx/sites-enabled/
    sudo nginx -t && sudo systemctl restart nginx
fi

echo "=============================================================================="
echo ">>> Server provisioning complete! Nginx, Node.js, and PM2 are installed."
echo "=============================================================================="
