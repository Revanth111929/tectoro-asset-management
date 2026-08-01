# Asset Management System - Quick Start Guide

## 🚀 Starting the Application

```bash
cd ~/Desktop/asset-management
./start-application.sh
```

## 🛑 Stopping the Application

```bash
cd ~/Desktop/asset-management
./stop-application.sh
```

## 🌐 Access URLs

- **Application:** http://192.168.20.180:3000
- **API:** http://192.168.20.180:3000/api

## 📋 View Logs

```bash
tail -f ~/Desktop/asset-management/logs/backend.log
```

## ✅ Check Status

```bash
# Check if application is running
lsof -ti:3000

# View process details
ps aux | grep "python3 app.py" | grep -v grep
```

## 🔄 Restart Application

```bash
./stop-application.sh
./start-application.sh
```

## 📊 Database Location

`~/Desktop/asset-management/assets.db`

## ⚙️ Configuration Files

- Backend: `app.py`
- Frontend Build: `frontend/build/`
- Frontend API Config: `frontend/.env.production`
- Database: `assets.db`

## 🔑 Default Login

- Username: `admin`
- Password: `admin123`

## 📝 Important Notes

✅ Application runs on **single port 3000**
✅ Backend serves both API and React frontend
✅ Database is **production database** - all data persists
✅ No Docker required
✅ All features working: Assets, Employees, Corporate SIMs, Activity History

## 🆘 Troubleshooting

### Port 3000 already in use
```bash
fuser -k 3000/tcp
./start-application.sh
```

### Backend not responding
```bash
tail -f logs/backend.log
# Check for errors in log file
```

### Database locked
```bash
# Stop application
./stop-application.sh

# Wait 5 seconds
sleep 5

# Restart
./start-application.sh
```

## 📦 Features Available

- ✅ Dashboard with statistics
- ✅ Asset Management (Add, Edit, Delete, View)
- ✅ Employee Management
- ✅ Corporate SIM Inventory
- ✅ Activity History & Audit Logs
- ✅ Excel Import/Export
- ✅ PDF Reports
- ✅ QR Code Generation
- ✅ Asset Lifecycle Tracking
- ✅ Temporary Assignments (Loaner Devices)
- ✅ Onboarding Management

---

**Application Status:** ✅ Running  
**Database:** ✅ Production (78 Assets, 6 Corporate SIMs)  
**Port:** 3000  
**Setup:** Non-Docker Traditional Deployment
