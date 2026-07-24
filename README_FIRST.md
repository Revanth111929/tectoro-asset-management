# 🚀 Quick Reference - Fix Any Issue

## ⚡ Super Quick Fix (90% of problems)

If anything is not working, just run:

```bash
cd /home/administrator/Desktop/asset-management
./fix.sh
```

Then press `Ctrl+Shift+R` in your browser.

---

## 🎯 Common Issues & Solutions

| Problem | Solution |
|---------|----------|
| "Failed to load users" | `./fix.sh` then refresh browser |
| Dashboard not updating | `./fix.sh` then refresh browser |
| API returning 404 | `./fix.sh` then refresh browser |
| Changes not showing | `./fix.sh` then refresh browser |

---

## 📋 Available Fix Scripts

### `./fix.sh` 
**Use this 90% of the time**
- Restarts backend
- Fixes most issues
- Takes 5 seconds

### `./restart_backend.sh`
**Same as fix.sh, just more detailed**
- Shows what it's doing
- Tests the API
- Provides next steps

### `python3 check_laptops.py`
**Check database status**
- Shows laptop counts
- Shows status breakdown
- Verifies database is working

### `python3 set_laptops_available.py`
**Change laptop statuses**
- Set laptops to Available
- Interactive script
- Clears employee info

### `python3 add_viewer_user.py`
**Add read-only users**
- Create viewer accounts
- Read-only access
- Interactive script

---

## 🔄 Start/Restart Commands

### Backend (Port 5000)
```bash
# Start manually
cd /home/administrator/Desktop/asset-management
source venv/bin/activate
python3 app.py

# Or use the script (recommended)
./restart_backend.sh
```

### Frontend (Port 3000)
```bash
cd /home/administrator/Desktop/asset-management/frontend
npm start
```

---

## 🔍 Check If Services Are Running

### Backend (should show process on port 5000)
```bash
lsof -i :5000
```

### Frontend (should show process on port 3000)
```bash
lsof -i :3000
```

---

## 🌐 Access URLs

- **Frontend (Main App)**: http://192.168.20.180:3000
- **Backend API**: http://192.168.20.180:5000/api

---

## 👥 Default Login

- **Username**: admin
- **Password**: admin
- **Role**: admin (full access)

---

## 📚 Documentation Files

- **QUICK_FIX.md** - Detailed troubleshooting guide
- **ROLE_BASED_ACCESS_GUIDE.md** - User roles and permissions
- **COMPLETED_FEATURES.md** - All implemented features
- **EMAIL_SETUP_GUIDE.md** - Email notification setup
- **USER_MANAGEMENT_FIXED.md** - User management guide

---

## 🛠️ Useful Commands

```bash
# Fix any issue (USE THIS FIRST)
./fix.sh

# Check database
python3 check_laptops.py

# View backend logs
tail -50 backend.log

# Test API
curl http://192.168.20.180:5000/api/dashboard/stats

# Test users endpoint
curl http://192.168.20.180:5000/api/users
```

---

## 🚨 Emergency Recovery

If everything is broken:

```bash
# Kill all processes
pkill -f "python3 app.py"
fuser -k 5000/tcp
sleep 2

# Restart
cd /home/administrator/Desktop/asset-management
./restart_backend.sh

# Refresh browser with Ctrl+Shift+R
```

---

## 💡 Remember

1. **Backend changes** (Python files) → Need restart
2. **Frontend changes** (React files) → Auto-reload (usually)
3. **Database changes** → Need backend restart
4. **Browser cache** → Press `Ctrl+Shift+R` to clear

---

## ✅ Quick Health Check

Run these to verify everything is working:

```bash
# 1. Check backend
curl http://192.168.20.180:5000/api/dashboard/stats

# 2. Check users
curl http://192.168.20.180:5000/api/users

# 3. Check database
python3 check_laptops.py
```

All should return data without errors.

---

## 🎓 When to Use What

| Situation | Command |
|-----------|---------|
| Something not working | `./fix.sh` |
| Backend not responding | `./restart_backend.sh` |
| Check database | `python3 check_laptops.py` |
| Add viewer user | `python3 add_viewer_user.py` |
| View logs | `tail -50 backend.log` |

---

## 📞 Quick Support Checklist

Before asking for help, try:
1. ✅ Run `./fix.sh`
2. ✅ Press `Ctrl+Shift+R` in browser
3. ✅ Check `tail -50 backend.log`
4. ✅ Try incognito mode

90% of issues will be solved by step 1 & 2!

---

**Remember: When in doubt, run `./fix.sh` and refresh your browser! 🚀**
