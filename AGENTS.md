# AGENTS.md — guidance for AI coding agents

## UI library (required)

- **Always use [animal-island-ui](https://guokaigdg.github.io/animal-island-ui/)** for UI. Prefer its components over inventing new buttons, cards, inputs, selects, tags, dividers, etc.
- Docs: https://guokaigdg.github.io/animal-island-ui/
- Skill / AI guide: https://guokaigdg.github.io/animal-island-ui/#/skill
- API reference: read `node_modules/animal-island-ui/AI_USAGE.md` if present; otherwise use `node_modules/animal-island-ui/dist/types/` (and the skill page above). Do **not** invent props.
- Import styles once at shared bootstrap, **before** any component usage:

  ```ts
  import 'animal-island-ui/style'
  ```

  This project does that in `src/bootstrap.ts`, imported first by every MPA entry (`src/main.tsx`, `src/date-main.tsx`).
- Import components from the package root only: `import { Button, Card } from 'animal-island-ui'`. **Do not** deep-import package paths (`animal-island-ui/es/...`, `animal-island-ui/dist/...`).
- Peer dependency: `classnames` (already installed).

## Project shape

- React + TypeScript + Vite **MPA** (multiple HTML entries), not SPA.
- Entries: `index.html` → `src/main.tsx`, `date.html` → `src/date-main.tsx`.
- `vite.config.ts` sets `base: '/all-online-tools/'` for GitHub Pages.
- Keep the multi-entry Rollup `input` pattern when adding tools: new `*.html` + `src/*-main.tsx` + `src/pages/*`.
- Tailwind CSS v4 via `@tailwindcss/vite` coexists with animal-island-ui styles.
- Date tools use **dayjs** (format / fromNow / toNow / diff). Keep that behavior.

## DatePicker / TimePicker note

- `DatePicker` is **date-only** (`YYYY-MM-DD` or month). `TimePicker` is **time-only** (`HH:mm:ss`).
- There is no combined datetime control — compose DatePicker + TimePicker when you need both (see `src/pages/DateTools.tsx`).
