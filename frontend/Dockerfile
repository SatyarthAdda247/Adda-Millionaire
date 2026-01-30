FROM node:22-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Build the app
RUN npx vite build

# Expose preview port
EXPOSE 8080

# Run Vite preview (NOT dev)
CMD ["npx", "vite", "preview", "--host", "0.0.0.0", "--port", "8080"]
