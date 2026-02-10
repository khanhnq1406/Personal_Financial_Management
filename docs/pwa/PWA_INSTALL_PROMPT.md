# PWA Install Prompt Documentation

## Overview

The PWA Install Prompt is a feature that encourages users to install the WealthJourney app on their devices for a better user experience. This implementation provides a smart, platform-aware installation prompt that appears at the right time, respects user preferences, and provides clear installation instructions for different platforms.

## Features

### Automatic Detection
- Detects if the app is already installed (runs in standalone mode)
- Identifies the user's platform (iOS Safari, Android Chrome, Desktop Chrome, etc.)
- Determines if the device supports PWA installation

### Platform-Specific Instructions
- **iOS Safari**: Step-by-step guide using Share button and "Add to Home Screen"
- **Android Chrome**: Native browser installation prompt with fallback instructions
- **Desktop Chrome**: Native browser installation prompt
- **Unsupported Platforms**: Gracefully degrades with appropriate messaging

### Smart Timing
- Appears after a brief delay (3 seconds) to avoid disrupting initial page load
- Only shows once per session by default
- Can be dismissed permanently by user preference

### Persistence
- Stores user preferences in localStorage
- Remembers if user dismissed the prompt
- Never shows prompt again if user has already installed the app

### User-Friendly Design
- Modal-based UI with clear visual hierarchy
- Responsive design for mobile and desktop
- Accessibility-compliant with proper ARIA attributes
- Smooth animations for better UX

## Components

### 1. usePWAInstall Hook

**Location:** `src/wj-client/hooks/usePWAInstall.tsx`

#### Returns

```typescript
{
  isInstallable: boolean;           // Can the app be installed?
  isInstalled: boolean;             // Is the app already installed?
  platform: string;                 // Detected platform (ios, android, desktop, etc.)
  showPrompt: boolean;              // Should prompt be shown?
  setShowPrompt: (show: boolean) => void;  // Control prompt visibility
  handleInstall: () => Promise<void>;      // Trigger native install
  handleDismiss: () => void;        // Dismiss prompt
  handleDismissPermanently: () => void;    // Never show again
}
```

#### Key Features

- **Platform Detection**: Identifies iOS, Android, Desktop Chrome, and other platforms
- **Install State Management**: Tracks if app is already installed or installable
- **Native Browser Events**: Captures and manages `beforeinstallprompt` event
- **User Preferences**: Persists dismiss state in localStorage
- **Automatic Display**: Shows prompt after 3-second delay if conditions are met

#### Usage Example

```typescript
"use client";

import { usePWAInstall } from "@/hooks/usePWAInstall";

export default function MyPage() {
  const {
    isInstallable,
    isInstalled,
    platform,
    showPrompt,
    handleInstall,
    handleDismiss,
    handleDismissPermanently,
  } = usePWAInstall();

  // Component automatically manages prompt visibility
  // Manual control available via setShowPrompt if needed
}
```

### 2. PWAInstallPrompt Component

**Location:** `src/wj-client/components/pwa/PWAInstallPrompt.tsx`

#### Props

```typescript
interface PWAInstallPromptProps {
  isOpen: boolean;                  // Control modal visibility
  onClose: () => void;              // Close handler
  onInstall: () => Promise<void>;   // Install handler (for Android/Desktop)
  onDismissPermanently: () => void; // Never show again handler
  platform: string;                 // User's platform (ios, android, desktop, etc.)
}
```

#### Behavior

- **Modal Display**: Renders as a centered modal overlay
- **Platform Routing**: Shows appropriate installation steps based on platform
- **Native Integration**: Triggers browser's native install prompt on Android/Desktop
- **iOS Guidance**: Provides visual step-by-step instructions for iOS Safari
- **Benefits Highlight**: Showcases app benefits (fast, offline, home screen access)

#### Usage Example

```typescript
import PWAInstallPrompt from "@/components/pwa/PWAInstallPrompt";
import { usePWAInstall } from "@/hooks/usePWAInstall";

export default function Dashboard() {
  const {
    showPrompt,
    setShowPrompt,
    platform,
    handleInstall,
    handleDismissPermanently,
  } = usePWAInstall();

  return (
    <>
      {/* Your page content */}

      <PWAInstallPrompt
        isOpen={showPrompt}
        onClose={() => setShowPrompt(false)}
        onInstall={handleInstall}
        onDismissPermanently={handleDismissPermanently}
        platform={platform}
      />
    </>
  );
}
```

### 3. InstallSteps Component

**Location:** `src/wj-client/components/pwa/InstallSteps.tsx`

#### Purpose

Renders platform-specific installation instructions with visual aids.

#### Platform Logic

- **iOS**: Shows Share icon, "Add to Home Screen" steps
- **Android**: Explains menu → "Install app" or "Add to Home Screen"
- **Desktop**: Points to install icon in address bar
- **Other**: Generic instructions to check browser menu

#### Visual Elements

- Platform-specific icons (share, menu, home)
- Step numbers for clarity
- Clear, concise text instructions
- Responsive layout

## Installation Flow

### iOS Safari Installation

1. **User visits app** in iOS Safari
2. **Hook detects iOS** platform and installability
3. **Prompt appears** after 3 seconds (if not dismissed before)
4. **User sees benefits**: Fast, Offline, Home Screen
5. **User clicks "Install"**
6. **Step-by-step guide shows**:
   - Tap Share icon (bottom of screen)
   - Scroll and tap "Add to Home Screen"
   - Tap "Add" to confirm
7. **User follows steps** → App installed
8. **Prompt never shows again** (localStorage flag set)

### Android Chrome Installation

1. **User visits app** in Android Chrome
2. **Hook captures** `beforeinstallprompt` event
3. **Prompt appears** after 3 seconds
4. **User clicks "Install"**
5. **Native browser prompt shows** (handled by Chrome)
6. **User confirms** → App installed
7. **Fallback**: If native prompt fails, manual instructions shown

### Desktop Chrome Installation

1. **User visits app** in Desktop Chrome
2. **Hook captures** `beforeinstallprompt` event
3. **Prompt appears** after 3 seconds
4. **User clicks "Install"**
5. **Native browser prompt shows** (install dialog)
6. **User confirms** → App installed to desktop
7. **Install icon** also visible in address bar

### Already Installed

- Hook detects `window.matchMedia('(display-mode: standalone)')` is true
- Prompt never shows
- Clean experience for existing users

## User Preferences

### localStorage Keys

```typescript
// Key: "pwa-install-dismissed"
// Value: "true" | null
// Purpose: Remember if user dismissed prompt permanently
```

### Behavior

- **Not Dismissed**: Prompt shows after 3-second delay on each new session
- **Dismissed Once**: Prompt closes for current session only
- **Dismissed Permanently**: Prompt never shows again (user clicked "Maybe Later")
- **App Installed**: Prompt never shows (detected automatically)

### Reset Preferences

Users can reset by clearing browser data or manually removing localStorage item:

```javascript
localStorage.removeItem("pwa-install-dismissed");
```

## Benefits Showcased

The prompt highlights three key benefits:

### 1. Fast & Reliable
- **Icon**: Lightning bolt (⚡)
- **Message**: "Lightning-fast performance"
- **User Value**: Instant loading, smooth experience

### 2. Works Offline
- **Icon**: Cloud (☁️)
- **Message**: "Access your finances anytime, even offline"
- **User Value**: Always available, no network dependency

### 3. Home Screen Access
- **Icon**: Home (🏠)
- **Message**: "Quick access from your home screen"
- **User Value**: One-tap launch, native app feel

## Testing

### Manual Testing Checklist

#### iOS Safari (iPhone/iPad)

- [ ] Open app in Safari (not installed)
- [ ] Wait 3 seconds → Prompt appears
- [ ] Verify iOS-specific instructions show Share button steps
- [ ] Click "Install" → Instructions display correctly
- [ ] Follow steps to actually install app
- [ ] Reopen app from home screen → Prompt does NOT appear
- [ ] Uninstall and revisit → Prompt should appear again

#### Android Chrome

- [ ] Open app in Chrome (not installed)
- [ ] Wait 3 seconds → Prompt appears
- [ ] Click "Install" → Native browser prompt appears
- [ ] Confirm installation → App installs
- [ ] Reopen app from home screen → Prompt does NOT appear
- [ ] Test fallback: If native prompt blocked, manual instructions show

#### Desktop Chrome

- [ ] Open app in Chrome (not installed)
- [ ] Wait 3 seconds → Prompt appears
- [ ] Click "Install" → Native install dialog appears
- [ ] Confirm → App installs to desktop
- [ ] Reopen as PWA → Prompt does NOT appear
- [ ] Verify install icon also visible in address bar

#### Already Installed Scenario

- [ ] Install app on any platform
- [ ] Launch as PWA (standalone mode)
- [ ] Verify prompt does NOT appear
- [ ] Check `isInstalled` returns true in hook

#### Dismiss Functionality

- [ ] Open app (not installed)
- [ ] Wait for prompt
- [ ] Click "Maybe Later"
- [ ] Verify prompt closes
- [ ] Refresh page → Prompt should NOT appear (same session)
- [ ] Close browser and reopen → Prompt should NOT appear (permanent)
- [ ] Clear localStorage → Prompt should appear again

#### Unsupported Browsers

- [ ] Test in Firefox, Edge, Safari Desktop
- [ ] Verify graceful degradation
- [ ] Ensure no errors in console
- [ ] Generic instructions shown (if any)

## Design System Compliance

### Tailwind CSS Classes

The components follow WealthJourney's design system:

#### Colors

```typescript
bg-white          // Modal background
bg-bg             // Primary green (#008148) - Install button
bg-gray-100       // Benefit card backgrounds
text-gray-600     // Secondary text
text-gray-800     // Primary text
hover:bg-hgreen   // Button hover state
```

#### Spacing & Layout

```typescript
p-6               // Modal padding
space-y-4         // Vertical spacing between sections
gap-4             // Grid/flex gaps
rounded-lg        // Modal and card corners
```

#### Responsive Design

```typescript
max-w-md          // Modal max width (mobile-first)
sm:max-w-lg       // Larger on small+ screens
grid-cols-1       // Single column on mobile
sm:grid-cols-3    // Three columns on desktop (benefits)
```

### Accessibility

- **Focus Management**: Modal traps focus, returns on close
- **ARIA Attributes**: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
- **Keyboard Navigation**: ESC to close, Tab to navigate
- **Semantic HTML**: Proper heading hierarchy (`h2`, `h3`)
- **Color Contrast**: Meets WCAG AA standards

### Animations

```typescript
transition-opacity duration-300  // Smooth fade in/out
ease-in-out                      // Natural motion curve
```

## Accessibility Features

### ARIA Attributes

```jsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="pwa-install-title"
>
  <h2 id="pwa-install-title">Install WealthJourney</h2>
  {/* Modal content */}
</div>
```

### Keyboard Support

- **ESC**: Close modal
- **Tab**: Navigate between focusable elements
- **Enter/Space**: Activate buttons

### Focus Management

- **On Open**: Focus trapped within modal
- **On Close**: Focus returns to trigger element
- **First Element**: Auto-focus on close button

### Screen Reader Support

- Modal announced as dialog
- Title properly associated via `aria-labelledby`
- Benefits list announced as unordered list
- Button states communicated (loading, disabled)

## Future Enhancements

### Potential Improvements

1. **A/B Testing**
   - Test different prompt timings (3s vs 5s vs 10s)
   - Measure installation conversion rates
   - Experiment with different benefit messaging

2. **Contextual Triggers**
   - Show prompt after user completes a transaction
   - Trigger on Nth visit (e.g., 3rd visit)
   - Display when user shows engagement signals

3. **Animation Enhancements**
   - Slide-up animation from bottom (mobile-friendly)
   - Bounce effect on benefit icons
   - Progress indicator for multi-step iOS installation

4. **Multi-language Support**
   - Internationalize all text strings
   - Platform detection messages in user's language
   - RTL support for Arabic, Hebrew, etc.

5. **Analytics Integration**
   - Track prompt impressions
   - Measure installation success rate by platform
   - Monitor dismiss rate (temporary vs permanent)
   - A/B test variations

6. **Installation Verification**
   - Detect successful installation immediately
   - Show confirmation message
   - Offer onboarding for new PWA users

7. **Customization Options**
   - Admin configurable prompt delay
   - Feature flag to disable prompt entirely
   - Custom benefits messaging per user segment

8. **Mini Prompt Variant**
   - Less intrusive banner at top/bottom
   - Expandable to full modal on click
   - Persistent across pages until dismissed

9. **Installation Badge**
   - Small "Install App" button in navigation
   - Always available fallback if auto-prompt dismissed
   - Less intrusive than modal

10. **Smart Retry Logic**
    - If user dismisses, retry after X days
    - Graduated intervals (1 day, 3 days, 1 week)
    - Re-engagement for high-value users

## Technical Implementation Details

### Platform Detection Logic

```typescript
const detectPlatform = (): string => {
  const ua = window.navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isAndroid = /android/.test(ua);
  const isChrome = /chrome/.test(ua);
  const isSafari = /safari/.test(ua) && !isChrome;

  if (isIOS && isSafari) return "ios";
  if (isAndroid && isChrome) return "android";
  if (isChrome && !isAndroid && !isIOS) return "desktop";
  return "other";
};
```

### Install State Detection

```typescript
const isInstalled = window.matchMedia(
  "(display-mode: standalone)"
).matches || (window.navigator as any).standalone === true;
```

### Native Prompt Handling

```typescript
window.addEventListener("beforeinstallprompt", (e: any) => {
  e.preventDefault(); // Prevent default mini-infobar
  setDeferredPrompt(e); // Store for later use
});

const handleInstall = async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt(); // Show native prompt
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      console.log("User accepted installation");
    }
    setDeferredPrompt(null); // Clear after use
  }
};
```

## References

### Web Standards

- [MDN: Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [MDN: beforeinstallprompt event](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeinstallprompt_event)
- [MDN: Display Modes](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/display-mode)

### Platform Documentation

- [Apple: Configuring Web Applications](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)
- [Chrome: Install Criteria](https://web.dev/install-criteria/)
- [Chrome: Patterns for Promoting PWA Installation](https://web.dev/promote-install/)

### Best Practices

- [Google Web.dev: PWA Installation](https://web.dev/install-criteria/)
- [PWA Best Practices](https://web.dev/pwa-checklist/)
- [Accessibility Guidelines (WCAG 2.1)](https://www.w3.org/WAI/WCAG21/quickref/)

### Related WealthJourney Documentation

- [PWA Setup Guide](./PWA_SETUP.md) - Initial PWA configuration
- [PWA Icon Generation Guide](./PWA_ICON_GENERATION_GUIDE.md) - Creating app icons
- [PWA Icons Complete](./PWA_ICONS_COMPLETE.md) - Icon implementation details

---

**Last Updated:** 2026-02-10
**Version:** 1.0.0
**Maintainer:** WealthJourney Development Team
