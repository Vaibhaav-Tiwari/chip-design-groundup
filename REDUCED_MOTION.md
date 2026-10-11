# Reduced Motion Support

ChipViz respects the system and browser reduced-motion preference to provide alternatives for users who prefer to minimize animations.

## How It Works

`ChipViz.prefersReducedMotion()` reads the CSS media query `(prefers-reduced-motion: reduce)` and returns true when the user or browser has enabled reduced motion.

When reduced motion is active, `ChipViz.pulse()` substitutes a brief color flash (200ms) for the animated signal pulse that normally travels along SVG wires. The wire returns to its original color after the flash.

## Enabling Reduced Motion

### macOS
1. System Settings → Accessibility → Display
2. Enable "Reduce motion"
3. Reload the page

### Windows
1. Settings → Ease of Access → Display
2. Toggle "Show animations" off
3. Reload the page

### Browser DevTools (Testing)
1. Open Chrome DevTools (F12)
2. Ctrl+Shift+P (Cmd+Shift+P on Mac) → "Emulate CSS media feature prefers-reduced-motion"
3. Select "prefers-reduced-motion: reduce"

## Scope

This note describes the shared `pulse()` helper in `js/core/helpers.js` only. It is not a claim that all page animations are disabled or a complete accessibility audit.
