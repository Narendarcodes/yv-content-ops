# Content Operations & Project Memory Platform — Backend

Node.js + Express + MongoDB (Mongoose) backend for the **Aaryajanani** Content Operations & Project Memory Platform.

Implements the MVP per the PRD: JWT auth, org-scoped roles & permissions, a project lifecycle state machine, versioning, inputs, comments, revisions, approvals, notifications, activity history, scheduling/publication, performance metrics, file uploads, Docker, and CI.

Also includes a **Fluit-aligned feature set** for content operations agencies: kanban **tasks**, structured client **briefs**, **review locking & feedback summarization**, project **chat** (channels/threads), client **contracts** with an e-sign lifecycle, and **invoices** with payment tracking.

## Tech stack

- **Runtime**: Node.js 24 (CommonJS)
- **Web**: Express 4
- **Database**: MongoDB 7 via Mongoose 7 (mongodb-memory-server for tests)
- **Auth**: bcryptjs + JWT access tokens; DB-backed, hashed refresh tokens
- **Validation**: Joi schemas + middleware
- **Logging / security**: pino, helmet, morgan, express-rate-limit, CORS
- **Testing**: Jest + Supertest
- **Files**: multer (memory) → pluggable storage adapter (local disk by default)

## Quickstart (development)

1. Start MongoDB (Docker compose) and the app:

```bash
docker compose up -d mongo
npm install
npm run dev
```

2. Run tests:

```bash
npm test
```

3. Lint:

```bash
npm run lint
```

Environment variables are read from `.env` (see [Configuration](#configuration)). API prefix defaults to `/api/v1`.

## Docker

Build and run the whole stack (MongoDB + API):

```bash
docker compose up --build
```

- API: `http://localhost:3000`
- Health check: `GET http://localhost:3000/api/v1/health`
- Mongo data persists in the `mongo-data` volume; uploaded files in `uploads-data`.

The `app` service reads secrets from your shell environment or `.env` (docker compose interpolation), e.g.:

```bash
JWT_ACCESS_SECRET=... docker compose up --build
```

## Configuration

| Variable | Default | Description |
| --- | --- | --- |
| `NODE_ENV` | `development` | Runtime environment |
| `PORT` | `3000` | HTTP port |
| `API_PREFIX` | `/api/v1` | URL prefix for all routes |
| `LOG_LEVEL` | `info` | pino log level |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/cop` | MongoDB connection string |
| `JWT_ACCESS_SECRET` | `dev_access_secret` | **Required to change in production.** Signs access tokens; the app refuses to start in production with a known default |
| `JWT_ACCESS_EXPIRES_IN` | `15m` | Access-token lifetime (e.g. `15m`, `1h`) |
| `JWT_REFRESH_EXPIRES_DAYS` | `7` | Refresh-token lifetime in days (stored hashed) |
| `CORS_ORIGIN` | *(any origin)* | Comma-separated allowed origins; set in production (e.g. `https://app.example.com`) |
| `STORAGE_DRIVER` | `local` | Storage adapter (`local` for now) |
| `STORAGE_LOCAL_DIR` | `./uploads` | Directory for uploaded files (local driver) |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Global per-IP rate-limit window (15 min) |
| `RATE_LIMIT_MAX` | `100` | Max requests per window |

## API

All endpoints are prefixed with `/api/v1`. Requests (except `register`/`login`/`refresh`) require an `Authorization: Bearer <accessToken>` header. Endpoints marked 🔒 additionally require an org-scoped permission.

### API Documentation (OpenAPI)

A formal **OpenAPI 3.1** specification is maintained at [`docs/openapi.yaml`](docs/openapi.yaml) and served live by the app:

| Endpoint | Description |
| --- | --- |
| `GET /api/v1/docs` | The raw OpenAPI spec (YAML) — machine-readable, works with any OpenAPI tooling |
| `GET /api/v1/docs/ui` | Interactive Swagger UI (try requests directly in the browser) |

The spec documents every endpoint with request/response schemas, authentication requirements, and permission scopes. Keep it in sync whenever routes or validators change.

### Auth (`/auth`)

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/auth/register` | Create a user |
| `POST` | `/auth/login` | Login → access + refresh token |
| `POST` | `/auth/refresh` | Rotate a refresh token |
| `POST` | `/auth/logout` | Revoke a refresh token |
| `GET` | `/auth/me` | Current user profile |

### Organizations (`/organizations`)

| Method | Path | Permission | Description |
| --- | --- | --- | --- |
| `POST` | `/organizations` | — | Create organization (creator becomes admin) |
| `POST` | `/organizations/:id/members` | 🔒 `manage_members` | Add a member |
| `GET` | `/organizations/:id/members` | 🔒 `manage_members` | List members |
| `PATCH` | `/organizations/:id/members/:memberUserId` | 🔒 `manage_members` | Update role / disable |

### Users (`/users`)

| Method | Path | Permission | Description |
| --- | --- | --- | --- |
| `GET` | `/users/me` | — | Current user profile |
| `GET` | `/users/organizations/:orgId/members` | 🔒 `manage_members` | List org members |
| `PATCH` | `/users/organizations/:orgId/members/:userId` | 🔒 `manage_members` | Update role / disable |

### Projects (`/projects`)

| Method | Path | Permission | Description |
| --- | --- | --- | --- |
| `POST` | `/projects` | 🔒 `project.create` | Create project |
| `GET` | `/projects?organizationId=` | 🔒 `project.view` | List projects (filter by status/assignee/search) |
| `GET` | `/projects/:id` | 🔒 `project.view` | Project detail |
| `POST` | `/projects/:id/transition` | 🔒 `project.transition` | Transition status (state machine) |
| `POST` | `/projects/:id/assign` | 🔒 `project.assign` | Assign an editor |
| `POST` | `/projects/:id/approve` | 🔒 `project.approve` | Approve an exact version |
| `POST` | `/projects/:id/schedule` | 🔒 `project.schedule` | Schedule an approved project |
| `GET` | `/projects/:id/versions` | 🔒 `project.view` | List versions |
| `POST` | `/projects/:id/versions` | 🔒 `project.upload_version` | Add a version |
| `POST` | `/projects/:id/versions/:versionId/files` | 🔒 `project.upload_version` | Upload a file (multipart `file`) |
| `GET` | `/projects/:id/inputs` | 🔒 `project.view` | List inputs |
| `POST` | `/projects/:id/inputs` | 🔒 `project.transition` | Request an input |
| `PATCH` | `/projects/:id/inputs/:inputId` | 🔒 `project.transition` | Update input state |
| `GET` | `/projects/:id/comments` | 🔒 `project.view` | List comments |
| `POST` | `/projects/:id/comments` | 🔒 `project.comment` | Add a comment |
| `PATCH` | `/projects/:id/comments/:commentId` | 🔒 `project.comment` | Resolve a comment |
| `GET` | `/projects/:id/revisions` | 🔒 `project.view` | List revision requests |
| `POST` | `/projects/:id/revisions` | 🔒 `project.revision` | Request a revision |
| `PATCH` | `/projects/:id/revisions/:revisionId` | 🔒 `project.revision` | Update revision status |
| `GET` | `/projects/:id/publications` | 🔒 `project.view` | List publications |
| `POST` | `/projects/:id/publications` | 🔒 `project.publish` | Record a publication |
| `GET` | `/projects/:id/metrics` | 🔒 `project.view` | List performance metrics |
| `POST` | `/projects/:id/metrics` | 🔒 `project.metrics` | Record a metric |
| `GET` | `/projects/:id/activity` | 🔒 `project.view` | Activity history for the project |

### Tasks — kanban (`/projects/:id/tasks`)

| Method | Path | Permission | Description |
| --- | --- | --- | --- |
| `GET` | `/projects/:id/tasks?status=` | 🔒 `project.view` | List tasks (filter by kanban column) |
| `POST` | `/projects/:id/tasks` | 🔒 `task.create` | Create a task (title, priority, assignee, due date) |
| `GET` | `/projects/:id/tasks/:taskId` | 🔒 `project.view` | Task detail |
| `PATCH` | `/projects/:id/tasks/:taskId` | 🔒 `task.update` | Edit a task |
| `DELETE` | `/projects/:id/tasks/:taskId` | 🔒 `task.update` | Delete a task |
| `POST` | `/projects/:id/tasks/:taskId/status` | 🔒 `task.update` | Move between `todo → in_progress → in_review → done` (assignee & managers notified) |

### Brief (`/projects/:id/brief`)

| Method | Path | Permission | Description |
| --- | --- | --- | --- |
| `GET` | `/projects/:id/brief` | 🔒 `project.view` | Fetch the brief (`exists: false` if none yet) |
| `PUT` | `/projects/:id/brief` | 🔒 `brief.manage` | Create or update the structured brief (goal, audience, references, deliverables, deadline, brand files) |

### Reviews — summarize & lock (`/projects/:id/reviews`)

| Method | Path | Permission | Description |
| --- | --- | --- | --- |
| `POST` | `/projects/:id/reviews/summarize` | 🔒 `project.view` | Summarize unresolved feedback into action items (rule-based, AI-ready) |
| `POST` | `/projects/:id/reviews/lock` | 🔒 `project.revision` | Lock feedback into the next revision scope; auto-creates a revision request with `source: review_lock` and resolves the comments |

### Chat (`/projects/:id/channels`)

| Method | Path | Permission | Description |
| --- | --- | --- | --- |
| `GET` | `/projects/:id/channels` | 🔒 `project.view` | List channels |
| `POST` | `/projects/:id/channels` | 🔒 `chat.post` | Create a channel or DM |
| `GET` | `/projects/:id/channels/:channelId/messages?parentId=` | 🔒 `project.view` | List messages (thread filter via `parentId`; top-level excludes replies) |
| `POST` | `/projects/:id/channels/:channelId/messages` | 🔒 `chat.post` | Post a message or threaded reply |

### Contracts (`/organizations/:id/contracts`) — client agreements

| Method | Path | Permission | Description |
| --- | --- | --- | --- |
| `GET` | `/organizations/:id/contracts?status=` | 🔒 `contract.manage` | List contracts |
| `POST` | `/organizations/:id/contracts` | 🔒 `contract.manage` | Create a contract (draft) |
| `GET` | `/organizations/:id/contracts/:contractId` | 🔒 `contract.manage` | Contract detail |
| `PATCH` | `/organizations/:id/contracts/:contractId` | 🔒 `contract.manage` | Edit a draft only |
| `POST` | `/organizations/:id/contracts/:contractId/send` | 🔒 `contract.manage` | Send for signature (`draft → sent`) |
| `POST` | `/organizations/:id/contracts/:contractId/view` | 🔒 `contract.manage` | Mark viewed (`sent → viewed`) |
| `POST` | `/organizations/:id/contracts/:contractId/sign` | 🔒 `contract.manage` | Capture e-signature (`→ signed`, stores signer name/email) |

### Invoices (`/organizations/:id/invoices`) — billing

| Method | Path | Permission | Description |
| --- | --- | --- | --- |
| `GET` | `/organizations/:id/invoices/outstanding` | 🔒 `invoice.manage` | Outstanding revenue summary (lazy overdue refresh) |
| `GET` | `/organizations/:id/invoices?status=` | 🔒 `invoice.manage` | List invoices |
| `POST` | `/organizations/:id/invoices` | 🔒 `invoice.manage` | Create an invoice (draft) |
| `GET` | `/organizations/:id/invoices/:invoiceId` | 🔒 `invoice.manage` | Invoice detail |
| `PATCH` | `/organizations/:id/invoices/:invoiceId` | 🔒 `invoice.manage` | Edit a draft only |
| `POST` | `/organizations/:id/invoices/:invoiceId/send` | 🔒 `invoice.manage` | Send (`draft → sent`, net-30 default due date) |
| `POST` | `/organizations/:id/invoices/:invoiceId/pay` | 🔒 `invoice.manage` | Record payment (`→ paid`) |
| `POST` | `/organizations/:id/invoices/:invoiceId/void` | 🔒 `invoice.manage` | Void an unpaid invoice |

### Notifications (`/notifications`)

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/notifications` | List my notifications |
| `GET` | `/notifications/unread-count` | Unread count |
| `PATCH` | `/notifications/read-all` | Mark all read |
| `PATCH` | `/notifications/:id/read` | Mark one read |

### System

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/health` | Liveness check |

## Project lifecycle (state machine)

```
IDEA ──► APPROVED_CONCEPT ──► ASSIGNED ──► WAITING_FOR_INPUTS ──► INPUTS_READY ──► IN_PROGRESS
  │            │                 │                                              │
  └─ CANCELLED ┘                 └── CANCELLED ──────────────────────────────── ┘

IN_PROGRESS ──► FIRST_DRAFT_SUBMITTED ──► UNDER_REVIEW ──► REVISION_REQUESTED ──► REVISION_IN_PROGRESS
                    │                         │  ▲                                      │
                    └─────────────────────────┘  └──────────── REVISION_SUBMITTED ──────┘

APPROVED ──► SCHEDULED ──► PUBLISHED ──► CLOSED
CANCELLED ────────────────────────────► CLOSED
```

Auto-transitions: assigning a project in `IDEA`/`APPROVED_CONCEPT` → `ASSIGNED`; uploading a draft in `IN_PROGRESS` → `FIRST_DRAFT_SUBMITTED` (and `REVISION_IN_PROGRESS` → `REVISION_SUBMITTED`); receiving the last input → `INPUTS_READY`; approving a version → `APPROVED`.

## Roles & permissions

Default roles are seeded on organization creation:

| Role | Permissions |
| --- | --- |
| `admin` | `*` (all) |
| `editor` | create, transition, assign, upload_version, comment, revision, view, **task.create, task.update, brief.manage, chat.post, contract.manage, invoice.manage** |
| `reviewer` | view, comment, revision, approve, **task.create, task.update, chat.post** |
| `publisher` | view, schedule, publish, metrics |

Roles are shared by name across organizations and **upserted** on seed, so existing databases pick up new permissions on restart.

## Project layout

```
src/
  config/        env/config
  controllers/   HTTP handlers
  db/            mongoose connection
  events/        domain event bus + listeners (activity, notifications)
  middleware/    auth, validation, errors
  models/        mongoose models
  routes/        express routers
  seed/          default roles
  services/      business logic
  storage/       file storage adapter (local)
  utils/         tokens, logger
tests/           jest + supertest suites (in-memory MongoDB)
```

## Tests

6 suites cover: health, auth, org/authorization, project lifecycle, a full end-to-end workflow (assignment → inputs → draft → review → revision → approval → schedule → publish → metrics) including notifications and activity history, and the Fluit-aligned features (tasks, brief, review lock/summarize, chat, contracts, invoices). Tests run against `mongodb-memory-server` (no external DB needed).

## Feature coverage vs Fluit (fluit.io)

Fluit positions as a one-stop agency hub (Drive, Review, Brief, Tasks, Client CRM, Chats, Intelligence). This backend now covers the core loop — **onboard → contract → brief → tasks → review (lock) → approve → invoice** — with:

- ✅ **Tasks** — kanban columns, assignees, deadlines, auto-notifications
- ✅ **Brief** — structured creative brief (goal, audience, references, deliverables, deadlines, brand guidelines)
- ✅ **Review lock + summarize** — feedback locked into a revision scope + action-item summarization
- ✅ **Chat** — channels, threaded replies, attachments, notifications
- ✅ **Contracts** — draft → sent → viewed → signed lifecycle with captured signer identity
- ✅ **Invoices** — draft → sent → paid, overdue detection, outstanding-revenue query

**Deferred (needs third-party infra):** real AI/LLM summarization (rule-based placeholder, `generatedBy: 'rule-based-summarizer'`, designed to be swapped), timestamped video annotations/drawings/voice notes (needs a video player), anonymous client file-request links (needs an unauthenticated upload flow), third-party e-sign (DocuSign/HelloSign) and payment gateways (Stripe) — currently self-attested sign + manual payment status — and a client-facing portal with per-user login lockout.

## Status

MVP backend. See `Aaryajanani_Content_Operations_PRD_v1.pdf` for the product spec.
