# Design System Quick Reference

> **Updated**: 2026-02-04
> **Version**: 1.0.0
> **Status**: Active

This is a quick reference guide for developers working with the WealthJourney design system.

---

## 🎨 Color Palette

### Primary (Blue - Trust & Stability)
```typescript
bg-primary-50    // #EFF6FF - Lightest backgrounds
bg-primary-100   // #DBEAFE - Subtle highlights
bg-primary-200   // #BFDBFE - Light accents
bg-primary-300   // #93C5FD - Medium for charts
bg-primary-400   // #60A5FA - Interactive elements
bg-primary-500   // #3B82F6 - Links, hover states ⭐
bg-primary-600   // #2563EB - Primary buttons, CTAs ⭐⭐
bg-primary-700   // #1D4ED8 - Hover states
bg-primary-800   // #1E40AF - Active states
bg-primary-900   // #1E3A8A - Dark headings
```

### Secondary (Gold - Premium & Value)
```typescript
bg-secondary-400 // #FBBF24 - Accent highlights
bg-secondary-500 // #F59E0B - Badges, premium indicators ⭐
bg-secondary-600 // #D97706 - Hover states
```

### Success (Green - Positive Trends)
```typescript
bg-success-50    // #F0FDF4 - Success backgrounds
bg-success-500   // #22C55E - Success states ⭐
bg-success-600   // #16A34A - Income, gains ⭐⭐
```

### Danger (Red - Warnings & Losses)
```typescript
bg-danger-50     // #FEF2F2 - Error backgrounds
bg-danger-500    // #EF4444 - Error states
bg-danger-600    // #DC2626 - Expenses, losses ⭐⭐
```

### Neutral (Gray - Professional)
```typescript
bg-neutral-50    // #F8FAFC - Page backgrounds ⭐⭐
bg-neutral-100   // #F1F5F9 - Card backgrounds
bg-neutral-200   // #E2E8F0 - Borders, hover
bg-neutral-300   // #CBD5E1 - Muted borders
bg-neutral-400   // #94A3B8 - Placeholder text
bg-neutral-500   // #64748B - Secondary text
bg-neutral-600   // #475569 - Body text ⭐
bg-neutral-700   // #334155 - Headings
bg-neutral-900   // #0F172A - High contrast text
```

### Chart Colors (Data Visualization)
```typescript
text-chart-blue     // #3B82F6
text-chart-indigo   // #6366F1
text-chart-purple   // #8B5CF6
text-chart-pink     // #EC4899
text-chart-rose     // #F43F5E
text-chart-orange   // #F97316
text-chart-amber    // #F59E0B
text-chart-yellow   // #EAB308
text-chart-lime     // #84CC16
text-chart-green    // #22C55E
text-chart-emerald  // #10B981
text-chart-teal     // #14B8A6
text-chart-cyan     // #06B6D4
text-chart-sky      // #0EA5E9
```

**⭐ Most commonly used colors**

---

## 📝 Typography

### Font Sizes
```typescript
text-xs          // 12px - Captions
text-sm          // 14px - Small text
text-base        // 16px - Body (mobile default) ⭐
text-lg          // 18px - Emphasized body
text-xl          // 20px - Large body
text-2xl         // 24px - H3 (font-semibold)
text-3xl         // 30px - H2 (font-bold)
text-4xl         // 36px - H1 (font-bold)
text-5xl         // 48px - Hero (font-extrabold)
```

### Financial Data (Special)
```typescript
text-financial-sm  // 16px semibold (small amounts)
text-financial-md  // 18px semibold (medium amounts) ⭐
text-financial-lg  // 24px bold (large amounts/totals) ⭐
```

### Font Weights
```typescript
font-normal      // 400 - Body text
font-medium      // 500 - Emphasized text
font-semibold    // 600 - Subheadings, financial data ⭐
font-bold        // 700 - Headings, CTAs ⭐
```

### Responsive Typography Pattern
```typescript
// Page titles
<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900">

// Section headings
<h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-neutral-800">

// Card titles
<h3 className="text-lg sm:text-xl font-semibold text-neutral-700">

// Body text (stays 16px minimum)
<p className="text-base leading-relaxed text-neutral-600">

// Financial data
<span className="text-lg sm:text-xl lg:text-2xl font-semibold text-neutral-900">
  ₫1,234,567
</span>
```

---

## 📏 Spacing & Touch Targets

### Touch Targets (WCAG Compliance)
```typescript
min-h-11         // 44px - Minimum touch target ⭐
min-h-12         // 48px - Comfortable touch ⭐⭐
min-h-14         // 56px - Large touch (primary actions)
```

### Responsive Padding
```typescript
// Mobile
p-mobile-xs      // 8px (0.5rem)
p-mobile-sm      // 12px (0.75rem)
p-mobile-md      // 16px (1rem) ⭐
p-mobile-lg      // 24px (1.5rem)

// Desktop
p-desktop-sm     // 16px (1rem)
p-desktop-md     // 24px (1.5rem) ⭐
p-desktop-lg     // 32px (2rem)
p-desktop-xl     // 48px (3rem)
```

### Common Patterns
```typescript
// Button padding
className="py-2.5 sm:py-3 px-6"

// Card padding
className="p-4 sm:p-6"

// Section spacing
className="space-y-4 sm:space-y-6"

// Gap between items
className="gap-2 sm:gap-3"
```

---

## 🌓 Shadows

### Card Shadows
```typescript
shadow-card        // Subtle elevation (default) ⭐
shadow-card-hover  // Interactive hover ⭐
shadow-card-active // Pressed state
```

### Overlay Shadows
```typescript
shadow-modal       // Deep overlay for modals
shadow-dropdown    // Floating menus
shadow-floating    // Action buttons (FAB)
```

### Focus Shadow
```typescript
shadow-focus       // Focus indicator (3px ring)
```

### Usage Examples
```typescript
// Standard card
<div className="bg-white shadow-card hover:shadow-card-hover transition-shadow duration-200">

// Modal
<div className="shadow-modal rounded-xl">

// Floating Action Button
<button className="shadow-floating hover:shadow-xl">
```

---

## 🔄 Border Radius

```typescript
rounded-sm       // 4px - Inputs
rounded          // 8px - Buttons, cards (default) ⭐
rounded-md       // 12px - Larger cards
rounded-lg       // 16px - Modals ⭐
rounded-xl       // 24px - Hero sections
rounded-full     // Pills, avatars
```

---

## ⚡ Transitions

### Duration
```typescript
duration-fast    // 150ms - Micro-interactions
duration-200     // 200ms - Standard (default) ⭐
duration-slow    // 300ms - Complex animations
```

### Timing Functions
```typescript
ease-smooth      // cubic-bezier(0.4, 0, 0.2, 1) - Default
ease-bounce      // cubic-bezier(0.68, -0.55, 0.265, 1.55) - Playful
```

### Common Patterns
```typescript
// Button hover
className="transition-all duration-200 hover:scale-105"

// Card hover
className="transition-shadow duration-200 hover:shadow-card-hover"

// Input focus
className="transition-colors duration-150 focus:border-primary-500"
```

---

## 🧩 Component Examples

### Button Variants
```typescript
// Primary button (most common)
<Button
  type={ButtonType.PRIMARY}
  size="md"                    // sm | md | lg
  loading={mutation.isPending}
  fullWidth={true}
>
  Save Changes
</Button>

// Secondary button
<Button
  type={ButtonType.SECONDARY}
  size="md"
>
  Cancel
</Button>

// Icon button
<Button
  type={ButtonType.IMG}
  src="/icons/close.png"
  aria-label="Close"
/>
```

### Card Variants
```typescript
// Standard card (most common)
<BaseCard className="space-y-4">
  {children}
</BaseCard>

// Large card with custom padding
<BaseCard
  padding="lg"          // none | sm | md | lg
  shadow="md"           // none | sm | md | lg
>
  {children}
</BaseCard>

// Interactive card
<BaseCard
  hover={true}
  onClick={handleClick}
  shadow="sm"
>
  {children}
</BaseCard>
```

---

## 🎯 Common Use Cases

### Error Messages
```typescript
<p className="text-sm text-danger-600 mt-2">
  Invalid input. Please try again.
</p>
```

### Success Messages
```typescript
<div className="bg-success-50 border border-success-200 rounded-lg p-4">
  <p className="text-success-700 font-medium">
    Transaction saved successfully!
  </p>
</div>
```

### Financial Data Display
```typescript
// Positive amount (income, gains)
<span className="text-financial-md text-success-600">
  +₫1,234,567
</span>

// Negative amount (expenses, losses)
<span className="text-financial-md text-danger-600">
  -₫500,000
</span>

// Neutral amount (total balance)
<span className="text-financial-lg text-neutral-900">
  ₫10,234,567
</span>
```

### Form Inputs
```typescript
<input
  className="
    w-full px-4 py-2.5
    border-2 border-neutral-200 rounded-lg
    focus:border-primary-500 focus:ring-2 focus:ring-primary-500
    text-base text-neutral-900
    placeholder:text-neutral-400
    min-h-[44px]
    transition-colors duration-150
  "
  placeholder="Enter amount"
/>
```

### Links
```typescript
// Primary link
<a className="text-primary-600 hover:text-primary-700 font-medium">
  Learn more
</a>

// Subtle link
<a className="text-neutral-500 hover:text-neutral-700 underline">
  View details
</a>
```

---

## 📱 Responsive Breakpoints

```typescript
sm:   // 640px  - Landscape phones
md:   // 768px  - Tablets
lg:   // 1024px - Laptops ⭐
xl:   // 1280px - Desktops
2xl:  // 1536px - Large desktops
```

### Mobile-First Pattern
```typescript
// ✅ Good: Mobile-first (base = mobile, then larger)
<div className="text-base sm:text-lg lg:text-xl">

// ❌ Bad: Desktop-first (avoid this)
<div className="text-xl lg:text-base">
```

---

## 🔍 Focus States

### Buttons & Interactive Elements
```typescript
focus-visible:outline-none
focus-visible:ring-2
focus-visible:ring-primary-500
focus-visible:ring-offset-2
```

### Form Inputs
```typescript
focus:border-primary-500
focus:ring-2
focus:ring-primary-500
```

---

## ✅ Accessibility Guidelines

### Touch Targets
- ✅ **Minimum**: 44x44px (use `min-h-11` and `min-w-11`)
- ✅ **Comfortable**: 48x48px (use `min-h-12` and `min-w-12`)
- ✅ **Large actions**: 56x56px (use `min-h-14`)

### Color Contrast
- ✅ **Body text**: 4.5:1 minimum (WCAG AA)
- ✅ **Large text**: 3:1 minimum
- ✅ All design system colors meet WCAG AA standards

### Focus Indicators
- ✅ Always use `focus-visible:ring-2` on interactive elements
- ✅ Use `focus-visible:ring-primary-500` for primary actions
- ✅ Include `ring-offset-2` for better visibility

---

## 📦 Migration from Old System

### Color Mapping
```typescript
// OLD → NEW
bg → bg-primary-600
hgreen → bg-primary-500
fg → bg-neutral-50
lred → bg-danger-600
hover → bg-neutral-200

text-bg → text-primary-600
text-hgreen → text-primary-500
text-fg → text-white (on colored) or text-neutral-50 (on light)
text-lred → text-danger-600

border-bg → border-primary-600
border-hgreen → border-primary-500
border-lred → border-danger-600

focus-visible:ring-hgreen → focus-visible:ring-primary-500
```

### Shadow Mapping
```typescript
// OLD → NEW
drop-shadow-round → shadow-card
```

---

## 💡 Best Practices

1. **Always use semantic color names** instead of arbitrary colors
   - ✅ `bg-primary-600` (semantic)
   - ❌ `bg-[#2563EB]` (arbitrary)

2. **Use mobile-first responsive design**
   - Start with mobile styles, then add `sm:`, `md:`, `lg:` breakpoints

3. **Maintain WCAG compliance**
   - All touch targets ≥44x44px
   - Text contrast ≥4.5:1
   - Clear focus indicators

4. **Prefer semantic spacing**
   - Use predefined spacing like `gap-2` instead of arbitrary values
   - Use `space-y-4` for consistent vertical spacing

5. **Use transition classes for smooth interactions**
   - Always add `transition-*` classes to hover/focus states

6. **Leverage component variants**
   - Use `Button` size prop instead of custom classes
   - Use `BaseCard` padding/shadow props for consistency

---

## 🔗 Related Documentation

- [UI/UX Optimization Plan](./UI_UX_OPTIMIZATION_PLAN.md) - Full design system specification
- [Phase 1 Implementation Summary](./PHASE_1_IMPLEMENTATION_SUMMARY.md) - Migration details
- [Component Guide](../src/wj-client/components/README.md) - Component API reference
- [CLAUDE.md](../.claude/CLAUDE.md) - Project conventions and patterns

---

**Last Updated**: 2026-02-04
**Maintainer**: WealthJourney Team
