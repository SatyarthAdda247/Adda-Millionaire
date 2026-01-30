# AWS Deployment - Quick Reference

## Files Structure

```
millionaires-adda/
├── backend-python/
│   ├── main.py           # Complete backend (API + Automation)
│   └── requirements.txt
├── Dockerfile            # Production container
├── docker-compose.yml    # One-command deploy
├── .env.production       # Environment template
├── deploy.sh             # Automated deployment
└── AWS_SETUP.md          # Detailed instructions
```

## One-Command Deploy

```bash
./deploy.sh
```

## What's Included

✅ FastAPI REST API
✅ DynamoDB integration
✅ AppTrove API calls
✅ Playwright browser automation (link creation)
✅ Health checks
✅ Auto-restart
✅ Docker containerized

## Environment Variables

Required in `.env`:
```bash
# AWS
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret

# AppTrove Dashboard (CRITICAL for automation)
APPTROVE_DASHBOARD_EMAIL=your-email@company.com
APPTROVE_DASHBOARD_PASSWORD=your-password

# Other vars are pre-configured in .env.production
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/users` | GET | List all affiliates |
| `/api/users/{id}` | GET | Get affiliate |
| `/api/users/{id}/approve` | POST | Approve + create link |
| `/api/users/{id}/reject` | POST | Reject affiliate |
| `/api/users/{id}` | DELETE | Delete affiliate |
| `/api/dashboard/stats` | GET | Dashboard statistics |
| `/api/apptrove/templates` | GET | AppTrove templates |

## Quick Commands

```bash
# Deploy
./deploy.sh

# View logs
docker-compose logs -f

# Restart
docker-compose restart

# Stop
docker-compose down

# Update code and redeploy
git pull && ./deploy.sh
```

## Support

- Full setup: See `AWS_SETUP.md`
- Troubleshooting: Check logs with `docker-compose logs -f`
- Health: `curl http://localhost/health`
