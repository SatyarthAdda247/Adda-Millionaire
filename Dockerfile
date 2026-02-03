FROM python:3.10

WORKDIR /app

# Install system dependencies for Node
RUN apt-get update && apt-get install -y curl git gnupg && \
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
RUN npm install -g express serve-static

# Create startup script to ensure both services run correctly
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
# Function to check if port is listening\n\
check_port() {\n\
    local port=$1\n\
    local service=$2\n\
    for i in {1..30}; do\n\
        if netstat -tuln 2>/dev/null | grep -q ":$port " || ss -tuln 2>/dev/null | grep -q ":$port "; then\n\
            echo "✅ $service is listening on port $port"\n\
            return 0\n\
        fi\n\
        sleep 1\n\
    done\n\
    echo "❌ $service failed to start on port $port"\n\
    return 1\n\
}\n\
\n\
# Start backend in background\n\
echo "🚀 Starting backend on port 3001..."\n\
cd /app/backend\n\
uvicorn main:app --host 0.0.0.0 --port 3001 > /tmp/backend.log 2>&1 &\n\
BACKEND_PID=$!\n\
echo "Backend started (PID: $BACKEND_PID)"\n\
\n\
# Wait for backend to be ready\n\
sleep 3\n\
if ! check_port 3001 "Backend"; then\n\
    echo "Backend logs:"\n    cat /tmp/backend.log\n    exit 1\n\
fi\n\
\n\
# Start frontend in foreground\n\
echo "🚀 Starting frontend on port 8080..."\n\
cd /app/frontend\n\
PORT=8080 node server.js &\n\
FRONTEND_PID=$!\n\
echo "Frontend started (PID: $FRONTEND_PID)"\n\
\n\
# Wait for frontend to be ready\n\
sleep 2\n\
if ! check_port 8080 "Frontend"; then\n\
    echo "Frontend failed to start"\n    exit 1\n\
fi\n\
\n\
echo "✅ Both services started successfully"\n\
echo "Backend: http://localhost:3001/health"\n\
echo "Frontend: http://localhost:8080/health"\n\
\n\
# Keep container running and monitor processes\n\
wait $BACKEND_PID $FRONTEND_PID\n\
' > /app/start.sh && chmod +x /app/start.sh

# Start both services using startup script
CMD ["/app/start.sh"]
