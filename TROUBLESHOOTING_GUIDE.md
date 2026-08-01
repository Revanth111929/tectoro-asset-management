# Asset Management System - Troubleshooting Guide

## 🚨 "Not Found" or "Cannot connect to server" Error

When you see these errors, it means the backend Flask server is not running.

---

## ✅ SOLUTION: Quick Fix Commands

### Method 1: Using the restart script (Recommended)
```bash
cd ~/Desktop/asset-management
bash restart_backend.sh
```

### Method 2: Manual restart
```bash
cd ~/Desktop/asset-management

# Step 1: Kill any existing processes on port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Step 2: Start the Flask backend
python3 api_server.py
```

### Method 3: One-liner command
```bash
cd ~/Desktop/asset-management && lsof -ti:3000 | xargs kill -9 2>/dev/null || true && python3 api_server.py
```

---

## 🔍 Checking if Server is Running

### Check what's running on port 3000:
```bash
lsof -i:3000
```

If nothing appears, the server is NOT running.

### Check Flask process:
```bash
ps aux | grep api_server.py
```

---

## 🛠️ Common Issues & Solutions

### Issue 1: Port 3000 is occupied by another process
**Solution:**
```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Start Flask backend
cd ~/Desktop/asset-management
python3 api_server.py
```

### Issue 2: Python dependencies missing
**Solution:**
```bash
cd ~/Desktop/asset-management
pip3 install -r requirements.txt
python3 api_server.py
```

### Issue 3: Database not found
**Solution:**
```bash
cd ~/Desktop/asset-management
python3 init_db.py
python3 api_server.py
```

### Issue 4: Frontend build is outdated
**Solution:**
```bash
cd ~/Desktop/asset-management/frontend
npm run build
cd ..
python3 api_server.py
```

---

## 📋 Complete Restart Process (Nuclear Option)

If nothing works, run this complete cleanup and restart:

```bash
#!/bin/bash
cd ~/Desktop/asset-management

# 1. Kill all processes on port 3000
echo "Killing processes on port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
sleep 2

# 2. Kill any Python Flask processes
echo "Killing Flask processes..."
pkill -f "python.*api_server.py" 2>/dev/null || true
sleep 2

# 3. Rebuild frontend (optional - only if you made changes)
# echo "Rebuilding frontend..."
# cd frontend
# npm run build
# cd ..

# 4. Start Flask backend
echo "Starting Flask backend on port 3000..."
python3 api_server.py
```

Save this as `complete_restart.sh` and run:
```bash
chmod +x complete_restart.sh
bash complete_restart.sh
```

# 4. 
---

## 🌐 Access URLs

Once the server is running, access the application at:
- **Main URL:** http://192.168.20.180:3000
- **Alternative:** http://localhost:3000

Login page should appear with:
- Cannot connect error = Server NOT running
- Login form visible = Server IS running ✅

---

## 📊 Server Status Check

### Is the server running?
```bash
curl http://localhost:3000/api/health 2>/dev/null && echo "✅ Server is UP" || echo "❌ Server is DOWN"
```

### Check backend logs:
The Flask server will show logs in the terminal where you ran `python3 api_server.py`

---

## 🔧 Development Mode

### Run backend with auto-reload (for development):
```bash
cd ~/Desktop/asset-management
export FLASK_ENV=development
python3 api_server.py
```

### Run frontend dev server separately (for development):
```bash
cd ~/Desktop/asset-management/frontend
npm start
```
Note: In production, we only use Flask on port 3000 serving the built frontend.

---

## 📝 Remember

1. **Always check if server is running first** before debugging other issues
2. **Port 3000 must be free** - only Flask backend should use it
3. **Frontend is built and served by Flask** - no separate React server needed
4. **Database must exist** - run `python3 init_db.py` if missing

---

## 🆘 Emergency Contact Commands

```bash
# Check what's running on port 3000
lsof -i:3000

# Check Flask processes
ps aux | grep api_server

# Check if database exists
ls -lh ~/Desktop/asset-management/*.db

# Check frontend build exists
ls -lh ~/Desktop/asset-management/frontend/build/index.html

# Tail backend logs (if running in background)
tail -f ~/Desktop/asset-management/backend.log
```

---

## ✨ Success Indicators

When the server starts successfully, you should see:
```
 * Serving Flask app 'api_server'
 * Running on http://0.0.0.0:3000
 * Running on http://192.168.20.180:3000
Press CTRL+C to quit
```

Then visit: http://192.168.20.180:3000 and you should see the login page.

---

**Last Updated:** June 18, 2026
