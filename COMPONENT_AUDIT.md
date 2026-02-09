# Component Audit Report - Design System Alignment

**Date**: 2026-02-05
**Reviewer**: Claude Code
**Goal**: Align all components with the WealthJourney Design System v2.0.0

## Summary

This audit reviews all components in the `/components` folder against the design system standards defined in `DESIGN_SYSTEM.md`. The goal is to ensure consistency in colors, typography, spacing, accessibility, and mobile-first design patterns.

---

## Priority Components to Fix

### 🔴 High Priority (Breaking Design System)

#### 1. **ButtonGroup.tsx**
**Issues:**
- ❌ Uses old Redux modal pattern (should be component-level state)
- ❌ Uses image icons instead of SVG icons
- ❌ Manual CSS class manipulation (`.show`) instead of React state
- ❌ Hardcoded colors (`bg-primary-600`) instead of semantic tokens
- ❌ Fixed positioning without responsive considerations
- ❌ No accessibility (aria-labels, keyboard navigation)
- ❌ Not aligned with FloatingActionButton pattern

**Recommendation**: Replace with FloatingActionButton component or update to match modern patterns

---

#### 2. **Notification.tsx**
**Issues:**
- ❌ Uses hardcoded colors (`text-primary-500`, `text-danger-600`)
- ❌ Inline font size (`text-[30px]`) instead of design system scale
- ❌ Uses deprecated `custom-btn` class
- ❌ No dark mode support
- ❌ Poor accessibility (no semantic structure)
- ❌ No animation/transition

**Recommendation**: Replace with Toast component or create proper notification component

---

#### 3. **ProgressBar.tsx**
**Issues:**
- ❌ Hardcoded green color (`#008148`) instead of semantic token
- ❌ Uses old gray colors (`gray-200`, `gray-600`) instead of neutral scale
- ❌ No dark mode support
- ❌ Missing accessibility (aria-valuenow, aria-valuemin, aria-valuemax)
- ❌ Label styling doesn't match design system

**Recommendation**: Update to use design system tokens and add accessibility

---

### 🟡 Medium Priority (Needs Improvement)

#### 4. **CreatableSelect.tsx**
**Status**: Mostly aligned ✅ but needs minor fixes

**Issues:**
- ⚠️ Uses `dark:bg-dark-surface` (good) but inconsistent with other components
- ⚠️ Dropdown animation is correct but could use design system animation tokens
- ⚠️ Touch target sizing could be improved for mobile

**Positive aspects:**
- ✅ Good keyboard navigation
- ✅ Proper ARIA attributes
- ✅ Dark mode support
- ✅ Focus management

**Recommendation**: Minor refinements to match design system perfectly

---

#### 5. **Checkbox.tsx**
**Status**: Mostly aligned ✅ but needs minor fixes

**Issues:**
- ⚠️ Uses `gray-300` instead of `neutral-300`
- ⚠️ Size is `w-5 h-5` (20px) - should be at least 24px for touch targets
- ⚠️ No dark mode support for border colors
- ⚠️ Uses `text-primary-600` instead of `text-primary-500`

**Positive aspects:**
- ✅ Good accessibility with aria-labels
- ✅ Proper disabled states
- ✅ Label wrapper for larger hit target

**Recommendation**: Update colors to match design system and increase size

---

#### 6. **CurrencySelector.tsx**
**Status**: Good functionality but inconsistent styling

**Issues:**
- ⚠️ Uses `bg-white` directly instead of semantic surface token
- ⚠️ Uses `gray-50`, `gray-500`, `gray-600` instead of neutral scale
- ⚠️ Dropdown uses `drop-shadow-round` (old token) instead of design system shadows
- ⚠️ Uses `bg-green-50` instead of `bg-primary-50` for selected state
- ⚠️ Manual z-index management instead of design system layers

**Positive aspects:**
- ✅ Good loading states
- ✅ Confirmation dialog pattern
- ✅ Responsive design (mobile/desktop)

**Recommendation**: Update to use design system color tokens consistently

---

### 🟢 Low Priority (Minor Refinements)

#### 7. **ThemeToggle.tsx**
**Status**: Excellent alignment ✅✅✅

**Positive aspects:**
- ✅ Perfect dark mode implementation
- ✅ Uses design system colors consistently
- ✅ Proper accessibility (aria-labels)
- ✅ Size variants
- ✅ Smooth transitions
- ✅ Focus states

**Issues:**
- None significant

---

#### 8. **FloatingActionButton.tsx**
**Status**: Excellent alignment ✅✅✅

**Positive aspects:**
- ✅ Mobile-first design
- ✅ Proper z-index management
- ✅ Touch-friendly (56px touch target)
- ✅ Smooth animations with staggered delays
- ✅ Backdrop for focus
- ✅ Accessibility (aria-labels, aria-expanded)

**Issues:**
- None significant

---

## Design System Compliance Checklist

### Color Usage
| Component | Primary Colors | Neutral Scale | Dark Mode | Status |
|-----------|---------------|---------------|-----------|---------|
| ButtonGroup | ❌ | ❌ | ❌ | Needs work |
| Notification | ❌ | ❌ | ❌ | Needs work |
| ProgressBar | ❌ | ❌ | ❌ | Needs work |
| CreatableSelect | ✅ | ✅ | ✅ | Good |
| Checkbox | ⚠️ | ⚠️ | ⚠️ | Minor fixes |
| CurrencySelector | ⚠️ | ⚠️ | ✅ | Minor fixes |
| ThemeToggle | ✅ | ✅ | ✅ | Excellent |
| FloatingActionButton | ✅ | ✅ | ✅ | Excellent |

### Typography
| Component | Font Scale | Font Weight | Tabular Numbers | Status |
|-----------|-----------|-------------|-----------------|---------|
| ButtonGroup | N/A | N/A | N/A | N/A |
| Notification | ❌ Inline sizes | ❌ | N/A | Needs work |
| ProgressBar | ⚠️ | ✅ | N/A | Minor fixes |
| CreatableSelect | ✅ | ✅ | N/A | Good |
| Checkbox | ✅ | ✅ | N/A | Good |
| CurrencySelector | ✅ | ✅ | ✅ | Good |
| ThemeToggle | ✅ | ✅ | N/A | Excellent |
| FloatingActionButton | ✅ | ✅ | N/A | Excellent |

### Accessibility
| Component | ARIA | Keyboard Nav | Focus States | Touch Targets | Status |
|-----------|------|--------------|--------------|---------------|---------|
| ButtonGroup | ❌ | ❌ | ❌ | ⚠️ 32px | Needs work |
| Notification | ❌ | N/A | N/A | N/A | Needs work |
| ProgressBar | ❌ | N/A | N/A | N/A | Needs work |
| CreatableSelect | ✅ | ✅ | ✅ | ⚠️ | Good |
| Checkbox | ✅ | ✅ | ✅ | ⚠️ 20px | Minor fixes |
| CurrencySelector | ⚠️ | ⚠️ | ✅ | ✅ | Minor fixes |
| ThemeToggle | ✅ | ✅ | ✅ | ✅ 40px+ | Excellent |
| FloatingActionButton | ✅ | ⚠️ | ✅ | ✅ 56px | Excellent |

### Mobile-First Design
| Component | Responsive | Touch-Friendly | Mobile Layout | Status |
|-----------|-----------|----------------|---------------|---------|
| ButtonGroup | ❌ | ⚠️ | ❌ | Needs work |
| Notification | ❌ | N/A | ❌ | Needs work |
| ProgressBar | ✅ | N/A | ✅ | Good |
| CreatableSelect | ✅ | ⚠️ | ✅ | Good |
| Checkbox | ✅ | ⚠️ | ✅ | Minor fixes |
| CurrencySelector | ✅ | ✅ | ✅ | Good |
| ThemeToggle | ✅ | ✅ | ✅ | Excellent |
| FloatingActionButton | ✅ | ✅ | ✅ | Excellent |

---

## Recommended Action Plan

### Phase 1: Critical Fixes (High Priority)
1. **ButtonGroup** → Deprecate and migrate to FloatingActionButton
2. **Notification** → Replace with Toast component
3. **ProgressBar** → Update colors, add dark mode and accessibility

### Phase 2: Improvements (Medium Priority)
4. **Checkbox** → Increase size, update colors
5. **CurrencySelector** → Standardize color tokens
6. **CreatableSelect** → Touch target refinements

### Phase 3: Polish (Low Priority)
7. Documentation updates
8. Storybook examples
9. Test coverage

---

## Design System Patterns to Follow

### Color Tokens (from DESIGN_SYSTEM.md)
```tsx
// Primary Colors
bg-primary-500 (Sky Blue #0EA5E9)
bg-primary-600 (Darker #0284C7)
text-primary-500

// Accent
bg-accent-500 (Green #22C55E)
text-accent-500

// Neutrals
bg-neutral-50 (Background #FAFAFA)
bg-neutral-100
text-neutral-900 (Primary text #171717)
text-neutral-500 (Secondary text #737373)
border-neutral-200 (#E5E5E5)

// Dark Mode
dark:bg-dark-background (#0A0A0A)
dark:bg-dark-surface (#171717)
dark:text-dark-text (#FAFAFA)
dark:border-dark-border
```

### Touch Targets
```tsx
// Minimum: 44x44px (iOS guidelines)
className="min-h-[44px] min-w-[44px]"

// Comfortable: 48x48px
className="h-12 w-12"

// Large: 56x56px (FAB standard)
className="h-14 w-14"
```

### Animations
```tsx
// Duration
transition-all duration-200 // Default
transition-all duration-150 // Micro-interactions
transition-all duration-300 // Complex animations

// Easing
ease-out // Exiting
ease-in  // Entering
```

### Typography Scale
```tsx
// Display sizes
text-display-3xl (3rem / 48px)
text-display-2xl (2.5rem / 40px)
text-display-xl (2rem / 32px)
text-display-lg (1.5rem / 24px)
text-display-md (1.125rem / 18px)
text-display-sm (1rem / 16px)

// Body
text-base (1rem / 16px)
text-sm (0.875rem / 14px)
text-xs (0.75rem / 12px)
```

---

## Next Steps

1. ✅ Complete this audit
2. ⏳ Get stakeholder approval
3. ⏳ Implement Phase 1 fixes
4. ⏳ Test all components
5. ⏳ Update documentation
6. ⏳ Deploy changes

---

**Notes:**
- Components not listed in this audit are either well-aligned or in specialized folders (forms/, modals/, etc.)
- Some components like BaseCard, Button, Select are already well-aligned based on previous refactoring
- Focus should be on the components identified in High/Medium priority

