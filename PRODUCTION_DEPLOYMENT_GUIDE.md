# 🚀 Production Deployment Guide - Quick Reference

## ⚠️ MANDATORY STEPS BEFORE DEPLOYMENT

### 1. Generate Production Secret Key

```bash
cd /home/administrator/Desktop/asset-management

# Generate a secure 64-character secret key
python3 -c "import secrets; print(secrets.token_hex(32))"

# Copy the output
```

### 2. Update Backend `.env`

```bash
nano .env

# Update these lines:
FLASK_ENV=production
SECRET_KEY=<paste-your-generated-secret-key-here>
APP_ENV=office
```

### 3. Fix Frontend API Configuration

```bash
nano frontend/.env

# OPTION 1 (Recommended): Remove the line entirely for relative URL
# Delete or comment out:
# REACT_APP_API_URL=http://192.168.20.180:3000/api

# OPTION 2: Set production URL
REACT_APP_API_URL=https://your-production-domain.com/api
```

### 4. Rebuild Frontend

```bash
cd frontend
npm run build
cd ..
```

---

## 📦 PRODUCTION SERVER SETUP

### Install Production Dependencies

```bash
# Install gunicorn (production WSGI server)
source venv/bin/activate
pip install gunicorn

# Verify requirements
pip install -r requirements.txt
```

### Start Production Server

```bash
# DO NOT USE: python api_server.py (development only)

# Use gunicorn for production:
gunicorn -w 4 -b 0.0.0.0:3000 api_server:app

# With auto-reload (for testing):
gunicorn -w 4 -b 0.0.0.0:3000 --reload api_server:app

# With logging:
gunicorn -w 4 -b 0.0.0.0:3000 --access-logfile - --error-logfile - api_server:app
```

### Using Systemd (Recommended)

Create service file:

```bash
sudo nano /etc/systemd/system/asset-management.service
```

Content:

```ini
[Unit]
Description=Asset Management API
After=network.target

[Service]
Type=notify
User=administrator
WorkingDirectory=/home/administrator/Desktop/asset-management
Environment="PATH=/home/administrator/Desktop/asset-management/venv/bin"
ExecStart=/home/administrator/Desktop/asset-management/venv/bin/gunicorn -w 4 -b 0.0.0.0:3000 api_server:app
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable asset-management
sudo systemctl start asset-management
sudo systemctl status asset-management
```

---

## 🌐 NGINX REVERSE PROXY (Recommended)

### Install Nginx

```bash
sudo apt update
sudo apt install nginx
```

### Configure Site

```bash
sudo nano /etc/nginx/sites-available/asset-management
```

Content:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL Certificate (obtain via Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Serve frontend static files
    location / {
        root /home/administrator/Desktop/asset-management/frontend/build;
        try_files $uri $uri/ /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Proxy API requests to backend
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts for long requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /api/health {
        proxy_pass http://localhost:3000;
        access_log off;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/asset-management /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Obtain SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
sudo systemctl reload nginx
```

---

## 🔒 SECURITY HARDENING

### File Permissions

```bash
cd /home/administrator/Desktop/asset-management

# Protect sensitive files
chmod 600 .env
chmod 600 frontend/.env
chmod 700 databases/

# Ensure database is not world-readable
chmod 600 databases/local_assets.db
```

### Firewall Configuration

```bash
# Allow HTTP, HTTPS, and SSH only
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

### Database Backup

```bash
# Create backup script
nano backup_database.sh
```

Content:

```bash
#!/bin/bash
BACKUP_DIR="/home/administrator/backups"
DB_PATH="/home/administrator/Desktop/asset-management/databases/local_assets.db"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"
cp "$DB_PATH" "$BACKUP_DIR/assets_backup_$TIMESTAMP.db"

# Keep only last 30 days of backups
find "$BACKUP_DIR" -name "assets_backup_*.db" -mtime +30 -delete

echo "Backup completed: assets_backup_$TIMESTAMP.db"
```

Make executable and add to cron:

```bash
chmod +x backup_database.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add line:
# 0 2 * * * /home/administrator/Desktop/asset-management/backup_database.sh
```

---

## ✅ POST-DEPLOYMENT VERIFICATION

### 1. Check Backend Health

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "Tectoro Asset Management API",
  "database": "healthy",
  "version": "2.0.0",
  "timestamp": "2026-08-18T06:12:55.796414"
}
```

### 2. Test Frontend Access

Open browser: `https://your-domain.com`

Expected: Login page loads correctly

### 3. Test Authentication

- Login as admin user
- Verify dashboard loads
- Check All Assets page (should show 31 assets)

### 4. Verify API Connection

Open browser console (F12) and check:
- No CORS errors
- API calls to `/api/*` successful
- No 401/403 errors on authorized pages

### 5. Test Critical Workflows

- ✅ View All Assets
- ✅ Add New Asset
- ✅ Edit Asset
- ✅ Assign Asset to Employee
- ✅ Create Part Replacement
- ✅ View Activity History
- ✅ Generate Report

---

## 🔧 TROUBLESHOOTING

### Issue: Backend Won't Start

```bash
# Check logs
journalctl -u asset-management -n 50 --no-pager

# Common causes:
# 1. Port 3000 already in use
sudo lsof -i :3000

# 2. Python environment issues
source venv/bin/activate
pip install -r requirements.txt

# 3. Database connection error
ls -la databases/local_assets.db
```

### Issue: Frontend Can't Connect to Backend

```bash
# Check nginx configuration
sudo nginx -t
cat /etc/nginx/sites-enabled/asset-management

# Check backend is running
curl http://localhost:3000/api/health

# Check frontend build has correct API URL
grep -r "REACT_APP_API_URL" frontend/.env
grep -r "192.168.20.180" frontend/build/  # Should find nothing
```

### Issue: 500 Internal Server Error

```bash
# Check backend logs
journalctl -u asset-management -f

# Common causes:
# 1. SECRET_KEY not set or still using dev key
grep SECRET_KEY .env

# 2. Database permissions
ls -la databases/local_assets.db

# 3. Missing dependencies
pip list | grep -i flask
```

### Issue: Assets Not Loading (Failed to load assets)

**Root Cause:** Backend not running

```bash
# Check if backend is running
systemctl status asset-management

# If not running, start it
sudo systemctl start asset-management

# Check logs for errors
journalctl -u asset-management -n 50
```

---

## 📊 MONITORING

### Health Check Endpoint

Set up monitoring to ping: `https://your-domain.com/api/health`

Expected response time: < 100ms

### Log Monitoring

```bash
# Real-time backend logs
journalctl -u asset-management -f

# Nginx access logs
tail -f /var/log/nginx/access.log

# Nginx error logs
tail -f /var/log/nginx/error.log
```

### Database Monitoring

```bash
# Check database size
du -h databases/local_assets.db

# Count assets
sqlite3 databases/local_assets.db "SELECT COUNT(*) FROM assets WHERE is_deleted = 0;"

# Check disk space
df -h /home/administrator/Desktop/asset-management/databases/
```

---

## 🔄 UPDATE PROCEDURE

### Updating the Application

```bash
# 1. Backup database
./backup_database.sh

# 2. Stop backend
sudo systemctl stop asset-management

# 3. Pull latest code (if using git)
git pull origin main

# 4. Update dependencies
source venv/bin/activate
pip install -r requirements.txt --upgrade

# 5. Rebuild frontend (if frontend changed)
cd frontend
npm install
npm run build
cd ..

# 6. Start backend
sudo systemctl start asset-management

# 7. Verify
curl http://localhost:3000/api/health
```

---

## 📞 PRODUCTION SUPPORT CHECKLIST

### Before Contacting Support

- [ ] Check backend service status: `systemctl status asset-management`
- [ ] Check backend logs: `journalctl -u asset-management -n 50`
- [ ] Check nginx logs: `tail -100 /var/log/nginx/error.log`
- [ ] Verify database exists: `ls -la databases/local_assets.db`
- [ ] Check health endpoint: `curl http://localhost:3000/api/health`
- [ ] Check disk space: `df -h`
- [ ] Check system resources: `top` or `htop`

### Information to Provide

1. Exact error message or behavior
2. When did it start (was there a deployment/change?)
3. Backend service status output
4. Last 50 lines of backend logs
5. Screenshot of browser console errors (if frontend issue)
6. Steps to reproduce

---

## ✅ PRODUCTION CHECKLIST SUMMARY

Before declaring production ready:

- [x] Backend server running (confirmed: port 3000)
- [x] Database healthy (confirmed: 31 assets)
- [x] Frontend builds successfully (confirmed: 394.85 kB)
- [x] Timezone implementation correct (IST)
- [ ] **SECRET_KEY updated** ⚠️ CRITICAL
- [ ] **Frontend API URL fixed** ⚠️ CRITICAL
- [ ] Frontend rebuilt after config changes
- [ ] Production WSGI server configured (gunicorn)
- [ ] Nginx reverse proxy configured
- [ ] SSL certificate installed
- [ ] Firewall configured
- [ ] Database backup automated
- [ ] Health check monitoring setup
- [ ] Admin user login tested
- [ ] Critical workflows tested

---

**Deployment Date:** _____________
**Deployed By:** _____________
**Production URL:** _____________
**Admin Password Changed:** [ ] Yes [ ] No

---

*For detailed audit findings, see PRODUCTION_READINESS_REPORT.md*
