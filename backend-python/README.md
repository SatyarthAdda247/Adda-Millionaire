# Python Backend for Affiliate Management

FastAPI backend that handles all API calls to AppTrove and DynamoDB.

## Setup

1. **Install Python 3.8+**

2. **Create virtual environment:**
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

4. **Configure environment variables:**
```bash
cp .env.example .env
# Edit .env with your actual credentials
```

5. **Run the server:**
```bash
python main.py
```

Or with uvicorn:
```bash
uvicorn main:app --reload --port 3001
```

## API Endpoints

### Users/Affiliates
- `GET /api/users` - Get all users
- `GET /api/users/{id}` - Get user by ID
- `PUT /api/users/{id}` - Update user
- `POST /api/users/{id}/approve` - Approve user
- `POST /api/users/{id}/reject` - Reject user
- `DELETE /api/users/{id}` - Delete user
- `GET /api/users/{id}/analytics` - Get user analytics

### AppTrove
- `GET /api/apptrove/templates` - Get templates
- `POST /api/apptrove/create-link` - Create link
- `GET /api/apptrove/stats?linkId={id}` - Get link stats

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/analytics` - Get dashboard analytics

### Health
- `GET /health` - Health check

## Environment Variables

Required:
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `AWS_REGION` - AWS region (default: ap-south-1)

AppTrove:
- `APPTROVE_API_KEY` - S2S API key
- `APPTROVE_SECRET_ID` - Secret ID
- `APPTROVE_SECRET_KEY` - Secret key
- `APPTROVE_REPORTING_API_KEY` - Reporting API key
- `APPTROVE_SDK_KEY` - SDK key

## Testing

The server runs on `http://localhost:3001`

Test with:
```bash
curl http://localhost:3001/health
```
