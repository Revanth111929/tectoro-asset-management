# 🚀 Asset Management System - Complete Setup Guide

## 📋 What You're Building
A full-stack web application with:
- **Frontend**: React.js (runs on port 3000)
- **Backend**: Python Flask API (runs on port 5000)
- **Database**: SQLite
- **Access**: From any device on your network via IP address

---

## 🛠️ Step 1: Install Required Software on Ubuntu

### 1.1 Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 Install Python 3 and pip
```bash
sudo apt install python3 python3-pip python3-venv -y
```

### 1.3 Install Node.js and npm (for React)
```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

### 1.4 Find Your IP Address
```bash
hostname -I
```
**Example output**: `192.168.1.100` ← This is your IP address

---

## 🔧 Step 2: Setup Backend (Flask API)

### 2.1 Navigate to project folder
```bash
cd /home/administrator/asset-management
```

### 2.2 Create Python virtual environment
```bash
python3 -m venv venv
```

### 2.3 Activate virtual environment
```bash
source venv/bin/activate
```
You'll see `(venv)` in your terminal prompt.

### 2.4 Install Python dependencies
```bash
pip install -r requirements.txt
```

### 2.5 Test the backend
```bash
python3 app.py
```

You should see:
```
🌱 Seeding sample data...
✅ Sample data seeded successfully!
 * Running on http://0.0.0.0:5000
```

**Keep this terminal open!** The backend is now running.

Open a browser and test: `http://localhost:5000/api/health`

---

## ⚛️ Step 3: Setup Frontend (React)

### 3.1 Open a NEW terminal (keep backend running)
```bash
cd /home/administrator/asset-management/frontend
```

### 3.2 Install React dependencies
```bash
npm install
```
This will take 2-5 minutes.

### 3.3 Configure API URL for network access
Create a `.env` file:
```bash
nano .env
```

Add this line (replace with YOUR IP from Step 1.4):
```
REACT_APP_API_URL=http://192.168.1.100:5000/api
```

Press `Ctrl+X`, then `Y`, then `Enter` to save.

### 3.4 Start React development server
```bash
npm start
```

The app will open automatically at `http://localhost:3000`

---

## 🌐 Step 4: Access from Other Devices

### 4.1 On the same computer
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`

### 4.2 From other devices on your network
Replace `192.168.1.100` with YOUR IP address:

- **Frontend**: `http://192.168.1.100:3000`
- **Backend API**: `http://192.168.1.100:5000`

### 4.3 Test from your phone/tablet
1. Connect to the same WiFi network
2. Open browser
3. Go to: `http://192.168.1.100:3000`

---

## 🔐 Step 5: Login Credentials

### Demo Admin Account
- **Username**: `admin`
- **Password**: `admin123`

---

## 📱 Step 6: Firewall Configuration (if needed)

If you can't access from other devices:

```bash
# Allow ports 3000 and 5000
sudo ufw allow 3000/tcp
sudo ufw allow 5000/tcp
sudo ufw reload
```

---

## 🎯 Quick Start Commands

### Start Backend
```bash
cd /home/administrator/asset-management
source venv/bin/activate
python3 app.py
```

### Start Frontend (in new terminal)
```bash
cd /home/administrator/asset-management/frontend
npm start
```

---

## 🐛 Troubleshooting

### Problem: "Cannot connect to backend"
**Solution**: Check if Flask is running on `0.0.0.0:5000` (not `127.0.0.1`)

### Problem: "npm: command not found"
**Solution**: Install Node.js again (Step 1.3)

### Problem: "Port 3000 already in use"
**Solution**: 
```bash
# Kill process on port 3000
sudo kill -9 $(sudo lsof -t -i:3000)
npm start
```

### Problem: Can't access from phone
**Solution**: 
1. Check firewall (Step 6)
2. Verify both devices on same WiFi
3. Ping your server: `ping 192.168.1.100`

---

## 📂 Project Structure

```
asset-management/
├── app.py                 # Flask backend entry point
├── models.py              # Database models
├── routes.py              # API endpoints
├── requirements.txt       # Python dependencies
├── assets.db              # SQLite database (auto-created)
├── frontend/              # React application
│   ├── src/
│   │   ├── App.js         # Main React component
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable components
│   │   └── services/      # API calls
│   ├── public/
│   └── package.json       # Node dependencies
└── static/
    └── qrcodes/           # Generated QR codes
```

---

## 🎓 Learning Resources

### What is React?
React is a JavaScript library for building user interfaces. It runs in the browser.

### What is Flask?
Flask is a Python web framework that creates APIs (backend services).

### How do they work together?
1. React (frontend) runs on port 3000 - shows the UI
2. Flask (backend) runs on port 5000 - handles data
3. React sends requests to Flask to get/save data
4. Flask talks to SQLite database

---

## 🔄 Making Changes

### Change backend code (Python)
1. Edit `app.py`, `models.py`, or `routes.py`
2. Stop Flask (Ctrl+C)
3. Restart: `python3 app.py`

### Change frontend code (React)
1. Edit files in `frontend/src/`
2. React auto-reloads - just save the file!

---

## 📊 Sample Data Included

The system comes with:
- ✅ 1 Admin user (admin/admin123)
- ✅ 10 Sample assets
- ✅ 5 Sample employees
- ✅ 4 Vendors
- ✅ 8 Categories
- ✅ 2 Active assignments

---

## 🚀 Next Steps

1. ✅ Complete setup (Steps 1-3)
2. ✅ Login with admin/admin123
3. ✅ Explore the dashboard
4. ✅ Add your first real asset
5. ✅ Assign asset to employee
6. ✅ Generate reports

---

## 💡 Tips

- Keep both terminals open (backend + frontend)
- Backend must start BEFORE frontend
- Use your actual IP address, not 127.0.0.1
- Test on same computer first, then try other devices

---

## 📞 Need Help?

Check the console output in both terminals for error messages.

**Common commands**:
```bash
# Check if ports are in use
sudo lsof -i:3000
sudo lsof -i:5000

# Get your IP again
hostname -I

# Restart everything
# Terminal 1: Ctrl+C, then: python3 app.py
# Terminal 2: Ctrl+C, then: npm start
```

---

**🎉 You're all set! Happy asset managing!**
