# RENDER DEPLOYMENT GUIDE
**Date**: July 30, 2026  
**Status**: Production-Ready with Environment Separation

---

## CRITICAL CHANGES IMPLEMENTED

### ✅ Seed Data Now Environment-Aware
- **Development**: Seed data ENABLED (sample assets for testing)
- **Production**: Seed data DISABLED (no sample data created)

### ✅ Database Configuration
- **Development**: Uses local SQLite (`assets.db`)
- **Production**: Uses DATABASE_URL (PostgreSQL recommended)

---

## RENDER DEPLOYMENT STEPS

### 1. Create Render PostgreSQL Database

**In Render Dashboard**:
1. Go to "New" → "PostgreSQL"
2. Name: `asset-management-db`
3. Database: `asset_management`
4. User: (auto-generated)
5. Region: Same as web service
6. Plan: Starter ($7/month) or higher
7. Click "Create Database"

**Save credentials** (shown once):
- Internal Database URL
- External Database URL
- Username
- Password

---

### 2. Configure Web Service Environment Variables

**In Render Web Service Dashboard → Environment**:

Add these environment variables:

```bash
# REQUIRED: Set production mode
FLASK_ENV=production

# REQUIRED: Database connection
DATABASE_URL=<paste-internal-database-url-from-postgres>

# REQUIRED: Generate secure secret key
# Run locally: python3 -c "import secrets; print(secrets.token_hex(32))"
SECRET_KEY=<paste-generated-64-character-string>

# OPTIONAL: Email configuration
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_DEFAULT_SENDER=assets@company.com
```

**Example DATABASE_URL**:
```
postgresql://asset_user:xxx@dpg-xxxxx-a.oregon-postgres.render.com/asset_management
```

---

### 3. Update requirements.txt

Add PostgreSQL driver:

```bash
psycopg2-binary==2.9.9
```

**On local machine**:
```bash
echo "psycopg2-binary==2.9.9" >> requirements.txt
git add requirements.txt
git commit -m "Add PostgreSQL driver for Render deployment"
git push
```

---

### 4. Deploy to Render

**Automatic Deployment** (if auto-deploy enabled):
- Push to main branch triggers deploy
- Render pulls latest code
- Installs dependencies
- Starts application

**Manual Deployment**:
1. Go to Render Dashboard
2. Click "Manual Deploy" → "Deploy latest commit"

---

### 5. Initialize Production Database

**First-time setup only**:

After successful deployment, initialize database tables:

**Option A: Using Render Shell**
```bash
# In Render Dashboard → Shell
python3 -c "from app import create_app; from models import db; app = create_app(); app.app_context().push(); db.create_all(); print('Tables created')"
```

**Option B: Using Local Script**
```bash
# On local machine with DATABASE_URL
export DATABASE_URL=<production-database-url>
export FLASK_ENV=production
python3 -c "from app import create_app; from models import db; app = create_app(); app.app_context().push(); db.create_all()"
```

---

### 6. Create First Admin User

**Using Render Shell**:
```python
from app import create_app
from models import db, User
from werkzeug.security import generate_password_hash

app = create_app()
with app.app_context():
    # Create admin user
    admin = User(
        username='admin',
        email='admin@company.com',
        password_hash=generate_password_hash('CHANGE_THIS_PASSWORD'),
        role='admin',
        is_active=True
    )
    db.session.add(admin)
    db.session.commit()
    print("Admin user created")
```

**Change the password immediately after first login!**

---

### 7. Verify Deployment

**Check Logs**:
```
In Render Dashboard → Logs, verify:

✓ "🌍 Environment: production"
✓ "📁 Database: Using DATABASE_URL (external/managed database)"
✓ "Type: PostgreSQL"
✓ "⚠️  PRODUCTION MODE: Seed data is DISABLED"
✓ "No sample assets will be created"
```

**Test Application**:
1. Visit: `https://your-app.onrender.com`
2. Login with admin credentials
3. Verify: Dashboard shows 0 assets (no seed data)
4. Create test asset
5. Restart service (Render Dashboard → Manual Deploy → Restart)
6. Verify: Asset still exists (persistence working)

---

## ENVIRONMENT COMPARISON

| Feature | Development | Production (Render) |
|---------|-------------|-------------------|
| **FLASK_ENV** | development | production |
| **Database Type** | SQLite | PostgreSQL |
| **Database File** | assets.db (local) | Managed by Render |
| **Seed Data** | ✅ Enabled | ❌ Disabled |
| **Sample Assets** | Yes (5 assets) | No |
| **Persistence** | Local filesystem | PostgreSQL cluster |
| **Data Loss Risk** | Low | None (managed DB) |

---

## VERIFICATION CHECKLIST

Before considering deployment complete:

### Environment Configuration
- [ ] `FLASK_ENV=production` set in Render
- [ ] `DATABASE_URL` points to PostgreSQL
- [ ] `SECRET_KEY` is random 64-character string (not default)
- [ ] Email settings configured (if using email features)

### Database Setup
- [ ] Render PostgreSQL created
- [ ] DATABASE_URL copied to web service
- [ ] Database tables initialized
- [ ] Admin user created

### Application Behavior
- [ ] Logs show "Environment: production"
- [ ] Logs show "PostgreSQL" database type
- [ ] Logs show "Seed data is DISABLED"
- [ ] Dashboard shows 0 assets initially
- [ ] Can create assets through UI
- [ ] Assets persist after restart

### Security
- [ ] Admin password changed from default
- [ ] SECRET_KEY is not development key
- [ ] Database credentials secured
- [ ] HTTPS enabled (automatic on Render)

---

## TROUBLESHOOTING

### "Seed data still appearing"

**Check**:
```bash
# In Render logs, verify:
grep "Environment:" logs
# Should show: Environment: production

grep "Seed data" logs
# Should show: PRODUCTION MODE: Seed data is DISABLED
```

**Fix**:
1. Verify `FLASK_ENV=production` in Render environment variables
2. Redeploy service
3. Check logs again

---

### "Database connection failed"

**Check**:
```bash
# Verify DATABASE_URL is correct
echo $DATABASE_URL
# Should start with: postgresql://
```

**Fix**:
1. Check DATABASE_URL in Render environment variables
2. Use "Internal Database URL" (not External)
3. Verify PostgreSQL service is running
4. Check PostgreSQL service logs

---

### "Tables don't exist"

**Symptom**: Errors about missing tables

**Fix**:
```bash
# Initialize database tables (Render Shell)
python3 -c "from app import create_app; from models import db; app = create_app(); app.app_context().push(); db.create_all()"
```

---

### "Cannot login"

**Symptom**: No admin user exists

**Fix**:
```bash
# Create admin user (Render Shell)
python3 -c "
from app import create_app
from models import db, User
from werkzeug.security import generate_password_hash

app = create_app()
with app.app_context():
    admin = User(
        username='admin',
        email='admin@company.com',
        password_hash=generate_password_hash('admin123'),
        role='admin',
        is_active=True
    )
    db.session.add(admin)
    db.session.commit()
"
```

---

## MIGRATION FROM DEVELOPMENT TO PRODUCTION

If you have data in local development you want to migrate:

### Option 1: Manual Entry
- Recommended for small datasets
- Ensures data quality
- No migration scripts needed

### Option 2: CSV Export/Import
1. Export from development (Reports → Export CSV)
2. Import to production (Assets → Import Excel)

### Option 3: Database Migration
```bash
# Export development data
pg_dump sqlite:///assets.db > development_data.sql

# Import to PostgreSQL (requires conversion)
# Use tool like: pgloader or custom migration script
```

---

## BACKUP STRATEGY

Render PostgreSQL includes automatic backups:

**Default Retention**:
- Starter plan: 7 days
- Standard plan: 14 days
- Pro plan: 30 days

**Manual Backups**:
```bash
# From Render Dashboard
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

**Restore from Backup**:
```bash
psql $DATABASE_URL < backup_20260730.sql
```

---

## MONITORING

**Application Logs**:
- Render Dashboard → Logs
- Real-time streaming
- Search and filter

**Database Monitoring**:
- Render Dashboard → PostgreSQL service
- Connection count
- Query performance
- Storage usage

**Health Checks**:
```bash
# Render automatically monitors
# Custom health endpoint (if needed)
curl https://your-app.onrender.com/api/dashboard/stats
```

---

## COST ESTIMATION

**Render Pricing** (as of 2026):

| Service | Plan | Cost |
|---------|------|------|
| Web Service | Starter | $7/month |
| PostgreSQL | Starter | $7/month |
| **Total** | | **$14/month** |

**Included**:
- Auto-scaling
- SSL certificates
- 7-day backups
- 100 GB bandwidth
- DDoS protection

---

## SUPPORT RESOURCES

**Render Documentation**:
- https://render.com/docs
- https://render.com/docs/databases

**Application Logs**:
- Check Render Dashboard → Logs
- Filter by environment/database messages

**Database Issues**:
- Render Dashboard → PostgreSQL service → Logs
- Connection pool monitoring
- Query performance analysis

---

## ROLLBACK PROCEDURE

If deployment fails:

1. **Render Dashboard** → "Rollback to previous deploy"
2. Or revert git commit:
   ```bash
   git revert HEAD
   git push
   ```
3. Render auto-deploys reverted code
4. Database remains unchanged (PostgreSQL persists)

---

## NEXT STEPS AFTER DEPLOYMENT

1. **Change admin password** (security)
2. **Create employee records** (through UI or import)
3. **Add real assets** (through UI or import)
4. **Configure email** (if using notifications)
5. **Setup backups** (automated schedule)
6. **Monitor logs** (check for errors)
7. **Test all features** (CRUD operations)
8. **Document procedures** (for team)

---

**Deployment Status**: Ready for Production  
**Environment Separation**: ✅ Implemented  
**Seed Data Control**: ✅ Environment-Aware  
**Database Strategy**: ✅ PostgreSQL Ready
