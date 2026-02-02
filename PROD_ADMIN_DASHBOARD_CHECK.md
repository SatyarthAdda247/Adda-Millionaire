# Production Admin Dashboard Checklist

## Pre-Deployment Checks

### 1. Backend URL Detection ✅
- [x] Frontend auto-detects `partners.addaeducation.com`
- [x] Uses `https://api.partners.addaeducation.com` in production
- [x] Falls back to `http://localhost:3001` for development

### 2. CORS Configuration ✅
- [x] Backend allows `https://partners.addaeducation.com`
- [x] Backend allows `https://www.partners.addaeducation.com`
- [x] Backend allows localhost for development

### 3. API Endpoints Used by Admin Dashboard
- `/api/users` - Get all affiliates
- `/api/dashboard/stats` - Dashboard statistics
- `/api/dashboard/analytics` - Dashboard analytics
- `/api/users/{id}/approve` - Approve affiliate
- `/api/users/{id}/reject` - Reject affiliate
- `/api/users/{id}/delete` - Delete affiliate
- `/api/users/{id}/assign-link` - Assign link to affiliate

### 4. Environment Variables
Ensure these are set in production:
- `AWS_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `DYNAMODB_USERS_TABLE`
- `DYNAMODB_LINKS_TABLE`
- `DYNAMODB_ANALYTICS_TABLE`
- `APPTROVE_API_KEY`
- `APPTROVE_REPORTING_API_KEY`
- (Other AppTrove credentials)

### 5. DNS Configuration
- [ ] `api.partners.addaeducation.com` DNS A record configured
- [ ] DNS propagated (check with `nslookup api.partners.addaeducation.com`)

### 6. SSL Certificate
- [ ] SSL certificate configured for `api.partners.addaeducation.com`
- [ ] HTTPS working correctly

### 7. Backend Health Check
```bash
curl https://api.partners.addaeducation.com/health
# Expected: {"status":"ok","dynamodb":"configured","apptrove":"configured"}
```

### 8. Frontend Build
```bash
cd frontend
npm run build
# Deploy dist/ folder to production
```

## Testing Checklist

### Local Testing
1. ✅ Admin dashboard works on `http://localhost:8080`
2. ✅ Backend responds on `http://localhost:3001`
3. ✅ API calls succeed locally

### Production Testing
1. [ ] Admin dashboard loads on `https://partners.addaeducation.com/admin`
2. [ ] Backend API accessible at `https://api.partners.addaeducation.com`
3. [ ] No CORS errors in browser console
4. [ ] Affiliates list loads correctly
5. [ ] Dashboard stats display correctly
6. [ ] Approve/Reject actions work
7. [ ] Link assignment works
8. [ ] No `ERR_NAME_NOT_RESOLVED` errors
9. [ ] No `Failed to fetch` errors

## Common Issues

### Issue: ERR_NAME_NOT_RESOLVED
**Solution:** Configure DNS A record for `api.partners.addaeducation.com`

### Issue: CORS errors
**Solution:** Verify backend CORS includes `https://partners.addaeducation.com`

### Issue: Failed to fetch
**Solution:** 
- Check backend is running
- Check SSL certificate
- Check security groups/firewall rules

### Issue: Old build deployed
**Solution:** Rebuild frontend and redeploy

## Verification Commands

```bash
# Check DNS
nslookup api.partners.addaeducation.com

# Check backend health
curl https://api.partners.addaeducation.com/health

# Check frontend
curl https://partners.addaeducation.com/health

# Test API endpoint
curl https://api.partners.addaeducation.com/api/users
```
