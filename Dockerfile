FROM python:3.10
# Trigger prod build for start.sh fix

WORKDIR /app

# Install system dependencies for Node and curl
RUN apt-get update && apt-get install -y curl git gnupg net-tools && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    npm install -g npm && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy code from build context
COPY . .

# Backend setup
WORKDIR /app/backend
RUN pip install --no-cache-dir -r requirements.txt

# Frontend setup
WORKDIR /app/frontend

# Install frontend dependencies
RUN rm -rf node_modules package-lock.json 2>/dev/null || true && \
    npm install --legacy-peer-deps

# Build frontend for production
RUN npm run build

# Expose ports
EXPOSE 8080 3001
# Frontend: 8080 (container, matches dev)
# Backend: 3001 (container, matches dev)

# Install express and serve-static for custom frontend server
RUN npm install express serve-static

# Copy startup script
COPY <<'EOF' /app/start.sh
#!/bin/bash
set -e

echo "🚀 Starting Partners Portal..."

# Function to check health endpoint
check_health() {
    local port=$1
    local service=$2
    # Retry for up to 120 seconds
    for i in {1..120}; do
        if curl -f -s http://localhost:$port/health > /dev/null 2>&1; then
            echo "✅ $service health check passed"
            return 0
        fi
        if [ $((i % 5)) -eq 0 ]; then
            echo "Waiting for $service (attempt $i/120)..."
        fi
        sleep 1
    done
    echo "❌ $service health check failed after 120s"
    return 1
}

# Start backend in background
echo "🚀 Starting backend on port 3001..."
cd /app/backend
uvicorn main:app --host 0.0.0.0 --port 3001 > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend started (PID: $BACKEND_PID)"

# Verify backend health endpoint
if ! check_health 3001 "Backend"; then
    echo "❌ Backend failed to start. Logs:"
    cat /tmp/backend.log
    exit 1
fi

# Start frontend in background
echo "🚀 Starting frontend on port 8080..."
cd /app/frontend
PORT=8080 node server.js > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend started (PID: $FRONTEND_PID)"

# Verify frontend health endpoint
if ! check_health 8080 "Frontend"; then
    echo "❌ Frontend failed to start. Logs:"
    cat /tmp/frontend.log
    exit 1
fi

echo ""
echo "✅ Both services started successfully"
echo "Backend: http://localhost:3001/health"
echo "Frontend: http://localhost:8080/health"
echo ""
echo "Tailing logs (Ctrl+C to stop):"

# Keep container running and monitor processes
tail -f /tmp/backend.log /tmp/frontend.log &
wait $BACKEND_PID $FRONTEND_PID
EOF

RUN chmod +x /app/start.sh

# Start both services using startup script
CMD ["/app/start.sh"]
