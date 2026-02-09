# Dark Mode Quick Start Guide

## Usage

### In Components

```typescript
// Import theme hook
import { useTheme } from '@/components/theme';

// Use in component
function MyComponent() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  // ...
}
```

### Theme Toggle Button

```typescript
import ThemeToggle from '@/components/ThemeToggle';

// Minimal usage
<ThemeToggle />

// With options
<ThemeToggle
  size="md"           // sm | md | lg
  showLabel={true}    // Show text label
  className="ml-4"    // Custom classes
/>
```

### Styling Components

```typescript
// Background
className="bg-white dark:bg-dark-surface"

// Text
className="text-neutral-900 dark:text-dark-text"

// Borders
className="border-neutral-200 dark:border-dark-border"

// Hover states
className="hover:bg-neutral-100 dark:hover:bg-dark-surface-hover"

// With transitions
className="transition-colors duration-200"
```

## Available Colors

### Dark Mode Palette

```
Backgrounds:
- dark-background    #0F172A  (main page bg)
- dark-surface       #1E293B  (cards, modals)
- dark-surface-hover #334155  (hover states)
- dark-surface-active #475569 (active states)

Text:
- dark-text          #F8FAFC  (primary)
- dark-text-secondary #94A3B8 (secondary)
- dark-text-tertiary #64748B  (tertiary)

Borders:
- dark-border        #334155  (borders)
- dark-border-light  #475569  (light borders)

Overlays:
- dark-overlay       rgba(0,0,0,0.7)  (modal backdrop)
```

### Semantic Mapping

| Element | Light | Dark |
|---------|-------|------|
| Page BG | `neutral-50` | `dark-background` |
| Card BG | `white` | `dark-surface` |
| Text | `neutral-900` | `dark-text` |
| Secondary Text | `neutral-600` | `dark-text-secondary` |
| Border | `neutral-200` | `dark-border` |

## Theme Options

```typescript
type Theme = 'light' | 'dark' | 'system';

// Set theme
setTheme('light');   // Always light
setTheme('dark');    // Always dark
setTheme('system');  // Follow OS preference
```

## Best Practices

1. **Always use semantic tokens**
   ```typescript
   // Good
   className="dark:bg-dark-surface"

   // Bad
   className="dark:bg-[#1E293B]"
   ```

2. **Add transitions for smooth switching**
   ```typescript
   className="transition-colors duration-200"
   ```

3. **Test with real content**
   - Text readability
   - Chart colors
   - Form inputs
   - Modal overlays

4. **Maintain brand colors**
   - Primary blue: Same in both modes
   - Success green: Same in both modes
   - Danger red: Same in both modes

## Quick Reference

```typescript
// Imports
import { useTheme } from '@/components/theme';
import ThemeToggle from '@/components/ThemeToggle';

// Component pattern
export function MyComponent() {
  const { resolvedTheme } = useTheme();

  return (
    <div className="bg-white dark:bg-dark-surface rounded-lg p-4">
      <h2 className="text-neutral-900 dark:text-dark-text">
        Title
      </h2>
      <p className="text-neutral-600 dark:text-dark-text-secondary">
        Description
      </p>
      <button className="bg-primary-600 text-white rounded-md">
        Action
      </button>
    </div>
  );
}
```

## Testing

```bash
# Manually test themes
1. Click theme toggle in sidebar
2. Toggle OS dark mode preference
3. Refresh page (check no flash)
4. Navigate between pages
```

## Common Issues

**Colors not applying?**
- Check `darkMode: 'class'` in tailwind.config.ts
- Verify `dark` class on `<html>` element
- Use `dark:` prefix in Tailwind classes

**Flash on page load?**
- ThemeProvider must wrap app
- Check inline script in providers.tsx
- Verify localStorage key matches

**Transitions feel slow?**
- Reduce duration to 150ms
- Disable transitions on theme toggle button
- Use `will-change` sparingly
