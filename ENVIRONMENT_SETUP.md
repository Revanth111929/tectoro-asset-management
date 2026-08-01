# ENVIRONMENT SETUP GUIDE
**Date**: July 30, 2026  
**Purpose**: Proper separation of development and production environments

---

## OVERVIEW

The IT Asset Management System supports multiple environments with **automatic database separation** to protect production data.

---

## ENVIRONMENT TYPES

### 🛠️ DEVELOPMENT (Local)
- **Purpose**: Local development and testing
- **Database**: `assets.db` (test data only)
- **Configuration**: `.env` with `FLASK_ENV=development`
- **Data**: Safe to delete, recreate, or reset
- **Commits**: NEVER commit this database to git

### 🚀 PRODUCTION
- **Purpose**: Live company asset management
- **Database**: `production.db` (real company data)
- **Configuration**: `.env` with `FLASK_ENV=production`
- **Data**: CRITICAL - Must be backed up regularly
- **Deployment**: Only deploy application code, NEVER the database

---

## AUTOMATIC DATABASE SELECTION

The application **automatically selects** the correct database based on the `FLASK_ENV` variable:

```bash
# Development (uses assets.db)
FLASK_ENV=development

# Production (uses production.db)
FLASK_ENV=production
```

When the application starts, it will display:
```
📁 Database: assets.db        # Development
📁 Database: production.db     # Production
```

---

## SETUP INSTRUCTIONS

### LOCAL DEVELOPMENT

1. **Copy environment template**:
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env`**:
   ```bash
   FLASK_ENV=development
   SECRET_KEY=dev-secret-key-not-for-production
   ```

3. **Start application**:
   ```bash
   ./start-application.sh
   ```

4. **Verify database**:
   - Look for: `📁 Database: assets.db`
   - Contains only test data
   - Safe to reset anytime

### PRODUCTION DEPLOYMENT

1. **Copy production template**:
   ```bash
   cp .env.production.example .env
   ```

2. **Edit `.env` with production values**:
   ```bash
   FLASK_ENV=production
   DATABASE_URL=sqlite:///path/to/production.db
   SECRET_KEY=<generate-random-64-char-string>
   ```

3. **Generate secure SECRET_KEY**:
   ```bash
   python3 -c "import secrets; print(secrets.token_hex(32))"
   ```

4. **Create production database** (one-time):
   ```bash
   # If production.db doesn't exist, it will be created automatically
   # To migrate from existing assets.db:
   cp assets.db production.db  # One time only!
   ```

5. **Secure the environment file**:
   ```bash
   chmod 600 .env
   ```

6. **Start application**:
   ```bash
   ./start-application.sh
   ```

7. **Verify database**:
   - Look for: `📁 Database: production.db`
   - Contains real company data
   - **NEVER delete or overwrite**

---

## ADVANCED CONFIGURATION

### Custom Database Location

You can override the automatic selection by setting `DATABASE_URL`:

```bash
# Custom SQLite path
DATABASE_URL=sqlite:///custom/path/to/database.db

# PostgreSQL (if migrating from SQLite)
DATABASE_URL=postgresql://user:password@localhost/asset_db

# MySQL (if migrating from SQLite)
DATABASE_URL=mysql://user:password@localhost/asset_db
```

### Environment Variable Priority

1. `DATABASE_URL` (if set) - **Highest priority**
2. `FLASK_ENV=production` → uses `production.db`
3. `FLASK_ENV=development` → uses `assets.db`
4. No env set → defaults to `assets.db`

---

## DATA PROTECTION RULES

### ❌ NEVER DO THIS

- ❌ Commit `.env` to git
- ❌ Commit `*.db` files to git
- ❌ Copy `assets.db` to production
- ❌ Overwrite `production.db` with `assets.db`
- ❌ Share production database with developers
- ❌ Use the same database for dev and prod
- ❌ Deploy database files with application code

### ✅ ALWAYS DO THIS

- ✅ Use separate databases for dev and production
- ✅ Keep `.env` file permissions restricted (chmod 600)
- ✅ Backup production database regularly
- ✅ Use `.env.example` for documentation
- ✅ Verify database name when application starts
- ✅ Test in development before deploying to production
- ✅ Deploy only source code, not data files

---

## GIT IGNORE

The following files are automatically ignored (`.gitignore`):

```
*.db              # All SQLite databases
*.sqlite          # Alternative extensions
*.sqlite3
.env              # Environment configuration
.env.local
.env.production
logs/*.log        # Log files
uploads/          # User-uploaded files
static/qrcodes/   # Generated QR codes
__pycache__/      # Python cache
frontend/build/   # Frontend build artifacts
```

---

## DEPLOYMENT CHECKLIST

Before deploying to production:

- [ ] `.env` has `FLASK_ENV=production`
- [ ] `SECRET_KEY` is randomly generated (not default)
- [ ] `DATABASE_URL` points to production database (if set)
- [ ] Production database exists and has real data
- [ ] Production database is backed up
- [ ] `.env` file permissions: `chmod 600 .env`
- [ ] Git status shows no `.db` files staged
- [ ] Git status shows no `.env` files staged
- [ ] Application tested in development first
- [ ] Verify database name shows `production.db` on startup

---

## TROUBLESHOOTING

### "Wrong database is being used"

**Check**:
```bash
# View database selection on startup
./start-application.sh
# Look for: 📁 Database: <filename>
```

**Fix**:
1. Check `.env` file: `cat .env`
2. Verify `FLASK_ENV` setting
3. Check if `DATABASE_URL` is set
4. Restart application

### "Production data is missing"

**Possible causes**:
- Wrong database file loaded
- `DATABASE_URL` pointing to wrong file
- `FLASK_ENV` not set to production
- Production database file moved or renamed

**Recovery**:
1. Check `.env` configuration
2. Verify `production.db` exists
3. Restore from backup if necessary
4. NEVER overwrite with `assets.db`

### "Cannot connect to database"

**Check**:
1. Database file exists
2. File permissions allow read/write
3. Disk space available
4. Path in `DATABASE_URL` is correct

---

## BACKUP STRATEGY

### Development
- Not critical (test data only)
- Can be recreated anytime

### Production
- **Critical** - Contains real company assets
- **Backup frequency**: Daily (minimum)
- **Backup method**:
  ```bash
  # Manual backup
  cp production.db backups/production_$(date +%Y%m%d).db
  
  # Automated backup (cron)
  0 2 * * * cp /path/to/production.db /path/to/backups/production_$(date +\%Y\%m\%d).db
  ```
- **Backup retention**: 30 days minimum
- **Test restores**: Monthly

---

## FILE STRUCTURE

```
asset-management/
├── .env                    # Current environment (NEVER commit)
├── .env.example            # Development template
├── .env.production.example # Production template
├── assets.db               # Development database (NEVER commit)
├── production.db           # Production database (NEVER commit)
├── app.py                  # Application entry point
├── models.py               # Database models
└── start-application.sh    # Startup script
```

---

## MIGRATION FROM SINGLE DATABASE

If you're currently using `assets.db` in production:

1. **Backup first**:
   ```bash
   cp assets.db production.db
   cp assets.db backups/assets_backup_$(date +%Y%m%d).db
   ```

2. **Update `.env`**:
   ```bash
   FLASK_ENV=production
   ```

3. **Test**:
   ```bash
   ./start-application.sh
   # Verify: 📁 Database: production.db
   ```

4. **Create new development database**:
   ```bash
   # Let app create fresh assets.db or copy from backup
   FLASK_ENV=development python3 app.py
   ```

---

## SUPPORT

For questions or issues:
1. Check application logs: `tail -f logs/backend.log`
2. Verify environment: `cat .env`
3. Check database on startup: Look for `📁 Database:` message

---

**Remember**: Production data is irreplaceable. Always verify which database is loaded before making changes.
