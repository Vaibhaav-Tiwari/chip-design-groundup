# Accessibility

This document describes native keyboard interactions supported by the ChipViz visualization library.

## Keyboard Navigation

The interactive controls in ChipViz support standard HTML keyboard navigation:

- **Tab** and **Shift+Tab**: Move focus between focusable controls (buttons, inputs)
- **Enter** or **Space**: Activate focused buttons and toggle controls
- **Arrow Keys**: Adjust focused range inputs (↑/→ increase, ↓/← decrease)

These keyboard interactions are provided by native HTML elements (`<button>`, `<input type="range">`) and require no special implementation.

## Testing Keyboard Access

To verify keyboard navigation is working:

1. **Navigate with Tab**: Press Tab repeatedly to move focus through all interactive controls on the page. Use Shift+Tab to move backward.
2. **Activate a Button**: Focus any button control and press Enter or Space to activate it.
3. **Adjust a Slider**: Focus any range input and use arrow keys to adjust its value.

## Note

This is a short usage note documenting the native keyboard interactions available in the current implementation. It is not a claim of a completed accessibility audit or full WCAG compliance. For comprehensive accessibility information, please refer to WCAG 2.1 guidelines.
