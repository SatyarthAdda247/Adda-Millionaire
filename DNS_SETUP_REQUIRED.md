# DNS Setup Required - Backend Domain

## Current Error
```
ERR_NAME_NOT_RESOLVED
GET https://api.partners.addaeducation.com/api/...
```

## Problem
The DNS record for `api.partners.addaeducation.com` is not configured or not propagated yet.

## Solution

### 1. Configure DNS A Record

Add an A record in your DNS provider:

```
Type: A
Name: api
Value: <Backend EC2 IP Address>
TTL: 300 (or your preference)
```

### 2. Verify DNS Propagation

```bash
# Check if DNS resolves
nslookup api.partners.addaeducation.com
# or
dig api.partners.addaeducation.com

# Should return the backend EC2 IP
```

### 3. Verify Backend is Running

```bash
# On backend EC2 instance
curl http://localhost:3001/health

# From external machine
curl https://api.partners.addaeducation.com/health
```

### 4. Check Security Groups

Ensure backend EC2 security group allows:
- Inbound: Port 443 (HTTPS) from 0.0.0.0/0
- Inbound: Port 80 (HTTP) from 0.0.0.0/0 (optional, for redirects)

### 5. SSL Certificate

If using HTTPS, ensure SSL certificate is configured for:
- `api.partners.addaeducation.com`

## Temporary Workaround

If DNS is not ready yet, you can:

1. **Use IP address directly** (not recommended for production):
   - Update `VITE_BACKEND_URL` to `https://<EC2_IP>`
   - Or use HTTP: `http://<EC2_IP>:3001`

2. **Use same-origin** (if backend is on same server):
   - Configure reverse proxy (nginx) to route `/api/*` to backend
   - Frontend uses relative URLs: `/api/...`

3. **Wait for DNS propagation**:
   - DNS changes can take 5 minutes to 48 hours
   - Usually propagates within 1-2 hours

## Required DNS Records

```
partners.addaeducation.com     → A Record → Frontend EC2 IP
api.partners.addaeducation.com → A Record → Backend EC2 IP
```

## Verification Checklist

- [ ] DNS A record created for `api.partners.addaeducation.com`
- [ ] DNS propagated (check with `nslookup` or `dig`)
- [ ] Backend service running on EC2
- [ ] Security group allows HTTPS (443) traffic
- [ ] SSL certificate configured (if using HTTPS)
- [ ] Health check endpoint accessible: `https://api.partners.addaeducation.com/health`

## Expected Response

After DNS is configured, the health check should return:

```json
{
  "status": "ok",
  "dynamodb": "configured",
  "apptrove": "configured"
}
```
