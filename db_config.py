"""
db_config.py
Single source of truth for selecting the correct database per environment.

  Local office application  -> databases/office_assets.db   (real office data)
  Public Render deployment  -> databases/demo_assets.db      (public demo data)

These two databases must NEVER cross environments and must NEVER fall back
into one another. APP_ENV is required and must be exactly 'office' or
'render' — there is no default, because guessing wrong here risks exposing
real office data publicly or mixing demo data into office records.

Imported identically by both api_server.py and app.py so the two backend
entry points can never disagree on which database is safe to use.
"""

import os

DATABASES_DIRNAME = 'databases'
OFFICE_DB_FILENAME = 'office_assets.db'
DEMO_DB_FILENAME = 'demo_assets.db'

VALID_ENVIRONMENTS = ('office', 'render')


class DatabaseConfigError(RuntimeError):
    """Raised when APP_ENV / DATABASE_URL configuration is missing or unsafe."""


def resolve_database_uri(basedir):
    """
    Returns (database_uri, app_env) for the current process.

    Rules:
      - APP_ENV must be set to 'office' or 'render'. No default, no guessing.
      - If DATABASE_URL is explicitly set, it must not reference the OTHER
        environment's SQLite filename (office_assets.db / demo_assets.db).
      - If DATABASE_URL is not set, the fixed SQLite file for this
        environment is used automatically, under <basedir>/databases/
        (office_assets.db for 'office', demo_assets.db for 'render').
        There is no fallback between them.
    """
    app_env = os.getenv('APP_ENV', '').strip().lower()

    if app_env not in VALID_ENVIRONMENTS:
        raise DatabaseConfigError(
            "FATAL: APP_ENV must be set to 'office' or 'render' (got "
            f"{app_env!r}). Refusing to start: without an explicit, valid "
            "APP_ENV this process cannot safely choose between the office "
            "database and the public demo database."
        )

    expected_filename = OFFICE_DB_FILENAME if app_env == 'office' else DEMO_DB_FILENAME
    forbidden_filename = DEMO_DB_FILENAME if app_env == 'office' else OFFICE_DB_FILENAME

    database_url = os.getenv('DATABASE_URL', '').strip()

    if database_url:
        if forbidden_filename in database_url:
            other_env = 'render' if app_env == 'office' else 'office'
            raise DatabaseConfigError(
                f"FATAL: APP_ENV={app_env!r} but DATABASE_URL references "
                f"'{forbidden_filename}' (the {other_env} database). "
                "Refusing to start: the office and demo databases must "
                "never be used by the wrong environment."
            )
        return database_url, app_env

    databases_dir = os.path.join(basedir, DATABASES_DIRNAME)
    os.makedirs(databases_dir, exist_ok=True)
    return 'sqlite:///' + os.path.join(databases_dir, expected_filename), app_env


def is_render_env(app_env):
    return app_env == 'render'


def is_office_env(app_env):
    return app_env == 'office'
