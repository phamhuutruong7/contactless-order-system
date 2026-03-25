#!/usr/bin/env bash
# vm-setup.sh — One-time provisioning for a Civo Compute VM (Ubuntu 22.04).
#
# Run ONCE after creating the VM:
#   ssh ubuntu@<VM_IP> 'bash -s' < scripts/vm-setup.sh
#
# What it does:
#   - Installs Docker + Docker Compose plugin
#   - Installs Nginx
#   - Configures sudoers for nginx reload (no password, needed by CI)
#   - Creates app directory ~/app with scripts/
#   - Copies nginx site config and initial upstream (blue)
#   - Enables nginx site
#   - Creates /opt/active-stack = blue (initial state)

set -euo pipefail

echo "=== 1/6  System update ==="
sudo apt-get update -qq
sudo apt-get upgrade -y -qq

echo "=== 2/6  Install Docker ==="
sudo apt-get install -y -qq ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update -qq
sudo apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker ubuntu
echo "Docker version: $(docker --version)"

echo "=== 3/6  Install Nginx ==="
sudo apt-get install -y -qq nginx
sudo systemctl enable nginx

echo "=== 4/6  Configure sudoers for Nginx reload ==="
# Allows the ubuntu user to reload/test nginx without a password (needed by CI deploy)
echo "ubuntu ALL=(ALL) NOPASSWD: /usr/sbin/nginx" \
  | sudo tee /etc/sudoers.d/nginx-reload > /dev/null
sudo chmod 440 /etc/sudoers.d/nginx-reload

echo "=== 5/6  Create app directory structure ==="
mkdir -p ~/app/{scripts,nginx}

echo "=== 6/6  Copy nginx config and enable site ==="
# These files come from the repo — re-run this block after first git clone/pull
# sudo cp ~/app/nginx/app.conf /etc/nginx/sites-available/app
# sudo ln -sf /etc/nginx/sites-available/app /etc/nginx/sites-enabled/app
# sudo rm -f /etc/nginx/sites-enabled/default
# sudo cp ~/app/nginx/upstream.conf.blue /etc/nginx/conf.d/upstream.conf
# echo "blue" | sudo tee /opt/active-stack
# sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "=== VM setup complete ==="
echo ""
echo "Next steps:"
echo "  1. Clone the repo:  git clone https://github.com/phamhuutruong7/contactless-order-system.git ~/app"
echo "  2. Copy nginx site:  sudo cp ~/app/nginx/app.conf /etc/nginx/sites-available/app"
echo "  3. Enable site:      sudo ln -sf /etc/nginx/sites-available/app /etc/nginx/sites-enabled/app"
echo "  4. Remove default:   sudo rm -f /etc/nginx/sites-enabled/default"
echo "  5. Init upstream:    sudo cp ~/app/nginx/upstream.conf.blue /etc/nginx/conf.d/upstream.conf"
echo "  6. Init state:       echo 'blue' | sudo tee /opt/active-stack"
echo "  7. Test & reload:    sudo nginx -t && sudo systemctl reload nginx"
echo "  8. Add repo deploy key or PAT for GHCR pulls"
