# [DEPLOY] Partners Portal - Production

## Type: Deployment Task
**Priority:** High  
**Domain:** partners.addaeducation.com

---

## Summary
Deploy affiliate management portal to production AWS instance.

## Description
Platform for managing affiliate partners with AppTrove integration for tracking and analytics.

**Key Features:**
- Affiliate approval workflow
- Link creation and assignment
- Analytics dashboard
- AppTrove API integration

---

## Tech Stack
- **Frontend:** React + TypeScript + Vite
- **Backend:** Python FastAPI
- **Database:** AWS DynamoDB
- **Deploy:** Docker + AWS EC2

**Repository:** https://github.com/metiseduventures/Partners-AddaEducation

---

## Infrastructure

**Server Requirements:**
- AWS EC2 t3.medium (4GB RAM)
- Ubuntu 22.04 LTS
- Ports: 22, 80, 443

**Ports:**
- Frontend Dev: 8080
- Backend Dev: 3001
- Production: 80/443

---

## Acceptance Criteria

- [ ] EC2 instance provisioned and configured
- [ ] DNS points to EC2 IP
- [ ] SSL certificate installed (HTTPS)
- [ ] Application deployed via Docker
- [ ] Health checks passing
- [ ] DynamoDB connection verified
- [ ] AppTrove API working
- [ ] All user flows tested

---

## Deployment Steps (7 hours)

### 1. Infrastructure (2h)
- [ ] Provision EC2 instance
- [ ] Configure security groups
- [ ] Set up SSH access

### 2. DNS (30m)
- [ ] Create A record
- [ ] Verify propagation

### 3. Deploy (2h)
- [ ] Clone repository
- [ ] Configure environment
- [ ] Run deploy script
- [ ] Verify containers

### 4. SSL (1h)
- [ ] Install Certbot
- [ ] Generate certificate
- [ ] Configure HTTPS

### 5. Testing (1h)
- [ ] Test all workflows
- [ ] Verify integrations
- [ ] Performance check

### 6. Monitoring (30m)
- [ ] Set up health checks
- [ ] Configure logging

---

## Pre-requisites

**Access Required:**
- AWS account (EC2, DynamoDB)
- Domain DNS access
- AppTrove API credentials
- GitHub repository

**Credentials Needed:**
- AWS Access Keys
- AppTrove API Keys
- DynamoDB table names

---

## Rollback Plan

```bash
docker-compose down
git checkout [previous-commit]
./deploy.sh
```

---

## Success Metrics

**Technical:**
- 99.9% uptime
- API response < 500ms
- Zero critical vulnerabilities

**Business:**
- Affiliate approval works
- Links track correctly
- Analytics displays real-time data

---

## Post-Deployment

- [ ] Monitor logs (24h)
- [ ] Verify SSL auto-renewal
- [ ] Document runbook
- [ ] Train operations team

---

**Labels:** `deployment` `production` `aws` `high-priority`  
**Assignee:** DevOps Team
