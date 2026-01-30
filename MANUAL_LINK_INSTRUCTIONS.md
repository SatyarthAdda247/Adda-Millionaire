# Manual Link Creation - Simplified Flow

## What Changed

❌ **Removed:** Automatic link creation via Playwright/browser automation  
✅ **Added:** Manual link creation flow

## New Workflow

### Admin Approves Affiliate:

1. Click "Approve" button
2. Backend approves the user
3. AppTrove dashboard opens in new tab (template page)
4. Dialog appears asking for the link

### Admin Creates Link in AppTrove:

1. In the new tab, click "Add Link"
2. Fill form:
   - **Link Name:** `Affiliate Name - Link`
   - **Campaign:** `affiliatename_affiliate`
   - **Source:** Same as campaign
3. Click through Next → Next → Create
4. Copy the generated link URL

### Admin Pastes Link:

1. Go back to admin dashboard
2. Paste link into dialog
3. Click "Assign Link"
4. Done! ✅

## Benefits

✅ No Gmail OAuth issues  
✅ No browser automation complexities  
✅ Simpler and more reliable  
✅ Admin has full control  
✅ Can verify link immediately  

## API Endpoints Updated

### Backend (`main.py`):

```python
# Approve user (no link creation)
POST /api/users/{id}/approve
Body: { "adminNotes": "...", "approvedBy": "admin" }
Response: { "success": true, "message": "User approved..." }

# Assign link manually
POST /api/users/{id}/assign-link  
Body: { "unilink": "https://applink.reevo.in/d/...", "templateId": "wBehUW" }
Response: { "success": true, "message": "Link assigned successfully" }
```

### Frontend (`backend-api.ts`):

```typescript
// Approve affiliate
await approveAffiliate(userId, { adminNotes, approvedBy: 'admin' });

// Assign link
await assignLinkToAffiliate(userId, { 
  unilink: 'https://applink.reevo.in/d/...',
  templateId: 'wBehUW'
});
```

## AdminDashboard Changes

1. **handleApprove:** Simplified to just approve user + open AppTrove tab
2. **Assign Link Dialog:** Shows input field for pasting link
3. **No automation code:** Removed Playwright dependencies

## Testing

```bash
# 1. Start backend
cd backend-python
python3 main.py

# 2. Start frontend  
npm run dev

# 3. Test flow:
# - Go to admin dashboard
# - Click approve on a pending affiliate
# - AppTrove opens in new tab
# - Create link manually
# - Paste link back
# - Verify it's saved
```

## Files Modified

- ✅ `backend-python/main.py` - Simplified approval, added assign-link endpoint
- ✅ `src/lib/backend-api.ts` - Updated assignLinkToAffiliate function
- ⏳ `src/pages/AdminDashboard.tsx` - Needs update to new flow

## Next Steps

Frontend AdminDashboard.tsx needs updating to:
1. Simplify handleApprove (just call API + open tab)
2. Update assign link dialog to have input field
3. Remove all automation-related code

Would you like me to complete the frontend updates?
