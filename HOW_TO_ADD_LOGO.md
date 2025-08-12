# 📎 How to Add Your Logo to SevaNet

## Quick Steps:

1. **Prepare your logo file:**
   - Name it exactly: `logo.png`
   - Should contain the "SevaNet" text/letters (no additional text will be added)
   - Recommended width: 150-200px, height: 48-64px
   - Format: PNG (for transparency support)

2. **Add to your project:**
   ```bash
   # Copy your logo.png file to:
   /Users/ransika/Documents/SevaNet/public/logo.png
   ```

3. **Your logo will automatically appear in:**
   - ✅ Homepage header and footer
   - ✅ Login and registration pages  
   - ✅ Dashboard sidebar and navigation
   - ✅ Browser favicon and tab icon
   - ✅ Social media previews (OpenGraph/Twitter)

## Current Status:
- 🔧 Logo component is ready and configured
- 🔄 Will automatically fallback to Building2 icon if logo.png is missing
- 📱 Responsive sizing (small/medium/large) already implemented
- 🎨 Proper styling and positioning applied

## File Structure:
```
SevaNet/
├── public/
│   ├── logo.png          ← Add your logo here
│   └── placeholder-logo.txt
├── src/components/ui/
│   └── Logo.tsx          ← Logo component (already configured)
└── ...
```

## Logo Specifications:
- **Format**: PNG recommended (supports transparency)
- **Size**: 512x512px ideal, minimum 256x256px
- **Background**: Transparent or white
- **Style**: Should work on both light and dark backgrounds
- **Quality**: High resolution for crisp display

## After Adding Your Logo:
The logo will immediately appear across all pages without needing to restart the server. The system will automatically use your logo.png file instead of the default Building2 icon.

## Need Help?
If you encounter any issues, the logo component includes automatic fallback to ensure the site always displays properly.