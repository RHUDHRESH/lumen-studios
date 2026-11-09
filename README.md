# Lumen Studios

A one-page concept portfolio site for a cinematic heritage film house: scroll-driven sections, a film archive gallery, a reel viewer and an inquiry form. It is a static site with no build step.

**Demo:** [lumen-studios-seven.vercel.app](https://lumen-studios-seven.vercel.app)
**Stack:** HTML, CSS and vanilla JavaScript; GSAP 3.12.5 with ScrollTrigger (jsDelivr); Google Fonts (Cormorant Garamond, Inter); Vercel headers in `vercel.json`

## What it does

- Opens with a preloader, then an animated opening section that leads into the manifesto and portrait sections.
- Film archive: entries from `data/archive.json` are built when the section nears the viewport, and images load lazily.
- Reel viewer: the "Watch Film" button opens an embedded YouTube player (video ID set in `CONFIG` in `gsap-animations.js`).
- Inquiry form with client-side validation and per-field error messages. Submissions are POSTed to the endpoint in `CONFIG.FORM_ENDPOINT`.
- Light and dark theme toggle, a custom cursor, and reduced-motion handling.

## Quick start

No install is needed. Serve the folder with any static server:

```bash
git clone https://github.com/RHUDHRESH/lumen-studios.git
cd lumen-studios
python -m http.server 8000
```

Open [localhost:8000](http://localhost:8000/).

To receive form submissions, create a form endpoint with a form service and replace `FORM_ENDPOINT` in `gsap-animations.js`. The current value is a third-party Formspree endpoint.

## How it works

```
index.html ──► style.css
     │
     └──► gsap-animations.js ──► data/archive.json  (archive entries)
                 │            ──► images/             (film stills)
                 └──────────► FORM_ENDPOINT          (inquiry POST)
```

Everything runs in the browser. GSAP drives the scroll sections; `gsap-animations.js` builds the archive, the reel viewer and the form.

## Project structure

- `index.html`: page markup and sections (opening, manifesto, archive, testimonial, process, reel, inquiry)
- `style.css`: layout, typography and theme tokens
- `gsap-animations.js`: animations, archive builder, reel viewer, form handling
- `data/archive.json`: archive locations and film entries
- `images/`: film stills
- `vercel.json`: security and cache headers
- `robots.txt`, `sitemap.xml`, `site.webmanifest`: crawler, sitemap and manifest files

## Roadmap

- Working: static page, scroll animations, archive, reel viewer, form validation.
- The form only delivers mail if the configured endpoint is live and owned by whoever deploys the site.
- If `data/archive.json` fails to load, the archive falls back to generic placeholder frames.
- No automated tests or build checks.

---
Built by [Rhudhresh R](https://github.com/RHUDHRESH)
