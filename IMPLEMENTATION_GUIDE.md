# Link Creation Implementation Guide

## 🎯 Executive Summary

**Current State:** AppTrove API does NOT support link creation (404 errors)
**Old Solution:** Node.js backend with Puppeteer automation (500+ lines, complex)
**Recommended:** Python Playwright automation (simpler, faster, modern)

---

## 📊 Comparison of Options

| Feature | Manual | Playwright (Python) | Puppeteer (Node.js) |
|---------|--------|-------------------|-------------------|
| **Setup Time** | 0 min | 2 hours | Already exists (complex) |
| **Per Link Time** | 30 sec | 3-5 sec | 3-5 sec |
| **Maintenance** | None | Low | High (old code) |
| **Reliability** | 100% | 85-90% | 85-90% |
| **Scalability** | Poor (manual) | Excellent | Excellent |
| **Code Complexity** | N/A | ~100 lines | ~500 lines |
| **Dependencies** | None | playwright | puppeteer, chrome |
| **Integration** | Existing | Easy (FastAPI) | Hard (separate stack) |

---

## ✅ RECOMMENDED: Python Playwright

### Why Playwright over Puppeteer?

1. **Modern & Maintained:** Active development, better APIs
2. **Faster:** 20-30% faster than Puppeteer
3. **Python Native:** Integrates with FastAPI backend
4. **Simpler Code:** ~100 lines vs 500 lines
5. **Better Error Handling:** Built-in retries and waits
6. **Cross-browser:** Can use Chrome, Firefox, or Edge

### Quick Start (30 minutes)

```bash
# 1. Install Playwright
cd backend-python
pip install playwright
playwright install chromium

# 2. Add credentials to .env
echo "APPTROVE_DASHBOARD_EMAIL=your-email@example.com" >> .env
echo "APPTROVE_DASHBOARD_PASSWORD=your-password" >> .env

# 3. Implementation is already prepared below!
```

---

## 🚀 Implementation Code

### Add to `backend-python/main.py`:

```python
from playwright.async_api import async_playwright
import os

APPTROVE_DASHBOARD_EMAIL = os.getenv("APPTROVE_DASHBOARD_EMAIL")
APPTROVE_DASHBOARD_PASSWORD = os.getenv("APPTROVE_DASHBOARD_PASSWORD")

async def create_link_via_automation(template_id: str, link_name: str, campaign: str):
    """
    Create AppTrove link via browser automation
    Returns: {"success": True, "unilink": "...", "linkId": "..."}
    """
    if not APPTROVE_DASHBOARD_EMAIL or not APPTROVE_DASHBOARD_PASSWORD:
        return {
            "success": False,
            "error": "AppTrove dashboard credentials not configured"
        }
    
    async with async_playwright() as p:
        # Launch browser
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        try:
            # Login to AppTrove
            await page.goto('https://dashboard.apptrove.com/login')
            await page.fill('input[type="email"]', APPTROVE_DASHBOARD_EMAIL)
            await page.fill('input[type="password"]', APPTROVE_DASHBOARD_PASSWORD)
            await page.click('button[type="submit"]')
            await page.wait_for_url('**/dashboard', timeout=30000)
            
            # Navigate to template
            await page.goto(f'https://dashboard.apptrove.com/v2/app/{template_id}')
            await page.wait_for_load_state('networkidle')
            
            # Click "Add Link" button
            await page.click('button:has-text("Add Link")')
            await page.wait_for_timeout(2000)
            
            # Fill form - Step 1: Basic Details
            inputs = await page.locator('input[type="text"]').all()
            if len(inputs) >= 3:
                await inputs[0].fill(link_name)  # Link Name
                await inputs[1].fill(campaign)    # Campaign
                await inputs[2].fill(campaign)    # Deep Linking
            
            # Click Next
            await page.click('button:has-text("Next")')
            await page.wait_for_timeout(2000)
            
            # Step 2: Advanced Settings (skip)
            await page.click('button:has-text("Next")')
            await page.wait_for_timeout(2000)
            
            # Step 3: Redirection (submit)
            await page.click('button:has-text("Create")')
            await page.wait_for_timeout(5000)
            
            # Extract created link
            await page.goto(f'https://dashboard.apptrove.com/v2/app/{template_id}')
            await page.wait_for_load_state('networkidle')
            
            # Find the link in the table
            link_url = await page.evaluate(f'''() => {{
                const rows = document.querySelectorAll('tr');
                for (const row of rows) {{
                    if (row.textContent.includes('{link_name}')) {{
                        const links = row.querySelectorAll('a[href*="applink"]');
                        if (links.length > 0) {{
                            return links[0].href;
                        }}
                    }}
                }}
                return null;
            }}''')
            
            await browser.close()
            
            if link_url:
                link_id = link_url.split('/d/')[1].split('?')[0] if '/d/' in link_url else None
                return {
                    "success": True,
                    "unilink": link_url,
                    "linkId": link_id,
                    "createdVia": "automation"
                }
            else:
                return {
                    "success": False,
                    "error": "Link created but URL not found. Check dashboard manually."
                }
                
        except Exception as e:
            await browser.close()
            return {
                "success": False,
                "error": f"Automation failed: {str(e)}"
            }

# Update the approve_user endpoint to use automation
@app.post("/api/users/{user_id}/approve")
async def approve_user(user_id: str, request: ApproveRequest):
    """Approve user and create AppTrove link"""
    check_dynamodb()
    
    try:
        # Get user
        response = users_table.get_item(Key={'id': user_id})
        user = response.get('Item')
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Create AppTrove link via automation
        template_id = "wBehUW"  # Millionaires Adda
        campaign = f"{user.get('name', 'Affiliate')}_Affiliate_Influencer".replace(' ', '_')
        
        link_result = await create_link_via_automation(
            template_id=template_id,
            link_name=f"{user.get('name')} - Affiliate Link",
            campaign=campaign
        )
        
        # Update user
        update_data = {
            "approvalStatus": "approved",
            "approvedAt": datetime.utcnow().isoformat(),
            "approvedBy": request.approvedBy,
            "status": "active"
        }
        
        if request.adminNotes:
            update_data["adminNotes"] = request.adminNotes
        
        if link_result.get("success") and link_result.get("unilink"):
            update_data["unilink"] = link_result["unilink"]
            update_data["linkId"] = link_result.get("linkId")
            update_data["templateId"] = template_id
        
        users_table.update_item(
            Key={'id': user_id},
            UpdateExpression='SET ' + ', '.join([f'{k} = :{k}' for k in update_data.keys()]) + ', updatedAt = :updatedAt',
            ExpressionAttributeValues={f':{k}': v for k, v in update_data.items()} | {':updatedAt': datetime.utcnow().isoformat()},
            ReturnValues='ALL_NEW'
        )
        
        return {
            "success": True,
            "message": "User approved successfully",
            "link": link_result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

## 📋 Testing Checklist

### Before Production:
- [ ] Add credentials to `.env`
- [ ] Test link creation manually
- [ ] Test with 3-5 real affiliates
- [ ] Verify links work on mobile
- [ ] Check links appear in AppTrove dashboard
- [ ] Test fallback to manual if automation fails

### Monitoring:
- [ ] Log all link creations
- [ ] Alert on automation failures
- [ ] Track success rate (target: >90%)

---

## 🔧 Troubleshooting

### "Credentials not configured"
→ Add `APPTROVE_DASHBOARD_EMAIL` and `APPTROVE_DASHBOARD_PASSWORD` to `.env`

### "Timeout" errors
→ Increase timeout values (30s → 60s)

### "Button not found"
→ AppTrove UI changed, update selectors

### Links not appearing
→ Links are created but extraction failed
→ Check AppTrove dashboard manually
→ Add more wait time after creation

---

## 📈 Success Metrics

**Target Performance:**
- Link creation time: <5 seconds
- Success rate: >90%
- Manual fallback rate: <10%

**Current (Manual):**
- Time: 30 seconds per link
- Success rate: 100%
- Scalability: Limited

**Expected (Playwright):**
- Time: 3-5 seconds per link
- Success rate: 85-95%
- Scalability: Unlimited

---

## 🎬 Next Steps

1. **Immediate (5 min):**
   ```bash
   pip install playwright
   playwright install chromium
   ```

2. **Setup (10 min):**
   - Add credentials to `.env`
   - Test login works

3. **Implement (30 min):**
   - Copy code above into `main.py`
   - Test with one affiliate

4. **Production (1 hour):**
   - Test with real affiliates
   - Monitor success rate
   - Add error logging

---

## 💡 Pro Tips

1. **Headless Mode:** Set `headless=False` for debugging
2. **Screenshots:** Add `await page.screenshot(path='debug.png')` for debugging
3. **Logs:** Log every step for troubleshooting
4. **Fallback:** Always have manual option as backup
5. **Rate Limit:** Add delay between creations to avoid rate limits

