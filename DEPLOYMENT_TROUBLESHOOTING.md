# Deployment Troubleshooting Guide

## Common Issues and Solutions

### 1. Pods Stuck in "Degraded" or "Progressing" State

**Symptoms:**
- ArgoCD shows "Degraded" health
- Pods are restarting
- Health checks failing

**Diagnosis:**
```bash
# Check pod status
kubectl get pods -n frontend | grep partners-adda-prod

# Check pod logs
kubectl logs -n frontend <pod-name> --tail=100

# Check pod events
kubectl describe pod -n frontend <pod-name>
```

**Common Causes:**
1. **Health check failing** - Pods not responding on `/health` endpoint
2. **Port mismatch** - Service expects different port than container exposes
3. **Startup timeout** - Services taking too long to start
4. **Resource constraints** - Not enough CPU/memory
5. **Environment variables missing** - Required env vars not set

### 2. Services Not Starting

**Check container logs:**
```bash
# Backend logs
kubectl logs -n frontend <pod-name> -c backend 2>/dev/null || kubectl logs -n frontend <pod-name> | grep backend

# Frontend logs  
kubectl logs -n frontend <pod-name> -c frontend 2>/dev/null || kubectl logs -n frontend <pod-name> | grep frontend
```

**Verify services are listening:**
```bash
# Exec into pod
kubectl exec -it -n frontend <pod-name> -- bash

# Check if ports are listening
netstat -tuln | grep -E '3001|8080'
# Or
ss -tuln | grep -E '3001|8080'

# Test health endpoints
curl http://localhost:3001/health
curl http://localhost:8080/health
```

### 3. Health Check Failures

**Backend health check:**
- Endpoint: `http://localhost:3001/health`
- Should return: `{"status":"ok","dynamodb":"...","apptrove":"..."}`

**Frontend health check:**
- Endpoint: `http://localhost:8080/health`
- Should return: `{"status":"ok","service":"Partners Portal Frontend",...}`

**If health checks fail:**
1. Check if services are running: `ps aux | grep -E 'uvicorn|node'`
2. Check if ports are bound: `netstat -tuln`
3. Check startup logs: `cat /tmp/backend.log`

### 4. Image Pull Errors

**Symptoms:**
- `ImagePullBackOff` or `ErrImagePull` errors

**Solutions:**
1. Verify image exists: `docker pull docker-central.adda247.com/api-partners:<tag>`
2. Check image registry credentials
3. Verify image tag is correct in values.yaml

### 5. Resource Constraints

**Check resource usage:**
```bash
kubectl top pods -n frontend | grep partners-adda-prod
kubectl describe pod -n frontend <pod-name> | grep -A 5 "Limits\|Requests"
```

**If OOMKilled:**
- Increase memory limits in values.yaml
- Check for memory leaks in application

### 6. Environment Variables Missing

**Check ConfigMap:**
```bash
kubectl get configmap -n frontend partners-adda-prod-green -o yaml
```

**Required environment variables:**
- AWS credentials (if using DynamoDB)
- AppTrove API keys
- DynamoDB table names

### 7. Network Issues

**Check service:**
```bash
kubectl get svc -n frontend partners-adda-prod
kubectl describe svc -n frontend partners-adda-prod
```

**Check Istio VirtualService:**
```bash
kubectl get virtualservice -n frontend partners-adda-prod -o yaml
```

## Quick Diagnostic Commands

```bash
# Full pod status
kubectl get pods -n frontend -l app=partners-adda-prod -o wide

# Recent events
kubectl get events -n frontend --sort-by='.lastTimestamp' | grep partners-adda-prod | tail -20

# Pod logs (last 100 lines)
kubectl logs -n frontend -l app=partners-adda-prod --tail=100

# Describe pod for detailed info
kubectl describe pod -n frontend -l app=partners-adda-prod | tail -50

# Check ArgoCD app status
argocd app get partners-adda-prod

# Check deployment status
kubectl get deployment -n frontend partners-adda-prod-green
kubectl describe deployment -n frontend partners-adda-prod-green
```

## Expected Behavior

**During successful deployment:**
1. ArgoCD syncs → Status: "Synced"
2. New pods start → Status: "Progressing"
3. Health checks pass → Status: "Healthy"
4. Old pods terminate → Rolling update complete

**During rolling update:**
- Health may be "Degraded" temporarily (normal)
- Old pods terminating while new pods starting
- Should resolve in 2-5 minutes

## If Deployment Still Fails

1. **Check ArgoCD UI:** https://argocd-central.adda247.com/applications/partners-adda-prod
2. **Check pod logs** for specific errors
3. **Verify image tag** matches what was built
4. **Check resource limits** are sufficient
5. **Verify environment variables** are set correctly
