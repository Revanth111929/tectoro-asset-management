# 🎯 Getting Started - Asset Management System

## 👋 Welcome!

This is a **complete web application** built with **React.js** (frontend) and **Python Flask** (backend). You can access it from **any device** on your network using your computer's IP address.

---

## 🚦 Step-by-Step Guide (For Beginners)

### Step 1: Check Requirements ✅

Open terminal and run:

```bash
cd /home/administrator/asset-management
./check_requirements.sh
```

This will tell you if you have everything installed.

**If something is missing**, the script will show you how to install it.

---

### Step 2: Install Dependencies 📦

Run the automated setup:

```bash
./START_HERE.sh
```

This will:
- Install all Python packages
- Install all Node.js packages
- Configure your IP address automatically
- Show you what to do next

**This may take 3-5 minutes** (downloading packages).

---

### Step 3: Start the Backend 🔧

Open **Terminal 1** and run:

```bash
cd /home/administrator/asset-management
source venv/bin/activate
python3 api_server.py
```

You should see:
```
🚀 Asset Management API Server
✅ API running on: http://0.0.0.0:5000
```

**✨ Keep this terminal open!** Don't close it.

---

### Step 4: Start the Frontend ⚛️

Open **Terminal 2** (new terminal window) and run:

```bash
cd /home/administrator/asset-management/frontend
npm start
```

After a few seconds, your browser will automatically open to:
```
http://localhost:3000
```

**✨ Keep this terminal open too!**

---

### Step 5: Login 🔐

You'll see a beautiful login page. Use these credentials:

- **Username**: `admin`
- **Password**: `admin123`

Click **LOGIN** and you're in! 🎉

---

## 📱 Access from Phone/Tablet

### Find Your IP Address

In Terminal 1 (where backend is running), you'll see:
```
📱 Access from network: http://YOUR_IP:5000
```

Or run:
```bash
hostname -I
```

Example: `192.168.1.100`

### Open on Your Phone

1. Connect phone to **same WiFi** as your computer
2. Open browser on phone
3. Go to: `http://192.168.1.100:3000` (use YOUR IP)
4. Login with admin/admin123

---

## 🎨 What You'll See

### Landing Page
Beautiful gradient hero section with features

### Login Page
Split-screen design with animated background

### Dashboard
- 4 stat cards (Total, Available, Assigned, Maintenance)
- 2 charts (Doughnut & Bar)
- Recent activity table
- Low stock alerts

### Assets Page
- List of all assets
- Search functionality
- Add/Edit/View buttons
- Status badges

### Employees Page
- Employee list
- Assign assets to employees
- Department and position info

### Reports Page
- Export to CSV
- Export to PDF
- Activity logs

---

## 🛑 How to Stop

### Stop Frontend (Terminal 2)
Press `Ctrl + C`

### Stop Backend (Terminal 1)
Press `Ctrl + C`

---

## 🔄 How to Restart

Just repeat Steps 3 and 4:

**Terminal 1:**
```bash
cd /home/administrator/asset-management
source venv/bin/activate
python3 api_server.py
```

**Terminal 2:**
```bash
cd /home/administrator/asset-management/frontend
npm start
```

---

## 📂 Understanding the Files

### Frontend (React) - `frontend/` folder
- **src/pages/** - Different pages (Dashboard, Login, etc.)
- **src/components/** - Reusable parts (Sidebar, Navbar)
- **src/services/api.js** - Talks to backend
- **package.json** - Lists all JavaScript libraries needed

### Backend (Flask) - Root folder
- **api_server.py** - The API server (handles data)
- **requirements.txt** - Lists all Python libraries needed

---

## 🎓 Learning Path

### Day 1: Explore
- Login and explore all pages
- Add a test asset
- View the dashboard charts
- Check activity logs

### Day 2: Understand Structure
- Look at `frontend/src/App.js` - routing
- Look at `frontend/src/pages/Dashboard.js` - a page
- Look at `api_server.py` - backend API

### Day 3: Make Changes
- Change a color in `frontend/src/App.css`
- Add a new stat card in Dashboard
- Modify the landing page text

### Day 4: Add Features
- Add a new field to asset form
- Create a new page
- Add a new API endpoint

---

## 🐛 Common Issues

### Issue: "Cannot connect to backend"

**Check:**
1. Is Terminal 1 (backend) still running?
2. Do you see "API running on http://0.0.0.0:5000"?
3. Test: Open `http://localhost:5000/api/health` in browser

**Fix:**
- Restart backend (Terminal 1)
- Check if port 5000 is free: `sudo lsof -i:5000`

---

### Issue: "Port 3000 already in use"

**Fix:**
```bash
sudo kill -9 $(sudo lsof -t -i:3000)
npm start
```

---

### Issue: Can't access from phone

**Check:**
1. Phone on same WiFi? ✅
2. Using correct IP? (not 127.0.0.1 or localhost)
3. Firewall blocking?

**Fix firewall:**
```bash
sudo ufw allow 3000/tcp
sudo ufw allow 5000/tcp
sudo ufw reload
```

---

## 💡 Pro Tips

1. **Two terminals** - Always keep both running
2. **Backend first** - Start backend before frontend
3. **Save often** - React auto-reloads when you save
4. **Check console** - Press F12 in browser to see errors
5. **Read errors** - Error messages tell you what's wrong

---

## 📚 Resources

### Inside This Project
- **README.md** - Complete documentation
- **SETUP_GUIDE.md** - Detailed setup instructions
- **check_requirements.sh** - Check if software installed
- **START_HERE.sh** - Automated setup

### Learn More
- React: https://react.dev/learn
- Flask: https://flask.palletsprojects.com/
- Bootstrap: https://getbootstrap.com/docs/

---

## 🎯 Quick Commands Reference

```bash
# Check requirements
./check_requirements.sh

# Setup everything
./START_HERE.sh

# Start backend
source venv/bin/activate && python3 api_server.py

# Start frontend (in new terminal)
cd frontend && npm start

# Find your IP
hostname -I

# Check if port is in use
sudo lsof -i:3000
sudo lsof -i:5000

# Kill process on port
sudo kill -9 $(sudo lsof -t -i:3000)
```

---

## ✅ Checklist

Before asking for help, check:

- [ ] Ran `./check_requirements.sh` - all green?
- [ ] Ran `./START_HERE.sh` - completed successfully?
- [ ] Backend running in Terminal 1?
- [ ] Frontend running in Terminal 2?
- [ ] Can access `http://localhost:3000`?
- [ ] Can login with admin/admin123?
- [ ] Checked browser console (F12) for errors?
- [ ] Checked terminal output for errors?

---

## 🎉 You're Ready!

Everything is set up. Now:

1. ✅ Start backend (Terminal 1)
2. ✅ Start frontend (Terminal 2)
3. ✅ Open http://localhost:3000
4. ✅ Login with admin/admin123
5. ✅ Explore and have fun!

**Questions?** Check README.md or SETUP_GUIDE.md

**Happy coding! 🚀**
