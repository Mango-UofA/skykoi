# Frontend

This is the React + Vite client for the SkyKoi clone.

## Includes

- marketing pages
- docs mirror
- auth screens
- native dashboard pages
- local reference captures in `frontend/references/`

## Commands

```bash
npm install
npm run dev
npm run build
```

## Runtime Config

Use `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## Production

Build with:

```bash
npm run build
```

Then serve `dist/` from Nginx, Caddy, or another static web server on your EC2 instance.
