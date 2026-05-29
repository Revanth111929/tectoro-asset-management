# 🏗️ System Architecture

## Overview

This is a **full-stack web application** with a clear separation between frontend and backend.

```
┌─────────────────────────────────────────────────────────────┐
│                     USER DEVICES                            │
│  💻 Computer    📱 Phone    🖥️ Tablet    💻 Laptop         │
│                                                             │
│  All connected to same WiFi network                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP Requests
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   YOUR COMPUTER                             │
│                                                             │
│  ┌──────────────────────┐      ┌──────────────────────┐   │
│  │   FRONTEND           │      │   BACKEND            │   │
│  │   React.js           │◄────►│   Flask API          │   │
│  │   Port: 3000         │      │   Port: 5000         │   │
│  │                      │      │                      │   │
│  │  • Landing Page      │      │  • REST API          │   │
│  │  • Login Page        │      │  • JSON Responses    │   │
│  │  • Dashboard         │      │  • CORS Enabled      │   │
│  │  • Assets            │      │  • Mock Data         │   │
│  │  • Employees         │      │                      │   │
│  │  • Reports           │      │                      │   │
│  └──────────────────────┘      └──────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Request Flow

### Example: User Views Dashboard

```
1. User opens browser
   └─► http://192.168.1.100:3000

2. React app loads
   └─► Shows Dashboard component

3. Dashboard needs data
   └─► Calls: axios.get('/api/dashboard/stats')

4. Request goes to Flask
   └─► http://192.168.1.100:5000/api/dashboard/stats

5. Flask processes request
   └─► Fetches data (from mock data or database)
   └─► Returns JSON: { totalAssets: 10, assigned: 2, ... }

6. React receives data
   └─► Updates state
   └─► Re-renders UI with new data

7. User sees updated dashboard
   └─► Charts, stats, tables all populated
```

---

## 📦 Component Structure

### Frontend (React)

```
frontend/
│
├── public/
│   └── index.html              # HTML template
│
├── src/
│   ├── index.js                # Entry point
│   ├── App.js                  # Main app with routing
│   │
│   ├── components/
│   │   └── Layout.js           # Sidebar + Navbar wrapper
│   │
│   ├── pages/
│   │   ├── LandingPage.js      # Public homepage
│   │   ├── LoginPage.js        # Login form
│   │   ├── Dashboard.js        # Main dashboard
│   │   ├── AssetList.js        # List all assets
│   │   ├── AssetAdd.js         # Add asset form
│   │   ├── AssetEdit.js        # Edit asset form
│   │   ├── AssetView.js        # View asset details
│   │   ├── EmployeeList.js     # List employees
│   │   ├── EmployeeAdd.js      # Add employee form
│   │   └── Reports.js          # Reports & exports
│   │
│   ├── services/
│   │   └── api.js              # API calls (axios)
│   │
│   └── styles/
│       ├── App.css             # App-wide styles
│       ├── LandingPage.css     # Landing page styles
│       └── LoginPage.css       # Login page styles
│
└── package.json                # Dependencies
```

### Backend (Flask)

```
api_server.py                   # Main API server
│
├── Routes:
│   ├── /api/health             # Health check
│   ├── /api/auth/login         # Login
│   ├── /api/dashboard/stats    # Dashboard stats
│   ├── /api/dashboard/activity # Recent activity
│   ├── /api/assets             # CRUD assets
│   ├── /api/employees          # CRUD employees
│   ├── /api/categories         # Get categories
│   ├── /api/vendors            # Get vendors
│   └── /api/reports/activity   # Activity logs
│
└── Data:
    ├── ASSETS[]                # Mock asset data
    ├── EMPLOYEES[]             # Mock employee data
    └── ACTIVITY_LOGS[]         # Mock activity logs
```

---

## 🔐 Authentication Flow

```
┌──────────┐
│  User    │
└────┬─────┘
     │
     │ 1. Enters username/password
     ▼
┌──────────────────┐
│  LoginPage.js    │
└────┬─────────────┘
     │
     │ 2. POST /api/auth/login
     ▼
┌──────────────────┐
│  Flask API       │
│  (api_server.py) │
└────┬─────────────┘
     │
     │ 3. Validates credentials
     │    (admin/admin123)
     ▼
┌──────────────────┐
│  Returns:        │
│  {               │
│    token: "...", │
│    user: {...}   │
│  }               │
└────┬─────────────┘
     │
     │ 4. Saves to localStorage
     ▼
┌──────────────────┐
│  localStorage    │
│  - token         │
│  - user          │
└────┬─────────────┘
     │
     │ 5. Redirects to /dashboard
     ▼
┌──────────────────┐
│  Dashboard       │
│  (Protected)     │
└──────────────────┘
```

---

## 🌐 Network Architecture

### Local Access (Same Computer)

```
Browser ──► http://localhost:3000 ──► React Dev Server
                                       │
                                       │ API calls
                                       ▼
                              http://localhost:5000 ──► Flask API
```

### Network Access (Other Devices)

```
Phone/Tablet ──► http://192.168.1.100:3000 ──► React Dev Server
                                                 │
                                                 │ API calls
                                                 ▼
                                        http://192.168.1.100:5000 ──► Flask API
```

---

## 📊 Data Flow Example: Adding an Asset

```
1. User fills form in AssetAdd.js
   ├─ Name: "Dell Laptop"
   ├─ Serial: "SN-001"
   └─ Category: "Laptop"

2. User clicks "Save Asset"
   └─► handleSubmit() function runs

3. API call made
   └─► axios.post('/api/assets', formData)

4. Request sent to Flask
   └─► POST http://192.168.1.100:5000/api/assets
       Body: { name: "Dell Laptop", serial: "SN-001", ... }

5. Flask receives request
   └─► @app.route('/api/assets', methods=['POST'])
   └─► Validates data
   └─► Adds to ASSETS array
   └─► Returns: { success: true, asset: {...} }

6. React receives response
   └─► Shows success message
   └─► Redirects to /assets

7. AssetList.js loads
   └─► Fetches updated list
   └─► Displays new asset in table
```

---

## 🎨 UI Component Hierarchy

```
App.js
│
├─► LandingPage.js (Public)
│
├─► LoginPage.js (Public)
│
└─► Layout.js (Protected)
    │
    ├─► Sidebar
    │   ├─ Brand logo
    │   ├─ Navigation links
    │   └─ Logout button
    │
    ├─► TopNavbar
    │   ├─ Sidebar toggle
    │   ├─ Theme toggle
    │   ├─ Notifications
    │   └─ User menu
    │
    └─► Page Content
        ├─► Dashboard.js
        │   ├─ Stat cards
        │   ├─ Charts (Doughnut, Bar)
        │   └─ Activity table
        │
        ├─► AssetList.js
        │   ├─ Search bar
        │   ├─ Filter dropdowns
        │   └─ Assets table
        │
        ├─► AssetAdd.js
        │   └─ Form with fields
        │
        ├─► EmployeeList.js
        │   └─ Employees table
        │
        └─► Reports.js
            ├─ Export buttons
            └─ Activity log table
```

---

## 🔧 Technology Stack Details

### Frontend Technologies

| Technology | Purpose | Version |
|------------|---------|---------|
| React | UI Library | 18.2.0 |
| React Router | Navigation | 6.22.0 |
| Axios | HTTP Client | 1.6.7 |
| Bootstrap | CSS Framework | 5.3.3 |
| Chart.js | Data Visualization | 4.4.1 |
| React-ChartJS-2 | Chart.js wrapper | 5.2.0 |

### Backend Technologies

| Technology | Purpose | Version |
|------------|---------|---------|
| Python | Language | 3.8+ |
| Flask | Web Framework | 3.0.3 |
| Flask-CORS | Cross-Origin Support | 4.0.0 |

---

## 🚀 Deployment Architecture

### Development (Current)

```
┌─────────────────────────────────────┐
│  Development Server                 │
│                                     │
│  React Dev Server (Port 3000)      │
│  ├─ Hot reload                      │
│  ├─ Source maps                     │
│  └─ Development build               │
│                                     │
│  Flask Dev Server (Port 5000)      │
│  ├─ Debug mode                      │
│  ├─ Auto-reload                     │
│  └─ Mock data                       │
└─────────────────────────────────────┘
```

### Production (Future)

```
┌─────────────────────────────────────┐
│  Production Server                  │
│                                     │
│  Nginx (Port 80/443)               │
│  ├─ Serves React build/            │
│  ├─ Proxies API to Flask           │
│  └─ SSL/HTTPS                       │
│                                     │
│  Gunicorn + Flask (Port 5000)      │
│  ├─ Production mode                 │
│  ├─ Multiple workers                │
│  └─ Real database (PostgreSQL)     │
└─────────────────────────────────────┘
```

---

## 📡 API Communication

### Request Format

```javascript
// Frontend (React)
axios.post('/api/assets', {
  name: 'Dell Laptop',
  serialNumber: 'SN-001',
  category: 'Laptop',
  status: 'Available'
}, {
  headers: {
    'Authorization': 'Bearer token-here',
    'Content-Type': 'application/json'
  }
});
```

### Response Format

```json
{
  "success": true,
  "asset": {
    "id": 11,
    "name": "Dell Laptop",
    "serialNumber": "SN-001",
    "category": "Laptop",
    "status": "Available"
  }
}
```

---

## 🔒 Security Considerations

### Current (Development)
- ✅ CORS enabled for localhost
- ✅ Basic authentication
- ✅ Token stored in localStorage
- ⚠️ No HTTPS (local network)
- ⚠️ Hardcoded credentials

### Production Recommendations
- 🔐 Use HTTPS/SSL
- 🔐 Implement JWT tokens
- 🔐 Hash passwords (bcrypt)
- 🔐 Environment variables for secrets
- 🔐 Rate limiting
- 🔐 Input validation
- 🔐 SQL injection prevention
- 🔐 XSS protection

---

## 📈 Scalability Path

### Phase 1: Current (Learning)
- Mock data in memory
- Single server
- Development mode

### Phase 2: Small Team
- SQLite database
- File-based storage
- Single production server

### Phase 3: Growing
- PostgreSQL database
- Redis for caching
- Load balancer
- Multiple app servers

### Phase 4: Enterprise
- Microservices architecture
- Kubernetes deployment
- Cloud hosting (AWS/Azure)
- CDN for static assets
- Monitoring & logging

---

## 🎯 Key Concepts

### Frontend (React)
- **Components**: Reusable UI pieces
- **State**: Data that changes
- **Props**: Data passed to components
- **Hooks**: useState, useEffect, etc.
- **Routing**: Different pages/URLs

### Backend (Flask)
- **Routes**: URL endpoints
- **Request**: Data from client
- **Response**: Data to client
- **JSON**: Data format
- **CORS**: Cross-origin permissions

### Communication
- **HTTP**: Protocol for web
- **REST API**: Standard for APIs
- **GET**: Fetch data
- **POST**: Create data
- **PUT**: Update data
- **DELETE**: Remove data

---

**Understanding this architecture will help you build and modify the application! 🚀**
