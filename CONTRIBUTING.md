# Contributing

Thank you for helping. Everything you can change lives in `content/` as markdown. You need a GitHub account and, to check your work locally, Node 22 or newer. There is nothing to install.

By contributing you agree your work is licensed under CC BY-SA 4.0 (content) or MIT (tools). See [LICENSE-CONTENT.md](LICENSE-CONTENT.md) and [LICENSE](LICENSE). Please follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Add an event, step by step

1. Fork the repository and create a branch, for example `event/apollo-11`.
2. Check `content/events/` that the event is not already there.
3. Copy a similar file in `content/events/` to `content/events/<id>.md`. The `id` is kebab-case and must equal the filename without `.md`.
4. Fill in the frontmatter (fields below) and write a short body in your own words.
5. Run `node tools/validate-content.mjs`. It must print `content ok`.
6. Open a pull request. CI runs the same check.

### Worked example

`content/events/acts-of-union-create-great-britain.md` has this shape:

```markdown
---
id: "acts-of-union-create-great-britain"
year: 1707.3288
date: 1707-05-01
level: 4
theme: "empires"
title: "Acts of Union create Great Britain"
wiki: "Acts of Union 1707"
emoji: "🏛️"
sources:
  - type: "wikipedia"
    label: "Wikipedia: Acts of Union 1707"
    url: "https://en.wikipedia.org/wiki/Acts_of_Union_1707"
---
One or two sentences in your own words.

Why it matters: one sentence.

## Sources

- Wikipedia: [Acts of Union 1707](https://en.wikipedia.org/wiki/Acts_of_Union_1707)
```

Fields:

- `id`: kebab-case, unique, equals the filename.
- `year`: the historian year as a number (negative for BCE). With a `date`, the year must match it, which the validator checks.
- `date`: `YYYY-MM-DD`, only when Wikipedia states one agreed day.
- `level`: 1 to 6, from the most significant events (1) to fine detail (6).
- `theme`: the id of a file in `content/themes/`.
- `title`, `wiki` (the Wikipedia article title), `emoji`.
- `sources`: at least one. `type: "wikipedia"` needs an `en.wikipedia.org` URL. `type: "book"` needs a `label` naming the book and chapter.
- `image`: optional, see below.
- `thenNow`: optional. It needs original SVG scenes in `content/scenes/` named `<id>-then.svg` and `<id>-now.svg`, with `thenSvg` and `nowSvg` set to `img/scenes/<id>-then.svg` and `img/scenes/<id>-now.svg`.

## Fix a fact

Edit the event file, keep the source line truthful to what you checked, and say in the pull request what the source says. If the year changes, change `date` with it.

## Sourcing rules

- Every event cites at least one Wikipedia article or a book chapter.
- Write facts in original wording. Do not copy or closely paraphrase text from Wikipedia, books or anywhere else.
- Quote no book text beyond a short phrase. Cite the book and chapter in `sources`.
- State only what the source states. If sources disagree, pick the better-supported figure and leave the other out.

## Dates

- Human Era (HE) counts from 10,000 BCE: HE = CE + 10,000. The site converts for display.
- `year` is the historian year, in CE terms (negative for BCE). Give the date as a historian would write it, not an HE number.
- Add `date:` only when Wikipedia states one agreed day. Leave it off for events known only to a year or an era.

## Images

- Free licences only: CC0, CC BY, CC BY-SA or public domain. No NC and no ND, ever.
- Images are hotlinked from Wikimedia Commons. Do not add image files to this repository.
- Record `url`, `credit` and `licence` in the `image` frontmatter. The credit names the author as shown on the Commons file page, followed by "via Wikimedia Commons". The licence is the exact licence on that page, for example `CC BY-SA 4.0` or `Public domain`.
- Use a real Commons thumbnail URL (the `upload.wikimedia.org/.../thumb/...` link, or `commons.wikimedia.org/wiki/Special:FilePath/<file>?width=800`), not the file page.

## Run the validator

```
node tools/validate-content.mjs
```

It checks frontmatter, ids and filenames, levels, years and dates, sources, image fields and licences, scene files, compare-facts pairs, guided pages and `thenNow` references. It prints each problem with the file name.

## How reviews work

A maintainer checks each pull request against the cited source, the wording rules and the image licence, usually within a few days. They may ask for changes. Small corrections merge fast, new events get a source check first. Merged changes reach the site on its next build.
