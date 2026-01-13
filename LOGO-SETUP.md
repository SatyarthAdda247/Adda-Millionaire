# Logo Setup Guide

This guide will help you add the actual logos for Reevo, Adda247 App, and Learner's Adda App.

## Option 1: Using Local Logo Files (Recommended)

### Step 1: Download the Logos

1. **Reevo Logo**
   - Visit: https://reevo.ai or search "Reevo app logo" on Google
   - Download the logo image (PNG format preferred)
   - Save as: `reevo-logo.png`

2. **Adda247 Logo**
   - Visit: https://www.adda247.com
   - Or check their App Store listing: https://apps.apple.com/in/app/adda247/id1618943840
   - Download the logo image
   - Save as: `adda247-logo.png`

3. **Learner's Adda Logo**
   - Visit the official Learner's Adda website or app store listing
   - Download the logo image
   - Save as: `learners-adda-logo.png`

### Step 2: Add Logos to Project

1. Place the downloaded logo files in: `/public/logos/`
2. Ensure filenames match exactly:
   - `reevo-logo.png`
   - `adda247-logo.png`
   - `learners-adda-logo.png`

## Option 2: Using Direct URLs

If you have direct URLs to the logos, you can update the `ProductCards.tsx` file:

1. Open `src/components/ProductCards.tsx`
2. Find the `products` array
3. Replace the `logo` property with the direct URL:

```typescript
{
  name: "Reevo",
  logo: "https://example.com/reevo-logo.png", // Direct URL
  // ... rest of the config
}
```

## Option 3: Using App Store/Play Store Logos

You can use the logos from app store listings:

1. **Reevo**: Check Chrome Web Store or app stores
2. **Adda247**: https://apps.apple.com/in/app/adda247/id1618943840
3. **Learner's Adda**: Check Google Play Store or App Store

Right-click on the app icon/logo and copy the image URL, then use it in the component.

## Logo Specifications

- **Recommended Size**: 200x200px or higher (square format)
- **Format**: PNG with transparent background (preferred)
- **Max File Size**: Under 500KB for optimal performance
- **Aspect Ratio**: Square (1:1) works best

## Testing

After adding the logos:

1. Start the development server: `npm run dev`
2. Navigate to the "What You'll Promote" section
3. Verify all three logos display correctly
4. If a logo doesn't load, check:
   - File path is correct
   - File exists in `/public/logos/`
   - File format is supported (PNG, JPG, SVG)
   - Browser console for any errors

## Fallback

If a logo fails to load, the component will automatically show the first letter of the app name as a fallback (e.g., "R" for Reevo).

## Quick Reference

- **Local Path**: `/public/logos/[filename].png`
- **Component File**: `src/components/ProductCards.tsx`
- **Logo Property**: `logo: "/logos/[filename].png"`
