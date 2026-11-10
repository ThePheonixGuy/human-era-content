# Human Era content

The open content of [Human Era](https://human-era.seven42.io), a timeline of human history counted from 10,000 BCE (year 1 HE). Every event, era, theme and guided page the site shows lives in this repository as markdown.

## How it fits

The Human Era site is built from this repository. A change merged here reaches the site on its next build, with no change to the site's code. The site code lives elsewhere and is not part of this repository.

```
content/
  events/   one file per event
  eras/     era bands
  themes/   event themes
  pages/    intro, tours, explainers, trails, compare facts
  scenes/   original SVG art for the Then and Now view
tools/
  validate-content.mjs   the checker CI runs on every pull request
```

## Contribute

Add an event, fix a fact or improve a description. Read [CONTRIBUTING.md](CONTRIBUTING.md) for the steps, the sourcing rules and the image rules. Check your change locally with Node 22 or newer and no install step:

```
node tools/validate-content.mjs
```

Pull requests run the same check. Please follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Licences

- Tooling (`tools/`, workflows): [MIT](LICENSE).
- Content (`content/`): [CC BY-SA 4.0](LICENSE-CONTENT.md).
- Images are hotlinked from Wikimedia Commons and keep their own licences, recorded per file. See [NOTICE.md](NOTICE.md).
