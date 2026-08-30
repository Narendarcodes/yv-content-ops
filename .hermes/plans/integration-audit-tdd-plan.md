# Integration Audit → TDD Implementation Plan

## Context
Backend (Express + Mongo + Socket.IO) ↔ Frontend (Vite + React + TypeScript) monorepo.
Test infra: Jest + mongodb-memory-server on backend. Frontend has no test runner yet.

## Issues & Fix Order (TDD per fix)

### Fix #1 — Socket.IO URL + CORS origin config (HIGH)
- **RED**: Add unit test in `tests/socket.test.js` that imports `initSocketServer` config and asserts CORS origin reads from `config.corsOrigin` (not hardcoded `true`).
- **GREEN**: Pass `config.corsOrigin` into `initSocketServer`'s `cors` option. In `lib/chat.ts`, derive socket URL from `API_BASE` (strip `/api/v1` suffix).
- **Test**: Backend unit test for cors config; frontend smoke test that `getSocket()` uses same origin as `API_BASE`.

### Fix #2 — Socket.IO token-refresh reconnect (MEDIUM)
- **RED**: Test that socket middleware calls `verifyAccessToken` and, on failure, attempts refresh-token verification; connection should succeed with refreshed token.
- **GREEN**: Add refresh-token check in `io.use` middleware: if access token fails, try refresh-token cookie, verify it, issue new access token, reconnect.
- **Frontend**: Wire `closeChatSocket()` on logout; reconnect with new token after refresh.

### Fix #3 — Enforce JWT_ACCESS_SECRET in production (HIGH)
- **RED**: Test that `config/index.js` throws when `NODE_ENV=production` and secret is default, even via docker-compose path.
- **GREEN**: Add runtime check in `docker-compose.yml` healthcheck / startup script that fails fast on `change-me`.
- **Test**: Existing config already has this check — verify docker-compose doesn't bypass it.

### Fix #4 — Wire upload form to real API (MEDIUM)
- **RED**: Add integration test that `POST /projects/:id/versions/:versionId/files` with a real file buffer returns 201 and stores the file.
- **GREEN**: Replace the simulated upload in `ProjectDetailPage` with a real multipart form POST to the upload endpoint.
- **Test**: Jest supertest for the upload endpoint; frontend component renders upload form wired to API.

### Fix #5 — Normalize Project.type (MEDIUM)
- **RED**: Test that a newly created project's `type` field (default `'content'` from backend) is normalized to a valid frontend enum value.
- **GREEN**: Add `type` normalization in `normalizeProject()` (data.ts) or add a default on the backend model.
- **Test**: Unit test on `normalizeProject` with `type: 'content'` → expects `'Content Production'`.

### Fix #6 — Read cookies as JWT fallback (LOW)
- **RED**: Test that `authenticate` middleware accepts a valid JWT from `req.cookies.accessToken` when no `Authorization` header is present.
- **GREEN**: Add `cookie-parser` dependency; in `authenticate`, check `req.headers.authorization` first, fall back to `req.cookies.accessToken`.
- **Test**: supertest with cookie set, no Authorization header → 200.

### Fix #7 — Add frontend dev/build service to docker-compose (MEDIUM)
- **RED**: Test that `docker compose config` includes a frontend service.
- **GREEN**: Add `frontend` service to docker-compose (multi-stage build or dev volume).
- **Test**: `docker compose config --services` includes frontend.

### Fix #8 — Consolidate duplicate frontend types (LOW)
- **RED**: Type-check pass that fails on duplicate/conflicting definitions.
- **GREEN**: Move all types to `lib/types.ts`, re-export from `services/api.ts`, remove duplicates.
- **Test**: `tsc --noEmit` passes with no duplicate identifier errors.

## Test Infrastructure
- Backend: Jest + mongodb-memory-server (existing).
- Frontend: No test runner. Install Vitest + Playwright for integration.
- Docker: Build + healthcheck assertions.
