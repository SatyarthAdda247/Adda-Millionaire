# Millionaires Adda - Partners Portal

## 📋 Project Overview

**Millionaires Adda** is a production-ready affiliate management platform designed for Adda247 Education. It enables the management of affiliate partners, tracking their performance through AppTrove integration, and provides comprehensive analytics dashboards for both administrators and affiliates.

### 🎯 Purpose
- Manage affiliate partner onboarding and approval workflows
- Generate and track affiliate marketing links via AppTrove
- Monitor affiliate performance with real-time analytics
- Provide separate dashboards for admins and affiliates

---

## 🏗️ Architecture

### Technology Stack

#### Frontend
- **Framework**: React 18.3.1 with TypeScript
- **Build Tool**: Vite 5.4.19
- **UI Library**: Radix UI components with shadcn/ui
- **Styling**: Tailwind CSS with custom design system
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router DOM v6
- **Charts**: Recharts for analytics visualization
- **Animations**: Framer Motion

#### Backend
- **Framework**: Python FastAPI
- **Runtime**: Uvicorn ASGI server
- **Database**: AWS DynamoDB
- **Browser Automation**: Playwright (for AppTrove integration)
- **API Client**: Requests library

#### Infrastructure
- **Deployment**: Docker containerized application
- **CI/CD**: Jenkins pipeline with ArgoCD
- **Cloud Provider**: AWS (EC2, DynamoDB)
- **Container Orchestration**: Kubernetes
- **Domain**: partners.addaeducation.com

---

## 📁 Project Structure

```
adda-creator-path-main/
├── frontend/                    # React frontend application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Page components
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── AdminLogin.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Index.tsx
│   │   │   ├── UserDashboard.tsx
│   │   │   └── UserLogin.tsx
│   │   ├── hooks/              # Custom React hooks
│   │   └── lib/                # Utility functions
│   ├── dist/                   # Production build output
│   ├── server.js               # Express server for production
│   └── package.json
│
├── backend/                     # Python FastAPI backend
│   ├── main.py                 # Main API application (699 lines)
│   ├── requirements.txt        # Python dependencies
│   └── venv/                   # Virtual environment
│
├── api/                        # API utilities and helpers
├── automation-service/         # Browser automation scripts
├── server/                     # Additional server configurations
│
├── Dockerfile                  # Multi-stage Docker build
├── docker-compose.yml          # Local development setup
├── Jenkinsfile                 # CI/CD pipeline configuration
├── vercel.json                 # Vercel deployment config
│
├── .env.example                # Environment variables template
├── WORKFLOW_DIAGRAM.md         # System architecture diagrams
├── DEPLOYMENT_FIX_SUMMARY.md   # Recent deployment fixes
└── README.md                   # Quick start guide
```

---

## 🔑 Key Features

### 1. **Affiliate Management**
- User registration and onboarding
- Admin approval workflow
- Profile management
- Status tracking (pending, approved, rejected, active, inactive)

### 2. **Link Generation & Tracking**
- AppTrove integration for affiliate link creation
- Browser automation for link generation (Playwright)
- Cookie-based authentication with fallback to OAuth
- Link assignment to approved affiliates

### 3. **Analytics & Reporting**
- Real-time click tracking
- Conversion metrics
- Install and purchase tracking
- Earnings calculations
- Performance dashboards

### 4. **Admin Dashboard**
- View all affiliates with filtering
- Approve/reject applications
- Assign affiliate links
- View system-wide analytics
- Monitor pending approvals

### 5. **User Dashboard**
- Personal affiliate link access
- Performance metrics
- Earnings tracking
- Profile management

---

## 🔄 Workflow Diagrams

The project includes comprehensive workflow diagrams in [`WORKFLOW_DIAGRAM.md`](file:///Users/adda247/Millionaires%20Adda/adda-creator-path-main/WORKFLOW_DIAGRAM.md):

1. **System Architecture Flow** - Overall system components
2. **Affiliate Approval Workflow** - Step-by-step approval process
3. **Link Creation & Tracking Flow** - How links are generated and tracked
4. **Data Flow Architecture** - Frontend ↔ Backend ↔ Database interactions
5. **Health Check Flow** - Monitoring and health verification
6. **Deployment Architecture** - Production infrastructure
7. **User Journey** - Affiliate onboarding state machine
8. **API Request Flow** - HTTP request handling

---

## 🗄️ Database Schema

### DynamoDB Tables

#### 1. **Users Table** (`edurise-users`)
```typescript
{
  id: string (UUID),
  name: string,
  email: string,
  phone: string,
  platform: string,
  socialHandle: string,
  followerCount: number,
  status: "pending" | "active" | "inactive" | "deleted",
  approvalStatus: "pending" | "approved" | "rejected",
  unilink?: string,
  linkId?: string,
  templateId?: string,
  adminNotes?: string,
  approvedBy?: string,
  approvedAt?: string,
  rejectedAt?: string,
  createdAt: string,
  updatedAt: string,
  deletedAt?: string
}
```

#### 2. **Links Table** (`edurise-links`)
- Stores affiliate link metadata
- Tracks link creation and assignment

#### 3. **Analytics Table** (`edurise-analytics`)
- Stores click events
- Conversion tracking
- Performance metrics

---

## 🔌 API Endpoints

### Health & Status
- `GET /` - Root endpoint
- `GET /health` - Health check (optimized for Kubernetes probes)

### User Management
- `POST /api/users` - Create new user/affiliate
- `GET /api/users` - List users (with filters)
- `GET /api/users/{user_id}` - Get user details
- `PUT /api/users/{user_id}` - Update user
- `DELETE /api/users/{user_id}` - Soft delete user
- `GET /api/users/{user_id}/analytics` - Get user analytics

### Admin Actions
- `POST /api/users/{user_id}/approve` - Approve affiliate
- `POST /api/users/{user_id}/reject` - Reject affiliate
- `POST /api/users/{user_id}/assign-link` - Assign AppTrove link

### AppTrove Integration
- `GET /api/apptrove/templates` - Fetch available link templates
- `GET /api/apptrove/stats?linkId={linkId}` - Get link statistics

### Dashboard
- `GET /api/dashboard/stats` - System-wide statistics
- `GET /api/dashboard/analytics` - Aggregated analytics

---

## 🔐 Environment Variables

### Required Variables

```bash
# AppTrove API Configuration
APPTROVE_SDK_KEY=your_sdk_key
APPTROVE_S2S_API_KEY=your_s2s_api_key
APPTROVE_SECRET_ID=your_secret_id
APPTROVE_SECRET_KEY=your_secret_key
APPTROVE_REPORTING_API_KEY=your_reporting_key
APPTROVE_API_URL=https://api.apptrove.com
APPTROVE_DOMAIN=applink.learnr.co.in

# AWS Configuration
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# DynamoDB Tables
DYNAMODB_USERS_TABLE=edurise-users
DYNAMODB_LINKS_TABLE=edurise-links
DYNAMODB_ANALYTICS_TABLE=edurise-analytics

# AppTrove Dashboard Automation (Optional)
APPTROVE_DASHBOARD_EMAIL=your_email
APPTROVE_DASHBOARD_PASSWORD=your_password
APPTROVE_COOKIES_FILE=apptrove_cookies.json

# Server Configuration
PORT=8000
NODE_ENV=production
```

See [`.env.example`](file:///Users/adda247/Millionaires%20Adda/adda-creator-path-main/.env.example) for complete configuration options.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20.x
- Python 3.10+
- AWS Account with DynamoDB access
- AppTrove API credentials

### Local Development

#### 1. Install Dependencies

**Frontend:**
```bash
cd frontend
npm install --legacy-peer-deps
```

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

#### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your actual credentials
```

#### 3. Start Development Servers

**Frontend (Port 8080):**
```bash
cd frontend
npm run dev
```

**Backend (Port 3001):**
```bash
cd backend
python main.py
# Or use uvicorn directly:
uvicorn main:app --host 0.0.0.0 --port 3001 --reload
```

#### 4. Access Application
- Frontend: http://localhost:8080
- Backend API: http://localhost:3001
- API Docs: http://localhost:3001/docs

---

## 🐳 Docker Deployment

### Build Image
```bash
docker build -t partners-portal .
```

### Run Container
```bash
docker run -p 8080:8080 -p 3001:3001 \
  --env-file .env \
  partners-portal
```

### Using Docker Compose
```bash
docker-compose up -d
```

---

## 📦 Production Deployment

### Deployment Flow

1. **Code Push** → GitHub repository
2. **Jenkins Build** → Builds Docker image
3. **Image Push** → Container registry
4. **ArgoCD Sync** → Deploys to Kubernetes
5. **Health Checks** → Verifies deployment

### Health Check Configuration

**Frontend Health Check:**
- Endpoint: `GET /health`
- Response time: < 50ms
- Returns: `{"status": "ok", "service": "Partners Portal Frontend"}`

**Backend Health Check:**
- Endpoint: `GET /health`
- Response time: < 100ms
- Returns: `{"status": "ok", "uptime": 123, "ready": true}`

### Recent Deployment Fixes

See [`DEPLOYMENT_FIX_SUMMARY.md`](file:///Users/adda247/Millionaires%20Adda/adda-creator-path-main/DEPLOYMENT_FIX_SUMMARY.md) for details on:
- Frontend server import fixes
- Backend health endpoint optimization
- Docker startup verification improvements
- Kubernetes probe configuration

---

## 🔧 AppTrove Integration

### Link Creation Methods

#### 1. **Browser Automation** (Primary)
Uses Playwright to automate AppTrove dashboard:
- Cookie-based authentication (preferred)
- Gmail OAuth fallback
- Automated form filling
- Link extraction from dashboard

**Generate Cookies:**
```bash
python generate-cookies.py
```

#### 2. **Manual Assignment** (Fallback)
Admin creates link in AppTrove dashboard manually and assigns via API:
```bash
POST /api/users/{user_id}/assign-link
{
  "unilink": "https://applink.learnr.co.in/d/ABC123",
  "templateId": "wBehUW"
}
```

### Authentication Strategies

1. **Cookie-based** (Most reliable)
   - Pre-generated session cookies
   - No login required
   - Fast execution

2. **Gmail OAuth** (Fallback)
   - Automated Google sign-in
   - Requires credentials
   - Slower but reliable

3. **Manual** (Last resort)
   - Admin creates link manually
   - Copy-paste into system

---

## 📊 Analytics & Tracking

### Metrics Tracked

- **Clicks**: Total link clicks
- **Installs**: App installations
- **Purchases**: In-app purchases
- **Conversions**: Click-to-install rate
- **Earnings**: Revenue generated
- **Performance**: Per-affiliate metrics

### Data Flow

```
User Click → AppTrove → Event Tracking → DynamoDB → Dashboard
```

---

## 🛠️ Development Tools

### Testing Scripts

The project includes numerous test scripts for API validation:

- `test-link-generation.py` - Python-based link generation testing
- `test-apptrove-api.js` - AppTrove API endpoint testing
- `test-comprehensive.js` - Full system integration tests
- `test-link-localhost.js` - Local development testing

### Automation Scripts

- `generate-cookies.py` - Generate AppTrove session cookies
- `create-test-link.js` - Create test affiliate links
- `fetch-template-data.js` - Fetch AppTrove templates

---

## 🔍 Troubleshooting

### Common Issues

#### 1. **DynamoDB Connection Failed**
```bash
# Verify AWS credentials
aws dynamodb list-tables --region ap-south-1

# Check .env configuration
cat .env | grep AWS
```

#### 2. **AppTrove API Errors**
```bash
# Test API key
curl -H "api-key: YOUR_KEY" https://api.apptrove.com/internal/link-template

# Regenerate cookies
python generate-cookies.py
```

#### 3. **Frontend Build Errors**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

#### 4. **Docker Health Check Failures**
See [`DEPLOYMENT_TROUBLESHOOTING.md`](file:///Users/adda247/Millionaires%20Adda/adda-creator-path-main/DEPLOYMENT_TROUBLESHOOTING.md)

---

## 📝 Code Quality

### Backend Structure (`main.py`)

**Key Components:**
- **Lines 1-83**: Imports, configuration, DynamoDB setup
- **Lines 84-110**: Pydantic models for request validation
- **Lines 111-134**: Helper functions
- **Lines 136-302**: Browser automation (Playwright)
- **Lines 304-327**: Health endpoints
- **Lines 329-590**: User management endpoints
- **Lines 592-634**: AppTrove integration endpoints
- **Lines 636-693**: Dashboard analytics endpoints

### Frontend Architecture

**Component Structure:**
- **Pages**: Route-level components
- **Components**: Reusable UI elements (Radix UI + shadcn)
- **Hooks**: Custom React hooks for data fetching
- **Lib**: Utility functions and API clients

---

## 🔒 Security Considerations

### Authentication
- Admin login required for dashboard access
- User authentication for affiliate portal
- API key validation for AppTrove

### Data Protection
- Environment variables for sensitive data
- AWS IAM roles for DynamoDB access
- CORS configuration for API security

### CORS Configuration
```python
allow_origins=[
    "http://localhost:8080",
    "https://partners.addaeducation.com",
    "https://www.partners.addaeducation.com",
    "https://api.partners.addaeducation.com"
]
```

---

## 📈 Performance Optimization

### Frontend
- Vite for fast builds and HMR
- Code splitting with React Router
- Lazy loading for components
- TanStack Query for caching

### Backend
- FastAPI async endpoints
- Optimized health checks (no DB queries)
- Connection pooling for DynamoDB
- Efficient query patterns

### Infrastructure
- Docker multi-stage builds
- Kubernetes horizontal scaling
- CDN for static assets
- Health check optimization (< 100ms)

---

## 🚦 CI/CD Pipeline

### Jenkins Pipeline Stages

1. **Checkout** - Pull latest code
2. **Build** - Create Docker image
3. **Test** - Run integration tests
4. **Push** - Upload to registry
5. **Deploy** - Trigger ArgoCD sync

### ArgoCD Configuration
- Auto-sync enabled
- Health checks configured
- Rollback on failure
- Progressive deployment

---

## 📚 Additional Documentation

- [`README.md`](file:///Users/adda247/Millionaires%20Adda/adda-creator-path-main/README.md) - Quick start guide
- [`WORKFLOW_DIAGRAM.md`](file:///Users/adda247/Millionaires%20Adda/adda-creator-path-main/WORKFLOW_DIAGRAM.md) - System architecture diagrams
- [`DEPLOYMENT_FIX_SUMMARY.md`](file:///Users/adda247/Millionaires%20Adda/adda-creator-path-main/DEPLOYMENT_FIX_SUMMARY.md) - Recent deployment fixes
- [`DEPLOYMENT_GUIDE.md`](file:///Users/adda247/Millionaires%20Adda/adda-creator-path-main/DEPLOYMENT_GUIDE.md) - Deployment instructions
- [`DEPLOYMENT_TROUBLESHOOTING.md`](file:///Users/adda247/Millionaires%20Adda/adda-creator-path-main/DEPLOYMENT_TROUBLESHOOTING.md) - Common issues
- [`TRACKIER_INTEGRATION.md`](file:///Users/adda247/Millionaires%20Adda/adda-creator-path-main/TRACKIER_INTEGRATION.md) - Trackier setup guide
- [`QUICKSTART.md`](file:///Users/adda247/Millionaires%20Adda/adda-creator-path-main/QUICKSTART.md) - Quick reference

---

## 🤝 Contributing

### Development Workflow

1. Create feature branch
2. Make changes
3. Test locally
4. Submit for review
5. Deploy to staging
6. Production deployment

### Code Standards

- **Frontend**: ESLint + TypeScript strict mode
- **Backend**: PEP 8 Python style guide
- **Commits**: Conventional commits format

---

## 📞 Support & Maintenance

### Monitoring
- Health checks every 10 seconds
- ArgoCD deployment status
- CloudWatch logs (AWS)
- Application performance metrics

### Backup Strategy
- DynamoDB point-in-time recovery
- Daily automated backups
- Version control for code

---

## 🎯 Future Enhancements

### Planned Features
- [ ] Email notifications for approvals
- [ ] Advanced analytics with custom date ranges
- [ ] Bulk affiliate import
- [ ] API rate limiting
- [ ] Multi-language support
- [ ] Mobile app for affiliates
- [ ] Automated payout calculations
- [ ] Integration with payment gateways

### Technical Improvements
- [ ] GraphQL API option
- [ ] Redis caching layer
- [ ] Elasticsearch for analytics
- [ ] Automated testing suite
- [ ] Performance monitoring (New Relic/Datadog)

---

## 📄 License

Proprietary - Adda247 Education

---

## 👥 Team

**Project**: Millionaires Adda - Partners Portal  
**Organization**: Adda247 Education  
**Domain**: partners.addaeducation.com  

---

## 🔗 Quick Links

- **Production**: https://partners.addaeducation.com
- **API Docs**: https://api.partners.addaeducation.com/docs
- **AppTrove Dashboard**: https://dashboard.apptrove.com
- **AWS Console**: https://console.aws.amazon.com

---

**Last Updated**: February 2026  
**Version**: 1.0.0  
**Status**: Production Ready ✅
