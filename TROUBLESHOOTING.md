# 🔧 Troubleshooting Guide

Common issues and their solutions.

---

## 🚨 Installation Issues

### Problem: "npm: command not found"

**Cause**: Node.js is not installed

**Solution**:
```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version
npm --version
```

---

### Problem: "python3: command not found"

**Cause**: Python is not installed

**Solution**:
```bash
# Install Python
sudo apt update
sudo apt install python3 python3-pip python3-venv -y

# Verify
python3 --version
pip3 --version
```

---

### Problem: "pip install fails with permission error"

**Cause**: Trying to install globally without sudo

**Solution**:
```bash
# Use virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# OR install with sudo (not recommended)
sudo pip3 install -r requirements.txt
```

---

## 🌐 Network Issues

### Problem: "Cannot access from phone/tablet"

**Checklist**:
1. ✅ Both devices on same WiFi?
2. ✅ Using correct IP (not localhost)?
3. ✅ Firewall allowing ports 3000 and 5000?
4. ✅ Both servers running?

**Solution**:
```bash
# 1. Find your IP
hostname -I
# Example output: 192.168.1.100

# 2. Test from phone browser
# Go to: http://192.168.1.100:3000

# 3. If blocked, allow ports
sudo ufw allow 3000/tcp
sudo ufw allow 5000/tcp
sudo ufw reload

# 4. Test connectivity
# From phone, ping your server:
ping 192.168.1.100
```

---

### Problem: "ERR_CONNECTION_REFUSED"

**Cause**: Server not running or wrong port

**Solution**:
```bash
# Check if servers are running
sudo lsof -i:3000  # Frontend
sudo lsof -i:5000  # Backend

# If nothing shows, start the servers
# Terminal 1:
cd /home/administrator/asset-management
source venv/bin/activate
python3 api_server.py

# Terminal 2:
cd /home/administrator/asset-management/frontend
npm start
```

---

### Problem: "CORS policy error in browser console"

**Error**: "Access to XMLHttpRequest blocked by CORS policy"

**Cause**: Backend not allowing frontend origin

**Solution**:
Check `api_server.py` has:
```python
from flask_cors import CORS
CORS(app, resources={r"/api/*": {"origins": "*"}})
```

If missing, add it and restart backend.

---

## 🔌 Port Issues

### Problem: "Port 3000 already in use"

**Cause**: Another process using port 3000

**Solution**:
```bash
# Find process using port 3000
sudo lsof -i:3000

# Kill the process
sudo kill -9 $(sudo lsof -t -i:3000)

# Or use different port
PORT=3001 npm start
```

---

### Problem: "Port 5000 already in use"

**Cause**: Another process using port 5000

**Solution**:
```bash
# Find process
sudo lsof -i:5000

# Kill it
sudo kill -9 $(sudo lsof -t -i:5000)

# Restart Flask
python3 api_server.py
```

---

## 🐛 Backend Issues

### Problem: "ModuleNotFoundError: No module named 'flask'"

**Cause**: Flask not installed or virtual environment not activated

**Solution**:
```bash
# Activate virtual environment
cd /home/administrator/asset-management
source venv/bin/activate

# You should see (venv) in prompt

# Install dependencies
pip install -r requirements.txt

# Run server
python3 api_server.py
```

---

### Problem: "ImportError: No module named 'flask_cors'"

**Cause**: Flask-CORS not installed

**Solution**:
```bash
source venv/bin/activate
pip install Flask-CORS
# Or
pip install -r requirements.txt
```

---

### Problem: "API returns 404 for all routes"

**Cause**: Wrong URL or API not running

**Solution**:
```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Should return: {"status":"ok","message":"API is running"}

# If 404, check:
# 1. Is api_server.py running?
# 2. Are you using /api/ prefix?
# 3. Check terminal for errors
```

---

## ⚛️ Frontend Issues

### Problem: "npm install fails"

**Cause**: Network issues or corrupted cache

**Solution**:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

---

### Problem: "Module not found: Can't resolve 'react-router-dom'"

**Cause**: Dependencies not installed

**Solution**:
```bash
cd frontend
npm install
```

---

### Problem: "Blank white screen after login"

**Cause**: JavaScript error

**Solution**:
```bash
# 1. Open browser console (F12)
# 2. Check for errors in Console tab
# 3. Common fixes:

# Missing dependencies
cd frontend
npm install

# Clear browser cache
# Ctrl+Shift+Delete > Clear cache

# Restart dev server
# Ctrl+C in Terminal 2
npm start
```

---

### Problem: "Cannot read property 'map' of undefined"

**Cause**: Data not loaded yet

**Solution**:
Check component has loading state:
```javascript
if (!data) return <div>Loading...</div>;
```

Or initialize state properly:
```javascript
const [items, setItems] = useState([]);  // Empty array, not undefined
```

---

## 🔐 Authentication Issues

### Problem: "Invalid credentials" even with correct password

**Cause**: Hardcoded check in LoginPage.js

**Solution**:
Check `frontend/src/pages/LoginPage.js`:
```javascript
if (username === 'admin' && password === 'admin123') {
  // Login success
}
```

Make sure you're using exactly: `admin` / `admin123`

---

### Problem: "Redirects to login after successful login"

**Cause**: Token not saved or authentication check failing

**Solution**:
```javascript
// Check localStorage in browser console (F12)
localStorage.getItem('token')
localStorage.getItem('user')

// Should show values, not null

// If null, check LoginPage.js saves them:
localStorage.setItem('token', 'demo-token-12345');
localStorage.setItem('user', JSON.stringify({ username, email }));
```

---

## 📊 Data Issues

### Problem: "No data showing in dashboard"

**Cause**: API not returning data or frontend not fetching

**Solution**:
```bash
# 1. Test API directly
curl http://localhost:5000/api/dashboard/stats

# Should return JSON with stats

# 2. Check browser console (F12)
# Look for API errors

# 3. Check Network tab in DevTools
# See if requests are being made
```

---

### Problem: "Charts not displaying"

**Cause**: Chart.js not installed or data format wrong

**Solution**:
```bash
# Install Chart.js
cd frontend
npm install chart.js react-chartjs-2

# Check data format in Dashboard.js
const data = {
  labels: ['Label1', 'Label2'],
  datasets: [{
    data: [10, 20],
    backgroundColor: ['#color1', '#color2']
  }]
};
```

---

## 🎨 UI Issues

### Problem: "Styles not loading / looks broken"

**Cause**: Bootstrap not loaded or CSS file missing

**Solution**:
```bash
# Check index.js imports Bootstrap
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

# Reinstall if needed
cd frontend
npm install bootstrap bootstrap-icons
```

---

### Problem: "Sidebar not showing"

**Cause**: Layout component not wrapping page

**Solution**:
Check `App.js` wraps protected routes:
```javascript
<Route path="/dashboard" element={
  <Layout><Dashboard /></Layout>
} />
```

---

### Problem: "Dark mode not working"

**Cause**: Theme toggle not implemented or CSS missing

**Solution**:
Check `Layout.js` has theme toggle:
```javascript
const [theme, setTheme] = useState('light');
document.documentElement.setAttribute('data-theme', theme);
```

---

## 🔄 Development Issues

### Problem: "Changes not reflecting"

**Cause**: Browser cache or server not reloading

**Solution**:
```bash
# Frontend (React auto-reloads)
# Just save the file

# If not working:
# 1. Hard refresh: Ctrl+Shift+R
# 2. Clear cache: Ctrl+Shift+Delete
# 3. Restart: Ctrl+C then npm start

# Backend (Flask needs restart)
# 1. Stop: Ctrl+C
# 2. Start: python3 api_server.py
```

---

### Problem: "Hot reload not working"

**Cause**: File watcher limit reached

**Solution**:
```bash
# Increase file watcher limit
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

---

## 🗄️ Database Issues (Future)

### Problem: "Database locked"

**Cause**: SQLite file locked by another process

**Solution**:
```bash
# Find process using database
sudo lsof assets.db

# Kill it
sudo kill -9 <PID>
```

---

## 🚀 Performance Issues

### Problem: "App is slow"

**Causes & Solutions**:

1. **Too many re-renders**
   ```javascript
   // Use React.memo for expensive components
   export default React.memo(MyComponent);
   ```

2. **Large data sets**
   ```javascript
   // Implement pagination
   const [page, setPage] = useState(1);
   const itemsPerPage = 10;
   ```

3. **Unoptimized images**
   ```bash
   # Compress images before using
   # Use WebP format
   ```

---

## 🔍 Debugging Tips

### Check Backend Logs
```bash
# Terminal 1 shows Flask logs
# Look for:
# - 200 OK (success)
# - 404 Not Found (wrong URL)
# - 500 Internal Server Error (backend error)
```

### Check Frontend Console
```bash
# Press F12 in browser
# Console tab shows:
# - JavaScript errors
# - API call results
# - console.log() output
```

### Check Network Tab
```bash
# F12 > Network tab
# Shows:
# - All HTTP requests
# - Request/response data
# - Status codes
# - Timing
```

### Test API Directly
```bash
# Use curl to test backend
curl http://localhost:5000/api/health
curl http://localhost:5000/api/assets
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

---

## 📞 Getting Help

### Before Asking for Help

1. ✅ Read error message carefully
2. ✅ Check this troubleshooting guide
3. ✅ Search error message online
4. ✅ Check browser console (F12)
5. ✅ Check terminal output
6. ✅ Try restarting servers

### Information to Provide

When asking for help, include:
- Error message (full text)
- What you were trying to do
- Steps to reproduce
- Terminal output
- Browser console output
- Operating system
- Node.js version (`node --version`)
- Python version (`python3 --version`)

---

## 🛠️ Useful Commands

```bash
# Check what's running on ports
sudo lsof -i:3000
sudo lsof -i:5000

# Kill process on port
sudo kill -9 $(sudo lsof -t -i:3000)

# Check Python packages
pip list

# Check npm packages
npm list --depth=0

# Clear npm cache
npm cache clean --force

# Reinstall everything
rm -rf node_modules package-lock.json
npm install

# Check system resources
htop  # or top

# Check disk space
df -h

# Check memory
free -h

# Find your IP
hostname -I
ip addr show

# Test network connectivity
ping 192.168.1.100
curl http://192.168.1.100:5000/api/health

# Check firewall status
sudo ufw status

# View logs
journalctl -xe
```

---

## ✅ Quick Fixes Checklist

When something breaks, try these in order:

1. ☐ Hard refresh browser (Ctrl+Shift+R)
2. ☐ Check both terminals are running
3. ☐ Restart backend (Ctrl+C, then python3 api_server.py)
4. ☐ Restart frontend (Ctrl+C, then npm start)
5. ☐ Check browser console for errors (F12)
6. ☐ Test API: curl http://localhost:5000/api/health
7. ☐ Clear browser cache
8. ☐ Reinstall dependencies (npm install)
9. ☐ Reboot computer (last resort)

---

**Still stuck? Check README.md or SETUP_GUIDE.md for more details! 🚀**
