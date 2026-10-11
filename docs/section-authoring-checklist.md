# Section Authoring Checklist

This checklist guides you through creating a new visualization section for the Chip Design Groundup project. Each section is registered with `ChipViz.register()` in a dedicated `js/sections/NN-*.js` file.

## Required Section Spec

When calling `ChipViz.register(spec)`, your spec object must include:

### 1. **id** (string, required)
   - Unique slug for your section
   - Used for:
     - Navigation and anchors (the section element gets id `sec-<id>`)
     - Concept map nodes and scroll-to targets
     - Duplicate detection (a second registration with the same id is ignored with a console warning)
   - Example: `id: 'gates'`

### 2. **order** (number, recommended)
   - Controls page order: Hero = 0, Gates = 1, etc.
   - Sections are sorted by order, then by id
   - If omitted, defaults to 999 (appears at the end)
   - Example: `order: 1`

### 3. **title** (string, recommended)
   - The section heading displayed to users
   - Example: `'Logic Gates: The Primitives'`

### 4. **subtitle** (string, recommended)
   - Secondary heading or tagline
   - Example: `'AND, OR, NOT — the atomic units of every chip.'`

### 5. **build** (function, required)
   - Called **once**, lazily, the first time the user scrolls the section into view
   - Receives one argument: `ctx` (see Context below)
   - Must be a function; omitting it or providing a non-function value causes a console error and blocks registration
   - Responsible for populating the `ctx.left` (explanation) and `ctx.stage` (visualization) containers
   - Example: `build: function (ctx) { ctx.stage.appendChild(myVisualization); }`

## Context Object (ctx)

The `build(ctx)` function receives a context object with these properties:

- **ctx.root**: The `<section>` element wrapping your entire section (read-only; do not modify the container itself)
- **ctx.left**: The left column element for explanations, controls, and text content (append or modify children here)
- **ctx.stage**: The right column element for live visualizations and interactive graphics (append or modify children here)
- **ctx.pulseGrid()**: Function that triggers the signature background circuit pulse animation

## Implementation Pattern

Sections are typically structured as follows:

```javascript
(function (ChipViz) {
  'use strict';

  // Helpers, data, and functions specific to this section
  function buildUI() { /* ... */ }
  function handleInteraction() { /* ... */ }

  // Register the section at the module level
  ChipViz.register({
    id: 'gates',
    order: 1,
    title: 'Logic Gates: The Primitives',
    subtitle: 'AND, OR, NOT — the atomic units of every chip.',

    build: function (ctx) {
      var explanation = ChipViz.el('p', {
        className: 'gates-explanation',
        text: 'Your explanation here…'
      });

      var visualization = buildUI();

      ctx.left.appendChild(explanation);
      ctx.stage.appendChild(visualization);

      // Trigger the background pulse effect
      ctx.pulseGrid();
    }
  });

})(window.ChipViz);
```

See `js/sections/01-gates.js` for a complete working example.

## Key Rules

1. **Lazy One-Time Construction**: `build()` is not called immediately; it runs only when the section enters the viewport. This keeps the page lightweight and fast. Your code can assume the section is visible and ready for interaction.

2. **sec-<id> Anchor Convention**: The section element automatically receives `id="sec-<id>"`, enabling smooth-scroll navigation via `ChipViz.scrollTo(id)` and direct URL fragments. Choose an id that's URL-safe and descriptive.

3. **Duplicate IDs Ignored**: If two sections register the same id, the second registration is silently ignored (a console warning is logged). Ensure your id is unique.

4. **Missing build() Function**: If `build` is not a function, registration fails with a console error. Check your spec object for typos.

5. **Registering the Script**: After creating `js/sections/NN-yourmodule.js`, you must add a `<script>` tag in `index.html` to load it. This is a **separate follow-up step** and not part of the section code itself.

## Syntax Check

Before committing, validate your JavaScript syntax:

```bash
find js -name '*.js' -print0 | xargs -0 -n1 node --check
```

This command checks all `.js` files in the `js/` directory for syntax errors.

## Example: Minimal Section

The simplest valid section looks like:

```javascript
(function (ChipViz) {
  'use strict';

  ChipViz.register({
    id: 'hello',
    order: 99,
    title: 'Hello World',
    subtitle: 'A minimal example.',
    build: function (ctx) {
      ctx.left.innerHTML = '<p>Welcome!</p>';
      ctx.stage.innerHTML = '<p>Visualization goes here.</p>';
    }
  });

})(window.ChipViz);
```

## Next Steps

1. Create `js/sections/NN-yourmodule.js` following the pattern above.
2. Test your section in a browser.
3. Add the `<script src="js/sections/NN-yourmodule.js"></script>` tag to `index.html`.
4. Run the syntax check: `find js -name '*.js' -print0 | xargs -0 -n1 node --check`.
5. Commit your changes.
