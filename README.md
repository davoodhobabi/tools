# Tools

A collection of small, practical web tools. Each tool is served on its own route; use the home page to browse them. This repo is meant to grow by adding more lightweight utilities under the same structure.

## Stack

- **Node.js** with **TypeScript**
- **Express 5** for the server and APIs
- **Sharp** for image processing
- **Multer** for uploads and **Archiver** for ZIP responses

## Running the project

```bash
npm install
npm run dev
```

The server listens on `http://localhost:3000` by default. Custom port:

```bash
PORT=8080 npm run dev
```

Production:

```bash
npm run build
npm start
```

## Structure and adding a tool

- `src/server.ts` serves static files from `public/` and loads every tool module from the registry.
- Tools are listed in `src/tools/registry.ts`. Each entry implements the `ToolModule` contract in `src/tools/tool.type.ts` (`id`, `title`, `basePath`, `register`).
- Per tool you typically have:
  - Logic and types under `src/tools/<tool-name>/`
  - Static UI under `public/tools/<tool-name>/`
  - API and static routes wired in `register(app)` under `basePath`

After adding a tool, append it to the `tools` array in `registry.ts` and link it from `public/index.html` when needed.

## Current tools

| Tool                 | Web path                  | Summary                                                                                         |
| -------------------- | ------------------------- | ----------------------------------------------------------------------------------------------- |
| Image Type Convert   | `/image-type-convert`     | Upload multiple images, convert to a chosen format, download as one ZIP                        |
| Image Smart Compress | `/image-smart-compress`   | One image: same format as source, proportional size % + quality → estimate, confirm, download   |

### Image Type Convert

- **GET** `/image-type-convert` — UI
- **GET** `/image-type-convert/health` — health check (`{ "ok": true }`)
- **POST** `/image-type-convert/api/convert` — multipart form with `outputFormat` and image files; per-request upload limit ~25 MB

Supported output formats: `jpeg`, `png`, `webp`, `avif`, `tiff` (`jpg` is normalized to `jpeg`).

### Image Smart Compress

- **GET** `/image-smart-compress` — UI
- **GET** `/image-smart-compress/health` — health check (`{ "ok": true }`)
- **POST** `/image-smart-compress/api/preview` — multipart: field `image`, `scalePercent` (10–200, scales width and height together), `quality` (1–100). Output format is inferred from the source image (jpeg, png, webp, avif, gif, tiff, heif; unknown raster types fall back to png). Returns JSON with sizes, dimensions, `format`, and `previewDataUrl` (a `data:` URL of the encoded output when it is ≤ 3 MB, otherwise `null`).
- **POST** `/image-smart-compress/api/export` — same fields as preview; response body is the encoded image file (same settings as a fresh encode).

## CLI batch conversion

Besides the web app, `npm run convert` (`src/index.ts`) converts images between an input and output directory. Example:

```bash
npm run convert:sample
```

Runs conversion with default paths `./input` and `./output`.

---

When you add a new tool, update this README with a table row and API notes if applicable.
