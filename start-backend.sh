#!/bin/bash

# Script to start the backend server
# Usage: ./start-backend.sh

echo "🚀 Starting EduRise Backend Server..."
echo ""

cd "$(dirname "$0")/server"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

# Check if .env exists
if [ ! -f ".env" ]; then
  echo "⚠️  Warning: .env file not found!"
  echo "📝 Creating .env from .env.example..."
  if [ -f ".env.example" ]; then
    cp .env.example .env
    echo "✅ Created .env file. Please update it with your configuration."
  else
    echo "❌ .env.example not found. Please create .env manually."
  fi
fi

echo ""
echo "🔧 Starting server on port 3001..."
echo ""

npm start
