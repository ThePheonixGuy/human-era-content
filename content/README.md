# content/

Everything the Human Era site shows as editorial material. The tree is self-contained: nothing here depends on `site/` or the builder, so it can live in its own repository.

```
content/
  events/    one markdown file per event: frontmatter (id, year, level, theme, wiki, sources, optional endYear, parent, image and thenNow) plus a short original-wording body
  eras/      one file per era band
  themes/    one file per theme (label, colour, emoji)
  pages/     intro steps, tour steps, explainers, trails and the compare-facts list
  scenes/    original SVG art for the Then and Now view, named <event-id>-then.svg and <event-id>-now.svg
```

An event's `thenNow.thenSvg` and `thenNow.nowSvg` read `img/scenes/<event-id>-then|now.svg`. That is the path the site serves. The build (`node scripts/build-content.mjs`) copies `content/scenes/*.svg` to `site/img/scenes/` (generated, gitignored), and the validator (`node scripts/validate-content.mjs`) requires the matching file in `content/scenes/`.
