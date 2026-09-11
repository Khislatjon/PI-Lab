# π Lab — Predictive Imaging Lab

Website for the Predictive Imaging Lab (π Lab), School of Engineering, Faculty of
Engineering and Science, University of Greenwich. The lab is deliberately open:
the π Lab network extends to affiliated researchers outside the lab's direct
supervision.

**Live:** https://predictiveimaginglab.com

## Running locally

No build step — it's static HTML. Serve the folder:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Structure

```
index.html            Home — hero, models, projects, facility, news
research.html         Research themes and published architectures
projects.html         Active projects, one row each
facility.html         Instruments and access
people.html           Members and π Lab network affiliates
publications.html     Papers (to be generated from BibTeX)
join.html             Openings and contact
assets/css/site.css   Design system — all tokens live here
assets/js/tomo.js     Procedural tomographic slice renderer
assets/js/site.js     Theme toggle, scroll reveals, canvas bootstrap
CNAME                 Custom domain for GitHub Pages
```

## Design system

Named **"Bench & Detector"**: the page ground is a cool lab bench, and imaging
surfaces are deep detector panels inset into it.

| Token | Light | Role |
| --- | --- | --- |
| `--bench` | `#E9EDEA` | Page ground |
| `--film` | `#080D0E` | Detector panels |
| `--ink` | `#0F1516` | Body text |
| `--teal` | `#0E6E76` | Compressive strain (ε−) |
| `--copper` | `#B85C25` | Tensile strain (ε+) |

The teal→copper accent pair is the two poles of a compressive/tensile strain
map, so the brand gradient doubles as a legitimate scientific colormap.

**Type:** Archivo (display, expanded width), Newsreader (body), IBM Plex Mono
(specs, DOIs, readouts) — all from Google Fonts.

Light and dark themes are both defined at token level and follow the visitor's
system preference; the Theme button overrides and persists to `localStorage`.

### The hero canvas

`assets/js/tomo.js` renders a tomographic slice procedurally. Structure comes
from a narrow band around a level set of 3D fractal value noise — trabecular
bone is irregular rather than a lattice, so this reads far closer to a real
specimen than a periodic surface would. A sweeping divider turns raw XCT
greyscale into a D2IM-style predicted strain field.

Slices build in row chunks across frames so a rebuild never drops a frame, and
the first slice renders synchronously so the panel is never empty on first
paint. Honours `prefers-reduced-motion`.

## Deployment

GitHub Pages serves from the default branch. `CNAME` points at
`predictiveimaginglab.com`; `.nojekyll` stops Jekyll from touching the assets.

DNS records to add at the registrar:

| Type | Name | Value |
| --- | --- | --- |
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `khislatjon.github.io` |

Then enable **Enforce HTTPS** in the repository's Pages settings once the
certificate is issued.

## Before launch

- [ ] Replace the generated specimen placeholders with real micrographs
      (`canvas.tile` elements — swap for `<img>`)
- [ ] Add portraits for the remaining people (`assets/img/people/`; drop the
      `ph-slot` class and swap the `<svg class="ph">` for an `<img>`)
- [x] Confirm contact details and postal address on `join.html`
- [x] Confirm roles and titles on `people.html`; add affiliate list
- [x] Link the Google Scholar profile on `publications.html`
- [ ] Replace the Scholar link with a generated list once the group's BibTeX
      file exists
- [ ] Consider moving to a generator (Astro or Eleventy) so publications come
      from BibTeX rather than hand-edited HTML
