# Tectoro IT Asset Management

## This is a production application.

Always preserve existing functionality.

## Backend

Production backend:

python3 api_server.py

Never replace it with app.py.

Never create another backend entry point.

## Frontend

React application in:

frontend/

## Rules

- Never rewrite the project.
- Never modify unrelated files.
- Never remove existing features.
- Never change database schema without migration.
- Never commit SQLite databases.
- Never use local office database in production.
- Never seed production database.

## After every feature

Update:

- Backend
- Frontend
- API
- Database (if required)
- Validation
- Reports
- Activity History

Then:

- Run backend
- Run frontend
- Test affected pages
- Fix any errors
- Commit
- Push

## Before finishing

Verify:

- Login
- Dashboard
- Assets
- Inventory
- Employees
- Lifecycle
- Reports
- Warranty
- Activity History
- Email
- Onboarding

No:

- Python errors
- React errors
- Console errors
- 404
- 500
- Broken APIs

If anything fails:

Fix it before completing the task.