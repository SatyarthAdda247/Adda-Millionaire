# AWS Deployment Setup

## Prerequisites
- AWS account
- SSH key pair

## Quick Deploy

### 1. Create AWS Instance

**AWS Lightsail:**
```
1. Go to lightsail.aws.amazon.com
2. Create instance:
   - OS: Ubuntu 22.04
   - Plan: 2GB RAM ($20/mo)
   - Name: millionaires-backend
```

**AWS EC2:**
```
1. Go to EC2 console
2. Launch instance:
   - AMI: Ubuntu Server 22.04 LTS
   - Type: t3.medium (4GB RAM)
   - Security Group: Allow ports 22, 80, 443
   - Key pair: Create/select
```

### 2. Connect to Instance

```bash
# Get IP from AWS console
ssh ubuntu@YOUR_INSTANCE_IP
```

### 3. Upload Files

**Option A: Git**
```bash
git clone https://github.com/your-repo/millionaires-adda.git
cd millionaires-adda
```

**Option B: SCP**
```bash
# From local machine
scp -r adda-creator-path-main ubuntu@YOUR_INSTANCE_IP:~/
ssh ubuntu@YOUR_INSTANCE_IP
cd adda-creator-path-main
```

### 4. Deploy

```bash
# Make deploy script executable
chmod +x deploy.sh

# Edit environment variables
nano .env

# IMPORTANT: Set these in .env:
# APPTROVE_DASHBOARD_EMAIL=your-email@company.com
# APPTROVE_DASHBOARD_PASSWORD=your-password

# Deploy!
./deploy.sh
```

### 5. Configure Firewall

**Lightsail:**
```
1. Go to instance > Networking tab
2. Add rule: HTTP (port 80)
3. Attach static IP (optional)
```

**EC2:**
```
1. Go to Security Groups
2. Edit inbound rules:
   - Type: HTTP, Port: 80, Source: 0.0.0.0/0
   - Type: HTTPS, Port: 443, Source: 0.0.0.0/0
```

## Verify Deployment

```bash
# Check health
curl http://YOUR_INSTANCE_IP/health

# Check users endpoint
curl http://YOUR_INSTANCE_IP/api/users

# View logs
docker-compose logs -f
```

## SSL Setup (Optional)

```bash
# Install Certbot
sudo apt install -y certbot

# Get certificate (replace with your domain)
sudo certbot certonly --standalone -d api.yourdomain.com

# Update docker-compose.yml to use SSL
# Add volume mount for /etc/letsencrypt
```

## Troubleshooting

**Container won't start:**
```bash
docker-compose logs backend
```

**Out of memory:**
```bash
free -h
# Upgrade instance if needed
```

**Playwright issues:**
```bash
docker-compose exec backend playwright install chromium
```

**Can't connect:**
```bash
# Check firewall rules
# Check if service is running:
docker-compose ps
```

## Management Commands

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Restart
docker-compose restart

# Rebuild
docker-compose up -d --build

# Logs
docker-compose logs -f

# Shell access
docker-compose exec backend bash
```

## Auto-Start on Boot

```bash
# Enable Docker to start on boot
sudo systemctl enable docker

# Containers restart automatically (unless-stopped policy)
```

## Monitoring

```bash
# Resource usage
docker stats

# System resources
htop  # Install: sudo apt install htop
```

## Backup

```bash
# Backup script (run daily)
cat > /home/ubuntu/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d)
docker-compose logs > /home/ubuntu/backup/logs-$DATE.txt
EOF

chmod +x /home/ubuntu/backup.sh
crontab -e
# Add: 0 2 * * * /home/ubuntu/backup.sh
```

## Update Deployment

```bash
cd ~/millionaires-adda
git pull  # or upload new files
./deploy.sh
```

## Complete!

Your API is now running at: `http://YOUR_INSTANCE_IP`

Test it:
- Health: `http://YOUR_INSTANCE_IP/health`
- Users: `http://YOUR_INSTANCE_IP/api/users`
- Dashboard stats: `http://YOUR_INSTANCE_IP/api/dashboard/stats`
