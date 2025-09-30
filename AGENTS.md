# Repository Guidelines

## Project Structure & Module Organization
Keep the workspace root clean and treat each service as an independent npm package. Place the Express API in `backend/` (`src/routes`, `src/services`, `src/entities`), the React client in `frontend/` (`src/pages`, `src/components`, `src/hooks`), and the JT/T 808 gateway in `jt808-service/` (`src/transport`, `src/lib`, `src/mock`). Diagrams, API drafts, and operational runbooks belong in `docs/`.

## Build, Test, and Development Commands
Install dependencies per package with `npm install`. Common scripts:
- `npm run dev` (backend, gateway) — start TypeScript services with hot reload.
- `npm start` (frontend) — launch the React dev server at `http://localhost:3000`.
- `npm run build` — produce production bundles prior to tagging a release.
- `npm test` / `npm run lint` — run the default test or lint suites; add the scripts when scaffolding new modules.
Always copy `.env.example` to `.env.local` before starting any service.

## Coding Style & Naming Conventions
Use TypeScript everywhere and stick with 2-space indentation for TS/JS and JSON. Favor `camelCase` for variables, `PascalCase` for React components, and `kebab-case` for filenames. Keep DTOs under `src/dto` with a `Dto` suffix, React prop interfaces ending in `Props`, and shared utilities in `src/shared`. Format code via ESLint + Prettier (`npm run lint -- --fix`) before pushing.

## Testing Guidelines
Back-end logic should be covered by Jest unit tests stored beside the implementation as `.spec.ts` files. Front-end components should use Vitest with Testing Library helpers; colocate UI smoke tests in `frontend/src/tests`. Simulate protocol traffic in `jt808-service` with recorded payloads under `testdata/`. Target 80% line coverage and document exceptions in `docs/testing-notes.md`. Run `npm test -- --coverage` before opening a pull request.

## Commit & Pull Request Guidelines
Adopt Conventional Commit headers (e.g., `feat:`, `fix:`, `refactor:`) and include the module prefix when helpful (`feat(backend):` …). Reference issue IDs with `Refs #123` in the footer. Pull requests should contain: a concise summary, bullet list of key changes, test evidence (`npm test`, screenshots, or curl output), and migration notes when schemas or protocols shift. Request reviewers for every service touched and wait for clean CI before merging.

## Security & Configuration Tips
Do not commit secrets; store local overrides in `.env.local` and document required keys in `.env.example`. Restrict PostgreSQL and Redis to `localhost` in development, rotate JWT and gateway tokens quarterly, and firewall the JT/T 808 TCP port to trusted device IPs only.
