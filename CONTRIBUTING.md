# Contributing Guide

Thanks for your interest in improving ChatGPT at Home! This guide explains how to develop, propose changes, and open pull requests.

## Prerequisites
- Node.js 18+ and npm 8+
- Ollama installed locally (see setup-guide.md)

## Setup & Dev
- Install: `npm ci`
- Dev server: `npm run dev` (http://localhost:3000)
- Build: `npm run build` (outputs to `dist/`)
- Start all (Ollama + web): `npm start`

## Branching & Commits
- Branch naming: `feature/<brief>`, `fix/<brief>`, `docs/<brief>`
- Use Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`, `ci:`, `test:`
  - Example: `feat(chat): add sidebar conversation list`

## Code Style
- Vue 3 + Composition API, `<script setup>` preferred
- 2-space indentation; semicolon-less JS to match existing files
- Components: PascalCase (`MessageList.vue`), one component per file
- Composables: `useX.js` naming, return refs/computed/plain objects
- CSS tokens in `src/styles/variables.css`; import via `src/styles/main.css`

## Testing & Quality
- No formal tests yet. If adding tests, prefer Vitest + Vue Test Utils and name files `*.spec.js`.
- Run a clean build before pushing: `npm ci && npm run build`
- Keep PRs focused and small; include screenshots/GIFs for UI changes.

## Pull Requests
- Target branch: `main`
- Include: problem statement, summary of changes, screenshots (UI), manual test steps, and any follow-ups
- Link related issues; reference breaking changes explicitly
- Ensure CI “Build / vite-build” passes

## Ownership & Guidelines
- Default reviewer/owner: @vscarpenter (see `.github/CODEOWNERS`)
- See AGENTS.md (Repository Guidelines) for structure, conventions, and security tips

App author: Vinny Carpenter — https://vinny.dev/
