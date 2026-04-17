# Project Structure Overview

## Directory Layout

```text
skykoi/
|-- backend/
|   |-- src/
|   |   |-- config/                   # AWS + Mongo config
|   |   |-- data/                     # Seed/default content
|   |   |-- models/                   # Mongoose schemas
|   |   |-- routes/                   # Auth, content, dashboard, leads
|   |   |-- services/                 # AWS, S3, Wishing Engine logic
|   |   |-- utils/                    # Auth helpers
|   |   |-- server.js                 # Express bootstrap
|   |   `-- seed.js                   # Seeder
|   |-- .env
|   |-- .env.example
|   |-- package.json
|   `-- package-lock.json
|-- frontend/
|   |-- public/                       # Static assets and mirrored media
|   |-- references/
|   |   `-- skykoi-live/              # Non-runtime captured UI/source files
|   |-- src/
|   |   |-- assets/
|   |   |-- components/
|   |   |   `-- dashboard/            # Native dashboard pages/components
|   |   |-- mirror/                   # Mirrored docs/marketing/dashboard HTML
|   |   |-- vendor/                   # Imported live CSS bundles
|   |   |-- App.jsx
|   |   |-- api.js
|   |   |-- index.css
|   |   `-- main.jsx
|   |-- .env
|   |-- .env.example
|   |-- package.json
|   `-- package-lock.json
|-- package.json                      # Optional root convenience scripts
|-- package-lock.json
|-- README.md
`-- PROJECT_STRUCTURE.md
```

## Scripts

### Root Convenience Scripts

```bash
npm run dev
npm run dev:frontend
npm run dev:backend
npm run build
npm run start
```

### Backend

```bash
cd backend
npm run dev
npm run start
npm run seed
```

### Frontend

```bash
cd frontend
npm run dev
npm run build
npm run preview
npm run lint
```

## Environment Files

### Backend

`backend/.env` stores runtime config such as:

```text
PORT=5000
MONGO_URI=...
CLIENT_URL=http://localhost:5173
AUTH_TOKEN_SECRET=...
```

### Frontend

`frontend/.env` stores:

```text
VITE_API_BASE_URL=http://localhost:5000/api
```

## API Surface

- `GET /api/health`
- `GET /api/content/home`
- `PUT /api/content/home`
- `POST /api/leads`
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`

## Notes

- Deployable runtime code lives in `backend/` and `frontend/`.
- UI/source capture files now live under `frontend/references/` instead of the repo root.
- The root folder is just a thin wrapper for local orchestration and top-level docs.
