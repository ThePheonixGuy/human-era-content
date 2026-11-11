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
- `endYear`: optional. Makes the event a span, for example a war or a period.
- `parent`: optional. The id of the big event this one is a step of. See below.
- `image`: optional, see below.
- `thenNow`: optional. It needs original SVG scenes in `content/scenes/` named `<id>-then.svg` and `<id>-now.svg`, with `thenSvg` and `nowSvg` set to `img/scenes/<id>-then.svg` and `img/scenes/<id>-now.svg`.

## Big events and their steps

Some events are the name history gives to a big story, such as World War II or the Global financial crisis. Others are steps inside one, such as D-Day or the collapse of Lehman Brothers. The big event is a span with a low level (1 or 2, so it shows when the timeline is zoomed out). Each step names it in `parent` and has a higher level (3 to 6). The site shows the big event at wide zoom and reveals its steps inside the span as you zoom in.

```markdown
---
id: "world-war-ii"
year: 1939
endYear: 1945
level: 1
title: "World War II"
...
---
```

```markdown
---
id: "d-day"
year: 1944.429
date: 1944-06-06
level: 3
parent: "world-war-ii"
title: "D-Day"
...
---
```

The validator checks that the parent exists, has an `endYear`, contains the step's `year`, has a lower `level` than the step, and that no chain of parents loops. A whole-number year covers the whole year, so a parent ending in 1945 holds a step dated 2 September 1945. Before adding a level 1 or 2 event, check that it is the name history uses for the big thing, with a Wikipedia article of that name. A single incident inside a bigger story belongs one level down as a step.

## Add a screensaver topic

The site's Screensaver mode offers curated topics from `content/pages/screensaver-topics.md`. Add an entry to the `topics` list with an `id` (kebab-case), a short `label`, an `icon` (the id of a file in `content/themes/`) and `events`, a one-line JSON list of existing event ids. Only list events that genuinely belong to the topic. Every id must exist and a topic needs at least 5 events, which `node tools/validate-content.mjs` checks. The camera visits the events in time order, or shuffled if the visitor asks.

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

It checks frontmatter, ids and filenames, levels, years and dates, parents and steps, sources, image fields and licences, scene files, compare-facts pairs, guided pages and `thenNow` references. It prints each problem with the file name.

## How reviews work

A maintainer checks each pull request against the cited source, the wording rules and the image licence, usually within a few days. They may ask for changes. Small corrections merge fast, new events get a source check first. Merged changes reach the site on its next build.
