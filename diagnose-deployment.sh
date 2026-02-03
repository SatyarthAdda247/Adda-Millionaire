#!/bin/bash
# Deployment Diagnostic Script

echo "🔍 Deployment Diagnostic Tool"
echo "=============================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl not found. Please install kubectl first.${NC}"
    exit 1
fi

NAMESPACE="frontend"
APP_NAME="partners-adda-prod"

echo "1. Checking Pod Status..."
echo "-------------------------"
kubectl get pods -n $NAMESPACE -l app=$APP_NAME -o wide
echo ""

echo "2. Checking Recent Pod Events..."
echo "--------------------------------"
kubectl get events -n $NAMESPACE --sort-by='.lastTimestamp' | grep $APP_NAME | tail -10
echo ""

echo "3. Getting Pod Names..."
echo "----------------------"
PODS=$(kubectl get pods -n $NAMESPACE -l app=$APP_NAME -o jsonpath='{.items[*].metadata.name}')
if [ -z "$PODS" ]; then
    echo -e "${RED}❌ No pods found for $APP_NAME${NC}"
    exit 1
fi

for POD in $PODS; do
    echo ""
    echo "========================================="
    echo "Pod: $POD"
    echo "========================================="
    
    echo ""
    echo "4. Pod Status Details..."
    echo "----------------------"
    kubectl describe pod -n $NAMESPACE $POD | tail -30
    echo ""
    
    echo "5. Pod Logs (last 50 lines)..."
    echo "-----------------------------"
    kubectl logs -n $NAMESPACE $POD --tail=50 2>&1 || echo "Could not fetch logs"
    echo ""
    
    echo "6. Checking if services are running in pod..."
    echo "--------------------------------------------"
    kubectl exec -n $NAMESPACE $POD -- sh -c "ps aux | grep -E 'uvicorn|node' | grep -v grep" 2>/dev/null || echo "Could not exec into pod"
    echo ""
    
    echo "7. Checking if ports are listening..."
    echo "------------------------------------"
    kubectl exec -n $NAMESPACE $POD -- sh -c "netstat -tuln 2>/dev/null | grep -E '3001|8080' || ss -tuln 2>/dev/null | grep -E '3001|8080' || echo 'Ports not listening'" 2>/dev/null || echo "Could not check ports"
    echo ""
    
    echo "8. Testing health endpoints..."
    echo "----------------------------"
    echo "Backend health:"
    kubectl exec -n $NAMESPACE $POD -- sh -c "curl -s http://localhost:3001/health || echo 'Backend health check failed'" 2>/dev/null || echo "Could not test backend health"
    echo ""
    echo "Frontend health:"
    kubectl exec -n $NAMESPACE $POD -- sh -c "curl -s http://localhost:8080/health || echo 'Frontend health check failed'" 2>/dev/null || echo "Could not test frontend health"
    echo ""
done

echo ""
echo "9. Checking Deployment..."
echo "------------------------"
kubectl get deployment -n $NAMESPACE ${APP_NAME}-green -o yaml | grep -A 10 "status:"
echo ""

echo "10. Checking Service..."
echo "----------------------"
kubectl get svc -n $NAMESPACE $APP_NAME
echo ""

echo "11. Checking ArgoCD App Status..."
echo "--------------------------------"
if command -v argocd &> /dev/null; then
    argocd app get $APP_NAME 2>/dev/null || echo "ArgoCD CLI not configured or app not found"
else
    echo "ArgoCD CLI not installed. Check UI: https://argocd-central.adda247.com/applications/$APP_NAME"
fi
echo ""

echo "✅ Diagnostic complete!"
echo ""
echo "Common Issues:"
echo "  - If pods are CrashLoopBackOff: Check logs above for errors"
echo "  - If health checks fail: Services may not be starting correctly"
echo "  - If ports not listening: Services failed to start"
echo "  - If ImagePullBackOff: Image doesn't exist or credentials wrong"
