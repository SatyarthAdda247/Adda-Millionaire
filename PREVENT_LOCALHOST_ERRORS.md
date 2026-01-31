# Preventing localhost:8000 Errors

## What Causes These Errors to Recur

### 1. **Old Production Build** ⚠️ MOST COMMON
**Problem:** Production site serving old JavaScript bundle
**Solution:**
```bash
cd frontend
npm run build
# Deploy new dist/ folder
```

### 2. **Browser Cache**
**Problem:** Browser cached old JavaScript files
**Solution:**
- Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Clear browser cache
- Use incognito/private mode

### 3. **CDN/Proxy Cache**
**Problem:** CDN or reverse proxy serving cached files
**Solution:**
- Clear CDN cache
- Invalidate cache after deployment
- Use cache-busting (versioned filenames)

### 4. **Environment Variables**
**Problem:** `VITE_BACKEND_URL` set incorrectly
**Solution:**
```bash
# Check environment variables
echo $VITE_BACKEND_URL

# Should be unset (for auto-detection) or:
# https://api.partners.addaeducation.com
```

### 5. **Build Process Issues**
**Problem:** Build doesn't include latest code
**Solution:**
```bash
# Clean build
cd frontend
rm -rf node_modules dist
npm install
npm run build

# Verify dist/ contains new files
ls -la dist/
```

### 6. **Deployment Not Replacing Files**
**Problem:** Old files not overwritten during deployment
**Solution:**
- Delete old `dist/` folder before deploying
- Use `rsync --delete` or similar
- Verify file timestamps after deployment

### 7. **Hardcoded URLs in Code**
**Problem:** Remaining hardcoded `localhost:8000` references
**Solution:**
```bash
# Search for any remaining references
grep -r "localhost:8000" frontend/src/
grep -r "8000" frontend/src/ | grep -v "8080"
```

### 8. **Multiple Deployments**
**Problem:** Different environments using different builds
**Solution:**
- Ensure all environments use same build
- Use environment-specific builds if needed
- Document which build goes where

## Prevention Checklist

Before deploying:
- [ ] Rebuild frontend: `cd frontend && npm run build`
- [ ] Verify no `localhost:8000` in built files: `grep -r "8000" dist/`
- [ ] Check `dist/index.html` has correct script references
- [ ] Test locally with production build: `npm run preview`
- [ ] Clear CDN/proxy cache
- [ ] Verify environment variables
- [ ] Check deployment logs for errors

## Quick Fix Commands

```bash
# 1. Clean rebuild
cd frontend
rm -rf dist node_modules
npm install
npm run build

# 2. Verify build
grep -r "localhost:8000" dist/ || echo "✅ No localhost:8000 found"

# 3. Check backend URL detection
grep -r "api.partners.addaeducation.com" dist/ && echo "✅ Production URL found"

# 4. Deploy
# Copy dist/ to production server
```

## Debugging

If errors persist:
1. Check browser console for actual URL being called
2. Inspect network tab to see request URL
3. Check `window.location.hostname` in console
4. Verify backend URL: `console.log(BACKEND_URL)` in code
5. Check if build timestamp is recent

## Root Cause

The `localhost:8000` errors happen because:
- Old build has hardcoded `localhost:8000`
- New code auto-detects domain but old build doesn't
- Browser/CDN serves cached old files

**Always rebuild and redeploy after code changes!**
