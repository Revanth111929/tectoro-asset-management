# Quick Fix Guide for Common Issues

## 🔧 Most Common Issue: Backend Not Updated

If you're experiencing any of these issues:
- "Failed to load users"
- Dashboard not showing correct data
- API endpoints returning 404
- Changes not reflecting in the UI

**Run this single command:**

```bash
cd /home/administrator/Desktop/asset-management && ./restart_backend.sh
```

Then **refresh your browser** with `Ctrl+Shift+R`

---

## 📋 Quick Command Reference

### 1. Restart Backend Only
```bash
cd /home/administrator/Desktop/asset-management
./restart_backend.sh
```

### 2. Restart Frontend Only
```bash
# Stop frontend (Ctrl+C in the terminal where it's running)
# Then restart:
cd /home/administrator/Desktop/asset-management/frontend
npm start
```

### 3. Restart Both Backend + Frontend
```bash
# Terminal 1 - Backend
cd /home/administrator/Desktop/asset-management
./restart_backend.sh

# Terminal 2 - Frontend (if not running)
cd /home/administrator/Desktop/asset-management/frontend
npm start
```

### 4. Check if Backend is Running
```bash
lsof -i :5000
```
If you see output, backend is running. If not, start it:
```bash
cd /home/administrator/Desktop/asset-management
source venv/bin/activate
python3 app.py
```

### 5. Check if Frontend is Running
```bash
lsof -i :3000
```
If you see output, frontend is running. If not, start it:
```bash
cd /home/administrator/Desktop/asset-management/frontend
npm start
```

---

## 🚨 Specific Problem Solutions

### Problem: "Failed to load users" or API 404 errors
**Solution:**
```bash
cd /home/administrator/Desktop/asset-management
./restart_backend.sh
# Then refresh browser with Ctrl+Shift+R
```

### Problem: Dashboard showing old data
**Solution:**
1. Restart backend:
```bash
cd /home/administrator/Desktop/asset-management
./restart_backend.sh
```
2. Hard refresh browser: `Ctrl+Shift+R`
3. Clear browser cache if needed: `Ctrl+Shift+Delete`

### Problem: Changes in code not reflecting
**Solution:**
1. If you changed Python files (backend):
```bash
cd /home/administrator/Desktop/asset-management
./restart_backend.sh
```

2. If you changed React files (frontend):
```bash
# Frontend usually auto-reloads, but if not:
# Ctrl+C in frontend terminal, then:
cd /home/administrator/Desktop/asset-management/frontend
npm start
```

### Problem: Port already in use (5000 or 3000)
**Solution for port 5000 (backend):**
```bash
fuser -k 5000/tcp
sleep 2
cd /home/administrator/Desktop/asset-management
source venv/bin/activate
python3 app.py
```

**Solution for port 3000 (frontend):**
```bash
fuser -k 3000/tcp
sleep 2
cd /home/administrator/Desktop/asset-management/frontend
npm start
```

### Problem: Database locked or permission errors
**Solution:**
```bash
cd /home/administrator/Desktop/asset-management
# Check database file permissions
ls -la assets.db

# Fix permissions if needed
chmod 644 assets.db

# Restart backend
./restart_backend.sh
```

---

## 🔄 Complete System Restart (Nuclear Option)

If nothing else works, do a complete restart:

```bash
# Stop everything
pkill -f "python3 app.py"
pkill -f "npm"
sleep 2

# Restart backend
cd /home/administrator/Desktop/asset-management
source venv/bin/activate
nohup python3 app.py > backend.log 2>&1 &
sleep 3

# Restart frontend (in a new terminal)
cd /home/administrator/Desktop/asset-management/frontend
npm start
```

---

## 📊 Diagnostic Commands

### Check Backend Status
```bash
# Check if running
curl http://192.168.20.180:5000/api/dashboard/stats

# Check backend logs
cd /home/administrator/Desktop/asset-management
tail -50 backend.log
```

### Check Frontend Status
```bash
# Check if accessible
curl http://192.168.20.180:3000

# Check if serving correctly
curl -I http://192.168.20.180:3000
```

### Check Database
```bash
cd /home/administrator/Desktop/asset-management
python3 check_laptops.py
```

### Check Users
```bash
curl http://192.168.20.180:5000/api/users | python3 -m json.tool
```

---

## 🎯 90% Solution (Works Most of the Time)

**Just run this:**
```bash
cd /home/administrator/Desktop/asset-management && ./restart_backend.sh && echo "✅ Backend restarted! Now refresh your browser with Ctrl+Shift+R"
```

---

## 📱 Browser Issues

### Clear Cache
1. Press `Ctrl+Shift+Delete`
2. Select "Cached images and files"
3. Click "Clear data"
4. Refresh page

### Hard Refresh
- **Chrome/Edge**: `Ctrl+Shift+R` or `Shift+F5`
- **Firefox**: `Ctrl+Shift+R` or `Ctrl+F5`

### Incognito/Private Mode
- Open an incognito window
- Go to `http://192.168.20.180:3000`
- This bypasses all cache

---

## 📝 Maintenance Commands

### View Backend Logs
```bash
cd /home/administrator/Desktop/asset-management
tail -f backend.log
```

### View Running Processes
```bash
# Backend processes
ps aux | grep "python3 app.py"

# Frontend processes  
ps aux | grep "npm"
```

### Kill Specific Process
```bash
# Find the PID first
ps aux | grep "python3 app.py"

# Kill by PID
kill -9 <PID>
```

---

## 🆘 Emergency Recovery

If the system is completely broken:

```bash
# 1. Stop everything
pkill -f "python3 app.py"
pkill -f "npm"
fuser -k 5000/tcp
fuser -k 3000/tcp
sleep 3

# 2. Check database is okay
cd /home/administrator/Desktop/asset-management
python3 check_laptops.py

# 3. Restart backend
source venv/bin/activate
python3 app.py

# 4. In another terminal, restart frontend
cd /home/administrator/Desktop/asset-management/frontend
npm start

# 5. Hard refresh browser
# Press Ctrl+Shift+R
```

---

## 💡 Pro Tips

1. **Always restart backend after code changes** to Python files
2. **Hard refresh browser** (`Ctrl+Shift+R`) after any changes
3. **Check backend logs** if API is not working: `tail backend.log`
4. **Use restart_backend.sh script** - it's the easiest way
5. **Frontend auto-reloads** - you usually don't need to restart it

---

## 🎓 Understanding the Architecture

```
Browser (Port 3000)
    ↓
React Frontend (npm start)
    ↓ API calls
Flask Backend (Port 5000)
    ↓
SQLite Database (assets.db)
```

- **Frontend changes**: Usually auto-reload
- **Backend changes**: Need manual restart
- **Database changes**: Need backend restart to reload

---

## ✅ Prevention Checklist

Before reporting an issue:
- [ ] Tried restarting backend: `./restart_backend.sh`
- [ ] Hard refreshed browser: `Ctrl+Shift+R`
- [ ] Checked backend is running: `lsof -i :5000`
- [ ] Checked frontend is running: `lsof -i :3000`
- [ ] Checked backend logs: `tail backend.log`
- [ ] Tried incognito mode to rule out cache issues

---

**Remember: 90% of issues are solved by restarting the backend!**

```bash
./restart_backend.sh
```
