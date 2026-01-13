# How to Get and Add App Logos

The logos are currently showing as styled letters (R, A, L) as fallbacks. To add the actual logos:

## Quick Method: Download from Play Store

### For Reevo:
1. Go to: https://play.google.com/store/apps/details?id=com.addaeducation.reevo
2. Right-click on the app icon
3. Select "Inspect" or "View Page Source"
4. Look for the icon image URL (usually in `<img>` tag with class containing "icon" or "logo")
5. Copy the image URL or download the image
6. Save as: `reevo-logo.png` in `/public/logos/`

### For Adda247:
1. Go to: https://www.adda247.com
2. Look for the logo in the header/navbar
3. Right-click and "Save image as..."
4. Save as: `adda247-logo.png` in `/public/logos/`

### For Learner's Adda:
1. Go to: https://play.google.com/store/apps/details?id=com.adda247.gold
2. Follow same steps as Reevo
3. Save as: `learners-adda-logo.png` in `/public/logos/`

## Alternative: Use Direct Image URLs

If you find direct image URLs, you can update the `logo` property in `ProductCards.tsx`:

```typescript
{
  name: "Reevo",
  logo: "https://example.com/reevo-logo.png", // Direct URL
  // ...
}
```

## File Requirements

- **Format**: PNG (preferred) or JPG
- **Size**: 200x200px or larger (square format)
- **Background**: Transparent PNG preferred
- **Location**: `/public/logos/` directory

## After Adding Logos

1. Ensure files are named exactly:
   - `reevo-logo.png`
   - `adda247-logo.png`
   - `learners-adda-logo.png`

2. Restart your dev server if needed
3. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
4. The logos should appear automatically

## Current Fallback

Until logos are added, the component shows styled letters:
- **R** (blue) for Reevo
- **A** (green) for Adda247
- **L** (purple) for Learner's Adda

These match the design shown in your reference image.
