# Icon System Testing Checklist

## Visual Testing

### Light Mode
- [ ] All icons render with correct stroke width
- [ ] Icon colors match theme (currentColor)
- [ ] Icon sizes are consistent across components
- [ ] No pixelation or blurriness

### Dark Mode
- [ ] All icons visible against dark background
- [ ] Icon colors properly invert
- [ ] Semantic colors (income/expense) remain distinct
- [ ] No contrast issues

### Responsive Testing
- [ ] Icons scale correctly at all breakpoints
- [ ] Touch targets meet 44px minimum on mobile
- [ ] Icons don't overflow containers on small screens

## Component Testing

### Button Component
- [ ] Loading spinner animates correctly
- [ ] Success checkmark displays properly
- [ ] Icon sizes match button size
- [ ] Icons work in all button variants (primary, secondary, ghost, link, danger, success)

### Theme Toggle
- [ ] Sun/Moon/Desktop icons display correctly
- [ ] Icons transition smoothly
- [ ] Icons scale with button size (sm, md, lg)

### Toast Component
- [ ] Success/Error/Warning/Info icons display
- [ ] Close button X icon visible
- [ ] Icons colored correctly (white on colored bg)

### BottomNav
- [ ] All 5 nav icons display
- [ ] Active state icon scales correctly
- [ ] Icons properly aligned
- [ ] Icons work with createNavItems helper

### Select Component
- [ ] Clear button X icon visible
- [ ] Dropdown chevron rotates when open
- [ ] Loading spinner displays during async operations

### FloatingActionButton
- [ ] Plus icon transforms to X when open
- [ ] Icon rotation animation smooth
- [ ] Icon size appropriate for touch target

### LoadingSpinner Component
- [ ] Spinner animates smoothly
- [ ] Icon size consistent with text

## Accessibility Testing

### Screen Reader Testing
- [ ] Icon-only buttons have aria-label
- [ ] Decorative icons marked with aria-hidden
- [ ] Icon labels are descriptive
- [ ] Navigation icons announce correctly

### Keyboard Navigation
- [ ] Icons in focusable elements receive focus
- [ ] Focus indicators visible
- [ ] Tab order logical

## Performance Testing

### Bundle Size
- [ ] Icon components tree-shakeable
- [ ] No unused icons in bundle
- [ ] Memoized components prevent re-renders

### Runtime Performance
- [ ] No layout shifts from icon loading
- [ ] Icons render without FOUC
- [ ] Animations run at 60fps

## Cross-Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] iOS Safari
- [ ] Android Chrome

## Migration Testing

### Legacy Compatibility
- [ ] ICON_PATHS references work temporarily
- [ ] LegacyIcon component displays SVGs correctly
- [ ] No broken image links during migration

### Post-Migration
- [ ] All ICON_PATHS imports removed
- [ ] All LegacyIcon usage removed
- [ ] Old SVG files deleted
- [ ] No console errors
