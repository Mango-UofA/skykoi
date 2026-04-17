# SkyKoi

A full-stack SkyKoi-inspired demo platform built with:

- `React + Vite` on the frontend
- `Node.js + Express + MongoDB` on the backend
- `AWS Bedrock` for AI wish generation
- `Nginx + PM2 + EC2` for production hosting

This repository is organized as a two-app workspace:

- `frontend/` contains the client application
- `backend/` contains the API, auth, dashboard state, and AI orchestration layer

The project started as a visual clone and was expanded into a functional demo, including:

- marketing pages
- docs mirror
- auth flow
- dashboard UI
- Wishing Engine
- AWS/Bedrock integration
- GitHub Actions deployment to EC2

## High-Level Architecture

```text
Browser
  |
  |  HTTP/HTTPS
  v
Nginx (EC2)
  |-- serves Vite build from frontend/dist
  |-- proxies /api/* -> localhost:5000
  v
Express API (PM2)
  |-- auth routes
  |-- content routes
  |-- dashboard routes
  |-- wishing engine orchestration
  v
MongoDB Atlas
  |-- users
  |-- workspace state
  |-- runs
  |-- messages
  |-- artifacts

Express API
  |
  |  Bedrock Converse
  v
AWS Bedrock
  |-- amazon.nova-micro-v1:0
  |-- fallback candidate models
```

## Repository Layout

```text
skykoi/
|-- backend/
|   |-- src/
|   |   |-- config/                   # MongoDB and AWS config
|   |   |-- data/                     # seed/default content
|   |   |-- models/                   # Mongoose schemas
|   |   |-- routes/                   # API route handlers
|   |   |-- services/                 # AWS, S3, Bedrock, wish logic
|   |   |-- utils/                    # auth/token helpers
|   |   |-- server.js                 # Express bootstrap
|   |   `-- seed.js
|   |-- ecosystem.config.cjs          # PM2 process config
|   |-- .env.example
|   |-- package.json
|   `-- package-lock.json
|-- frontend/
|   |-- public/                       # static assets
|   |-- references/                   # captured SkyKoi source/reference files
|   |   `-- skykoi-live/
|   |-- src/
|   |   |-- assets/
|   |   |-- components/
|   |   |   `-- dashboard/            # native dashboard components/pages
|   |   |-- mirror/                   # mirrored docs/marketing/dashboard HTML
|   |   |-- vendor/                   # imported CSS bundles
|   |   |-- api.js                    # frontend API client
|   |   |-- App.jsx                   # route map
|   |   |-- index.css                 # global UI styling
|   |   `-- main.jsx
|   |-- .env.example
|   |-- .env.production               # production frontend API base path
|   |-- package.json
|   `-- package-lock.json
|-- deploy/
|   |-- nginx/
|   |   `-- skykoi.conf               # nginx site config
|   `-- scripts/
|       |-- bootstrap-ec2.sh          # base EC2 provisioning
|       `-- deploy.sh                 # app deploy script
|-- .github/
|   `-- workflows/
|       `-- deploy-ec2.yml            # GitHub Actions EC2 deploy pipeline
|-- package.json                      # convenience workspace scripts
|-- package-lock.json
|-- PROJECT_STRUCTURE.md
`-- README.md
```

## Frontend Architecture

The frontend is a React SPA built with Vite and React Router.

### Main responsibilities

- render public marketing pages
- render mirrored docs pages
- render auth screens
- render dashboard pages
- call backend APIs
- maintain logged-in token state in local storage

### Important frontend files

- [frontend/src/App.jsx](/c:/projects/skykoi/frontend/src/App.jsx:1)
  - central route table
  - mixes mirrored pages and native dashboard pages

- [frontend/src/api.js](/c:/projects/skykoi/frontend/src/api.js:1)
  - Axios client
  - auth/dashboard/content request helpers

- [frontend/src/index.css](/c:/projects/skykoi/frontend/src/index.css:1)
  - global styles
  - marketing page overrides
  - auth styles
  - dashboard layout and Wishing Engine styles

- [frontend/src/components/dashboard](/c:/projects/skykoi/frontend/src/components/dashboard:1)
  - native dashboard implementation

### Production frontend config

The production frontend uses:

```env
VITE_API_BASE_URL=/api
```

This works because Nginx serves the SPA and reverse-proxies `/api` to the backend.

## Backend Architecture

The backend is an Express API using MongoDB Atlas for persistence.

### Entry point

- [backend/src/server.js](/c:/projects/skykoi/backend/src/server.js:1)

Responsibilities:

- load env vars
- connect to MongoDB
- configure CORS and JSON middleware
- mount route modules
- expose `/api/health`

### Route modules

- [backend/src/routes/authRoutes.js](/c:/projects/skykoi/backend/src/routes/authRoutes.js:1)
  - signup
  - login
  - current user lookup

- [backend/src/routes/contentRoutes.js](/c:/projects/skykoi/backend/src/routes/contentRoutes.js:1)
  - homepage content fetch/update

- [backend/src/routes/leadRoutes.js](/c:/projects/skykoi/backend/src/routes/leadRoutes.js:1)
  - lead capture

- [backend/src/routes/dashboardRoutes.js](/c:/projects/skykoi/backend/src/routes/dashboardRoutes.js:1)
  - overview
  - chat
  - artifacts
  - settings
  - billing
  - connect
  - team
  - wish-run lifecycle

### Models

- [backend/src/models/User.js](/c:/projects/skykoi/backend/src/models/User.js:1)
  - app users

- [backend/src/models/Workspace.js](/c:/projects/skykoi/backend/src/models/Workspace.js:1)
  - dashboard and Wishing Engine state
  - messages
  - runs
  - artifacts
  - usage counters
  - settings

- [backend/src/models/SiteContent.js](/c:/projects/skykoi/backend/src/models/SiteContent.js:1)
  - editable content storage

- [backend/src/models/Lead.js](/c:/projects/skykoi/backend/src/models/Lead.js:1)
  - lead submissions

### Auth model

Auth is custom, not Clerk-backed.

The backend stores users in MongoDB and uses signed auth tokens.

Core auth helper:

- [backend/src/utils/auth.js](/c:/projects/skykoi/backend/src/utils/auth.js:1)

Capabilities:

- password hashing
- token creation
- token verification

## Wishing Engine Architecture

The Wishing Engine is the core interactive product surface.

### Request flow

1. user sends a message from `/dashboard/chat`
2. frontend POSTs to `/api/dashboard/chat/messages`
3. backend creates a new run in the workspace
4. backend marks the run `queued`
5. async run processing begins
6. Bedrock response is requested
7. reply is stored in messages
8. artifacts are generated and stored
9. run status becomes `completed` or `failed`
10. frontend polls `/api/dashboard/chat` until the run is finished

### Backend logic

Main orchestration lives in:

- [backend/src/routes/dashboardRoutes.js](/c:/projects/skykoi/backend/src/routes/dashboardRoutes.js:1)
- [backend/src/services/wishService.js](/c:/projects/skykoi/backend/src/services/wishService.js:1)

### Wishing Engine data model

Each run stores:

- `title`
- `prompt`
- `status`
- `provider`
- `summary`
- `progress`
- `steps`
- `logs`
- `createdAt`

Each artifact stores:

- `title`
- `type`
- `language`
- `content`
- `preview`
- `storage.provider`
- `storage.bucket`
- `storage.key`
- `storage.url`

### Bedrock integration

The backend supports two Bedrock auth modes:

1. `BEDROCK_API_KEY`
2. standard AWS access keys

Current model strategy:

- primary configured model from `AWS_BEDROCK_MODEL_ID`
- fallback candidates:
  - `amazon.nova-micro-v1:0`
  - `amazon.nova-lite-v1:0`
  - `meta.llama3-8b-instruct-v1:0`

The Bedrock service logic:

- prefers direct HTTP `Converse` with bearer token when `BEDROCK_API_KEY` is set
- uses AWS SDK `ConverseCommand` otherwise
- falls back to a local demo planner if Bedrock is unavailable

### Important Wishing Engine implementation details

- conversation history is trimmed to ensure the first Bedrock message is from the user
- the run state is persisted in MongoDB
- artifacts can be local-only or S3-backed
- UI shows:
  - messages
  - run timeline
  - outputs
  - preview/download actions

## AWS Integration

AWS integration is split into several layers:

### Account/status layer

- [backend/src/services/awsService.js](/c:/projects/skykoi/backend/src/services/awsService.js:1)

Purpose:

- validate AWS account connectivity
- fetch caller identity from STS
- expose region/account metadata to dashboard pages

### Bedrock layer

- [backend/src/services/wishService.js](/c:/projects/skykoi/backend/src/services/wishService.js:1)

Purpose:

- run `Converse` against Bedrock
- handle provider/model fallback
- generate AI replies

### S3 artifact layer

- [backend/src/services/s3Service.js](/c:/projects/skykoi/backend/src/services/s3Service.js:1)

Purpose:

- optional upload target for generated artifacts
- if no bucket is configured, artifacts stay stored in MongoDB

### Config layer

- [backend/src/config/aws.js](/c:/projects/skykoi/backend/src/config/aws.js:1)

Supported env values:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `AWS_BEDROCK_MODEL_ID`
- `BEDROCK_API_KEY`
- `AWS_S3_BUCKET`

## MongoDB / Persistence

MongoDB Atlas is the system of record for:

- users
- workspace state
- run history
- messages
- artifacts
- settings
- usage counters

The backend currently treats MongoDB connectivity as required for auth and dashboard persistence.

If MongoDB is unavailable:

- health can still respond
- auth and dashboard endpoints return availability errors

This is why Atlas network access must include the EC2 public IP or a wider allowlist.

## Runtime and Deployment Architecture

Production runtime is currently hosted on a single EC2 instance.

### Production stack

- `Ubuntu 24.04 LTS`
- `Node.js 22`
- `PM2`
- `Nginx`
- `MongoDB Atlas`
- `AWS Bedrock`

### Live hosting model

```text
Internet
  |
  v
Nginx :80
  |-- serves frontend/dist
  |-- proxies /api to localhost:5000
  v
PM2-managed Node process
  |
  v
Express backend
```

### PM2

PM2 config:

- [backend/ecosystem.config.cjs](/c:/projects/skykoi/backend/ecosystem.config.cjs:1)

App name:

- `skykoi-api`

### Nginx

Nginx config:

- [deploy/nginx/skykoi.conf](/c:/projects/skykoi/deploy/nginx/skykoi.conf:1)

Responsibilities:

- serve SPA static files
- reverse proxy API traffic
- fallback unknown client routes to `index.html`

## CI/CD Architecture

GitHub Actions deploys the app to EC2 on push to `main`.

Workflow:

- [.github/workflows/deploy-ec2.yml](/c:/projects/skykoi/.github/workflows/deploy-ec2.yml:1)

### Deployment flow

1. push to `main`
2. GitHub Actions starts
3. SSH into EC2 using repository secret key
4. fetch/reset repo to latest `origin/main`
5. write production env files
6. install backend dependencies
7. install frontend dependencies
8. build frontend
9. reload PM2 app
10. validate/reload Nginx

### Deploy scripts

- [deploy/scripts/bootstrap-ec2.sh](/c:/projects/skykoi/deploy/scripts/bootstrap-ec2.sh:1)
  - one-time server provisioning

- [deploy/scripts/deploy.sh](/c:/projects/skykoi/deploy/scripts/deploy.sh:1)
  - repeatable deployment execution

### GitHub secrets used

- `EC2_HOST`
- `EC2_USER`
- `EC2_SSH_KEY`
- `APP_DIR`
- `BACKEND_ENV_B64`
- `FRONTEND_ENV_PRODUCTION_B64`

The workflow now uses base64-encoded env secrets to avoid multiline shell corruption during remote deploys.

## Environment Configuration

### Backend

Example keys:

```env
PORT=5000
MONGO_URI=mongodb+srv://...
CLIENT_URL=http://localhost:5173
AUTH_TOKEN_SECRET=...

AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_BEDROCK_MODEL_ID=amazon.nova-micro-v1:0
BEDROCK_API_KEY=...
AWS_S3_BUCKET=
```

### Frontend

Development:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Production:

```env
VITE_API_BASE_URL=/api
```

## API Surface

### Health

- `GET /api/health`

### Auth

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Content

- `GET /api/content/home`
- `PUT /api/content/home`

### Leads

- `POST /api/leads`

### Dashboard

- `GET /api/dashboard/overview`
- `GET /api/dashboard/chat`
- `POST /api/dashboard/chat/messages`
- `POST /api/dashboard/chat/reset`
- `GET /api/dashboard/chat/artifacts/:artifactId`
- `GET /api/dashboard/settings`
- `PATCH /api/dashboard/settings`
- `GET /api/dashboard/connect`
- `GET /api/dashboard/team`
- `GET /api/dashboard/billing`

## Current Tradeoffs / Limitations

This is a functional demo system, not a full isolated-agent platform.

Current constraints:

- no per-user dedicated compute runtime
- no container or VM isolation per wish
- Wishing Engine runs inside app orchestration, not separate worker infrastructure
- S3 storage is optional, not mandatory
- many public pages still rely on mirrored source captures for visual fidelity
- some dashboard surfaces are demo-mode simulations rather than production-grade systems

## Local Development

### Install

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
```

### Run both apps

```bash
npm run dev
```

### Run backend only

```bash
cd backend
npm run dev
```

### Run frontend only

```bash
cd frontend
npm run dev
```

### Build frontend

```bash
cd frontend
npm run build
```

## Production Notes

- frontend is served statically from `frontend/dist`
- backend runs behind PM2
- Nginx proxies `/api`
- MongoDB Atlas must allow the EC2 IP
- Bedrock access depends on configured model permissions

## Recommended Next Improvements

- add HTTPS with a domain and Let's Encrypt
- move secrets to AWS SSM Parameter Store or Secrets Manager
- rotate exposed MongoDB/AWS/Bedrock credentials
- add code splitting to reduce frontend bundle size
- split Wishing Engine into background workers for long-running jobs
- add structured markdown rendering and syntax highlighting for outputs

## Quick Links

- [PROJECT_STRUCTURE.md](/c:/projects/skykoi/PROJECT_STRUCTURE.md:1)
- [backend/src/server.js](/c:/projects/skykoi/backend/src/server.js:1)
- [backend/src/routes/dashboardRoutes.js](/c:/projects/skykoi/backend/src/routes/dashboardRoutes.js:1)
- [backend/src/services/wishService.js](/c:/projects/skykoi/backend/src/services/wishService.js:1)
- [deploy/scripts/deploy.sh](/c:/projects/skykoi/deploy/scripts/deploy.sh:1)
- [.github/workflows/deploy-ec2.yml](/c:/projects/skykoi/.github/workflows/deploy-ec2.yml:1)
