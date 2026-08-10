---
name: content-ops-backend
description: Domain knowledge for the Content Operations & Project Memory Platform (Aaryajanani) backend — Node/Express/Mongo. Use when working on this backend: adding routes/services/models, changing the project lifecycle, permissions, notifications, or running tests. Encodes architecture, state machine, permission model, conventions, and DoD.
---

# Content Ops Backend (Aaryajanani)

Node.js 24 (CommonJS) + Express 4 + Mongoose 7 + MongoDB (mongodb-memory-server in tests).

## Run & verify (DoD)

- Dev: `npm run dev` (src/server.js). Tests: `npm test` (jest --runInBand). Lint: `npm run lint`.
- **DoD before committing**: `npm test` 5/5 suites green AND jest exits cleanly (no open-handle hang) AND `npm run lint` clean.
- Never call bare `bus.emit` for workflow side-effects — use `await bus.emitAsync(event, payload)` so activity/notifications finish before the response (prevents cross-suite DB race in tests).
- Every new test suite that touches the DB must stop `global.__MONGOD__` in its `afterAll` (health.test.js runs last alphabetically and must stop it too, or jest hangs).

## Architecture

```
routes → controllers → services → models (Mongoose)
            │                │
            │                └─ emits domain events on bus (await bus.emitAsync)
            └─ middleware: authenticate, requirePermission, validate (Joi)
events/hub.js       awaitable DomainEventBus (emitAsync awaits + isolates listener errors)
events/listeners.js activity history + notifications (registered via setup() from app.js)
storage/            pluggable file storage (local disk driver; swap for S3 later)
seed/roles.js       DEFAULT_ROLES upserted on org creation
```

- **Error contract**: services throw `{status, code, message}`; `middleware/errors.js` responds `{error:{code,message}}`; validation responds `{error:{code:'validation_error',details:[{field,message}]}}`.
- **Auth**: JWT access token (`JWT_ACCESS_SECRET`), DB-backed hashed refresh tokens; `tokens.js` helpers.
- **Files**: multer memory storage (100MB cap) → `storage.saveFile` → `ProjectVersion.files[]` subdocs.

## Permission model

- `Membership.role` is a role **NAME string** (NOT ObjectId). Resolve roles via `Role.find({name:{$in:memberships.map(m=>m.role)}})`.
- `requirePermission(perm)` checks org membership + role permissions; sets `req.projectOrgId` when org is inferred from a project route (controllers use `req.projectOrgId || req.query.organizationId`).
- Default roles: admin `*`; editor (create/transition/assign/upload_version/comment/revision/view); reviewer (view/comment/revision/approve); publisher (view/schedule/publish/metrics).
- Org-scoping: all project lookups use `Project.findOne({_id, organizationId})` — never bare `findById` in services.

## State machine

Single source of truth: `ALLOWED_TRANSITIONS` in `src/services/project.service.js`.

```
IDEA→APPROVED_CONCEPT/ASSIGNED/CANCELLED; APPROVED_CONCEPT→ASSIGNED/CANCELLED;
ASSIGNED→WAITING_FOR_INPUTS/IN_PROGRESS/CANCELLED; WAITING_FOR_INPUTS→INPUTS_READY/CANCELLED;
INPUTS_READY→IN_PROGRESS/CANCELLED; IN_PROGRESS→FIRST_DRAFT_SUBMITTED/CANCELLED;
FIRST_DRAFT_SUBMITTED→UNDER_REVIEW/REVISION_REQUESTED; UNDER_REVIEW→REVISION_REQUESTED/APPROVED;
REVISION_REQUESTED→REVISION_IN_PROGRESS; REVISION_IN_PROGRESS→REVISION_SUBMITTED;
REVISION_SUBMITTED→UNDER_REVIEW/APPROVED; APPROVED→SCHEDULED; SCHEDULED→PUBLISHED;
PUBLISHED→CLOSED; CANCELLED→CLOSED; CLOSED→[]
```

Auto-transitions: assign in IDEA/APPROVED_CONCEPT→ASSIGNED; addVersion IN_PROGRESS→FIRST_DRAFT_SUBMITTED and REVISION_IN_PROGRESS→REVISION_SUBMITTED; last input received→INPUTS_READY; approveVersion→APPROVED (sets approvedVersionId/approvedBy/approvedAt).

## Gotchas

- dotenv does NOT override pre-set env vars — tests set MONGO_URI in setup.js; keep NODE_ENV handling that way.
- jest + `--runInBand`: module registries are per-suite; event-bus listeners must be awaited (see above).
- Do not add unused imports/params — eslint (flat config) fails CI on `no-unused-vars`.
