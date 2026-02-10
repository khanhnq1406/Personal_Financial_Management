# Icon Generation Guide - Troubleshooting

## Problem: Icons Not Looking Correct

If your generated icons don't look right, here are the solutions:

## Quick Fix Options

### Option 1: Regenerate with Improved Script (Best Quality)
```bash
cd src/wj-client
./scripts/generate-icons-improved.sh
```

This script uses higher density rendering for better quality.

### Option 2: Choose Background Style
```bash
# Transparent background (default)
./scripts/generate-icons-custom.sh transparent

# Solid green background with icon centered
./scripts/generate-icons-custom.sh solid

# Rounded corners with solid background
./scripts/generate-icons-custom.sh rounded
```

### Option 3: Manual Creation (Recommended for Best Results)

Use a design tool like:
- **Figma** (Free, online)
- **Adobe Illustrator**
- **Sketch**
- **Affinity Designer**

#### Steps:
1. Create a 1024x1024 canvas
2. Add your logo with proper scaling
3. Export as PNG at different sizes:
   - 512×512 (mandatory)
   - 192×192 (mandatory)
   - 180×180 (Apple touch icon)
   - Other sizes as needed

## Common Issues & Solutions

### Issue 1: Icon looks blurry or pixelated
**Solution:** Use the improved script with higher density:
```bash
./scripts/generate-icons-improved.sh
```

### Issue 2: Icon is too small or has too much padding
**Solution:**
1. Edit `logo.svg` to adjust the viewBox
2. Or use the custom script with solid background:
```bash
./scripts/generate-icons-custom.sh solid
```

### Issue 3: Stroke width not scaling properly
**Problem:** SVG stroke-width doesn't scale proportionally

**Solution:** Convert strokes to paths in your SVG editor:
1. Open `logo.svg` in Illustrator/Inkscape
2. Select all paths with strokes
3. Object → Expand → Stroke
4. Save and regenerate

### Issue 4: Background not transparent
**Solution:** Ensure SVG has `fill="none"` on root element and regenerate:
```bash
./scripts/generate-icons-custom.sh transparent
```

## Recommended Icon Specifications

### Size Guidelines
- **Minimum safe zone**: 80% of canvas (20% padding)
- **Optimal display size**: 60-70% of canvas
- **Background**: Transparent or solid color

### For Best Results
1. **Simple Design**: Icons should be recognizable at 16×16
2. **High Contrast**: Good contrast for visibility
3. **No Fine Details**: Avoid thin lines < 2px
4. **Consistent Padding**: Same padding on all sides

## Testing Your Icons

### Visual Check
Open generated icons in Preview/Image viewer to verify:
```bash
open public/icons/icon-512x512.png
open public/icons/icon-192x192.png
open public/icons/apple-touch-icon.png
```

### Test in Browser
1. Start dev server: `npm run dev`
2. Open DevTools (F12)
3. Application tab → Manifest
4. Check "Icons" section
5. Click each icon to preview

### Test PWA Installation
1. iOS Safari: Share → Add to Home Screen
2. Android Chrome: Menu → Add to Home Screen
3. Desktop Chrome: Install icon in address bar

## Design Tool Templates

### Figma Template
Create frames for each size:
- Frame 1: 1024×1024 (master)
- Frame 2: 512×512
- Frame 3: 192×192
- Frame 4: 180×180 (Apple)

Export settings:
- Format: PNG
- Scale: 1x (for exact size)
- Background: Transparent

### Inkscape/Illustrator
1. Create artboard: 1024×1024
2. Center your logo
3. File → Export → PNG
4. Set dimensions and export

## Online Icon Generators

If you prefer not to use command-line tools:

1. **[Favicon.io](https://favicon.io/)** - Generate from text/image/emoji
2. **[RealFaviconGenerator](https://realfavicongenerator.net/)** - Comprehensive PWA icons
3. **[PWA Asset Generator](https://www.pwabuilder.com/)** - Microsoft's tool
4. **[App Icon Generator](https://www.appicon.co/)** - All sizes at once

## SVG Optimization

Before generating, optimize your SVG:

```bash
# Install SVGO
npm install -g svgo

# Optimize SVG
svgo public/logo.svg -o public/logo-optimized.svg
```

Then use the optimized version in generation scripts.

## Final Checklist

- [ ] Icons are clear at 16×16 (smallest size)
- [ ] Icons are recognizable at all sizes
- [ ] Background is appropriate (transparent or solid)
- [ ] File sizes are reasonable (< 50KB for 512×512)
- [ ] Apple touch icon exists (180×180)
- [ ] Manifest.json references correct paths
- [ ] No console errors in DevTools → Application → Manifest
- [ ] PWA audit passes (Lighthouse)

## Get Help

If icons still don't look right:
1. Check the generated PNG files in `public/icons/`
2. Compare with original SVG
3. Consider using a design tool for manual export
4. Test on actual devices (iOS/Android)

---

**Pro Tip:** For production apps, it's often worth investing time in properly designed icons in a tool like Figma. The automated scripts are great for prototyping, but hand-crafted icons usually look better.
