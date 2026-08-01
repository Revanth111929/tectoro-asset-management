# Production Deployment Guide 🚀

**Complete guide for running the Asset Management System in production**

---

## 📋 Table of Contents

1. [Understanding the Error](#understanding-the-error)
2. [Production Scripts](#production-scripts)
3. [Quick Start](#quick-start)
4. [Troubleshooting](#troubleshooting)
5. [Systemd Service (Auto-start)](#systemd-service-auto-start)
6. [Nginx Reverse Proxy](#nginx-reverse-proxy-optional)
7. [Maintenance](#maintenance)

---

## Understanding the Error

### The "Address already in use" Error

```
Address already in use
Port 3000 is in use by another program.
```

**What it means**: Another process is already listening on port 3000.

**Common causes**:
1. ✅ **Application already running** - You started it earlier
2. 🔴 **React dev server** (`npm start`) is running
3. 🔴 **Another instance** of the app was started manually
4. 🔴 **Zombie process** - App crashed but port wasn't released

**How to fix**: Use the production scripts we created!

---

## Production Scripts

I've created 4 scripts to manage your application in production:

### 1. `production_start.sh` - Start the Application
```bash
./production_start.sh
```

**What it does**:
- ✅ Checks if app is already running
- ✅ Kills any processes on port 3000
- ✅ Activates virtual environment
- ✅ Verifies frontend build exists
- ✅ Starts the server in background
- ✅ Saves PID for management
- ✅ Verifies server started successfully

**Interactive**: Asks you to choose between `app.py` or `api_server.py`

### 2. `production_stop.sh` - Stop the Application
```bash
./production_stop.sh
```

**What it does**:
- ✅ Reads PID from file
- ✅ Gracefully stops the process (SIGTERM)
- ✅ Force kills if needed (SIGKILL)
- ✅ Cleans up PID file
- ✅ Ensures port 3000 is free

### 3. `production_restart.sh` - Restart the Application
```bash
./production_restart.sh
```

**What it does**:
- ✅ Stops the application
- ✅ Waits 2 seconds
- ✅ Starts the application

### 4. `production_status.sh` - Check Application Status
```bash
./production_status.sh
```

**What it shows**:
- ✅ PID file status
- ✅ Process status (running/stopped)
- ✅ CPU and memory usage
- ✅ Uptime
- ✅ Port 3000 status
- ✅ API health check
- ✅ Frontend build info
- ✅ Recent logs (last 10 lines)
- ✅ Database info
- ✅ Overall health status

---

## Quick Start

### First Time Setup

1. **Stop any running processes**:
```bash
# Kill React dev server if running
pkill -f "react-scripts"
pkill -f "npm start"

# Kill any Python processes
pkill -f "python.*app.py"
pkill -f "python.*api_server.py"

# Or use our stop script
./production_stop.sh
```

2. **Start the application**:
```bash
./production_start.sh
```

When prompted, choose:
- **Option 1** (app.py) - Recommended, includes all blueprints
- **Option 2** (api_server.py) - Standalone, all routes in one file

3. **Verify it's running**:
```bash
./production_status.sh
```

You should see:
```
✅ Overall Status: RUNNING & HEALTHY
```

4. **Access the application**:
Open browser: http://192.168.20.180:3000

---

## Daily Usage

### Start Application
```bash
cd /home/administrator/Desktop/asset-management
./production_start.sh
```

### Stop Application
```bash
cd /home/administrator/Desktop/asset-management
./production_stop.sh
```

### Restart Application (after changes)
```bash
cd /home/administrator/Desktop/asset-management
./production_restart.sh
```

### Check Status
```bash
cd /home/administrator/Desktop/asset-management
./production_status.sh
```

### View Live Logs
```bash
cd /home/administrator/Desktop/asset-management
tail -f logs/production.log
```

### View Last 50 Lines of Logs
```bash
cd /home/administrator/Desktop/asset-management
tail -50 logs/production.log
```

---

## Troubleshooting

### Problem 1: "Address already in use"

**Symptom**:
```
Address already in use
Port 3000 is in use by another program.
```

**Solution**:
```bash
./production_stop.sh
./production_start.sh
```

**Or manually**:
```bash
# Find what's using port 3000
lsof -i:3000

# Kill specific PID
kill <PID>

# Or kill all processes on port 3000
fuser -k 3000/tcp
```

---

### Problem 2: Application Won't Start

**Check the logs**:
```bash
tail -50 logs/production.log
```

**Common issues**:

**A. Missing virtual environment**
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**B. Missing frontend build**
```bash
cd frontend
npm install
npm run build
cd ..
```

**C. Database not initialized**
```bash
source venv/bin/activate
python3 -c "from app import create_app; from models import db; app = create_app(); app.app_context().push(); db.create_all(); print('Database initialized')"
```

**D. Wrong .env.production file**
```bash
# Check frontend API URL
cat frontend/.env.production
# Should be: REACT_APP_API_URL=http://192.168.20.180:3000/api

# Fix if wrong
echo "REACT_APP_API_URL=http://192.168.20.180:3000/api" > frontend/.env.production

# Rebuild frontend
cd frontend
npm run build
cd ..
```

---

### Problem 3: API Returns Errors

**Check API health**:
```bash
curl http://localhost:3000/api/dashboard/stats
```

**If it fails**:
```bash
# Check if server is running
./production_status.sh

# Check logs for errors
tail -50 logs/production.log

# Restart
./production_restart.sh
```

---

### Problem 4: Frontend Shows Old Version

**Rebuild frontend**:
```bash
cd frontend
rm -rf build
npm run build
cd ..
./production_restart.sh
```

**Clear browser cache**:
- Press **Ctrl + Shift + R**
- Or use incognito mode

---

### Problem 5: Can't Kill Process

**Force kill everything on port 3000**:
```bash
sudo fuser -k 3000/tcp
```

**Find and kill specific Python processes**:
```bash
ps aux | grep python | grep -E '(app|api_server)'
kill -9 <PID>
```

---

## Systemd Service (Auto-start)

Want the application to start automatically on boot? Create a systemd service.

### Step 1: Create Service File

```bash
sudo nano /etc/systemd/system/asset-management.service
```

### Step 2: Add Configuration

```ini
[Unit]
Description=Asset Management System
After=network.target

[Service]
Type=simple
User=administrator
WorkingDirectory=/home/administrator/Desktop/asset-management
Environment="PATH=/home/administrator/Desktop/asset-management/venv/bin:/usr/local/bin:/usr/bin:/bin"
ExecStart=/home/administrator/Desktop/asset-management/venv/bin/python3 /home/administrator/Desktop/asset-management/app.py
Restart=always
RestartSec=10
StandardOutput=append:/home/administrator/Desktop/asset-management/logs/production.log
StandardError=append:/home/administrator/Desktop/asset-management/logs/production.log

[Install]
WantedBy=multi-user.target
```

### Step 3: Enable and Start

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable auto-start on boot
sudo systemctl enable asset-management

# Start the service
sudo systemctl start asset-management

# Check status
sudo systemctl status asset-management
```

### Managing the Service

```bash
# Start
sudo systemctl start asset-management

# Stop
sudo systemctl stop asset-management

# Restart
sudo systemctl restart asset-management

# Status
sudo systemctl status asset-management

# View logs
sudo journalctl -u asset-management -f

# Disable auto-start
sudo systemctl disable asset-management
```

---

## Nginx Reverse Proxy (Optional)

Want to run on port 80 (standard HTTP) instead of 3000?

### Step 1: Install Nginx

```bash
sudo apt update
sudo apt install nginx -y
```

### Step 2: Create Nginx Config

```bash
sudo nano /etc/nginx/sites-available/asset-management
```

### Step 3: Add Configuration

```nginx
server {
    listen 80;
    server_name 192.168.20.180;

    # Increase timeouts for large file uploads
    client_max_body_size 50M;
    proxy_connect_timeout 600;
    proxy_send_timeout 600;
    proxy_read_timeout 600;
    send_timeout 600;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Step 4: Enable Site

```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/asset-management /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx

# Enable auto-start
sudo systemctl enable nginx
```

### Step 5: Update Frontend API URL

```bash
# Update .env.production to use port 80
echo "REACT_APP_API_URL=http://192.168.20.180/api" > frontend/.env.production

# Rebuild frontend
cd frontend
npm run build
cd ..

# Restart application
./production_restart.sh
```

Now access at: **http://192.168.20.180** (no port number!)

---

## Maintenance

### Regular Maintenance Tasks

#### Daily
- **Check status**: `./production_status.sh`
- **Review logs**: `tail -50 logs/production.log`

#### Weekly
- **Rotate logs** (if they get too large):
```bash
# Backup old log
mv logs/production.log logs/production_$(date +%Y%m%d).log

# Restart to create new log
./production_restart.sh
```

#### Monthly
- **Database backup**:
```bash
# Create backups directory
mkdir -p backups

# Backup database
cp assets.db backups/assets_$(date +%Y%m%d).db

# Keep only last 30 days
find backups/ -name "assets_*.db" -mtime +30 -delete
```

- **Update dependencies**:
```bash
source venv/bin/activate
pip install --upgrade -r requirements.txt
cd frontend
npm update
npm run build
cd ..
./production_restart.sh
```

---

## Deployment Checklist

Before deploying to production, verify:

### Infrastructure
- [ ] Port 3000 is free
- [ ] Virtual environment exists (`venv/`)
- [ ] Dependencies installed (`pip install -r requirements.txt`)
- [ ] Frontend built (`frontend/build/`)
- [ ] Database initialized (`assets.db`)
- [ ] Logs directory exists (`logs/`)

### Configuration
- [ ] `.env` file configured
- [ ] `frontend/.env.production` has correct API URL
- [ ] Database connection string correct
- [ ] Secret key set

### Security
- [ ] Change default admin password
- [ ] Update SECRET_KEY in environment
- [ ] Configure ALLOWED_ORIGINS in app
- [ ] Enable HTTPS (if using Nginx)
- [ ] Firewall configured
- [ ] Database backed up

### Testing
- [ ] Application starts: `./production_start.sh`
- [ ] Status shows healthy: `./production_status.sh`
- [ ] API responds: `curl http://localhost:3000/api/dashboard/stats`
- [ ] Frontend loads in browser
- [ ] Login works
- [ ] Core features work (add asset, assign, etc.)

---

## Quick Reference

### Common Commands

```bash
# Start
./production_start.sh

# Stop
./production_stop.sh

# Restart
./production_restart.sh

# Status
./production_status.sh

# Logs
tail -f logs/production.log

# Kill port 3000
fuser -k 3000/tcp

# Find what's on port 3000
lsof -i:3000

# Check if app is running
ps aux | grep -E 'python.*(app|api_server)' | grep -v grep
```

### File Locations

```
/home/administrator/Desktop/asset-management/
├── app.py                    # Main server file (recommended)
├── api_server.py             # Alternative server file
├── assets.db                 # SQLite database
├── logs/
│   └── production.log        # Application logs
├── app.pid                   # Process ID file
├── frontend/
│   ├── build/                # Production build
│   └── .env.production       # Production API URL
├── production_start.sh       # Start script
├── production_stop.sh        # Stop script
├── production_restart.sh     # Restart script
└── production_status.sh      # Status script
```

---

## Support

### Getting Help

1. **Check status**: `./production_status.sh`
2. **Check logs**: `tail -50 logs/production.log`
3. **Check this guide**: Look for your error in [Troubleshooting](#troubleshooting)

### Common Error Messages

| Error | Solution |
|-------|----------|
| "Address already in use" | `./production_stop.sh` then `./production_start.sh` |
| "No module named 'flask'" | `source venv/bin/activate && pip install -r requirements.txt` |
| "Database not found" | Initialize database (see Problem 2C) |
| "Failed to load" in browser | Rebuild frontend and hard refresh (Ctrl+Shift+R) |
| "API health check failed" | Check logs: `tail -50 logs/production.log` |

---

**Last Updated**: July 29, 2026  
**Version**: 1.0  
**Port**: 3000  
**Status**: Production Ready ✅
