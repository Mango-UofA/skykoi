# SkyKoi Clone

This repo is now structured so the actual application lives in just two places:

- `frontend/` for the React + Vite client
- `backend/` for the Node + Express + Mongo API

The root folder is only a thin workspace wrapper for local development and deployment coordination.

## Layout

```text
skykoi/
|-- backend/                        # API, models, services, env, package.json
|-- frontend/                       # React app, assets, mirrored references, env, package.json
|   `-- references/skykoi-live/    # Non-runtime UI/source captures used during cloning
|-- package.json                    # Optional root convenience scripts
|-- package-lock.json
|-- README.md
`-- PROJECT_STRUCTURE.md
```

## Run Locally

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

## EC2 Deployment Notes

For deployment, you can treat the app as two services:

1. `backend/`
   Run the Express server with its own env file.
2. `frontend/`
   Build the Vite app and serve the generated `dist/` behind Nginx or another static server.

Typical production flow:

```bash
cd backend
npm install
npm run start
```

```bash
cd frontend
npm install
npm run build
```

## Environment Files

- `backend/.env`
- `frontend/.env`

Safe templates:

- `backend/.env.example`
- `frontend/.env.example`

## Notes

- Runtime app code is inside `frontend/` and `backend/`.
- SkyKoi snapshot/reference files were moved under `frontend/references/`.
- The root package is optional convenience glue; your deployable app remains the frontend/backend pair.
