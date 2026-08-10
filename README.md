# Content Operations & Project Memory Platform — Backend

Node.js + Express + MongoDB (Mongoose) backend for the **Aaryajanani** Content Operations & Project Memory Platform.

Implements the MVP per the PRD: JWT auth, org-scoped roles & permissions, a project lifecycle state machine, versioning, inputs, comments, revisions, approvals, notifications, activity history, scheduling/publication, performance metrics, file uploads, Docker, and CI.

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
| `JWT_ACCESS_SECRET` | `dev_access_secret` | **Change in production.** Signs access tokens |
| `JWT_ACCESS_EXPIRES_IN` | `15m` | Access-token lifetime (e.g. `15m`, `1h`) |
| `JWT_REFRESH_EXPIRES_DAYS` | `7` | Refresh-token lifetime in days (stored hashed) |
| `STORAGE_DRIVER` | `local` | Storage adapter (`local` for now) |
| `STORAGE_LOCAL_DIR` | `./uploads` | Directory for uploaded files (local driver) |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Global per-IP rate-limit window (15 min) |
| `RATE_LIMIT_MAX` | `100` | Max requests per window |

## API

All endpoints are prefixed with `/api/v1`. Requests (except `register`/`login`/`refresh`) require an `Authorization: Bearer <accessToken>` header. Endpoints marked 🔒 additionally require an org-scoped permission.

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
| `PATCH` | `/organizations/:id/members/:userId` | 🔒 `manage_members` | Update role / disable |

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
| `editor` | create, transition, assign, upload_version, comment, revision, view |
| `reviewer` | view, comment, revision, approve |
| `publisher` | view, schedule, publish, metrics |

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

5 suites cover: health, auth, org/authorization, project lifecycle, and a full end-to-end workflow (assignment → inputs → draft → review → revision → approval → schedule → publish → metrics) including notifications and activity history. Tests run against `mongodb-memory-server` (no external DB needed).

## Status

MVP backend. See `Aaryajanani_Content_Operations_PRD_v1.pdf` for the product spec.
