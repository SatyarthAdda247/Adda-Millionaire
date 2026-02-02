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

# Start both services
# Use exec form for proper signal handling
# Start backend first, wait 2 seconds, then start frontend
CMD ["sh", "-c", "cd /app/backend && uvicorn main:app --host 0.0.0.0 --port 3001 > /tmp/backend.log 2>&1 & sleep 2 && cd /app/frontend && PORT=8080 node server.js"]
