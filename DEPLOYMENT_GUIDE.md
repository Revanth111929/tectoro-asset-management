# PRODUCTION DEPLOYMENT GUIDE
**Version**: 2.0  
**Date**: July 30, 2026  
**Environment-Aware Deployment**

---

## ⚠️ CRITICAL: DATA PROTECTION

**Production database (`production.db`) contains irreplaceable company asset records.**

### NEVER Deploy These Files:
- ❌ `*.db` files (any database)
- ❌ `.env` file (contains secrets)
- ❌ `logs/` directory
- ❌ `uploads/` directory
- ❌ `__pycache__/` directories
- ❌ `frontend/build/` directory (will be rebuilt)
- ❌ `frontend/node_modules/`

### ONLY Deploy:
- ✅ Python source code (`.py` files)
- ✅ Frontend source code (`frontend/src/`)
- ✅ Templates and configuration examples
- ✅ Documentation
- ✅ Scripts (`start-application.sh`, etc.)

---

## PRE-DEPLOYMENT CHECKLIST

### Local Testing
- [ ] All features tested in development
- [ ] `FLASK_ENV=development` in local `.env`
- [ ] Using `assets.db` (test data)
- [ ] No errors in logs
- [ ] Dashboard loads correctly
- [ ] All CRUD operations work
- [ ] Git status clean (no `.db` or `.env` files)

### Code Review
- [ ] No hardcoded database paths
- [ ] No hardcoded secrets
- [ ] Environment variables used correctly
- [ ] All changes committed to git
- [ ] No debug code left in source

---

## DEPLOYMENT STEPS

### STEP 1: Backup Production Database

**Before any deployment**, backup the production database:

```bash
# On production server
cd /path/to/asset-management
cp production.db backups/production_$(date +%Y%m%d_%H%M%S).db

# Verify backup
ls -lh backups/
```

### STEP 2: Pull Latest Code

```bash
# On production server
cd /path/to/asset-management
git pull origin main

# Verify no database files were pulled
git status
# Should NOT show any .db files!
```

### STEP 3: Verify Environment Configuration

```bash
# Check .env exists
cat .env

# Must contain:
# FLASK_ENV=production
# SECRET_KEY=<random-64-char-string>
# DATABASE_URL=sqlite:///production.db (optional if using auto-detection)
```

### STEP 4: Install Python Dependencies

```bash
source venv/bin/activate
pip install -r requirements.txt
```

### STEP 5: Rebuild Frontend

```bash
cd frontend
npm install
npm run build
cd ..
```

### STEP 6: Restart Application

```bash
./stop-application.sh
./start-application.sh
```

### STEP 7: Verify Deployment

**Critical checks**:

```bash
# 1. Check database selection
grep "📁 Database:" logs/backend.log
# MUST show: 📁 Database: production.db

# 2. Test API
curl http://localhost:3000/api/dashboard/stats

# 3. Check data integrity
# Verify asset count matches expected production data
```

### STEP 8: Verify in Browser

1. Open: `http://your-server:3000`
2. Login with production credentials
3. Check Dashboard statistics
4. Verify asset data is correct (production data, not test data)
5. Test critical features:
   - View assets
   - Search employees
   - View reports

---

## ROLLBACK PROCEDURE

If deployment fails:

### Option 1: Quick Rollback (Code Only)
```bash
git log --oneline -5
git reset --hard <previous-commit-hash>
./stop-application.sh
./start-application.sh
```

### Option 2: Database Restore (If Corrupted)
```bash
# Stop application
./stop-application.sh

# Restore from backup
cp backups/production_YYYYMMDD_HHMMSS.db production.db

# Restart
./start-application.sh
```

---

## FIRST-TIME PRODUCTION SETUP

If this is the first deployment to production:

### 1. Prepare Production Server

```bash
# Install system dependencies
sudo apt update
sudo apt install python3 python3-pip python3-venv nodejs npm

# Create application directory
sudo mkdir -p /var/www/asset-management
cd /var/www/asset-management
```

### 2. Clone Repository

```bash
git clone https://github.com/your-org/asset-management.git .
```

### 3. Setup Python Environment

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 4. Setup Frontend

```bash
cd frontend
npm install
npm run build
cd ..
```

### 5. Create Production Environment File

```bash
# Copy template
cp .env.production.example .env

# Generate secure secret key
python3 -c "import secrets; print(secrets.token_hex(32))"

# Edit .env
nano .env
```

Required settings:
```bash
FLASK_ENV=production
SECRET_KEY=<paste-generated-secret-key-here>
DATABASE_URL=sqlite:///production.db  # Optional
```

### 6. Initialize Production Database

#### Option A: Fresh Start (No Existing Data)
```bash
FLASK_ENV=production python3 -c "from app import create_app; from models import db; app = create_app(); app.app_context().push(); db.create_all(); print('Production database created')"
```

#### Option B: Migrate from Existing assets.db
```bash
# If you have existing production data in assets.db
cp assets.db production.db
```

### 7. Secure Files

```bash
# Restrict .env permissions
chmod 600 .env

# Set proper ownership
sudo chown -R www-data:www-data .
```

### 8. Start Application

```bash
./start-application.sh
```

### 9. Setup as System Service (Optional but Recommended)

Create systemd service file:

```bash
sudo nano /etc/systemd/system/asset-management.service
```

Content:
```ini
[Unit]
Description=IT Asset Management System
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/asset-management
Environment="PATH=/var/www/asset-management/venv/bin"
ExecStart=/var/www/asset-management/venv/bin/python3 app.py
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable asset-management
sudo systemctl start asset-management
sudo systemctl status asset-management
```

---

## ENVIRONMENT VERIFICATION

After deployment, always verify:

```bash
# Check database being used
grep "📁 Database:" logs/backend.log

# Expected in production: 📁 Database: production.db
# Expected in development: 📁 Database: assets.db
```

If wrong database is loaded:
1. Check `.env` file: `FLASK_ENV=production`
2. Restart application
3. Verify again

---

## MONITORING

### Check Application Status
```bash
# View logs
tail -f logs/backend.log

# Check process
ps aux | grep python3 | grep app.py

# Check port
lsof -i :3000
```

### Automated Health Check
```bash
# Create monitoring script
cat > /usr/local/bin/check-asset-mgmt.sh << 'EOF'
#!/bin/bash
if curl -s http://localhost:3000/api/dashboard/stats > /dev/null; then
    echo "$(date): Asset Management is UP"
else
    echo "$(date): Asset Management is DOWN"
    # Optional: restart service
    # systemctl restart asset-management
fi
EOF

chmod +x /usr/local/bin/check-asset-mgmt.sh

# Add to cron (every 5 minutes)
echo "*/5 * * * * /usr/local/bin/check-asset-mgmt.sh >> /var/log/asset-mgmt-health.log 2>&1" | crontab -
```

---

## BACKUP AUTOMATION

Create automated backup script:

```bash
sudo nano /usr/local/bin/backup-asset-db.sh
```

Content:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/asset-management"
DB_FILE="/var/www/asset-management/production.db"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
cp $DB_FILE $BACKUP_DIR/production_$DATE.db

# Keep only last 30 days
find $BACKUP_DIR -name "production_*.db" -mtime +30 -delete

echo "$(date): Backup completed - production_$DATE.db"
```

Make executable and schedule:
```bash
sudo chmod +x /usr/local/bin/backup-asset-db.sh

# Add to cron (daily at 2 AM)
echo "0 2 * * * /usr/local/bin/backup-asset-db.sh >> /var/log/asset-mgmt-backup.log 2>&1" | sudo crontab -
```

---

## TROUBLESHOOTING

### Issue: Wrong Database Loaded

**Symptoms**: Test data showing in production

**Fix**:
1. Check `.env`: Must have `FLASK_ENV=production`
2. Check logs for `📁 Database:` message
3. Restart application
4. Verify production data appears

### Issue: Application Won't Start

**Check**:
```bash
# View detailed logs
cat logs/backend.log

# Check port availability
lsof -i :3000

# Check file permissions
ls -la production.db .env
```

### Issue: Database Permission Error

**Fix**:
```bash
# Ensure correct ownership
chown www-data:www-data production.db

# Ensure write permissions
chmod 664 production.db
```

---

## SECURITY BEST PRACTICES

1. **Never commit sensitive files**:
   - `.env` → Contains secrets
   - `*.db` → Contains data
   - `logs/` → May contain sensitive info

2. **Restrict file permissions**:
   ```bash
   chmod 600 .env
   chmod 664 production.db
   ```

3. **Use strong SECRET_KEY**:
   - Minimum 64 characters
   - Randomly generated
   - Never reuse across environments

4. **Keep backups secure**:
   - Store in separate location
   - Encrypt if possible
   - Restrict access

5. **Use HTTPS in production**:
   - Configure reverse proxy (nginx/Apache)
   - Obtain SSL certificate
   - Force HTTPS redirect

---

## POST-DEPLOYMENT CHECKLIST

- [ ] Application started successfully
- [ ] Database verification: `📁 Database: production.db`
- [ ] Dashboard loads and shows production data
- [ ] Asset count matches expected
- [ ] No test data visible
- [ ] All CRUD operations work
- [ ] No errors in logs
- [ ] Backup completed
- [ ] Monitoring active
- [ ] Documentation updated

---

## CONTACTS

**For deployment issues**:
- Check logs: `logs/backend.log`
- Review: `ENVIRONMENT_SETUP.md`
- Rollback if necessary

**For data recovery**:
- Restore from backup
- Never overwrite production with development database

---

**Remember**: When in doubt, backup first!
