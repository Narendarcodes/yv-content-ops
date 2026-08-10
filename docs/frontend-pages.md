# Frontend Pages — Design & Build List

Backend API is complete and verified (52 OpenAPI paths, all endpoints load/security tested).
This is the page inventory to design and build, mapped 1:1 to the API.

## Role / permission model (visibility gating)

| Role | Can do |
|---|---|
| **admin** | Everything (`*`) incl. manage members |
| **editor** | project create/transition/assign/upload/comment/revision/view, tasks, brief, chat, contracts, invoices |
| **reviewer** | view, comment, revision, approve, tasks (create/update), chat |
| **publisher** | view, schedule, publish, metrics |

Visibility column below uses these. Suggested stack: **React + Vite + TanStack Query + Tailwind** (shadcn/ui optional).

---

## 1. Auth & app shell

| # | Page | Route | Purpose | Key API | Visibility | Pri |
|---|---|---|---|---|---|---|
| 1 | **Login** | `/login` | Sign in, store tokens | `POST /auth/login`, `/auth/refresh` | Public | P0 |
| 2 | **Register** | `/register` | Create account | `POST /auth/register` | Public | P0 |
| 3 | **App Shell / Layout** | layout wrapper | Sidebar nav, topbar, **org switcher** (`GET /users/me/organizations`), notification bell (`GET /notifications/unread-count`), user menu (`GET /users/me`) | all of the above | Authenticated | P0 |
| 4 | **Notification Center** | `/notifications` | List, mark read/all read | `GET /notifications`, `PATCH /:id/read`, `PATCH /read-all` | Authenticated | P2 |

## 2. Organizations & people (admin)

| # | Page | Route | Purpose | Key API | Visibility | Pri |
|---|---|---|---|---|---|---|
| 5 | **Create Organization** | `/orgs/new` | Onboarding: name + slug → first org + admin membership | `POST /organizations` | Authenticated | P0 |
| 6 | **Members & Roles** | `/orgs/:orgId/settings/members` | Invite by email, list members, change roles, disable | `GET/POST /organizations/:orgId/members`, `PATCH .../members/:userId` | admin (`manage_members`) | P1 |

## 3. Projects (core)

| # | Page | Route | Purpose | Key API | Visibility | Pri |
|---|---|---|---|---|---|---|
| 7 | **Project List** | `/orgs/:orgId/projects` | Table/cards with status filter, search, pagination | `GET /projects?organizationId=&status=&search=&limit=&skip=` | project.view (all roles) | P0 |
| 8 | **Create Project** | modal on list | New project (title, description, org) | `POST /projects` | editor, admin | P0 |
| 9 | **Project Detail — Overview** | `/orgs/:orgId/projects/:id` | Header w/ status badge + state timeline; assignee; action buttons (assign → transition → approve → schedule) that appear per permission | `GET /projects/:id`, `POST /transition`, `/assign`, `/approve`, `/schedule` | project.view | P0 |
| 10 | **Versions tab** | `?tab=versions` | Upload file + change summary, list versions, approve a version | `GET/POST /versions`, `POST /versions/:vid/files` | view all / upload: editor, admin / approve: reviewer, admin | P0 |
| 11 | **Inputs tab** | `?tab=inputs` | Collect creative inputs, mark received | `GET/POST /inputs`, `PATCH /inputs/:iid` | view all / write: editor, admin | P1 |
| 12 | **Comments & Review tab** | `?tab=review` | Threaded feedback on a version, resolve comments, request revisions, **summarize** + **lock** review scope | `GET/POST /comments`, `PATCH /comments/:cid`, `GET/POST /revisions`, `POST /reviews/summarize`, `POST /reviews/lock` | view all / write: editor, reviewer, admin | P0 |
| 13 | **Activity Feed tab** | `?tab=activity` | Chronological event log of the project | `GET /activity` | project.view | P2 |
| 14 | **Publications tab** | `?tab=publications` | Record + list publications | `GET/POST /publications` | view all / write: publisher, admin | P1 |
| 15 | **Metrics tab** | `?tab=metrics` | Record + list performance metrics | `GET/POST /metrics` | view all / write: publisher, admin | P2 |

## 4. Fluit features (v2)

| # | Page | Route | Purpose | Key API | Visibility | Pri |
|---|---|---|---|---|---|---|
| 16 | **Tasks Kanban** | `?tab=tasks` or `/tasks` | 4-column board (todo → in_progress → in_review → done), drag to change status, create/edit/delete, priority + assignee | tasks CRUD + `POST /tasks/:tid/status` | view all / write: editor, reviewer, admin | P0 |
| 17 | **Brief Editor** | `?tab=brief` | Structured creative brief (goal, audience, references, deliverables, deadline) | `GET/PUT /brief` | view all / write: editor, admin | P0 |
| 18 | **Chat** | `?tab=chat` | Channels list + message thread (topic channels, threaded replies) | `GET/POST /channels`, `GET/POST /channels/:cid/messages` | view all / post: editor, reviewer, admin | P1 |
| 19 | **Contracts** | `/orgs/:orgId/contracts` | List w/ status filter, create/edit draft, **send → view → sign** (e-sign modal captures name + email) | contracts CRUD + `/send`, `/view`, `/sign` | admin, editor (`contract.manage`) | P1 |
| 20 | **Contract Detail** | `/orgs/:orgId/contracts/:id` | Full terms, status stepper, signature capture, signer info | `GET /contracts/:id`, `/send`, `/view`, `/sign` | contract.manage | P1 |
| 21 | **Invoices** | `/orgs/:orgId/invoices` | List w/ status filter (draft/sent/paid/overdue/void), **outstanding revenue card** | `GET /invoices`, `GET /invoices/outstanding` | admin, editor (`invoice.manage`) | P1 |
| 22 | **Invoice Detail** | `/orgs/:orgId/invoices/:id` | Amounts, payment history, actions: send / record payment / void | `GET /invoices/:id`, `/send`, `/pay`, `/void` | invoice.manage | P1 |

## 5. User

| # | Page | Route | Purpose | Key API | Visibility | Pri |
|---|---|---|---|---|---|---|
| 23 | **Profile** | `/profile` | View + edit name/email | `GET /users/me`, `PATCH /users/me` | Authenticated | P1 |

---

## Build order (vertical slices)

1. **P0 core**: Login/Register (1,2) → App Shell + org switcher (3) → Create Org (5) → Project List (7) → Project Detail Overview + Versions (9,10)
2. **P0 work**: Tasks Kanban (16), Comments & Review (12), Brief (17)
3. **P1**: Chat (18), Contracts (19,20), Invoices (21,22), Members (6), Profile (23), Inputs (11), Publications (14)
4. **P2 polish**: Notifications (4), Activity (13), Metrics (15)

## Notes / backend facts to design around

- **State machine**: CONCEPT → ASSIGNED → WAITING_FOR_INPUTS → IN_PROGRESS → IN_REVIEW → APPROVED → SCHEDULED → PUBLISHED. Buttons should be driven by the current state + permission, not hard-coded.
- **Org switcher** is now backed by `GET /users/me/organizations` (added in commit 635d4af).
- **Profile edit** is backed by `PATCH /users/me` (same commit).
- All responses are `{ data: ... }`; errors are `{ error: { code, message, details? } }` — build one shared API client + error-toast helper.
- Every page below needs a loading skeleton and an auth guard (redirect to `/login` on 401).
- Rate limit is 100 req / 15 min per IP by default — debounce the notification unread-count poll.

---

## Stitch designs (2026-08-10)

All 23 pages above have been designed in **Google Stitch** using the Aaryajanani design system (driven by the `stitch-design-taste`, `design-taste-frontend`, `impeccable`, and `emil-design-eng` skills).

- **Stitch project**: `projects/6921599624910875253` — "Aaryajanani — Content Operations & Project Memory Platform"
- **Design system**: `assets/5404831274793666282` — Aaryajanani Design System (LIGHT, deep-teal accent `#0F766E`, Outfit headlines / Geist body / JetBrains Mono labels, ROUND_EIGHT)
- **Device type**: DESKTOP
- Machine-readable screen map: `.stitch/metadata.json`

Screen ID map (id → page from the table above):

| Page | Screen ID |
|---|---|
| Login (1) | `c610d3c34c7d4b2f83a54df53a03e28e` |
| Register (2) | `c491c180b23c4bdfaf2dbbdcbeac55a3` |
| App Shell (3) | `7713bfd1014d46a1b0880a76746fba98` |
| Notification Center (4) | `713cc404478d4019a9f3b92d1067340a` |
| Create Organization (5) | `9516e1a92940420a88468b685540be44` |
| Members & Roles (6) | `9d1050d0a2f54906844bcd8adcfd5aa6` |
| Project List (7) | `84265cb0c8024c079f5ce9187fcce131` |
| Create Project modal (8) | `0f228974935946a39ff372fc492169e1` |
| Project Detail Overview (9) | `b760ed8921bc4525b1e01b7424dee46e` |
| Versions tab (10) | `84aa845fcc334f348b2d1a96ba0fa18d` |
| Inputs tab (11) | `2e73af30afc8400d8ec56fb1796902e1` |
| Comments & Review tab (12) | `368ebd8e91044d00a17466246b2b3a7b` |
| Activity Feed tab (13) | `bad886b72a274ba193d849d0846be92a` |
| Publications tab (14) | `bccef7f0215b4f5ea8d49e39c85f0df3` |
| Metrics tab (15) | `599059b15a7c437a9f2497a1b2593b0d` |
| Tasks Kanban (16) | `3e90fd42ae974e2bbe59db6957b3b67a` |
| Brief Editor (17) | `a29fd6a29ea8433184ef30918dd4ce55` |
| Chat (18) | `11e9fa6bc5074a5e941fdbfac277d407` |
| Contracts (19) | `4ae242387e444a0a8003778a6886cf01` |
| Contract Detail (20) | `35a5bb24b78547c48f2a8126a03abfbf` |
| Invoices (21) | `33da852622c74e2bb7b396b500075c46` |
| Invoice Detail (22) | `2722831a8fbc4390b6e5d66b66d12cef` |
| Profile (23) | `07b40c5d7e354588b96f8bb53ab49f0c` |

Plus a generated logo asset: `147f653db54e4dfb8b9b23d969b25524`.
