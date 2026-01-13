# Affiliate Management Dashboard

A comprehensive dashboard for managing and tracking all affiliates in the Millionaire's Adda program.

## Features

### 📊 Overview Statistics
- **Total Affiliates**: Count of all registered affiliates
- **Active Affiliates**: Number of currently active affiliates
- **Total Clicks**: Aggregate clicks across all affiliate links
- **Total Conversions**: Total number of conversions
- **Total Earnings**: Total revenue generated
- **Conversion Rate**: Average conversion rate percentage

### 🔍 Search & Filtering
- **Search**: Search by name, email, or social handle
- **Platform Filter**: Filter affiliates by platform (Instagram, YouTube, Telegram, etc.)
- **Sorting**: Sort by date joined, name, clicks, conversions, or earnings
- **Sort Order**: Ascending or descending order

### 📋 Affiliate Management
- **View Details**: Click the eye icon to view full affiliate details
- **Edit Information**: Update affiliate details (name, phone, platform, followers, status)
- **Trackier Links**: View and copy affiliate tracking links
- **Performance Metrics**: See individual affiliate stats (clicks, conversions, earnings)

### 📈 Analytics Tracking
- **Real-time Stats**: View up-to-date performance metrics
- **Individual Analytics**: Track each affiliate's performance over time
- **Top Performers**: See which affiliates are generating the most revenue
- **Activity Timeline**: View recent activity and updates

## Accessing the Dashboard

Navigate to: `http://localhost:5173/dashboard`

## API Endpoints Used

### Dashboard Statistics
```
GET /api/dashboard/stats
```
Returns overview statistics, top performers, and recent activity.

### Affiliates List
```
GET /api/users?search=query&platform=Instagram&sortBy=earnings&sortOrder=desc
```
Returns list of all affiliates with optional filtering and sorting.

### Affiliate Details
```
GET /api/users/:id
```
Returns detailed information about a specific affiliate.

### Affiliate Analytics
```
GET /api/users/:id/analytics?startDate=2024-01-01&endDate=2024-12-31&groupBy=day
```
Returns analytics data for a specific affiliate with optional date filtering.

### Update Affiliate
```
PUT /api/users/:id
```
Updates affiliate information (name, phone, platform, followers, status).

### Sync Analytics
```
POST /api/analytics/sync
```
Syncs analytics data from AppTrove/Trackier API.

## Dashboard Components

### 1. Stats Cards
Displays key metrics at a glance:
- Total Affiliates
- Total Clicks
- Conversions
- Total Earnings
- Conversion Rate

### 2. Filters Bar
- Search input for quick filtering
- Platform dropdown filter
- Sort by dropdown
- Sort order toggle

### 3. Affiliates Table
Comprehensive table showing:
- Affiliate name, email, and social handle
- Platform badge
- Follower count
- Performance metrics (clicks, conversions, earnings)
- Conversion rate with color coding
- Join date
- Action buttons (view/edit)

### 4. Affiliate Detail Modal
Detailed view with:
- Performance overview cards
- Editable affiliate information
- Trackier links with copy/open actions
- Analytics timeline

## Data Structure

### Affiliate Object
```typescript
{
  id: string;
  name: string;
  email: string;
  phone: string;
  platform: string;
  socialHandle: string;
  followerCount: string;
  createdAt: string;
  status?: "active" | "inactive" | "pending";
  stats: {
    totalClicks: number;
    totalConversions: number;
    totalEarnings: number;
    conversionRate: number;
    lastActivity: string;
  };
  links: Array<{
    id: string;
    link: string;
  }>;
}
```

### Analytics Entry
```typescript
{
  id: string;
  userId: string;
  linkId: string | null;
  clicks: number;
  conversions: number;
  earnings: number;
  date: string;
  createdAt: string;
}
```

## Usage Examples

### Viewing All Affiliates
1. Navigate to `/dashboard`
2. View the table with all affiliates
3. Use filters to narrow down results

### Editing an Affiliate
1. Click the edit icon (pencil) next to an affiliate
2. Modify the fields you want to change
3. Click "Save" to update

### Viewing Performance
1. Click the eye icon to view details
2. See performance metrics in the overview cards
3. View Trackier links and copy them if needed

### Syncing Analytics
1. Click "Sync Analytics" button in the header
2. Wait for sync to complete
3. Refresh data to see updated stats

## Future Enhancements

- [ ] Export functionality (CSV/Excel)
- [ ] Advanced analytics charts
- [ ] Email notifications for milestones
- [ ] Bulk actions (activate/deactivate multiple affiliates)
- [ ] Performance comparison tools
- [ ] Automated reporting
- [ ] Integration with payment systems
- [ ] Real-time updates via WebSocket

## Notes

- The dashboard requires the backend API to be running
- Analytics sync requires AppTrove API key configuration
- For production, add authentication and role-based access control
- Consider implementing pagination for large affiliate lists
