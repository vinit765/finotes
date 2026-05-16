# Finotes

Finotes is a notes app built for the internship backend assignment in [Intern Engg Assignment.pdf](C:\Users\VINIT\Downloads\Intern Engg Assignment.pdf).

It includes:

- `FastAPI` backend with the required REST APIs
- `JWT` authentication with custom `POST /register` and `POST /login`
- Notes CRUD
- Note sharing via `POST /notes/{id}/share`
- Public `GET /about` and `GET /openapi.json`
- A basic React frontend to exercise the API
- One meaningful custom feature: note version history with restore

## Assignment Alignment

The backend follows the required contract from the PDF:

- `POST /register`
- `POST /login`
- `GET /notes`
- `GET /notes/{id}`
- `POST /notes`
- `PUT /notes/{id}`
- `DELETE /notes/{id}`
- `POST /notes/{id}/share`
- `GET /openapi.json`
- `GET /about`

Extra feature implemented:

- `GET /notes/{id}/history`
- `POST /notes/{id}/restore/{version_id}`

## Stack

- Backend: `FastAPI`, `SQLAlchemy`, `PyJWT`
- Frontend: `React`, `Vite`, `TypeScript`
- Local database: `SQLite` by default
- Production database: any SQL database supported by `SQLAlchemy` through `DATABASE_URL`

## Repo Layout

```text
backend/   API, models, schemas, tests
frontend/  Simple client for auth and notes flows
render.yaml
README.md
```

## Database Setup

Local development works out of the box with SQLite:

```env
DATABASE_URL=sqlite:///./notes.db
```

If you deploy the backend, set `DATABASE_URL` to the managed SQL database you want to use. PostgreSQL is a good fit for production, but it is not required by the assignment.

## Environment Files

Backend example:

- [backend/.env.example](/d:/finotes/backend/.env.example)

Frontend example:

- [frontend/.env.example](/d:/finotes/frontend/.env.example)

## Local Run

### Backend

From `backend/`:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend URLs:

- API: `http://localhost:8000`
- Docs: `http://localhost:8000/docs`
- OpenAPI JSON: `http://localhost:8000/openapi.json`

### Frontend

From `frontend/`:

```powershell
npm install
npm run dev
```

Frontend URL:

- `http://localhost:3000`

## Required Environment Variables

Backend:

```env
APP_NAME=Finotes API
APP_ENV=development
DATABASE_URL=sqlite:///./notes.db
JWT_SECRET=replace-me-with-a-long-random-secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
FRONTEND_URL=http://localhost:3000
ABOUT_NAME=Your Name
ABOUT_EMAIL=your.email@example.com
```

Frontend:

```env
VITE_API_BASE_URL=http://localhost:8000
```

## API Notes

- Do not prefix routes with `/api`
- `DELETE /notes/{id}` returns `204 No Content`
- `POST /login` returns `{ "access_token": "..." }` on success
- Invalid login returns `401` with `{ "message": "Invalid email or password" }`
- Shared users can access a note through `GET /notes/{id}` after it has been shared

## About Endpoint

`GET /about` returns your name, email, and the custom feature description required by the assignment.

## Custom Feature

The custom feature is note version history:

- Every create and update stores a version snapshot
- Owners can inspect note history
- Owners can restore an older version

This adds meaningful product value without changing the required API contract.

## Tests

Backend tests live in:

- [backend/tests/test_api.py](/d:/finotes/backend/tests/test_api.py)

They cover:

- registration and login
- notes CRUD
- access control
- sharing
- public metadata endpoints
- version history and restore

## Deploying

The assignment asks for a hosted backend. This repo includes [render.yaml](/d:/finotes/render.yaml) for a simple Render setup, but the API can also be deployed on any free platform you prefer.

For production deployment:

- set `APP_ENV=production`
- set a strong `JWT_SECRET`
- set `FRONTEND_URL` to the deployed frontend URL
- set `DATABASE_URL` to your production SQL database

## Important Files

- Backend entry: [backend/app/main.py](/d:/finotes/backend/app/main.py)
- Auth routes: [backend/app/api/routes/auth.py](/d:/finotes/backend/app/api/routes/auth.py)
- Notes routes: [backend/app/api/routes/notes.py](/d:/finotes/backend/app/api/routes/notes.py)
- Meta routes: [backend/app/api/routes/meta.py](/d:/finotes/backend/app/api/routes/meta.py)
- DB config: [backend/app/db/session.py](/d:/finotes/backend/app/db/session.py)
- App config: [backend/app/core/config.py](/d:/finotes/backend/app/core/config.py)
- Frontend API client: [frontend/src/lib/api.ts](/d:/finotes/frontend/src/lib/api.ts)
