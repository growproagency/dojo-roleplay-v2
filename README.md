# Project Template

Production-ready starter for React + Node.js + Supabase + Render.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite |
| Server state | TanStack Query v5 |
| Client state | Zustand |
| Backend | Node.js, Express |
| Database & Auth | Supabase (PostgreSQL) |
| Deployment | Render |

## Quick start

### 1. Backend

```bash
cd backend
cp .env.example .env.local   # fill in your Supabase credentials
npm install
npm run dev                  # starts on localhost:3001
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env.local   # fill in your Supabase credentials
npm install
npm run dev                  # starts on localhost:5173
```

Vite proxies `/api/*` to `localhost:3001` in development — no CORS config needed locally.

---

## Project structure

```
backend/src/
├── config/env.js                  # validates env vars at startup
├── db/
│   ├── supabase.js                # single Supabase client (service role)
│   └── example.queries.js         # raw DB calls — no business logic
├── services/example.service.js    # business logic — no HTTP knowledge
├── controllers/example.controller.js  # req → service → res
├── routes/example.routes.js       # URL + method → middleware + controller
├── middleware/
│   ├── auth.middleware.js          # verifies Supabase token → req.user
│   ├── validate.middleware.js      # Joi body validation
│   ├── requestLogger.middleware.js # structured request logging
│   └── error.middleware.js         # global error handler (last middleware)
├── schemas/example.schema.js      # Joi validation schemas
├── utils/
│   ├── logger.js                   # pino structured logger
│   └── asyncHandler.js             # eliminates try/catch in controllers
└── server.js                       # entry point — wires everything together

frontend/src/
├── lib/supabase.js                 # Supabase client (anon key)
├── context/AuthProvider.jsx        # syncs Supabase session → Zustand
├── store/
│   ├── auth.store.js               # user, token, session
│   └── ui.store.js                 # toasts, sidebar
├── hooks/
│   ├── useAuth.js                  # signIn, signOut, signUp
│   └── useExample.js               # TanStack Query hooks
├── api/
│   ├── client.js                   # base fetch wrapper with auth headers
│   └── example.api.js              # fetch calls for one resource
├── components/ProtectedRoute.jsx   # redirects unauthenticated users
├── pages/LoginPage.jsx             # example auth page
└── main.jsx                        # providers + router setup
```

---

## Adding a new resource (e.g. posts)

1. **DB**: `db/posts.queries.js` — copy `example.queries.js`, change table name
2. **Service**: `services/posts.service.js` — copy `example.service.js`, add your rules
3. **Controller**: `controllers/posts.controller.js` — copy `example.controller.js`
4. **Schema**: `schemas/post.schema.js` — define your Joi shapes
5. **Route**: `routes/posts.routes.js` — copy `example.routes.js`, update imports
6. **Mount**: Add `app.use('/api/posts', postsRoutes)` in `server.js`
7. **Frontend API**: `api/posts.api.js` — copy `example.api.js`, update paths
8. **Frontend hooks**: `hooks/usePosts.js` — copy `useExample.js`, update keys

---

## Deployment on Render

### Backend (Web Service)
- Build: `npm install`
- Start: `node src/server.js`
- Health check path: `/health`
- Env vars: `NODE_ENV`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `ALLOWED_ORIGINS`

### Frontend (Static Site)
- Build: `npm install && npm run build`
- Publish dir: `dist`
- Env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`

---

## Environment variables

| Variable | Where | Description |
|----------|-------|-------------|
| `SUPABASE_URL` | Backend | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Backend | Service role key — full DB access, never expose to frontend |
| `ALLOWED_ORIGINS` | Backend | Comma-separated list of allowed CORS origins |
| `VITE_SUPABASE_URL` | Frontend | Same Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Frontend | Anon key — safe to expose, RLS protects data |
| `VITE_API_URL` | Frontend | Your backend URL (e.g. `https://api.yourapp.com`) |
