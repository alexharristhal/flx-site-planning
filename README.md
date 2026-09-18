# Flexnode website prototype (premium-configurator direction)

Built 2026-09-17. Clickable multi-page HTML prototype.

## Run it

```bash
cd "Website/Prototype-Sept17-2026" && python3 -m http.server 8811
```

Then open `http://localhost:8811`. Opening `index.html` from Finder also works, but the
configurator deep links (`configure.html?model=nx3`) need the server.

## Pages

| File | Role |
| --- | --- |
| `index.html` | Overview. Hero, routes, speed, lineup, configurator CTA, building, leadership, delivery, community, insights, conversion |
| `platform.html` | NX product specifics. Four-configuration comparison table, integrated systems, configurable vs standardized, upgrade path |
| `configure.html` | **The centrepiece.** Six-step deployment configurator with a live site plan, readiness score and build code |
| `delivery.html` | Parallel schedule, the six conditions, scope matrix, sourcing, public partner roles |
| `sites.html` | Site evaluation, the four power-status definitions, the opportunity-card format, two routes |
| `community.html` | The five questions communities ask, local adaptation, approval path, public fact-sheet template |
| `company.html` | Our story and the 2019–today timeline |
| `team.html` | Five leadership profiles |
| `insights.html` | Thought-leadership hub, nine articles across three pillars, plus the news feed |
| `insights-article.html` | One fully written article, 1,142 words |
| `project-fit.html` | Three-step intake. Receives the configuration carried from `configure.html` |

## Design system

`assets/css/site.css`. Pure white ground (`#FFFFFF`), pure black type (`#000000`),
IBM Plex Sans primary, IBM Plex Mono for technical labels, specs and annotations.

**One non-neutral value exists.** `--signal: #B4633A` (brand copper), used only for live-state
dots, active step numbers and hotspot markers. Set it to `#000000` at the top of the stylesheet
to run the site fully monochrome under CLAUDE.md rule 4.1.

## Configurator arithmetic

All coefficients live in the `RULES` object at the top of `assets/js/configurator.js`.
That is the single place to edit once engineering approves a basis.

| Rule | Current value | Status |
| --- | --- | --- |
| NX-1 / 2 / 3 / 4 critical IT | 4.5 / 9.0 / 13.5 / 18.0 MW | From the published family range |
| Acres per MW, linear | 0.28 | **Representative. Needs approval** |
| Acres per MW, compressed | 0.21 | **Representative. Needs approval** |
| 2N area multiplier | 1.18× | **Representative. Needs approval** |
| Facility draw over critical IT | 1.18× liquid, 1.25× hybrid, 1.35× air | **Representative. Needs approval** |
| Base schedule | 8 months, +1 per 4.5 MW above 9 MW | From the documented 5–10 MW delivery basis |

The stated area boundary is building, equipment yard, service clearance and internal access.
It excludes substation, setbacks and stormwater. That boundary is printed on the page.

## What is sourced and what is not

Sourced from the two planning documents, the company deck and `context/`:
the eight-month basis and its conditions, the configuration range, leadership records,
the company timeline, partner roles, community positions.

Labelled representative on the page: all area and density figures, the thermal envelopes,
the site opportunity card, the schedule arithmetic, and every render.

Deliberately excluded from this public prototype under CLAUDE.md rule 2.5: named commercial
counterparties and LOIs, internal program names, capital structure, site scoring models and
deal economics.

## Assets

`assets/img/` holds web-sized JPEGs cut from `3D Renderings/Selects-Aug2026/` and the
Metropolis render set. Two internal massing studies were pulled after review: one carried a
Google Maps watermark, the other used an off-brand colour key. Neither is publishable.

## Build scripts

`_build/*.py` generate the pages from a shared shell so nav and footer stay consistent.
Edit the Python, then run each script from the prototype root:

```bash
cd "Website/Prototype-Sept17-2026" && PYTHONPATH=_build python3 _build/b_home.py
```

Editing the HTML directly also works. The scripts will overwrite it on the next run.
