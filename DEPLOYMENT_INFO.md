# Deployment Information

## Domain URLs

**Frontend:** https://partners.addaeducation.com  
**Backend:** https://api.partners.addaeducation.com

## Health Check Paths

**Backend:** https://api.partners.addaeducation.com/health  
**Frontend:** https://partners.addaeducation.com/health

## Deployment Location

Independent Docker deployment on an Adda Instance

## DNS Configuration Required

**A Records:**
- `partners.addaeducation.com` → Frontend EC2 IP
- `api.partners.addaeducation.com` → Backend EC2 IP

## Ports

| Environment | Frontend | Backend |
|-------------|----------|---------|
| Development | 8080     | 3001    |
| Production  | 80/443   | 80/443  |
