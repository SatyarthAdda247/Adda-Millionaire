# Partners Portal - Deployment Guide

**Frontend:** https://partners.addaeducation.com  
**Backend:** https://api.partners.addaeducation.com

## Tech Stack

**Frontend:** React + TypeScript + Vite + Tailwind CSS  
**Backend:** Python FastAPI + DynamoDB  
**Infrastructure:** Docker + AWS EC2  
**External API:** AppTrove

## Ports

| Environment | Frontend | Backend |
|-------------|----------|---------|
| Development | 8080     |   3001  |
| Production | - | - | 80 (HTTP) / 443 (HTTPS) |

## Health Checks

**Backend:**
```bash
curl https://api.partners.addaeducation.com/health
# Expected: {"status":"ok","dynamodb":"configured","apptrove":"configured"}
```

**Frontend:**
```bash
curl https://partners.addaeducation.com/health.json
# Expected: {"status":"ok","service":"Partners Portal Frontend"}
```

**Repository:** https://github.com/metiseduventures/Partners-AddaEducation
