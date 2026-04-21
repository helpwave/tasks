# AGENTS.md

This document is the operational guide for AI agents contributing to `helpwave/tasks`.

Use it as the source of truth for how to understand the repository, make safe changes, and deliver high-quality contributions with minimal back-and-forth.

## 1) Mission and Product Context

`helpwave/tasks` is an open-source healthcare operations platform for ward and task management.

Primary goals:
- Organize clinical tasks and patient workflows
- Reflect ward/location hierarchy and team context
- Support real-time collaborative updates
- Maintain auditability and operational reliability

Core architecture:
- `backend/`: FastAPI + Strawberry GraphQL API
- `web/`: Next.js (Pages Router) frontend
- `tests/`: Playwright E2E package
- `simulator/`: traffic/workflow simulator
- `proxy/`: Nginx reverse proxy for production-style routing
- `keycloak/`: identity provider config
- `scaffold/`: initial location tree and seed-like structure

## 2) Ground Rules for All Agents

1. Prefer precise, minimal changes over broad refactors unless explicitly requested.
2. Preserve existing behavior unless the task requires changing it.
3. Never commit secrets (`.env`, credentials, tokens, private keys).
4. Never run destructive git commands unless explicitly instructed.
5. Do not edit generated files manually unless the task explicitly asks for it.
6. Keep code clean, explicit, and reusable.
7. Do not add code comments unless explicitly requested.
8. Validate changes locally with relevant checks before finalizing.

## 3) Repository Map and Ownership Boundaries

### Backend (`backend/`)
- Language: Python (FastAPI, Strawberry GraphQL, SQLAlchemy async, Alembic)
- Responsibilities:
  - GraphQL schema and resolvers
  - Auth and request context
  - Authorization logic (location-scoped visibility/access)
  - Database persistence and migrations
  - Redis-backed pub/sub notifications
  - InfluxDB-backed audit logging

Important paths:
- `backend/main.py`
- `backend/config.py`
- `backend/auth.py`
- `backend/api/context.py`
- `backend/api/resolvers/`
- `backend/api/services/authorization.py`
- `backend/database/models/`
- `backend/database/migrations/`

### Frontend (`web/`)
- Language: TypeScript (Next.js + React)
- Responsibilities:
  - UI routes/pages and app shell
  - OIDC session handling and auth redirects
  - GraphQL operations and cache synchronization
  - Realtime subscriptions and optimistic updates
  - Localization and theme/UX settings

Important paths:
- `web/pages/_app.tsx`
- `web/hooks/useAuth.tsx`
- `web/api/auth/authService.ts`
- `web/providers/ApolloProviderWithData.tsx`
- `web/data/`
- `web/components/layout/Page.tsx`
- `web/utils/config.ts`
- `web/api/graphql/`
- `web/api/gql/generated.ts` (generated)
- `web/locales/` and `web/i18n/translations.ts` (generated output)

### End-to-End Tests (`tests/`)
- Playwright tests and config for full user-flow verification.

### Simulator (`simulator/`)
- Python tool to simulate realistic workflow traffic in development/testing.

## 4) Local Development Workflow

## Start infrastructure
From repository root:

```bash
docker compose -f docker-compose.dev.yml up -d postgres redis keycloak influxdb
```

## Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn main:app --reload
```

## Frontend
```bash
cd web
npm install
npm run dev
```

## Optional simulator
```bash
cd simulator
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

## 5) Required Generation Steps

These are mandatory when relevant files change:

1. If any `*.graphql` file changed in `web/`:
```bash
cd web
npm run generate-graphql
```

2. If any `*.arb` file changed in `web/locales/`:
```bash
cd web
npm run build-intl
```

Never skip these steps when applicable.

## 6) Validation Checklist Before Finalizing

Run only what is relevant to your change scope.

### Frontend changes
```bash
cd web
npm run lint
npm run check-translations
```

### Backend changes
```bash
cd backend
pytest tests/unit -v
pytest tests/integration -v
```

### E2E-impacting changes
```bash
cd tests
npm install
npx playwright test
```

If you cannot run a check, explicitly state what you could not run and why.

## 7) Change Strategy by Task Type

### Feature work
- Follow existing domain patterns.
- Prefer extending existing service/hook/provider layers over introducing parallel systems.

### Bug fixes
- Reproduce mentally or with tests.
- Fix at the narrowest reliable layer.
- Verify no regression in adjacent flows.

### Refactors
- Keep behavior stable.
- Make incremental commits when requested.
- Avoid mixing refactor and feature changes unless required.

### API and schema changes
- Update backend schema/resolvers/types coherently.
- Regenerate frontend GraphQL types/documents.
- Update consuming hooks/components.

## 8) Architecture-Specific Guidance

### Backend request flow
Standard flow:
1. Auth token/cookie extraction
2. User/context hydration
3. Authorization checks (location-scope)
4. Resolver/service execution
5. DB changes and optional audit emission
6. Redis pub/sub notifications for subscribers

When changing behavior, identify which stage is affected and keep boundaries clear.

### Frontend data flow
Standard flow:
1. UI event from page/component
2. Hook/provider mutation or query execution
3. Auth header attachment
4. GraphQL request over HTTP or subscription over WS
5. Cache update, optimistic reconciliation, and UI refresh

When adding data access:
- Prefer existing patterns in `web/data/hooks/` and current provider setup.
- Keep cache consistency and subscription behavior in mind.

## 9) Environment and Configuration Rules

### Backend
- Review `backend/config.py` for canonical env contracts.
- Ensure local Redis URL matches compose password settings.
- Do not hardcode environment-specific URLs in source.

### Frontend
- Use runtime config through `web/utils/config.ts`.
- Treat `RUNTIME_*` values as public runtime configuration.
- Keep local defaults and production runtime injection behavior intact.

## 10) Code Quality and Style Expectations

1. Use explicit typing where practical.
2. Keep functions/components focused and reusable.
3. Favor existing utility modules before adding new helpers.
4. Avoid dead code, hidden side effects, and unnecessary indirection.
5. Keep naming aligned with existing domain language (`task`, `patient`, `location`, `property`, `view`, `preset`).
6. Do not introduce comments unless asked; write self-explanatory code.

## 11) Safe Git Practices for Agents

1. Inspect current git status before making edits.
2. Do not revert unrelated user changes.
3. Stage only files relevant to the requested task.
4. Never force-push unless explicitly instructed.
5. Do not amend commits unless explicitly requested.
6. Do not create commits unless explicitly requested.

## 12) Common Pitfalls

1. Forgetting to run `npm run generate-graphql` after GraphQL document changes.
2. Forgetting to run `npm run build-intl` after locale ARB changes.
3. Assuming auth/permissions are purely frontend concerns instead of backend-enforced.
4. Breaking Redis-backed realtime paths by changing event channels without updating subscribers.
5. Mixing broad refactors with urgent bug fixes in one change.
6. Editing generated files directly.

## 13) High-Value Files to Read First

1. `README.md`
2. `backend/main.py`
3. `backend/config.py`
4. `backend/api/context.py`
5. `backend/api/services/authorization.py`
6. `backend/api/resolvers/__init__.py`
7. `backend/database/models/`
8. `web/package.json`
9. `web/pages/_app.tsx`
10. `web/hooks/useAuth.tsx`
11. `web/api/auth/authService.ts`
12. `web/providers/ApolloProviderWithData.tsx`
13. `web/data/client.ts`
14. `web/utils/config.ts`
15. `.github/workflows/tests.yml`

## 14) Definition of Done for Agent Tasks

A task is done when:
1. Requested behavior is implemented correctly.
2. Relevant generation steps are completed.
3. Relevant tests/lint/type checks pass (or limitations are clearly reported).
4. No unrelated files are modified.
5. Final handoff clearly states what changed and how it was validated.

