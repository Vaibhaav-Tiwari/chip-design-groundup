# Chip Design Visualizer

This project is an interactive chip-design visualizer. It builds a guided view of
chip design concepts, from basic logic gates through larger computing systems.

## Run locally

No build step or dependencies are required.

- Open `index.html` directly in a browser, or
- Serve the repository folder and visit the local URL:

  ```sh
  python3 -m http.server
  ```

  Then open <http://localhost:8000>.

## Folder layout

- `index.html` — page shell and the script/style load order.
- `css/` — shared styles and styles for individual sections.
- `js/core/` — shared runtime code, including the section registry.
- `js/sections/` — one JavaScript module per visualizer section.

## Adding a section

Sections register themselves; do not add section wiring to `index.html`. The
registry in `js/core/registry.js` defines `ChipViz.register()`. A section file
calls it at top level with a spec containing a unique `id`, an `order`, a
title/subtitle, and a `build(ctx)` function:

```js
ChipViz.register({
  id: 'example',
  order: 13,
  title: 'Example section',
  subtitle: 'A short description.',
  build: function (ctx) {
    // Build the section using ctx.root, ctx.left, and ctx.stage.
  }
});
```

The registry loads before section files. Registered sections are sorted by
`order`; `build()` is called lazily when a section first enters view.
