# AGENTS.md

## Cursor Cloud specific instructions

### Overview
LUMIRIZE (株式会社ルミライズ) corporate website — a zero-build static site (HTML/CSS/JS) hosted on GitHub Pages.

### Development Server
Run the site locally with any static HTTP server:
```
python3 -m http.server 8080 --directory /workspace
```
Then open `http://localhost:8080/` in a browser. No build step, no dependencies.

### Key files
- `index.html` — Single-page HTML
- `styles.css` — All styles
- `script.js` — Client-side JavaScript (IIFE, vanilla)
- Image assets at repo root (`hero.jpg`, `scene*.jpg`, `logo-*.png`)

### Lint / Test / Build
- **No linter configured** — no `package.json`, no ESLint.
- **No automated tests** — CI only runs `echo "CI is working"`.
- **No build step** — the site is served directly as static files.

### Important caveats
- Do NOT add files outside the 3 editable files (`index.html`, `styles.css`, `script.js`) per README rules.
- The contact form uses client-side `mailto:` link generation (no backend).
- Opening `index.html` via `file://` may not work due to browser CORS policies; always use an HTTP server.
- The cinematic scroll experience relies on `IntersectionObserver`; test in Chrome for best results.
