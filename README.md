# π Lab — Predictive Imaging Lab

Website for the Predictive Imaging Lab (π Lab), School of Engineering, Faculty of
Engineering and Science, University of Greenwich.

**Live:** https://predictiveimaginglab.com

## Running locally

No build step — it's static HTML. Serve the folder:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Structure

```
index.html            Home
research.html         Research themes
projects.html         Active projects
facility.html         Instruments and access
people.html           Members and π Lab network affiliates
publications.html     Publications
join.html             Openings and contact
assets/css/site.css   Design system — all tokens live here
assets/js/tomo.js     Procedural tomographic slice renderer (hero illustration)
assets/js/site.js     Theme toggle, scroll reveals, canvas bootstrap
```

## Design system

Named **"Bench & Detector"**: the page ground is a cool lab bench, and imaging
surfaces are deep detector panels inset into it. Tokens are defined at the top of
`assets/css/site.css`.

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

The hero panel is a procedural illustration rather than measured data:
`assets/js/tomo.js` renders a tomographic-style slice from 3D fractal noise, with
a sweeping divider between greyscale and a predicted-strain colormap. It honours
`prefers-reduced-motion`.

## Deployment

GitHub Pages serves from `main`, so pushing to `main` publishes. `CNAME` sets the
custom domain and `.nojekyll` stops Jekyll from touching the assets.
