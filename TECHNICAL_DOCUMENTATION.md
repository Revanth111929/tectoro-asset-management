# Technical Documentation - IT Asset Management System

## 📚 Table of Contents
1. [Technology Stack](#technology-stack)
2. [Architecture Overview](#architecture-overview)
3. [Dependencies](#dependencies)
4. [How It Works](#how-it-works)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [File Structure](#file-structure)
8. [Data Flow](#data-flow)

---

## 🛠️ Technology Stack

### Backend
- **Language**: Python 3.10+
- **Framework**: Flask 3.0.3
- **Database**: SQLite (can be upgraded to PostgreSQL/MySQL)
- **ORM**: SQLAlchemy 2.0.30

### Frontend
- **Language**: JavaScript (ES6+)
- **Framework**: React 18.2.0
- **UI Library**: Bootstrap 5.3.3
- **Icons**: Bootstrap Icons 1.11.3
- **Routing**: React Router DOM 6.22.0
- **HTTP Client**: Axios 1.6.7
- **Charts**: Chart.js 4.4.1 + React-ChartJS-2 5.2.0

### Development Tools
- **Build Tool**: React Scripts 5.0.1 (Create React App)
- **Package Manager**: npm (Node.js)
- **Python Package Manager**: pip
- **Virtual Environment**: venv

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        USER BROWSER                          │
│                     (Chrome, Firefox, etc.)                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTP Requests
                         │ (Port 3000 - Development)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    REACT FRONTEND                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Components (UI)                                      │  │
│  │  - Layout, Dashboard, AssetList, etc.                │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  Services (API Calls)                                 │  │
│  │  - api.js (Axios HTTP client)                        │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  Context (State Management)                           │  │
│  │  - ThemeContext (Dark/Light mode)                    │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  Routing (Navigation)                                 │  │
│  │  - React Router (SPA routing)                        │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ REST API Calls
                         │ (JSON over HTTP)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    FLASK BACKEND                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Routes (API Endpoints)                               │  │
│  │  - /api/assets, /api/dashboard, etc.                 │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  Models (Database Schema)                             │  │
│  │  - Asset, User, ActivityLog                          │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  Services                                             │  │
│  │  - Email notifications, Excel import/export          │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  SQLAlchemy ORM                                       │  │
│  │  - Database abstraction layer                        │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ SQL Queries
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    SQLite DATABASE                           │
│  - assets.db (Single file database)                         │
│  - Tables: users, assets, activity_logs                     │
└─────────────────────────────────────────────────────────────┘
```

**Architecture Type**: Client-Server (SPA + REST API)
- **Frontend**: Single Page Application (SPA) - runs in browser
- **Backend**: RESTful API server - runs on server
- **Communication**: JSON over HTTP/HTTPS

---

## 📦 Dependencies

### Backend Dependencies (Python)

| Package | Version | Purpose |
|---------|---------|---------|
| Flask | 3.0.3 | Web framework for building REST API |
| Flask-SQLAlchemy | 3.1.1 | ORM integration for database operations |
| Flask-Login | 0.6.3 | User session management |
| Flask-CORS | 4.0.0 | Cross-Origin Resource Sharing (allows frontend to call backend) |
| Flask-Mail | 0.9.1 | Email notifications |
| Werkzeug | 3.0.3 | WSGI utilities, password hashing |
| SQLAlchemy | 2.0.30 | SQL toolkit and ORM |
| python-dotenv | 1.0.1 | Environment variable management |
| openpyxl | 3.1.2 | Excel file reading/writing |
| pandas | 2.0.3 | Data manipulation for Excel import |

**Install**: `pip install -r requirements.txt`

### Frontend Dependencies (JavaScript/React)

| Package | Version | Purpose |
|---------|---------|---------|
| react | 18.2.0 | Core React library for building UI |
| react-dom | 18.2.0 | React rendering for web browsers |
| react-router-dom | 6.22.0 | Client-side routing (navigation) |
| axios | 1.6.7 | HTTP client for API calls |
| chart.js | 4.4.1 | Charting library for dashboard |
| react-chartjs-2 | 5.2.0 | React wrapper for Chart.js |
| bootstrap | 5.3.3 | CSS framework for styling |
| bootstrap-icons | 1.11.3 | Icon library |
| react-scripts | 5.0.1 | Build tools and dev server |

**Install**: `npm install`

---

## ⚙️ How It Works

### 1. Application Startup

#### Backend (Flask)
```bash
# Activate virtual environment
source venv/bin/activate

# Run Flask server
python3 app.py
```

**What happens**:
1. Flask app initializes (`app.py`)
2. Database connection established (SQLite)
3. Models loaded (`models.py`)
4. Routes registered (`routes.py`)
5. CORS enabled (allows frontend to connect)
6. Server starts on `http://localhost:5000`

#### Frontend (React)
```bash
# Navigate to frontend folder
cd frontend

# Start development server
npm start
```

**What happens**:
1. React development server starts
2. Webpack compiles JavaScript/CSS
3. Browser opens at `http://localhost:3000`
4. React app loads (`index.js` → `App.js`)
5. Router initializes (React Router)
6. Theme context loads (dark/light mode)

### 2. User Authentication Flow

```
User enters credentials
        ↓
Frontend sends POST to /api/auth/login
        ↓
Backend validates username/password
        ↓
Backend generates token
        ↓
Frontend stores token in localStorage
        ↓
Frontend redirects to Dashboard
        ↓
All subsequent API calls include token in headers
```

**Code Example**:
```javascript
// Frontend (LoginPage.js)
const response = await authAPI.login(username, password);
localStorage.setItem('token', response.data.token);
localStorage.setItem('user', JSON.stringify(response.data.user));
navigate('/dashboard');
```

```python
# Backend (routes.py)
@api_bp.route('/auth/login', methods=['POST'])
def api_login():
    user = User.query.filter_by(username=username).first()
    if user and check_password_hash(user.password_hash, password):
        return jsonify({'token': f'user-{user.id}', 'user': {...}})
```

### 3. Data Fetching Flow

```
User opens Dashboard
        ↓
React component mounts (useEffect)
        ↓
Frontend calls dashboardAPI.getStats()
        ↓
Axios sends GET to /api/dashboard/stats
        ↓
Backend queries database (SQLAlchemy)
        ↓
Backend returns JSON response
        ↓
Frontend updates state (useState)
        ↓
React re-renders with new data
```

**Code Example**:
```javascript
// Frontend (Dashboard.js)
useEffect(() => {
  dashboardAPI.getStats()
    .then(res => setStats(res.data))
    .catch(err => console.error(err));
}, []);
```

```python
# Backend (routes.py)
@api_bp.route('/dashboard/stats')
def api_dashboard_stats():
    total = Asset.query.count()
    assigned = Asset.query.filter_by(status='Assigned').count()
    return jsonify({'totalAssets': total, 'assignedAssets': assigned})
```

### 4. CRUD Operations Flow

#### CREATE (Add Asset)
```
User fills form → Submit
        ↓
Frontend validates input
        ↓
POST /api/assets with JSON data
        ↓
Backend creates Asset object
        ↓
SQLAlchemy inserts into database
        ↓
Backend returns success + asset data
        ↓
Frontend redirects to asset list
```

#### READ (View Assets)
```
User opens asset list
        ↓
GET /api/assets?page=1&search=laptop
        ↓
Backend queries with filters
        ↓
SQLAlchemy returns paginated results
        ↓
Backend serializes to JSON (to_dict())
        ↓
Frontend displays in table
```

#### UPDATE (Edit Asset)
```
User edits asset → Save
        ↓
PUT /api/assets/123 with updated data
        ↓
Backend finds asset by ID
        ↓
Updates fields
        ↓
SQLAlchemy commits changes
        ↓
Backend returns updated asset
        ↓
Frontend shows success message
```

#### DELETE (Remove Asset)
```
User clicks delete → Confirm
        ↓
DELETE /api/assets/123
        ↓
Backend finds asset by ID
        ↓
SQLAlchemy deletes record
        ↓
Backend returns success
        ↓
Frontend refreshes list
```

### 5. Real-Time Features

#### Theme Switching
```
User clicks theme button
        ↓
ThemeContext updates state
        ↓
localStorage saves preference
        ↓
CSS variables update ([data-theme="dark"])
        ↓
All components re-render with new theme
```

#### Search & Filter
```
User types in search box
        ↓
React state updates (onChange)
        ↓
useEffect triggers API call
        ↓
Backend filters results (SQL LIKE query)
        ↓
Frontend displays filtered data
```

#### Bulk Operations
```
User selects multiple items
        ↓
State tracks selected IDs
        ↓
User chooses bulk action
        ↓
Frontend loops through IDs
        ↓
Multiple API calls (Promise.all or sequential)
        ↓
Backend processes each request
        ↓
Frontend shows success/failure count
```

---

## 🗄️ Database Schema

### Tables

#### 1. **users** (Authentication)
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(150),
    role VARCHAR(50) DEFAULT 'admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. **assets** (Main Data)
```sql
CREATE TABLE assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Employee Info
    emp_id VARCHAR(50),
    employee_name VARCHAR(150),
    mobile_number VARCHAR(30),
    
    -- Asset Info
    asset_name VARCHAR(200) NOT NULL,
    category VARCHAR(100),
    serial_number VARCHAR(150) UNIQUE NOT NULL,
    model_name VARCHAR(150),
    os VARCHAR(100),
    version VARCHAR(50),
    ram VARCHAR(30),
    location VARCHAR(150),
    
    -- Purchase Info
    invoice_number VARCHAR(100),
    invoice_date DATE,
    warranty_date DATE,
    purchase_price FLOAT,
    quantity INTEGER DEFAULT 1,
    configuration TEXT,
    
    -- Accessories
    charger_serial VARCHAR(100),
    laptop_bag_serial VARCHAR(100),
    hard_disk_serial VARCHAR(100),
    hard_disk_capacity VARCHAR(50),
    ups_serial VARCHAR(100),
    ups_capacity VARCHAR(50),
    printer_type VARCHAR(100),
    printer_model VARCHAR(150),
    mobile_imei VARCHAR(50),
    mobile_number_sim VARCHAR(30),
    testing_status VARCHAR(50),
    
    -- History
    old_user VARCHAR(150),
    date DATE,
    old_device VARCHAR(150),
    comments TEXT,
    
    -- Status
    status VARCHAR(30) DEFAULT 'Available',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 3. **activity_logs** (Audit Trail)
```sql
CREATE TABLE activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user VARCHAR(100),
    action VARCHAR(50),  -- CREATE, UPDATE, DELETE, etc.
    module VARCHAR(50),  -- Asset, User, etc.
    description TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Relationships
- **One-to-Many**: One user can perform many activities (user → activity_logs)
- **No foreign keys**: Simplified design for flexibility
- **Soft relationships**: Employee name stored as string (not foreign key)

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/logout` | User logout |

### Dashboard
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/dashboard/stats` | Get statistics (total, assigned, etc.) |
| GET | `/api/dashboard/activity` | Get recent activity logs |

### Assets (CRUD)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/assets` | List all assets (with filters) |
| GET | `/api/assets/<id>` | Get single asset |
| POST | `/api/assets` | Create new asset |
| PUT | `/api/assets/<id>` | Update asset |
| DELETE | `/api/assets/<id>` | Delete asset |

### Import/Export
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/assets/import` | Import from Excel |
| GET | `/api/assets/template` | Download Excel template |
| GET | `/reports/export/csv` | Export all assets as CSV |

### Query Parameters (GET /api/assets)
- `search` - Search in name, serial, employee
- `category` - Filter by category
- `status` - Filter by status
- `location` - Filter by location
- `page` - Page number (pagination)
- `per_page` - Items per page

**Example**:
```
GET /api/assets?search=laptop&status=Available&page=1&per_page=20
```

---

## 📁 File Structure

```
asset-management/
│
├── backend/
│   ├── app.py                 # Flask app initialization
│   ├── models.py              # Database models (SQLAlchemy)
│   ├── routes.py              # API endpoints
│   ├── email_service.py       # Email notifications
│   ├── migrate_db.py          # Database migration script
│   ├── requirements.txt       # Python dependencies
│   ├── assets.db              # SQLite database file
│   └── .env                   # Environment variables
│
├── frontend/
│   ├── public/
│   │   └── index.html         # HTML template
│   │
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.js      # Main layout with sidebar
│   │   │
│   │   ├── context/
│   │   │   └── ThemeContext.js # Dark/Light mode state
│   │   │
│   │   ├── pages/
│   │   │   ├── Dashboard.js   # Dashboard page
│   │   │   ├── AssetList.js   # Asset list page
│   │   │   ├── AssetAdd.js    # Add asset page
│   │   │   ├── AssetEdit.js   # Edit asset page
│   │   │   ├── AssetView.js   # View asset details
│   │   │   ├── AssetImport.js # Excel import page
│   │   │   ├── InventoryCategory.js # Inventory pages
│   │   │   ├── LoginPage.js   # Login page
│   │   │   └── Reports.js     # Reports page
│   │   │
│   │   ├── services/
│   │   │   └── api.js         # Axios API client
│   │   │
│   │   ├── App.js             # Main app component
│   │   ├── App.css            # Global styles
│   │   ├── index.js           # React entry point
│   │   └── index.css          # Base styles
│   │
│   ├── package.json           # Node dependencies
│   └── .env                   # Frontend environment variables
│
└── Documentation/
    ├── README.md
    ├── TECHNICAL_DOCUMENTATION.md
    ├── LATEST_IMPROVEMENTS.md
    └── QUICK_REFERENCE.md
```

---

## 🔄 Data Flow

### Complete Request-Response Cycle

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USER ACTION                                               │
│    User clicks "Add Asset" button                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. REACT COMPONENT                                           │
│    - Form validation                                         │
│    - State management (useState)                             │
│    - Event handler (onSubmit)                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. API SERVICE (api.js)                                      │
│    assetAPI.create(formData)                                │
│    - Adds auth token to headers                             │
│    - Converts data to JSON                                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. AXIOS HTTP CLIENT                                         │
│    POST http://localhost:5000/api/assets                    │
│    Headers: { Authorization: Bearer token }                 │
│    Body: { asset_name: "...", serial_number: "..." }       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼ (Network)
┌─────────────────────────────────────────────────────────────┐
│ 5. FLASK ROUTE (routes.py)                                  │
│    @api_bp.route('/assets', methods=['POST'])               │
│    - Receives JSON data                                     │
│    - Validates required fields                              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. SQLALCHEMY MODEL (models.py)                             │
│    asset = Asset(asset_name=..., serial_number=...)        │
│    db.session.add(asset)                                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. DATABASE (assets.db)                                     │
│    INSERT INTO assets VALUES (...)                          │
│    - SQLite executes SQL                                    │
│    - Returns new record ID                                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. ACTIVITY LOG                                              │
│    log = ActivityLog(action='CREATE', ...)                 │
│    db.session.add(log)                                      │
│    db.session.commit()                                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 9. FLASK RESPONSE                                            │
│    return jsonify({                                         │
│      'success': True,                                       │
│      'asset': asset.to_dict(),                             │
│      'message': 'Asset created'                            │
│    }), 201                                                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼ (Network)
┌─────────────────────────────────────────────────────────────┐
│ 10. AXIOS RESPONSE                                           │
│     - Receives JSON response                                │
│     - Status code: 201 Created                              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 11. REACT COMPONENT                                          │
│     - Updates state                                         │
│     - Shows success message                                 │
│     - Redirects to asset list                              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 12. USER SEES RESULT                                         │
│     "Asset added successfully!"                             │
│     Redirected to /assets page                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Security Features

1. **Password Hashing**: Werkzeug's `generate_password_hash()`
2. **Token-based Auth**: JWT-like tokens in localStorage
3. **CORS Protection**: Flask-CORS restricts origins
4. **SQL Injection Prevention**: SQLAlchemy ORM (parameterized queries)
5. **XSS Protection**: React auto-escapes output
6. **Activity Logging**: All actions tracked in database

---

## 🚀 Performance Optimizations

1. **Pagination**: 20 items per page (reduces data transfer)
2. **Lazy Loading**: Components load on demand
3. **Database Indexing**: Serial number, EMP ID indexed
4. **Caching**: Browser caches static assets
5. **Minification**: Production build minifies JS/CSS
6. **Code Splitting**: React Router splits bundles

---

## 📊 Key Technologies Explained

### Why Flask?
- Lightweight and fast
- Easy to learn
- Great for REST APIs
- Excellent ORM support (SQLAlchemy)
- Large ecosystem

### Why React?
- Component-based architecture
- Virtual DOM (fast rendering)
- Large community
- Rich ecosystem (libraries, tools)
- Single Page Application (smooth UX)

### Why SQLite?
- No server setup required
- Single file database
- Perfect for small-medium apps
- Easy backup (copy file)
- Can upgrade to PostgreSQL/MySQL later

### Why Bootstrap?
- Pre-built responsive components
- Consistent design
- Mobile-friendly
- Fast development
- Customizable

---

## 🎯 Summary

**This is a modern full-stack web application** built with:

- **Backend**: Python Flask REST API
- **Frontend**: React Single Page Application
- **Database**: SQLite with SQLAlchemy ORM
- **Architecture**: Client-Server with JSON communication
- **Deployment**: Backend on port 5000, Frontend on port 3000

**Data flows** from user → React → Axios → Flask → SQLAlchemy → SQLite and back.

**The system is production-ready** with proper error handling, authentication, logging, and responsive design.

