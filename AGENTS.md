# AGENTS.md — guidance for AI coding agents

## UI library (required)

- **Always use [pxlkit](https://pxlkit.xyz/)** (`@pxlkit/ui-kit`) for UI. Prefer its `Pixel*` components (`PixelButton`, `PixelCard`, `PixelInput`, `PixelSelect`, `PixelDatePicker`, `PixelBadge`, `PixelDivider`, …) over inventing new buttons, cards, inputs, selects, etc.
- Docs: https://pxlkit.xyz/docs · UI kit showcase: https://pxlkit.xyz/ui-kit
- GitHub: https://github.com/joangeldelarosa/pxlkit
- Do **not** invent props — read types under `node_modules/@pxlkit/ui-kit/dist/` (and `@pxlkit/ui-kit-core`) or the docs above.
- Styles: import the kit stylesheet **instead of** raw Tailwind (already done in `src/index.css`):

  ```css
  @import "@pxlkit/ui-kit/styles.css";
  ```

  Every MPA entry imports `src/bootstrap.ts` first (`src/main.tsx`, `src/date-main.tsx`), which loads CSS + Google Fonts via `buildGoogleFontsUrl()`.
- Wrap the app with `PxlKitSurfaceProvider` (`surface="pixel"`) — see `src/components/Providers.tsx`. HTML roots use `class="dark"` for the retro dark palette matching pxlkit.xyz.
- Import components from the package root only: `import { PixelButton, PixelCard } from '@pxlkit/ui-kit'`. Icons: `import { PxlKitIcon } from '@pxlkit/core'` + packs such as `@pxlkit/ui` / `@pxlkit/gamification`.
- Peers / related packages already installed: `@pxlkit/core`, `@pxlkit/ui`, `@pxlkit/gamification` (add more packs only when needed).

## Project shape

- React + TypeScript + Vite **MPA** (multiple HTML entries), not SPA.
- Entries: `index.html` → `src/main.tsx`, `date.html` → `src/date-main.tsx`, `pdf.html` → `src/pdf-main.tsx`, `json.html` → `src/json-main.tsx`, `model.html` → `src/model-main.tsx`, `face.html` → `src/face-main.tsx`.
- `vite.config.ts` sets `base: '/all-online-tools/'` for GitHub Pages.
- Keep the multi-entry Rollup `input` pattern when adding tools: new `*.html` + `src/*-main.tsx` + `src/pages/*`.
- Tailwind CSS v4 via `@tailwindcss/vite` processes `@pxlkit/ui-kit/styles.css`.
- Date tools use **dayjs** (format / fromNow / toNow / diff). Keep that behavior.
- PDF tools use **pdfjs-dist** (preview), **pdf-lib** + **pica** (redact export). Logic lives under `src/components/pdf/`; keep local-only (no upload).
- JSON tools use native **JSON.parse** / **JSON.stringify** (format / validate) and a small structural diff under `src/components/json/`; keep local-only (no upload).
- Model tools use **three@0.160** (`GLTFLoader` + **OrbitControls**) under `src/components/model/`; local file picker for `.glb`/`.gltf` only (no upload). Prefer self-contained `.glb`.
- Face tools use **@mediapipe/tasks-vision** Face Landmarker under `src/components/face/`; camera via `getUserMedia` (front/`user`), browser-only overlay modes (bounding box / mesh). WASM + model from Google CDN; stop tracks on unmount.

## Date / time controls note

- `PixelDatePicker` is **date-only** (`Date | null`). There is no combined datetime control in pxlkit.
- For time, use `PixelInput` with `type="time"` (and `step={1}` for seconds). Compose date + time in app state (see `src/pages/DateTools.tsx`).

## i18n (zh / en)

- Lightweight module under `src/i18n/` (no heavy i18n framework): dicts `zh` / `en`, `I18nProvider` + `useI18n().t(path, params?)`.
- **Default locale**: saved `localStorage` key `all-online-tools.locale` wins; else browser language if it starts with `zh` → `zh`, otherwise `en`.
- `LanguageSwitcher` (`PixelSegmented`) is mounted once in `Providers` (fixed top-right) so every MPA entry gets it.
- Switching locale updates `document.documentElement.lang` (`zh-CN` / `en`) and dayjs locale (`zh-cn` / `en`).
- Cover user-visible strings via `t('…')`; prefer shared keys under `common.*` / per-tool namespaces (`home.*`, `date.*`, …).
