# Comic Rack

Static comic reader: rack view (index) and flip-book reader with swipe/click.

## Run

Serve the project over HTTP (required for `fetch`). From repo root:

```bash
npx serve .
# or: python -m http.server 8080
```

Open `http://localhost:3000` (or your port).

## Structure

- **index.html** – Rack of comic covers; loads `manifest.json` and each comic’s `manifest.json`.
- **reader.html** – Reader for `?comic=<id>`; uses [page-flip](https://www.npmjs.com/package/page-flip) (St.PageFlip).
- **manifest.json** – Root manifest: `{ "comics": [ { "id", "path" } ] }`.
- **comics/<id>/manifest.json** – Per-comic: `id`, `title`, `subtitle`, `cover`, `pages`, optional `pageDir`, `aspect`, `theme`.

## Manifest formats

**Root** (`manifest.json`):

```json
{ "version": 1, "comics": [ { "id": "demo", "path": "comics/demo" } ] }
```

**Comic** (`comics/<id>/manifest.json`):

- `pages`: array of strings (`"01.png"`) or objects (`{ "src": "p01.png", "headline": "..." }`).
- Optional: `pageDir`, `aspect`, `theme` (default | warm | noir), `cover` (default `cover.png`).

## Optional cleanup

- `manifest (2).json` – Backup/copy of correct root manifest; can be removed.
- `reader (2).html` – Duplicate; remove if unused.
- `man.json` / `comics/*/man.json` – Alternate manifest names; not used by the app.
