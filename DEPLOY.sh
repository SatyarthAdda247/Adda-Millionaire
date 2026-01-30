#!/bin/bash

set -e

echo "🚀 Millionaires Adda - AWS Deployment"
echo "======================================"
echo ""

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
    echo "✅ Docker installed. Please logout/login and re-run this script."
    exit 0
fi

# Check .env
if [ ! -f .env ]; then
    echo "📝 Creating .env from production template..."
    cp .env.production .env
    echo ""
    echo "⚠️  IMPORTANT: Edit .env with your credentials!"
    echo ""
    echo "Required:"
    echo "- APPTROVE_DASHBOARD_EMAIL"
    echo "- APPTROVE_DASHBOARD_PASSWORD"
    echo ""
    read -p "Press Enter after editing .env file..."
fi

echo "🛑 Stopping existing containers..."
docker-compose down 2>/dev/null || true

echo "📦 Building image..."
docker-compose build

echo "🚀 Starting services..."
docker-compose up -d

echo ""
echo "⏳ Waiting for service to start..."
sleep 10

echo ""
echo "📊 Container Status:"
docker-compose ps

echo ""
echo "🔍 Health Check:"
curl -s http://localhost/health | python3 -m json.tool || echo "Service starting..."

echo ""
echo "✅ Deployment Complete!"
echo ""
echo "📝 Commands:"
echo "  Logs:    docker-compose logs -f"
echo "  Stop:    docker-compose down"
echo "  Restart: docker-compose restart"
echo "  Rebuild: docker-compose up -d --build"
echo ""
echo "🌐 API Endpoints:"
echo "  Health:  http://$(curl -s ifconfig.me)/health"
echo "  API:     http://$(curl -s ifconfig.me)/api/users"
echo ""
