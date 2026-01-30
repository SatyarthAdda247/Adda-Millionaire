FROM python:3.10

WORKDIR /app

# Install system dependencies for Node
RUN apt-get update && apt-get install -y curl git gnupg && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
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
EXPOSE 3000 8000
# Frontend: 3000 (internal) -> 80 (external)
# Backend: 8000 (internal) -> 8000 (external)

# Install serve for frontend
RUN npm install -g serve

# Start both services
CMD bash -c "cd /app/backend && uvicorn main:app --host 0.0.0.0 --port 8000 & cd /app/frontend && serve -s dist -l 3000"
