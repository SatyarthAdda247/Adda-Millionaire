# 🚀 AWS Deployment Guide

## What's Been Configured

✅ **Unified Backend**: Python FastAPI with Playwright automation
✅ **Docker**: Production-ready container with Chromium
✅ **One-command deploy**: `./deploy.sh`
✅ **Auto-restart**: Container restarts on failure
✅ **Health checks**: Built-in monitoring

## Files Created

```
├── backend-python/main.py       # Complete backend (610 lines)
├── Dockerfile                   # Production container
├── docker-compose.yml           # Container orchestration
├── deploy.sh                    # Automated deployment script
├── .env.example                 # Environment template
├── AWS_SETUP.md                 # Detailed instructions
└── README_AWS.md                # Quick reference
```

## Deploy to AWS in 3 Steps

### Step 1: Create AWS Instance

**Option A: AWS Lightsail** (Easiest)
```
1. Go to lightsail.aws.amazon.com
2. Create instance:
   - Ubuntu 22.04
   - 2GB RAM plan ($20/month)
   - Download SSH key
```

**Option B: AWS EC2** (More control)
```
1. Launch instance:
   - Ubuntu 22.04 LTS
   - t3.medium (4GB RAM)
   - Security: Allow ports 22, 80
```

### Step 2: Upload & Configure

```bash
# SSH into instance
ssh ubuntu@YOUR_INSTANCE_IP

# Upload code (choose one method)
# Method 1: Git
git clone https://github.com/your-repo/millionaires-adda.git
cd millionaires-adda

# Method 2: SCP from local machine
# scp -r adda-creator-path-main ubuntu@YOUR_INSTANCE_IP:~/

# Configure environment
cp .env.example .env
nano .env
```

**IMPORTANT: Set in .env:**
```bash
APPTROVE_DASHBOARD_EMAIL=your-email@company.com
APPTROVE_DASHBOARD_PASSWORD=your-password
```

### Step 3: Deploy!

```bash
chmod +x deploy.sh
./deploy.sh
```

That's it! Your API is running.

## Verify It Works

```bash
# Health check
curl http://YOUR_INSTANCE_IP/health

# Test API
curl http://YOUR_INSTANCE_IP/api/users
curl http://YOUR_INSTANCE_IP/api/dashboard/stats
```

## Update Frontend

Update `src/lib/backend-api.ts`:

```typescript
const API_BASE_URL = "http://YOUR_INSTANCE_IP/api";
```

## Management

```bash
# View logs
docker-compose logs -f

# Restart
docker-compose restart

# Stop
docker-compose down

# Update & redeploy
git pull && ./deploy.sh
```

## What Happens When You Approve?

1. User clicks "Approve" in dashboard
2. Backend calls `/api/users/{id}/approve`
3. Playwright launches Chromium browser
4. Logs into AppTrove dashboard
5. Navigates to template
6. Fills form with affiliate data
7. Submits and extracts link URL
8. Saves link to DynamoDB
9. Returns link to frontend

All automatic! 🎉

## Troubleshooting

**Logs show errors?**
```bash
docker-compose logs -f backend
```

**Can't connect?**
- Check AWS Security Group allows port 80
- Check if service is running: `docker-compose ps`

**Automation fails?**
- Verify APPTROVE_DASHBOARD_EMAIL & PASSWORD in .env
- Check logs: `docker-compose logs | grep Automation`

## Full Documentation

- **AWS_SETUP.md**: Complete setup instructions
- **README_AWS.md**: Quick command reference
- **.env.example**: All environment variables

---

**Need help?** Check logs first: `docker-compose logs -f`
