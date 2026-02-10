# Progressive Web App (PWA) Setup Guide

## Overview

WealthJourney is now configured as a Progressive Web App (PWA), allowing users to install it on their devices and use it like a native app.

## Features Enabled

✅ **Add to Home Screen** - Users can install the app on iOS, Android, and desktop
✅ **Standalone Mode** - Runs fullscreen without browser UI when installed
✅ **iOS Safari Optimized** - Proper viewport handling for iOS devices
✅ **App Icons** - Support for all device sizes and platforms
✅ **Theme Colors** - Branded colors for system UI
✅ **Splash Screens** - iOS splash screen support
✅ **Windows Tiles** - Microsoft Edge tile support

## How Users Can Install

### iOS (Safari)
1. Open the website in Safari
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add" in the top right
5. The app icon will appear on the home screen

### Android (Chrome)
1. Open the website in Chrome
2. Tap the menu (3 dots)
3. Tap "Add to Home Screen" or "Install app"
4. Confirm installation
5. The app will be added to the home screen and app drawer

### Desktop (Chrome/Edge)
1. Open the website in Chrome or Edge
2. Look for the install icon in the address bar (⊕ or computer icon)
3. Click "Install"
4. The app will open in a standalone window

## Files Created

### Core PWA Files
- **`public/manifest.json`** - Web app manifest with app configuration
- **`public/browserconfig.xml`** - Windows tile configuration
- **`app/layout.tsx`** - Updated with PWA meta tags

### Icon Generation Scripts
- **`scripts/generate-icons.sh`** - Unix/Linux icon generator (requires ImageMagick)
- **`scripts/generate-icons-macos.sh`** - macOS icon generator (uses built-in sips)
- **`scripts/generate-icons.js`** - Node.js icon generator (requires sharp/svg2img)

### Documentation
- **`public/icons/README.md`** - Icon generation guide

## Icon Generation Instructions

You need to generate icons before the PWA is fully functional.

### Method 1: macOS (Recommended)
```bash
# Step 1: Convert logo.svg to PNG
# Open logo.svg in Preview and export as PNG at 1024x1024
# Save as: public/icons/logo-1024.png

# Step 2: Run the generator
cd src/wj-client
./scripts/generate-icons-macos.sh
```

### Method 2: Using ImageMagick
```bash
# Install ImageMagick
brew install imagemagick  # macOS
# or
sudo apt-get install imagemagick librsvg2-bin  # Ubuntu

# Generate icons
cd src/wj-client
./scripts/generate-icons.sh
```

### Method 3: Using Node.js
```bash
cd src/wj-client

# Install dependencies
npm install sharp svg2img

# Generate icons
node scripts/generate-icons.js
```

### Method 4: Manual Creation
Use any image editor to create PNG files:

**Required Icons:**
- `favicon-16x16.png` (16×16)
- `favicon-32x32.png` (32×32)
- `icon-72x72.png` (72×72)
- `icon-96x96.png` (96×96)
- `icon-128x128.png` (128×128)
- `icon-144x144.png` (144×144)
- `icon-152x152.png` (152×152)
- `icon-192x192.png` (192×192)
- `icon-384x384.png` (384×384)
- `icon-512x512.png` (512×512)
- `apple-touch-icon.png` (180×180)

Save all icons in `public/icons/`

## PWA Configuration

### App Behavior
- **Display Mode**: `standalone` - Runs fullscreen without browser UI
- **Orientation**: `portrait-primary` - Preferred portrait orientation on mobile
- **Theme Color**: `#008148` (WealthJourney green)
- **Background Color**: `#ffffff` (white)
- **Start URL**: `/dashboard/home` - Opens directly to dashboard

### iOS Specific
- **Status Bar**: `black-translucent` - Transparent status bar showing content behind
- **Viewport Fit**: `cover` - Content extends to device edges (safe areas)
- **Dynamic Viewport**: Uses `dvh` units to account for iOS Safari's dynamic UI

### App Shortcuts
The manifest includes quick actions:
1. **Add Transaction** - Quick shortcut to add a transaction
2. **View Portfolio** - Direct access to investment portfolio

## Testing PWA Installation

### Desktop (Chrome DevTools)
1. Open Chrome DevTools (F12)
2. Go to Application tab
3. Click "Manifest" in sidebar
4. Check for errors in manifest parsing
5. Click "Service Workers" (when implemented)

### iOS Simulator (Xcode)
1. Open in Safari on iOS Simulator
2. Follow installation steps
3. Check if icon appears on home screen
4. Test standalone mode behavior

### Android Emulator
1. Open in Chrome on Android Emulator
2. Check for install prompt
3. Test installation and standalone mode

## Lighthouse PWA Audit

Run Lighthouse audit to check PWA score:
```bash
# Using Chrome DevTools
1. Open DevTools (F12)
2. Go to Lighthouse tab
3. Check "Progressive Web App"
4. Click "Generate report"
```

**Target Scores:**
- ✅ Installable
- ✅ PWA Optimized
- ✅ Accessible
- ✅ Performance

## Troubleshooting

### "Add to Home Screen" not showing
- Check manifest.json is accessible at `/manifest.json`
- Verify all required icons exist
- Ensure HTTPS is enabled (required for PWA)
- Check browser console for manifest errors

### Icons not displaying
- Verify icon files exist in `public/icons/`
- Check file sizes are correct (512x512, 192x192, etc.)
- Ensure icons are PNG format with transparent background

### App opens in browser instead of standalone
- Check `display: "standalone"` in manifest.json
- Verify iOS meta tags are present
- Ensure app was installed correctly (not just bookmarked)

### iOS status bar issues
- Check viewport-fit is set to "cover"
- Verify safe-area-inset padding is applied
- Test on physical iOS device (simulator may behave differently)

## Next Steps

### Recommended Enhancements
1. **Service Worker** - Enable offline functionality and caching
2. **Push Notifications** - Real-time transaction alerts
3. **Background Sync** - Sync data when connection restored
4. **App Shortcuts** - More quick actions
5. **Share Target** - Allow sharing data to the app

### Service Worker Setup (Future)
```javascript
// public/sw.js - Service worker for offline support
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('wealthjourney-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/dashboard/home',
        '/offline.html'
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

## Resources

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [iOS Web App Meta Tags](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)
- [Service Workers](https://developers.google.com/web/fundamentals/primers/service-workers)
- [Lighthouse PWA Audits](https://web.dev/lighthouse-pwa/)

## Support

For issues or questions about PWA setup, check:
- Browser console for manifest errors
- Lighthouse PWA audit results
- iOS/Android device compatibility

---

**Last Updated**: 2026-02-10
**PWA Version**: 1.0.0
