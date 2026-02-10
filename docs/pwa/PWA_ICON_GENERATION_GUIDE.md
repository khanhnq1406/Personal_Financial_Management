# PWA Icon Generation Guide

Complete guide for generating all PWA icons for WealthJourney.

## Prerequisites

### Required Tools

1. **librsvg** (for proper SVG rendering)
   ```bash
   brew install librsvg
   ```

2. **ImageMagick** (for maskable icon generation)
   ```bash
   brew install imagemagick
   ```

### Verify Installation

```bash
# Check rsvg-convert
which rsvg-convert
# Should output: /opt/homebrew/bin/rsvg-convert

# Check ImageMagick
which magick
# Should output: /opt/homebrew/bin/magick
```

---

## Icon Generation Process

### Step 1: Generate Regular Icons

Use `rsvg-convert` to generate all standard PWA icons with proper SVG rendering.

```bash
cd src/wj-client
./scripts/generate-icons-rsvg.sh
```

**What it generates:**
- ✅ `icon-72x72.png` through `icon-512x512.png` (all sizes)
- ✅ `apple-touch-icon.png` (180×180 for iOS)
- ✅ `favicon-16x16.png` and `favicon-32x32.png`

**Output:**
```
🎨 PWA Icon Generator (rsvg-convert)

Generating icons with rsvg-convert...

✅ icon-72x72.png (1.6K)
✅ icon-96x96.png (2.0K)
✅ icon-128x128.png (2.5K)
✅ icon-144x144.png (2.8K)
✅ icon-152x152.png (2.8K)
✅ icon-192x192.png (3.4K)
✅ icon-384x384.png (6.0K)
✅ icon-512x512.png (7.7K)
✅ apple-touch-icon.png
✅ favicons generated

🎉 All icons generated successfully!
📁 Icons saved to: public/icons

💡 rsvg-convert properly renders SVG strokes, so icons should look correct now!
```

### Step 2: Generate Maskable Icons

Use ImageMagick to create maskable icons for Android adaptive icons.

```bash
cd src/wj-client
./scripts/generate-maskable-icons.sh
```

**What it generates:**
- ✅ `icon-192x192-maskable.png` (for Android)
- ✅ `icon-512x512-maskable.png` (for Android)

**Output:**
```
🎭 Maskable Icon Generator

Generating maskable icons from existing PNGs...

Strategy: Resize existing icons to 80% and center on green background

Creating 192x192 maskable icon...
✅ icon-192x192-maskable.png
Creating 512x512 maskable icon...
✅ icon-512x512-maskable.png

🎉 Maskable icons generated!
📁 Saved to: public/icons

💡 What are maskable icons?
   - Used by Android for adaptive icons
   - Have a safe zone (80% of canvas) with padding
   - Background: #008148 (WealthJourney green)
   - Icon size: 80% of canvas (safe zone)

📱 Test at: https://maskable.app/editor
```

---

## Complete Generation Command

Generate all icons at once:

```bash
cd src/wj-client
./scripts/generate-icons-rsvg.sh && ./scripts/generate-maskable-icons.sh
```

---

## Verification

### 1. Visual Check

```bash
# Check regular icons
open public/icons/icon-512x512.png
open public/icons/icon-192x192.png

# Check maskable icons
open public/icons/icon-512x512-maskable.png
open public/icons/icon-192x192-maskable.png
```

**Expected appearance:**
- **Regular icons**: Green circle with white trending-up arrow (full size)
- **Maskable icons**: White trending-up arrow centered on green background (80% size with padding)

### 2. Check File Sizes

```bash
ls -lh public/icons/*.png
```

**Expected sizes:**
```
1.6K  icon-72x72.png
2.0K  icon-96x96.png
2.5K  icon-128x128.png
2.8K  icon-144x144.png
2.8K  icon-152x152.png
3.4K  icon-192x192.png
11K   icon-192x192-maskable.png    ← Should be larger (has padding)
6.0K  icon-384x384.png
7.7K  icon-512x512.png
32K   icon-512x512-maskable.png    ← Should be larger (has padding)
3.2K  apple-touch-icon.png
747B  favicon-16x16.png
1.0K  favicon-32x32.png
```

### 3. Browser DevTools Check

1. Start dev server: `npm run dev`
2. Open Chrome DevTools (F12)
3. Go to **Application** tab
4. Click **Manifest** in left sidebar
5. Scroll to **Icons** section
6. Verify all icons display correctly

### 4. Maskable Icon Test

Go to: https://maskable.app/editor

1. Upload `public/icons/icon-512x512-maskable.png`
2. Toggle different shapes (circle, rounded square, squircle)
3. Verify icon looks good in all shapes
4. Ensure arrow is never cut off

---

## Generated Files

After running both scripts, you should have:

```
public/icons/
├── icon-72x72.png              ← Regular icon
├── icon-96x96.png              ← Regular icon
├── icon-128x128.png            ← Regular icon
├── icon-144x144.png            ← Regular icon
├── icon-152x152.png            ← Regular icon
├── icon-192x192.png            ← Regular icon
├── icon-192x192-maskable.png   ← Maskable (Android adaptive)
├── icon-384x384.png            ← Regular icon
├── icon-512x512.png            ← Regular icon
├── icon-512x512-maskable.png   ← Maskable (Android adaptive)
├── apple-touch-icon.png        ← iOS home screen (180×180)
├── favicon-16x16.png           ← Browser tab icon
└── favicon-32x32.png           ← Browser tab icon
```

---

## Icon Types Explained

### Regular Icons (`icon-{size}x{size}.png`)
- **Purpose**: Standard PWA icons for all platforms
- **Design**: Green circle with white trending-up arrow (full canvas)
- **Used by**: iOS, Android, desktop browsers, PWA install prompts
- **Manifest purpose**: `"any"`

### Maskable Icons (`icon-{size}x{size}-maskable.png`)
- **Purpose**: Android adaptive icons that work with any shape
- **Design**: White arrow on green background with 20% safe zone padding
- **Used by**: Android devices with adaptive icon support
- **Manifest purpose**: `"maskable"`
- **Safe zone**: Icon at 80% size ensures it's never cut off

### Apple Touch Icon (`apple-touch-icon.png`)
- **Purpose**: iOS/iPadOS home screen icon
- **Size**: 180×180px
- **Design**: Green circle with white arrow
- **Used by**: iOS Safari "Add to Home Screen"

### Favicons (`favicon-{size}x{size}.png`)
- **Purpose**: Browser tab icons
- **Sizes**: 16×16 and 32×32
- **Design**: Scaled-down version of main icon
- **Used by**: Browser tabs, bookmarks

---

## Troubleshooting

### Issue: Icons only show green circle (no arrow)

**Cause**: ImageMagick doesn't render SVG strokes properly

**Solution**: Use `rsvg-convert` instead
```bash
./scripts/generate-icons-rsvg.sh
```

### Issue: Maskable icons only show green background

**Cause**: Script is using SVG as source instead of PNG

**Solution**:
1. Generate regular icons first: `./scripts/generate-icons-rsvg.sh`
2. Then generate maskable: `./scripts/generate-maskable-icons.sh`

The maskable script now automatically uses the correctly-rendered PNGs as source.

### Issue: `rsvg-convert: command not found`

**Solution**: Install librsvg
```bash
brew install librsvg
```

### Issue: `magick: command not found`

**Solution**: Install ImageMagick
```bash
brew install imagemagick
```

### Issue: Icons look blurry

**Cause**: Low-quality rendering

**Solution**: Use `rsvg-convert` which renders at proper density
```bash
./scripts/generate-icons-rsvg.sh
```

---

## Script Locations

All icon generation scripts are in `src/wj-client/scripts/`:

| Script | Purpose | Requirements |
|--------|---------|--------------|
| `generate-icons-rsvg.sh` | **Recommended**: Regular icons with best quality | librsvg |
| `generate-maskable-icons.sh` | **Required**: Maskable icons for Android | ImageMagick + Regular icons |
| `generate-icons-improved.sh` | Alternative: ImageMagick with high density | ImageMagick |
| `generate-icons-custom.sh` | Alternative: Custom background styles | ImageMagick |

---

## Best Practices

1. **Always generate in order**:
   ```bash
   ./scripts/generate-icons-rsvg.sh      # Step 1: Regular icons
   ./scripts/generate-maskable-icons.sh  # Step 2: Maskable icons
   ```

2. **Use rsvg-convert for regular icons**
   - Better SVG rendering than ImageMagick
   - Properly handles strokes and paths
   - Cleaner, sharper output

3. **Test maskable icons at maskable.app**
   - Ensures safe zone is correct
   - Verifies icon works in all shapes
   - Catches any cutoff issues

4. **Commit generated icons to git**
   - Include all PNG files in version control
   - Don't regenerate in CI/CD
   - Ensures consistent icons across deployments

5. **Keep source SVG optimized**
   - Simplify paths when possible
   - Remove unnecessary attributes
   - Use fills instead of strokes when possible

---

## When to Regenerate Icons

Regenerate icons when:
- ✅ Logo/brand design changes
- ✅ Brand colors change
- ✅ Icon design is updated
- ✅ New icon sizes are needed
- ✅ Maskable safe zone needs adjustment

No need to regenerate for:
- ❌ Code changes
- ❌ Feature updates
- ❌ Bug fixes
- ❌ Routine deployments

---

## Quick Reference

```bash
# One-line generation (recommended)
cd src/wj-client && ./scripts/generate-icons-rsvg.sh && ./scripts/generate-maskable-icons.sh

# Check results
ls -lh public/icons/*.png

# Visual verification
open public/icons/icon-512x512.png
open public/icons/icon-512x512-maskable.png

# Test in browser
npm run dev
# Then: DevTools → Application → Manifest → Icons
```

---

## Notes

- **Source SVG**: `public/logo.svg` (original logo with circle + arrow)
- **Output directory**: `public/icons/`
- **Manifest**: Icons automatically referenced in `public/manifest.json`
- **Quality**: rsvg-convert provides best quality for SVG → PNG conversion
- **Maskable strategy**: Resize existing PNG (not SVG) to ensure quality

---

**Last Updated**: 2026-02-10
**Version**: 1.0
**Status**: Production-ready ✅
