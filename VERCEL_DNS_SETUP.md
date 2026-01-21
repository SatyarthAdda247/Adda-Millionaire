# Vercel DNS Setup Guide for partners.addaeducation

## Current Status
- Domain: `partners.addaeducation`
- Status: Invalid Configuration
- Action Required: Update DNS records

## Option 1: Use Vercel DNS (Recommended)

### Step 1: Update Nameservers at Your Domain Registrar

1. **Log in to your domain registrar** (where you purchased `addaeducation` domain)
   - Common registrars: GoDaddy, Namecheap, Google Domains, Cloudflare, etc.

2. **Find DNS/Nameserver settings**
   - Look for "DNS Management", "Nameservers", or "DNS Settings"
   - Usually under "Domain Settings" or "Advanced Settings"

3. **Update nameservers to:**
   ```
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```

4. **Save changes**
   - Changes can take 24-48 hours to propagate
   - Usually takes 1-2 hours

5. **Verify in Vercel**
   - Go back to Vercel → Domain Settings
   - Click "Refresh" button
   - Status should change to "Valid Configuration"

## Option 2: Use DNS Records (If you can't change nameservers)

### Step 1: Add DNS Record at Your Current DNS Provider

1. **Log in to your DNS provider** (where your domain's DNS is currently managed)

2. **Add an A Record:**
   - **Type:** A
   - **Name/Host:** @ (or leave blank, or use `partners`)
   - **Value/IP:** `216.198.79.1`
   - **TTL:** 3600 (or default)

3. **Save the record**

4. **Verify in Vercel**
   - Go to Vercel → Domain Settings → DNS Records tab
   - Click "Refresh"
   - Wait for DNS propagation (can take up to 48 hours, usually 1-2 hours)

## Important Notes

### DNS Propagation Time
- **Typical:** 1-2 hours
- **Maximum:** 24-48 hours
- Vercel will automatically detect when DNS is configured correctly

### Verification
After updating DNS:
1. Go to Vercel dashboard
2. Navigate to your project → Settings → Domains
3. Click "Refresh" button
4. Status should change from "Invalid Configuration" to "Valid Configuration"

### Testing DNS Propagation
You can check if DNS has propagated using:
```bash
# Check A record
dig partners.addaeducation A

# Or use online tools:
# - https://dnschecker.org
# - https://www.whatsmydns.net
```

## Troubleshooting

### Still showing "Invalid Configuration" after 24 hours?
1. **Double-check the DNS record:**
   - Verify the A record value is exactly `216.198.79.1`
   - Check that the record name is `@` or `partners`

2. **Check for conflicting records:**
   - Remove any old CNAME records pointing to `cname.vercel-dns.com`
   - Remove any old A records pointing to `76.76.21.21` (if you want to use new IP)

3. **Clear DNS cache:**
   ```bash
   # On Mac/Linux
   sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
   
   # On Windows
   ipconfig /flushdns
   ```

4. **Contact Vercel Support:**
   - If still not working after 48 hours
   - Vercel Support: https://vercel.com/support

## After DNS is Configured

Once the domain is verified:
1. Your site will be accessible at `https://partners.addaeducation`
2. Update your frontend code if needed to handle the new domain
3. Update CORS settings in backend (if using backend) to allow `partners.addaeducation`
4. Update environment variables if domain-specific settings are needed

## Quick Checklist

- [ ] Logged into domain registrar/DNS provider
- [ ] Updated nameservers OR added A record
- [ ] Saved changes
- [ ] Waited for propagation (1-48 hours)
- [ ] Clicked "Refresh" in Vercel
- [ ] Verified status changed to "Valid Configuration"
