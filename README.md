# Millionaires Adda - Affiliate Platform

Production-ready affiliate management platform with AppTrove integration.

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Start frontend
npm run dev

# Start backend
cd backend-python
pip install -r requirements.txt
python main.py
```

### Production (AWS)

```bash
# Configure environment
cp .env.example .env

# Deploy
chmod +x deploy.sh
./deploy.sh
```

## Environment Variables

Copy `.env.example` to `.env` and configure:
- AWS credentials
- DynamoDB tables
- AppTrove API keys

## Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Backend:** Python FastAPI
- **Database:** AWS DynamoDB
- **Deployment:** Docker + AWS EC2
