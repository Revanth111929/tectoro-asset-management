# 🚀 Asset Management System

A complete full-stack web application for managing company assets, built with **React.js** and **Python Flask**.

## ✨ Features

### 📊 Dashboard
- Real-time statistics (Total, Available, Assigned, Maintenance assets)
- Low stock alerts
- Visual charts (Doughnut & Bar charts)
- Recent activity feed

### 💼 Asset Management
- Add, edit, view, and delete assets
- Track serial numbers, categories, vendors
- Monitor purchase dates, warranty expiry
- Asset condition and status tracking
- Stock quantity management
- QR code generation support

### 👥 Employee Management
- Employee records with departments and positions
- Assign assets to employees
- Track assignment history
- Return asset functionality

### 📦 Inventory Control
- Category management
- Vendor management
- Low stock alerts
- Stock quantity tracking

### 📈 Reports & Analytics
- Export data to CSV
- Export data to PDF
- Activity logs and audit trail
- Visual analytics with charts

### 🎨 Modern UI
- Responsive design (works on all devices)
- Dark mode support
- Bootstrap 5 styling
- Smooth animations
- Mobile-friendly sidebar

---

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI library
- **React Router** - Navigation
- **Bootstrap 5** - CSS framework
- **Chart.js** - Data visualization
- **Axios** - HTTP client

### Backend
- **Python 3** - Programming language
- **Flask** - Web framework
- **Flask-CORS** - Cross-origin support
- **SQLite** - Database (optional, using mock data for demo)

---

## 📋 Prerequisites

Before you begin, ensure you have:

- **Ubuntu** (or any Linux distribution)
- **Python 3.8+**
- **Node.js 18+** and **npm**
- **Internet connection** (for initial setup)

---

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

```bash
cd /home/administrator/asset-management
./START_HERE.sh
```

This script will:
- ✅ Check if Node.js and Python are installed
- ✅ Create Python virtual environment
- ✅ Install all dependencies
- ✅ Configure API URL with your IP address
- ✅ Show you how to start the servers

### Option 2: Manual Setup

See **SETUP_GUIDE.md** for detailed step-by-step instructions.

---

## 🎯 Running the Application

You need **TWO terminals** running simultaneously:

### Terminal 1: Start Backend API

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

### Terminal 2: Start React Frontend

```bash
cd /home/administrator/asset-management/frontend
npm start
```

The browser will automatically open at `http://localhost:3000`

---

## 🌐 Accessing from Other Devices

### Find Your IP Address
```bash
hostname -I
```

Example output: `192.168.1.100`

### Access the App
From any device on the same network:

- **Frontend**: `http://192.168.1.100:3000`
- **Backend API**: `http://192.168.1.100:5000`

### From Your Phone/Tablet
1. Connect to the same WiFi network
2. Open browser
3. Navigate to: `http://YOUR_IP:3000`

---

## 🔐 Login Credentials

**Demo Admin Account:**
- Username: `admin`
- Password: `admin123`

---

## 📁 Project Structure

```
asset-management/
├── frontend/                    # React application
│   ├── public/
│   │   └── index.html          # HTML template
│   ├── src/
│   │   ├── components/         # Reusable components
│   │   │   └── Layout.js       # Main layout with sidebar
│   │   ├── pages/              # Page components
│   │   │   ├── LandingPage.js  # Public landing page
│   │   │   ├── LoginPage.js    # Login page
│   │   │   ├── Dashboard.js    # Main dashboard
│   │   │   ├── AssetList.js    # Assets list
│   │   │   ├── AssetAdd.js     # Add asset form
│   │   │   ├── EmployeeList.js # Employees list
│   │   │   └── Reports.js      # Reports page
│   │   ├── services/
│   │   │   └── api.js          # API service layer
│   │   ├── App.js              # Main app component
│   │   ├── App.css             # App styles
│   │   ├── index.js            # Entry point
│   │   └── index.css           # Global styles
│   ├── package.json            # Node dependencies
│   └── .env                    # Environment variables
│
├── api_server.py               # Flask REST API (for React)
├── app.py                      # Flask full-stack app (alternative)
├── models.py                   # Database models
├── routes.py                   # Flask routes
├── requirements.txt            # Python dependencies
├── START_HERE.sh               # Quick start script
├── SETUP_GUIDE.md              # Detailed setup guide
└── README.md                   # This file
```

---

## 🔧 Configuration

### Change API URL

Edit `frontend/.env`:
```env
REACT_APP_API_URL=http://YOUR_IP:5000/api
```

### Change Port Numbers

**Backend (api_server.py):**
```python
app.run(debug=True, host='0.0.0.0', port=5000)  # Change 5000 to your port
```

**Frontend (package.json):**
```json
"scripts": {
  "start": "PORT=3000 react-scripts start"  // Change 3000 to your port
}
```

---

## 🐛 Troubleshooting

### Problem: "Cannot connect to backend"

**Solution:**
1. Check if Flask is running: `curl http://localhost:5000/api/health`
2. Verify CORS is enabled in `api_server.py`
3. Check `.env` file has correct API URL

### Problem: "npm: command not found"

**Solution:**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### Problem: "Port 3000 already in use"

**Solution:**
```bash
sudo kill -9 $(sudo lsof -t -i:3000)
npm start
```

### Problem: Can't access from phone

**Solution:**
1. Check firewall:
   ```bash
   sudo ufw allow 3000/tcp
   sudo ufw allow 5000/tcp
   sudo ufw reload
   ```
2. Verify both devices on same WiFi
3. Ping your server: `ping YOUR_IP`

---

## 📚 API Endpoints

### Authentication
- `POST /api/auth/login` - Login

### Dashboard
- `GET /api/dashboard/stats` - Get statistics
- `GET /api/dashboard/activity` - Get recent activity

### Assets
- `GET /api/assets` - Get all assets
- `GET /api/assets/:id` - Get single asset
- `POST /api/assets` - Create asset
- `PUT /api/assets/:id` - Update asset
- `DELETE /api/assets/:id` - Delete asset

### Employees
- `GET /api/employees` - Get all employees
- `GET /api/employees/:id` - Get single employee
- `POST /api/employees` - Create employee

### Reports
- `GET /api/reports/activity` - Get activity logs
- `GET /api/reports/export/csv` - Export CSV
- `GET /api/reports/export/pdf` - Export PDF

---

## 🎓 Learning Guide

### What is React?
React is a JavaScript library for building user interfaces. It creates interactive web pages that update without reloading.

### What is Flask?
Flask is a Python web framework that creates APIs (backend services) to handle data and business logic.

### How do they work together?
1. **React (Frontend)** - Runs on port 3000, shows the UI
2. **Flask (Backend)** - Runs on port 5000, handles data
3. **Communication** - React sends HTTP requests to Flask
4. **Data Flow** - Flask processes requests and sends JSON responses

### Key Concepts

**Components**: Reusable UI pieces (like LEGO blocks)
```javascript
function Button() {
  return <button>Click me</button>;
}
```

**State**: Data that changes over time
```javascript
const [count, setCount] = useState(0);
```

**API Calls**: Fetching data from backend
```javascript
axios.get('/api/assets').then(response => {
  console.log(response.data);
});
```

---

## 🔄 Development Workflow

### Making Changes

**Frontend (React):**
1. Edit files in `frontend/src/`
2. Save - React auto-reloads!
3. See changes instantly in browser

**Backend (Flask):**
1. Edit `api_server.py`
2. Stop server (Ctrl+C)
3. Restart: `python3 api_server.py`

### Adding a New Page

1. Create `frontend/src/pages/NewPage.js`
2. Add route in `frontend/src/App.js`
3. Add navigation link in `frontend/src/components/Layout.js`

---

## 📊 Sample Data

The system includes:
- ✅ 10 Sample assets (laptops, monitors, printers, etc.)
- ✅ 5 Sample employees
- ✅ 4 Activity log entries
- ✅ Multiple categories and vendors

---

## 🚀 Deployment

### For Production

1. **Build React app:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Serve with Flask:**
   - Configure Flask to serve the `build/` folder
   - Use a production WSGI server (Gunicorn)

3. **Use a real database:**
   - Replace mock data with SQLite/PostgreSQL
   - Implement proper authentication

4. **Security:**
   - Use environment variables for secrets
   - Enable HTTPS
   - Implement proper CORS policies

---

## 🤝 Contributing

This is a learning project. Feel free to:
- Add new features
- Improve the UI
- Fix bugs
- Add tests

---

## 📝 License

This project is for educational purposes.

---

## 💡 Tips

- Keep both terminals open while developing
- Backend must start BEFORE frontend
- Use your actual IP address, not 127.0.0.1
- Test on same computer first, then try other devices
- Check browser console (F12) for errors

---

## 📞 Need Help?

1. Check **SETUP_GUIDE.md** for detailed instructions
2. Look at console output in both terminals
3. Check browser console (F12) for frontend errors
4. Test API directly: `curl http://localhost:5000/api/health`

---

## 🎉 Next Steps

1. ✅ Complete setup
2. ✅ Login with admin/admin123
3. ✅ Explore the dashboard
4. ✅ Add your first asset
5. ✅ Assign asset to employee
6. ✅ Generate reports
7. ✅ Customize the UI
8. ✅ Add new features

---

**Happy Asset Managing! 🚀**
