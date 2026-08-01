# Project Summary — Tectoro IT Asset Management

_Last verified against repo state on 2026-08-01. This replaces an earlier generic scaffold summary with a factual description of what the code actually does today._

## 1. Architecture

Flask (Python) REST API backend + React 18 SPA frontend, backed by SQLite (Postgres-ready via `DATABASE_URL`).

**Critical finding: there are two competing, only partially-equivalent backend implementations in this repo**, not one:

| | `api_server.py` | `app.py` |
|---|---|---|
| Style | Monolithic, ~3500 lines, all `@app.route` handlers written directly in the file | App-factory (`create_app()`), registers blueprints from `routes.py` + `api_lifecycle.py` |
| Auth | Stateless JWT bearer tokens (`utils/auth.py`, `PyJWT`) | Session/cookie auth via `Flask-Login` |
| DB default | Always `assets.db` unless `DATABASE_URL` set | `assets.db` in dev; falls back to a separate, empty `production.db` if `FLASK_ENV=production` and `DATABASE_URL` unset |
| Onboarding feature | ✅ implemented | ❌ not implemented anywhere in `routes.py`/`api_lifecycle.py` |
| Assignment-form PDF generation | ✅ implemented (`services/pdf_generator.py`) | ❌ no reference to it |
| Corporate SIM, Lifecycle (temp-assignments/replacements/exits) | ✅ implemented | ✅ also implemented (via `routes.py` + `api_lifecycle.py`) |
| Mandated by `CLAUDE.md` | **"Production backend... never replace it"** | not mentioned |
| Launched by `Procfile` / `railway.json` (`gunicorn app:app`) | ❌ | ✅ |
| Launched by `production_start.sh` | only if you interactively pick option 2 | **default choice (option 1, labeled "recommended")** |

`routes.py` and `api_lifecycle.py` are Flask Blueprints (`auth_bp`, `main_bp`, `asset_bp`, `report_bp`, `api_bp`, `lifecycle_bp`) that are **only ever registered by `app.py`** — `api_server.py` explicitly does not import them (there's a comment in the source saying so) and reimplements the same endpoints independently. This means the two files are not two views of the same code, they are two hand-maintained copies that have drifted (see §7, Potential Risks).

**Recommendation for anyone continuing work here:** treat `api_server.py` as authoritative per `CLAUDE.md`, but be aware the deploy config (`Procfile`, `railway.json`) currently points at `app.py`, which is missing Onboarding and PDF assignment-forms. This mismatch should be resolved (either fix the deploy config, or port the missing features into `routes.py`/`api_lifecycle.py`) before treating either file as fully safe to deploy.

## 2. Folder Structure (top-level, noise filtered out)

```
asset-management/
├── api_server.py            # Standalone monolithic backend (CLAUDE.md: the production backend)
├── app.py                   # App-factory backend using routes.py + api_lifecycle.py blueprints (Procfile target)
├── routes.py                # Blueprints: auth_bp, main_bp, asset_bp, report_bp, api_bp
├── api_lifecycle.py         # Blueprint: lifecycle_bp (audit logs, temp assignments, replacements, exits)
├── models.py                # All SQLAlchemy models (15 tables)
├── email_service.py         # SMTP send + acknowledgment-email token flow
├── services/
│   ├── audit_service.py     # AuditService (field-diff logging), LifecycleService (event/timeline)
│   └── pdf_generator.py     # AssetAssignmentPDFGenerator (reportlab), single + bulk-zip PDFs
├── utils/
│   ├── auth.py              # JWT issue/verify + token_required/admin_required/role_required/non_viewer_required decorators
│   └── rate_limit.py        # Flask-Limiter setup (per-route limit helpers)
├── migrations/
│   └── add_lifecycle_tracking.py   # raw-sqlite3 migration for lifecycle tables
├── migrate_*.py, add_*.py, fix_*.py  # ~15 ad-hoc, one-off schema/data scripts (no Alembic; see §5)
├── ack-feature/              # STALE — a patch kit already fully merged into the main tree (dead folder, see §7)
├── assets.db                 # Active SQLite data file (73 asset rows) — the real production data today
├── production.db             # Empty SQLite stub, never populated — not authoritative
├── instance/assets.db        # Symlink -> ../assets.db (not a separate DB)
├── static/, templates/       # Server-rendered views used only by routes.py's auth_bp/main_bp/asset_bp/report_bp
├── frontend/                 # React SPA (see §4)
├── requirements.txt          # Flask 3.0.3, Flask-SQLAlchemy 3.1.1, SQLAlchemy 2.0.30, Flask-Login, Flask-Mail,
│                             # Flask-Cors, psycopg2-binary (Postgres-ready), gunicorn — no Flask-Migrate/Alembic
├── Procfile / railway.json   # Deploy config: `gunicorn app:app`
└── *.md (150+ files)         # Large volume of historical status/fix/completion docs at repo root (see §7)
```

## 3. Backend

**Mandated production entry point (`CLAUDE.md`):** `python3 api_server.py`

- Flask app serves the React build directly (`static_folder='frontend/build'`), so in the intended setup Flask is both the API and the static file server — no separate web server needed for the frontend.
- Config: `SECRET_KEY` (random per-process if unset — **should be pinned via env var in real production**), `SQLALCHEMY_DATABASE_URI` from `DATABASE_URL` or defaults to local `assets.db`, connection pooling configured (pool_size 10, recycle 3600, pre_ping) implying Postgres-readiness.
- CORS restricted to `/api/*` with an explicit `ALLOWED_ORIGINS` allowlist, credentials supported.
- Security headers added on every response (`X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, HSTS).
- Auth: JWT bearer tokens (`utils/auth.py`), roles `admin` / `user` / `viewer` encoded in the token payload, decorators `token_required`, `admin_required`, `role_required(*roles)`, `non_viewer_required`.
- Rate limiting: Flask-Limiter, in-memory store by default (`RATELIMIT_STORAGE_URL`), stricter limits on login (5/min) than general API (60/min) and expensive endpoints (10/min).
- `db.create_all()` runs at import time; **`seed_data()` is permanently disabled** in this file (won't clobber real data) — contrast with `app.py`, which still auto-seeds an `admin/admin123` demo user + 5 sample assets on first run.
- Known code-quality issue: a large block of routes (Corporate SIM, Onboarding) is physically appended after the `if __name__ == '__main__':` block; this still works at import time but is fragile/confusing to maintain.
- `api_server.py.broken_backup` and `routes.py.bak` exist alongside as backups — not part of the running app.

**Alternate entry point:** `app.py` (`create_app()` factory) — registers `routes.py` + `api_lifecycle.py` blueprints, uses session-based `Flask-Login` auth instead of JWT, and is what `Procfile`/`railway.json` actually launch in the current deploy config.

## 4. Frontend

**Entry point:** `frontend/src/index.js` → mounts `<App/>` (wrapped in `ThemeProvider`) → `frontend/src/App.js` defines all routing (React Router v6).

- Auth state is client-side only: `localStorage` holds `token`, `refresh_token`, `user`, `tokenExpiry`; route guards (`Protected`, `AdminOnly`, `NonViewerOnly`) are plain React wrapper components, not server-verified on every navigation.
- API layer: `frontend/src/services/api.js` — single axios instance, base URL from `REACT_APP_API_URL` (dev: `http://192.168.20.180:3000/api`, prod: `https://tectoro-asset-management.onrender.com/api`), request interceptor attaches the JWT, response interceptor does a one-shot silent token refresh on 401 before forcing logout/redirect.
  - Inconsistency: `LoginPage.js` uses raw `fetch` instead of this instance, and `ActivityHistory.js` uses its own raw `axios` + a locally redefined base URL — both bypass the shared interceptor/refresh logic.
- RBAC on the client is a hardcoded permission matrix in `utils/permissions.js` (`admin`/`user`/`viewer`) read from `localStorage` — UX gating only, not a security boundary (server-side checks are what actually matter).
- Layout/nav shell: `components/Layout.js` — collapsible sidebar grouped into Main / Assets / Inventory (per-category links, all really filtered views over the same Asset table) / Lifecycle / Reports / Settings.
- Orphaned/unused files found in `frontend/src/pages/`: `LandingPage.js`, `EmployeeAdd.js`, `EmployeeList.js` (none routed in `App.js`), plus a stale `AssetAdd.js.backup`.
- Key deps: React 18.2, react-router-dom 6.22, axios 1.6, chart.js 4.4 + react-chartjs-2, Bootstrap 5.3. No Redux/Query/TypeScript.

## 5. Database

SQLite today (`assets.db`, 73 asset rows — this is the real, actively-used data file), Postgres-ready via `DATABASE_URL` + `psycopg2-binary` (see `.env.production.example`). `production.db` is an empty, never-populated stub and should not be treated as authoritative. No Alembic/Flask-Migrate — schema evolution is via ~15 ad-hoc one-off scripts (`migrate_*.py`, `add_*.py`, `fix_*.py`) that each hardcode `assets.db` and apply raw `ALTER TABLE`/ORM changes directly.

**Models (`models.py`, 15 tables):**
- `User` — app users, plain string `role` column (no separate roles table).
- `Asset` — the central table; `category`/vendor are plain strings (**no normalized Category/Vendor tables**); ~40 flat category-specific columns (brand, processor, IMEI, RAID config, etc.) added over time rather than a JSON/dynamic-fields blob; `status` and `ack_status` are string enums.
- `Employee` — primary key is `emp_id` (string), not an integer `id`; `application_access` stored as a JSON-in-Text column.
- `AuditLog` / `ActivityLog` — field-level change history and coarse action log, respectively.
- `AssetLifecycle` — event history per asset (procured/assigned/returned/repair/replaced/retired).
- `TemporaryAssignment`, `AssetReplacement` — FKs to two `Asset` rows each (original/temp, old/new).
- `EmployeeExit` + `ExitAssetCollection` (1:many, cascade delete-orphan).
- `EmailConfig` — admin-configured SMTP settings (encrypted password).
- `AdminProfile`, `Onboarding` + `OnboardingAssetAssignment`, `CorporateSIM` (PUK code stored **in plaintext** — flagged in the model's own comment as needing encryption).

## 6. API Surface (grouped; full duplication exists between `api_server.py` and `routes.py`/`api_lifecycle.py` — see §1)

- **Auth**: login/logout/refresh/me (JWT in `api_server.py`; session-based in `routes.py`)
- **Dashboard**: stats, activity feed, lifecycle-stats
- **Assets**: full CRUD, import (Excel), template download, history, by-employee, assignment-form PDF (single + bulk zip — `api_server.py` only), warranty/expiring
- **Employees**: CRUD, assets-by-employee, initiate exit
- **Inventory**: no separate model — category-filtered Asset views only
- **Lifecycle**: temporary-assignments, asset-replacements, employee-exits (create/list/collect-asset/complete), asset timeline/holders
- **Reports**: CSV/Excel export, paginated activity report
- **Activity History / Audit Log**: list/filter/recent/by-asset/by-employee/export (plus some legacy singular aliases `/api/audit-log`, `/api/activity-log` in `api_server.py`)
- **Email/Acknowledgment**: send assignment/ack email, public acknowledge-by-token link, SMTP config + test
- **Corporate SIM**: CRUD, assign/return, stats — implemented in both backends
- **Onboarding**: CRUD, convert-to-employee, available-assets — **`api_server.py` only**
- **Settings/Users**: user CRUD (admin-only), SMTP password update, admin profile
- **Misc**: `/api/health`, `/api/version`

## 7. Current Features (working, end-to-end)

- JWT-authenticated (or session-authenticated, depending on entry point) asset management: full CRUD, Excel import/template, warranty tracking, dynamic per-category fields
- Employee management incl. exit/offboarding workflow with per-asset collection status
- Employee onboarding with pre-assigned assets and conversion to a full employee record (api_server.py only)
- Asset lifecycle tracking: temporary assignments (loaner while original is repaired), permanent replacements, full audit trail (`AuditLog` + `AssetLifecycle`)
- Corporate SIM card inventory and assignment
- Email acknowledgment flow: emails a unique link, employee click marks the asset acknowledged
- Reports: CSV/Excel export, activity log, assignment-form PDF generation (single + bulk)
- Role-based UI (admin/user/viewer) with matching server-side role decorators
- Dark/light/system theme support

## 8. Potential Risks

1. **Two diverging backends.** `CLAUDE.md` mandates `api_server.py`; the actual deploy config (`Procfile`, `railway.json`, and the "recommended" default in `production_start.sh`) points at `app.py`. `app.py`'s blueprint stack is missing Onboarding entirely and assignment-form PDF generation — if `app.py` is what's actually deployed, those features 404 in production. This should be resolved explicitly (pick one, delete or clearly quarantine the other) rather than left ambiguous.
2. **No migration framework.** Schema changes are one-off scripts run manually against `assets.db`; there's no Alembic history, so replaying schema history on a fresh Postgres instance (the intended production DB per `.env.production.example`) would require manually re-running ~15 scripts in the right order, several of which use raw sqlite3 syntax and may not translate directly.
3. **`production.db` is a red herring.** It's empty and only used as an accidental fallback in `app.py` when `FLASK_ENV=production` and `DATABASE_URL` is unset — a real deploy without `DATABASE_URL` set would silently start with a blank database.
4. **Plaintext secret-adjacent data.** `CorporateSIM.puk_code` is stored unencrypted (flagged in-model as a known gap). `EmailConfig` password is encrypted, at least.
5. **Client-side-only RBAC enforcement gaps.** Frontend permission checks (`utils/permissions.js`) are UX-only; verify that every sensitive route on whichever backend is actually deployed independently enforces `admin_required`/`role_required` — don't rely on hidden buttons.
6. **In-memory rate limiting.** `Flask-Limiter` defaults to `memory://` storage, which doesn't share state across multiple worker processes/dynos — under multi-worker gunicorn (as configured in `railway.json`), effective rate limits are per-worker, not global.
7. **Frontend bypasses of the shared API client.** `LoginPage.js` (raw `fetch`) and `ActivityHistory.js` (raw `axios`) skip the shared `services/api.js` interceptor, so they don't get automatic token refresh/401 handling — a stale token could behave inconsistently on those two pages versus the rest of the app.
8. **Orphaned frontend files** (`LandingPage.js`, `EmployeeAdd.js`, `EmployeeList.js`, `AssetAdd.js.backup`) and backend backups (`api_server.py.broken_backup`, `routes.py.bak`) are dead weight but harmless; the `ack-feature/` folder is a fully-merged, now-obsolete patch kit — safe to archive/remove after confirming (it was diffed identical to the live `email_service.py`).
9. **Massive doc clutter at repo root** — 150+ historical status/fix/completion `.md` files accumulated over the project's life make it hard to find current, authoritative documentation. Worth curating down to a handful of living docs (README, this summary, a CHANGELOG) if anyone plans to onboard new contributors.
10. **Random `SECRET_KEY` fallback** in `api_server.py` (`os.urandom(32).hex()` if env var unset) means every process restart invalidates all existing sessions/tokens unless `SECRET_KEY` is pinned in the real production environment.

## 9. Notes for Future Work

- Before adding any new backend feature, confirm which entry point is actually being deployed right now, and add it in both places (or consolidate onto one) to avoid growing the drift described in §1/§7.
- Do not delete `ack-feature/`, backup files, or the historical `.md` files without explicit sign-off — this summary documents them as low-risk clutter, not as verified-safe-to-delete.
