# 🚀 Asset Management System - Quick Start Guide

## ✅ How to Start the Application

### Method 1: Using the Start Script (Recommended)
```bash
cd ~/Desktop/asset-management
bash start_server.sh
```

### Method 2: Manual Start
```bash
cd ~/Desktop/asset-management
source venv/bin/activate
python3 api_server.py
```

---

## 🌐 Access the Application

Once the server starts, you'll see:
```
==================================================
🚀  IT Asset Management API
==================================================
✅  API:    http://0.0.0.0:3000
✅  Health: http://localhost:3000/api/health
⚛️   React:  Served from /frontend/build
==================================================
```

**Open your browser and go to:**
- **Main URL:** http://192.168.20.180:3000
- **Alternative:** http://localhost:3000

---

## 🔐 Default Login Credentials

```
Username: admin
Password: admin123
```

---

## 🛠️ Troubleshooting

### Problem 1: "Cannot connect to server" on login page
**Solution:** Server is not running. Start it using one of the methods above.

### Problem 2: "Not Found" error when refreshing pages
**Solution:** This should be fixed now. If it persists:
1. Stop the server (Ctrl+C)
2. Run: `bash start_server.sh`

### Problem 3: Port 3000 already in use
**Solution:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Start server again
bash start_server.sh
```

### Problem 4: "404 POST /api/auth/login" error
**Solution:** The blueprints weren't registered properly. This is now fixed in the latest version.

### Problem 5: Frontend not loading / blank page
**Solution:** Rebuild the frontend:
```bash
cd ~/Desktop/asset-management/frontend
npm run build
cd ..
bash start_server.sh
```

---

## 📁 Project Structure

```
asset-management/
├── api_server.py          # Main Flask backend (port 3000)
├── routes.py              # Additional API blueprints
├── models.py              # Database models
├── assets.db              # SQLite database
├── frontend/
│   ├── build/            # Production build (served by Flask)
│   └── src/              # React source code
├── start_server.sh       # Startup script
└── venv/                 # Python virtual environment
```

---

## 🔄 How It Works

1. **Flask** runs on port 3000
2. **API routes** are at `/api/*` (handled by Flask)
3. **React app** is served for all other routes (/, /dashboard, /assets, etc.)
4. **React Router** handles client-side navigation
5. **Refreshing any page** serves `index.html` which loads React

---

## 📝 Making Changes

### Backend Changes (Python/Flask)
1. Edit files in root directory (api_server.py, routes.py, models.py)
2. Restart server: Press `Ctrl+C` then run `bash start_server.sh`

### Frontend Changes (React)
1. Edit files in `frontend/src/`
2. Rebuild: `cd frontend && npm run build`
3. Restart server: `cd .. && bash start_server.sh`

---

## 🎯 Features Implemented

✅ Dynamic forms based on asset category  
✅ Asset search and auto-populate in Existing/Old Device page  
✅ Auto-fetch asset details  
✅ Asset timeline and movement history  
✅ Temporary assignments  
✅ Asset replacements  
✅ Warranty tracking  
✅ Activity logs and audit trail  
✅ Dark theme support  
✅ Employee management  
✅ Email acknowledgments  

---

## 🆘 Emergency Reset

If something goes completely wrong:

```bash
cd ~/Desktop/asset-management

# Kill all processes
lsof -ti:3000 | xargs kill -9

# Restart fresh
bash start_server.sh
```

---

## 📞 Need Help?

Check these files for detailed information:
- `TROUBLESHOOTING_GUIDE.md` - Comprehensive troubleshooting
- `EXISTING_DEVICE_UPDATE_FEATURE.md` - Details on the asset update feature
- `AUTO_FETCH_FEATURE_COMPLETE.md` - Auto-fetch documentation
- `ASSET_MOVEMENT_HISTORY_COMPLETE.md` - Timeline feature docs

---

**Last Updated:** June 18, 2026  
**Status:** ✅ FULLY OPERATIONAL
