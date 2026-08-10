# Content Operations & Project Memory Platform — Backend

This repository contains the backend for the Content Operations & Project Memory Platform (Aaryajanani pilot).

Purpose: implement the Node.js + Express + MongoDB backend for the MVP.

Quickstart (development)

1. Start a MongoDB instance (Docker compose):

```bash
docker compose up -d mongo
```

2. Install dependencies:

```bash
npm install
```

3. Run the server in development mode:

```bash
npm run dev
```

4. Run tests:

```bash
npm test
```

Notes:
- Environment variables are read from `.env`.
- API prefix defaults to `/api/v1`.
- Health endpoint: `GET /api/v1/health`.

Roadmap: Epics and development plan are in `/memories/session/backend-plan.md`.
