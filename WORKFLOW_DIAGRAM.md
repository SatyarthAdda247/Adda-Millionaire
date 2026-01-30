# Partners Portal - Workflow Diagram

## System Architecture Flow

```mermaid
graph TB
    User[👤 User/Affiliate] --> Frontend[🌐 Frontend<br/>partners.addaeducation.com<br/>React + Vite]
    Admin[👨‍💼 Admin] --> Frontend
    
    Frontend -->|API Calls| Backend[⚙️ Backend API<br/>api.partners.addaeducation.com<br/>Python FastAPI]
    
    Backend -->|Read/Write| DynamoDB[(📊 AWS DynamoDB<br/>Users, Links, Analytics)]
    Backend -->|Fetch Templates| AppTrove[🔗 AppTrove API<br/>Link Management]
    Backend -->|Get Stats| AppTrove
    
    Frontend -->|Static Files| CDN[📦 Static Assets<br/>health.json]
    
    style Frontend fill:#4A90E2,color:#fff
    style Backend fill:#50C878,color:#fff
    style DynamoDB fill:#FFA500,color:#fff
    style AppTrove fill:#9B59B6,color:#fff
```

## Affiliate Approval Workflow

```mermaid
sequenceDiagram
    participant A as Admin
    participant F as Frontend
    participant B as Backend API
    participant D as DynamoDB
    participant AT as AppTrove
    
    A->>F: Login to Dashboard
    F->>B: GET /api/users?approvalStatus=pending
    B->>D: Query pending affiliates
    D-->>B: Return affiliate list
    B-->>F: Display pending affiliates
    
    A->>F: Click "Approve" on affiliate
    F->>B: POST /api/users/{id}/approve
    B->>D: Update affiliate status to "approved"
    D-->>B: Confirmation
    B-->>F: Success response
    
    Note over A,AT: Admin creates link manually in AppTrove
    A->>AT: Create link in AppTrove Dashboard
    AT-->>A: Return link URL
    
    A->>F: Paste link URL
    F->>B: POST /api/users/{id}/assign-link
    B->>D: Save link to affiliate record
    D-->>B: Confirmation
    B-->>F: Link assigned successfully
    F-->>A: Show success message
```

## Link Creation & Tracking Flow

```mermaid
flowchart LR
    Start([Affiliate Gets Link]) --> Click[User Clicks Link]
    Click --> AppTrove[AppTrove Processes]
    AppTrove --> Check{App Installed?}
    
    Check -->|No| PlayStore[Redirect to Play Store]
    Check -->|Yes| DeepLink[Deep Link to App]
    
    PlayStore --> Install[User Installs App]
    Install --> Open[User Opens App]
    DeepLink --> Open
    
    Open --> Track[AppTrove Tracks Event]
    Track --> Analytics[Analytics Stored]
    Analytics --> Dashboard[Admin Views Dashboard]
    
    style Start fill:#4A90E2,color:#fff
    style AppTrove fill:#9B59B6,color:#fff
    style Analytics fill:#FFA500,color:#fff
    style Dashboard fill:#50C878,color:#fff
```

## Data Flow Architecture

```mermaid
graph TD
    subgraph "Frontend Layer"
        UI[React Components]
        API_Client[API Client<br/>backend-api.ts]
    end
    
    subgraph "Backend Layer"
        API[FastAPI Endpoints]
        Business[Business Logic]
    end
    
    subgraph "Data Layer"
        Users[(Users Table)]
        Links[(Links Table)]
        Analytics[(Analytics Table)]
    end
    
    subgraph "External Services"
        AppTrove_API[AppTrove API]
    end
    
    UI --> API_Client
    API_Client -->|HTTP Requests| API
    API --> Business
    Business --> Users
    Business --> Links
    Business --> Analytics
    Business -->|API Calls| AppTrove_API
    
    AppTrove_API -->|Templates & Stats| Business
    Users -->|Query Results| Business
    Links -->|Query Results| Business
    Analytics -->|Query Results| Business
    Business -->|JSON Response| API
    API -->|JSON Response| API_Client
    API_Client -->|Update UI| UI
```

## Health Check Flow

```mermaid
sequenceDiagram
    participant M as Monitoring System
    participant F as Frontend
    participant B as Backend
    participant D as DynamoDB
    participant AT as AppTrove
    
    M->>F: GET /health.json
    F-->>M: {"status":"ok"}
    
    M->>B: GET /health
    B->>D: Test Connection
    D-->>B: Connection OK
    B->>AT: Test API Key
    AT-->>B: API Key Valid
    B-->>M: {"status":"ok","dynamodb":"configured","apptrove":"configured"}
```

## Deployment Architecture

```mermaid
graph TB
    Internet[🌐 Internet] --> DNS[DNS<br/>partners.addaeducation.com]
    DNS --> EC2[AWS EC2 Instance]
    
    subgraph "EC2 Container"
        Docker[Docker Container]
        Docker --> Backend[FastAPI Backend<br/>Port 8000]
        Backend --> Frontend[Static Files<br/>React Build]
    end
    
    EC2 --> Docker
    Docker --> DynamoDB[(AWS DynamoDB<br/>ap-south-1)]
    Docker --> AppTrove[AppTrove API<br/>api.apptrove.com]
    
    style EC2 fill:#FF6B6B,color:#fff
    style Docker fill:#4ECDC4,color:#fff
    style DynamoDB fill:#FFA500,color:#fff
    style AppTrove fill:#9B59B6,color:#fff
```

## User Journey - Affiliate Onboarding

```mermaid
stateDiagram-v2
    [*] --> SignUp: Affiliate Signs Up
    SignUp --> Pending: Form Submitted
    Pending --> AdminReview: Admin Notified
    AdminReview --> Approved: Admin Approves
    AdminReview --> Rejected: Admin Rejects
    Approved --> LinkCreation: Link Created in AppTrove
    LinkCreation --> LinkAssigned: Link Assigned to Affiliate
    LinkAssigned --> Active: Affiliate Active
    Rejected --> [*]
    Active --> Tracking: Links Tracked
    Tracking --> Analytics: Data Collected
    Analytics --> Dashboard: Admin Views Stats
```

## API Request Flow

```mermaid
flowchart TD
    Request[HTTP Request] --> CORS{CORS Check}
    CORS -->|Allowed| Auth{Authentication}
    CORS -->|Blocked| Error1[403 Forbidden]
    
    Auth -->|Valid| Route{Route Handler}
    Auth -->|Invalid| Error2[401 Unauthorized]
    
    Route -->|GET /api/users| UsersHandler[Users Handler]
    Route -->|POST /api/users/{id}/approve| ApproveHandler[Approve Handler]
    Route -->|GET /api/apptrove/templates| TemplatesHandler[Templates Handler]
    Route -->|GET /api/dashboard/stats| StatsHandler[Stats Handler]
    
    UsersHandler --> DynamoDB[(DynamoDB)]
    ApproveHandler --> DynamoDB
    TemplatesHandler --> AppTrove[AppTrove API]
    StatsHandler --> DynamoDB
    
    DynamoDB --> Response[JSON Response]
    AppTrove --> Response
    Response --> Client[Client Receives Data]
    
    style Request fill:#4A90E2,color:#fff
    style Response fill:#50C878,color:#fff
    style Error1 fill:#FF6B6B,color:#fff
    style Error2 fill:#FF6B6B,color:#fff
```

---

## Diagram Formats

These diagrams use **Mermaid** syntax and can be rendered in:
- GitHub markdown files
- GitLab markdown
- VS Code with Mermaid extension
- Online at https://mermaid.live

## Key Components

1. **Frontend:** React SPA served from `partners.addaeducation.com`
2. **Backend:** FastAPI REST API at `api.partners.addaeducation.com`
3. **Database:** AWS DynamoDB for persistent storage
4. **External:** AppTrove API for link management and tracking
5. **Deployment:** Docker container on AWS EC2
