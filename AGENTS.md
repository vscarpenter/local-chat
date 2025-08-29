# Repository Guidelines

## Project Structure & Module Organization
- `src/`: Vue 3 application code
  - `components/`: UI components (PascalCase `.vue` files)
  - `composables/`: reusable logic (`useThing.js` patterns)
  - `styles/`: global styles and variables
  - `App.vue`, `main.js`: app entry
- `scripts/start-helper.js`: starts Ollama and/or the web app
- `start-ollama.*`, `stop-ollama.*`: platform scripts
- `index.html`, `vite.config.js`: Vite entry/config
- `dist/`: build output (generated; do not edit)
- Docs: `README.md`, `STARTUP.md`, `setup-guide.md`

## Build, Test, and Development Commands
- `npm install`: install dependencies
- `npm run dev`: start Vite dev server (http://localhost:3000)
- `npm run build`: production build to `dist/`
- `npm run preview` or `npm run serve`: serve the built app
- `npm run start:ollama`: start the Ollama daemon only
- `npm run start:web`: start the web app only
- `npm start` / `npm run start:all`: start Ollama then the web app
- `npm run stop`: stop services started by the helper

## Coding Style & Naming Conventions
- Indentation: 2 spaces; semicolon‑less JS to match existing files
- Components: PascalCase names (e.g., `MessageList.vue`), one component per file
- Composables: `useX.js` naming, return refs/computed/plain objects
- CSS: define tokens in `src/styles/variables.css`; import via `main.css`
- Vue: prefer Composition API and `<script setup>`; keep props/emits explicit

## Testing Guidelines
- No automated tests yet. If adding tests:
  - Framework: Vitest + Vue Test Utils
  - Location: `src/__tests__/` or alongside components
  - Names: `*.spec.js`; focus on chat send/stream/error cases
  - Add a basic `npm test` script when introducing Vitest

## Commit & Pull Request Guidelines
- Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`, `build:`, `perf:`, `test:`
- Scope examples: `feat(chat): retry last message`
- PRs: link issues, describe rationale, include screenshots for UI changes, list manual test steps, and ensure `npm run build` succeeds.

## Security & Configuration Tips
- Ollama defaults live in `src/composables/useOllama.js` (`baseUrl`, `model`). Prefer configurable overrides in code review rather than committing local tweaks.
- Do not commit secrets or logs. When changing endpoints, verify CORS and local network assumptions.

## Author
- Vinny Carpenter — https://vinny.dev/
