# AGENTS.md

## Cursor Cloud specific instructions

### Overview

LUMIRIZE (株式会社ルミライズ) corporate website — a zero-build static site (HTML/CSS/JS) hosted on GitHub Pages.

### Development Server

```
python3 -m http.server 8080 --directory /workspace
```

Or via npm: `npm start`. Then open `http://localhost:8080/`.

### Key files

- `index.html` / `styles.css` / `script.js` — the 3 editable source files (per README rules)
- Image assets at repo root (`hero.jpg`, `scene*.jpg`, `logo-*.png`)
- `eslint.config.js`, `.stylelintrc.json`, `.htmlhintrc`, `.prettierrc.json` — linter/formatter configs

### Commands

| Task           | Command                |
| -------------- | ---------------------- |
| Lint (all)     | `npm run lint`         |
| Lint HTML      | `npm run lint:html`    |
| Lint CSS       | `npm run lint:css`     |
| Lint JS        | `npm run lint:js`      |
| Format check   | `npm run format:check` |
| Format (write) | `npm run format`       |
| Test           | `npm test` (runs lint) |
| Dev server     | `npm start`            |

### User preferences

- 「URLを教えて」等の指示には、GitHub操作手順ではなく、Safariで直接開けるウェブURLを返すこと。
- 本番URL: `https://hiderock84-sys.github.io/lumirize-v2/`（カスタムドメイン: `https://lumirize.com/`）

### Important caveats

- The site has **no build step** — files are served as-is via GitHub Pages.
- Do NOT add source files beyond `index.html`, `styles.css`, `script.js` per README rules.
- The contact form uses client-side `mailto:` link generation (no backend).
- Opening `index.html` via `file://` may fail due to browser CORS policies; always use an HTTP server.
- The cinematic scroll experience relies on `IntersectionObserver`; test in Chrome.
- CI runs lint + format checks on every push and PR.
