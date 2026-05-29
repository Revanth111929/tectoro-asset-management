# System Architecture - Visual Guide

## 🎨 Technology Stack Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     TECHNOLOGY STACK                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  FRONTEND (Client-Side)          BACKEND (Server-Side)          │
│  ┌──────────────────┐            ┌──────────────────┐          │
│  │   React 18.2     │            │   Flask 3.0.3    │          │
│  │   JavaScript     │            │   Python 3.10+   │          │
│  └──────────────────┘            └──────────────────┘          │
│           │                               │                      │
│           ├─ React Router 6.22           ├─ SQLAlchemy 2.0     │
│           ├─ Axios 1.6.7                 ├─ Flask-Login 0.6    │
│           ├─ Bootstrap 5.3               ├─ Flask-CORS 4.0     │
│           ├─ Chart.js 4.4                ├─ Flask-Mail 0.9     │
│           └─ Bootstrap Icons 1.11        └─ Pandas 2.0         │
│                                                                  │
│                        DATABASE                                  │
│                  ┌──────────────────┐                           │
│                  │  SQLite 3.x      │                           │
│                  │  (assets.db)     │                           │
│                  └──────────────────┘                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🏛️ Three-Tier Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRESENTATION TIER                             │
│                    (User Interface)                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  React Components                                         │  │
│  │  - Dashboard, AssetList, Forms, Tables                   │  │
│  │  - Responsive UI with Bootstrap                          │  │
│  │  - Dark/Light theme support                              │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ REST API (JSON/HTTP)
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                    APPLICATION TIER                              │
│                    (Business Logic)                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Flask Routes & Controllers                               │  │
│  │  - Authentication & Authorization                         │  │
│  │  - CRUD Operations                                        │  │
│  │  - Data Validation                                        │  │
│  │  - Business Rules                                         │  │
│  │  - Email Notifications                                    │  │
│  │  - Excel Import/Export                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ SQL Queries (ORM)
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                    DATA TIER                                     │
│                    (Data Storage)                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  SQLite Database                                          │  │
│  │  - users table (authentication)                          │  │
│  │  - assets table (main data)                              │  │
│  │  - activity_logs table (audit trail)                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Request-Response Flow

### Example: User Views Dashboard

```
┌──────────┐
│  USER    │ 1. Opens browser → http://localhost:3000/dashboard
└────┬─────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  BROWSER                                                     │
│  - Loads React app                                          │
│  - React Router matches /dashboard route                    │
│  - Dashboard component mounts                               │
└────┬────────────────────────────────────────────────────────┘
     │
     │ 2. useEffect() triggers API call
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  AXIOS (HTTP Client)                                         │
│  GET http://localhost:5000/api/dashboard/stats             │
│  Headers: { Authorization: "Bearer token123" }             │
└────┬────────────────────────────────────────────────────────┘
     │
     │ 3. HTTP Request over network
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  FLASK SERVER (Port 5000)                                   │
│  - Receives request                                         │
│  - CORS middleware validates origin                         │
│  - Routes to api_dashboard_stats()                          │
└────┬────────────────────────────────────────────────────────┘
     │
     │ 4. Execute business logic
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  SQLALCHEMY ORM                                              │
│  total = Asset.query.count()                                │
│  assigned = Asset.query.filter_by(status='Assigned').count()│
└────┬────────────────────────────────────────────────────────┘
     │
     │ 5. SQL Query
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  SQLITE DATABASE                                             │
│  SELECT COUNT(*) FROM assets;                               │
│  SELECT COUNT(*) FROM assets WHERE status='Assigned';       │
└────┬────────────────────────────────────────────────────────┘
     │
     │ 6. Return results
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  FLASK SERVER                                                │
│  return jsonify({                                           │
│    'totalAssets': 150,                                      │
│    'assignedAssets': 85,                                    │
│    'availableAssets': 65                                    │
│  })                                                         │
└────┬────────────────────────────────────────────────────────┘
     │
     │ 7. HTTP Response (JSON)
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  AXIOS                                                       │
│  - Receives response                                        │
│  - Parses JSON                                              │
│  - Returns Promise                                          │
└────┬────────────────────────────────────────────────────────┘
     │
     │ 8. Update React state
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  DASHBOARD COMPONENT                                         │
│  setStats(response.data)                                    │
│  - State updates                                            │
│  - React re-renders                                         │
│  - UI updates with new data                                 │
└────┬────────────────────────────────────────────────────────┘
     │
     │ 9. Display to user
     │
     ▼
┌──────────┐
│  USER    │ Sees: Total Assets: 150, Assigned: 85
└──────────┘
```

---

## 📦 Component Architecture (Frontend)

```
App.js (Root)
│
├─ ThemeContext (Dark/Light mode state)
│
├─ React Router
│   │
│   ├─ Public Routes
│   │   ├─ / → LandingPage
│   │   └─ /login → LoginPage
│   │
│   └─ Protected Routes (wrapped in Layout)
│       │
│       ├─ Layout Component
│       │   ├─ Sidebar (navigation)
│       │   ├─ Topbar (user menu, theme switcher)
│       │   └─ Content Area (children)
│       │
│       ├─ /dashboard → Dashboard
│       │   ├─ StatCards (total, assigned, etc.)
│       │   ├─ Charts (category breakdown)
│       │   └─ ActivityLog (recent actions)
│       │
│       ├─ /assets → AssetList
│       │   ├─ SearchBar
│       │   ├─ Filters (category, status, location)
│       │   ├─ DataTable (with pagination)
│       │   └─ BulkActions (select, delete, export)
│       │
│       ├─ /assets/add → AssetAdd
│       │   ├─ Tab: New Device (inventory entry)
│       │   └─ Tab: Existing Device (with employee)
│       │
│       ├─ /assets/edit/:id → AssetEdit
│       │   └─ Form (pre-filled with asset data)
│       │
│       ├─ /assets/view/:id → AssetView
│       │   └─ Details (read-only display)
│       │
│       ├─ /assets/import → AssetImport
│       │   ├─ Template Download
│       │   └─ File Upload
│       │
│       ├─ /inventory/:type → InventoryCategory
│       │   ├─ Laptops, Mobiles, Printers, etc.
│       │   ├─ Filtered view by category
│       │   └─ Bulk operations
│       │
│       ├─ /reports → Reports
│       │   ├─ Export CSV
│       │   └─ Activity Log
│       │
│       └─ /warranty → Warranty
│           └─ Expiring warranties list
```

---

## 🗂️ Backend Module Structure

```
Flask App (app.py)
│
├─ Configuration
│   ├─ Database URI (SQLite)
│   ├─ Secret Key
│   ├─ CORS settings
│   └─ Mail settings
│
├─ Extensions
│   ├─ SQLAlchemy (db)
│   ├─ Flask-Login (login_manager)
│   ├─ Flask-CORS (cors)
│   └─ Flask-Mail (mail)
│
├─ Models (models.py)
│   ├─ User
│   │   ├─ id, username, password_hash
│   │   ├─ email, role, created_at
│   │   └─ Methods: check_password()
│   │
│   ├─ Asset
│   │   ├─ 35+ fields (employee, asset, purchase, accessories)
│   │   └─ Methods: to_dict()
│   │
│   └─ ActivityLog
│       ├─ user, action, module, description
│       └─ Methods: to_dict()
│
├─ Routes (routes.py)
│   │
│   ├─ auth_bp (Authentication)
│   │   ├─ GET  / → landing page
│   │   ├─ GET  /login → login page
│   │   ├─ POST /login → authenticate
│   │   └─ GET  /logout → logout
│   │
│   ├─ main_bp (Main Pages)
│   │   └─ GET /dashboard → dashboard page
│   │
│   ├─ asset_bp (Asset Management)
│   │   ├─ GET    /assets → list assets
│   │   ├─ GET    /assets/add → add form
│   │   ├─ POST   /assets/add → create asset
│   │   ├─ GET    /assets/edit/:id → edit form
│   │   ├─ POST   /assets/edit/:id → update asset
│   │   ├─ POST   /assets/delete/:id → delete asset
│   │   └─ GET    /assets/view/:id → view details
│   │
│   ├─ report_bp (Reports)
│   │   ├─ GET /reports → reports page
│   │   ├─ GET /reports/export/csv → export CSV
│   │   ├─ GET /reports/activity → activity log
│   │   └─ GET /reports/warranty → warranty alerts
│   │
│   └─ api_bp (REST API for React)
│       │
│       ├─ Authentication
│       │   ├─ POST /api/auth/login
│       │   └─ POST /api/auth/logout
│       │
│       ├─ Dashboard
│       │   ├─ GET /api/dashboard/stats
│       │   └─ GET /api/dashboard/activity
│       │
│       ├─ Assets (CRUD)
│       │   ├─ GET    /api/assets
│       │   ├─ GET    /api/assets/:id
│       │   ├─ POST   /api/assets
│       │   ├─ PUT    /api/assets/:id
│       │   └─ DELETE /api/assets/:id
│       │
│       └─ Import/Export
│           ├─ POST /api/assets/import
│           └─ GET  /api/assets/template
│
└─ Services
    ├─ email_service.py (Email notifications)
    └─ migrate_db.py (Database migrations)
```

---

## 🔐 Authentication Flow

```
┌──────────────────────────────────────────────────────────────┐
│  1. USER ENTERS CREDENTIALS                                   │
│     Username: admin                                           │
│     Password: admin123                                        │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│  2. FRONTEND VALIDATION                                       │
│     - Check if fields are not empty                          │
│     - Basic format validation                                │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│  3. API CALL                                                  │
│     POST /api/auth/login                                     │
│     Body: { username: "admin", password: "admin123" }       │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│  4. BACKEND AUTHENTICATION                                    │
│     user = User.query.filter_by(username='admin').first()   │
│     if user and check_password_hash(user.password, pwd):    │
│         # Valid credentials                                  │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│  5. GENERATE TOKEN                                            │
│     token = f'user-{user.id}-{user.username}'               │
│     return { token, user: {...} }                           │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│  6. STORE IN BROWSER                                          │
│     localStorage.setItem('token', token)                     │
│     localStorage.setItem('user', JSON.stringify(user))       │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│  7. REDIRECT TO DASHBOARD                                     │
│     navigate('/dashboard')                                   │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│  8. ALL FUTURE API CALLS INCLUDE TOKEN                       │
│     Headers: { Authorization: `Bearer ${token}` }           │
└──────────────────────────────────────────────────────────────┘
```

---

## 💾 Database Schema Relationships

```
┌─────────────────────────────────────────────────────────────┐
│  users                                                       │
├─────────────────────────────────────────────────────────────┤
│  id (PK)                                                     │
│  username (UNIQUE)                                           │
│  password_hash                                               │
│  email                                                       │
│  role                                                        │
│  created_at                                                  │
└─────────────────────────────────────────────────────────────┘
                     │
                     │ (Soft relationship - no FK)
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  activity_logs                                               │
├─────────────────────────────────────────────────────────────┤
│  id (PK)                                                     │
│  user (VARCHAR) ← stores username as string                 │
│  action (CREATE, UPDATE, DELETE, etc.)                      │
│  module (Asset, User, etc.)                                 │
│  description                                                 │
│  timestamp                                                   │
└─────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────┐
│  assets                                                      │
├─────────────────────────────────────────────────────────────┤
│  id (PK)                                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Employee Info                                        │   │
│  │ - emp_id, employee_name, mobile_number             │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Asset Info                                           │   │
│  │ - asset_name, category, serial_number (UNIQUE)     │   │
│  │ - model_name, os, version, ram, location           │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Purchase Info                                        │   │
│  │ - invoice_number, invoice_date, warranty_date      │   │
│  │ - purchase_price, quantity, configuration          │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Accessories                                          │   │
│  │ - charger_serial, laptop_bag_serial                │   │
│  │ - hard_disk_serial, ups_serial, printer_type       │   │
│  │ - mobile_imei, mobile_number_sim, testing_status   │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ History & Status                                     │   │
│  │ - old_user, date, old_device, comments             │   │
│  │ - status, created_at, updated_at                   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Key Design Patterns

### 1. **MVC Pattern** (Model-View-Controller)
- **Model**: SQLAlchemy models (models.py)
- **View**: React components (frontend)
- **Controller**: Flask routes (routes.py)

### 2. **REST API Pattern**
- Stateless communication
- JSON data format
- HTTP methods (GET, POST, PUT, DELETE)
- Resource-based URLs (/api/assets/:id)

### 3. **Single Page Application (SPA)**
- One HTML page (index.html)
- Dynamic content loading
- Client-side routing (React Router)
- No page reloads

### 4. **Component-Based Architecture**
- Reusable UI components
- Props for data passing
- State management (useState, useContext)
- Lifecycle hooks (useEffect)

### 5. **ORM Pattern**
- Object-Relational Mapping
- Python objects ↔ Database tables
- No raw SQL queries
- Database abstraction

---

## 📊 Data Flow Summary

```
USER ACTION
    ↓
REACT COMPONENT (UI)
    ↓
EVENT HANDLER (onClick, onSubmit)
    ↓
API SERVICE (api.js)
    ↓
AXIOS HTTP CLIENT
    ↓
NETWORK (HTTP/JSON)
    ↓
FLASK ROUTE (routes.py)
    ↓
BUSINESS LOGIC
    ↓
SQLALCHEMY ORM
    ↓
SQL QUERY
    ↓
SQLITE DATABASE
    ↓
QUERY RESULTS
    ↓
SQLALCHEMY MODELS
    ↓
JSON SERIALIZATION (to_dict())
    ↓
FLASK RESPONSE
    ↓
NETWORK (HTTP/JSON)
    ↓
AXIOS PROMISE
    ↓
REACT STATE UPDATE (setState)
    ↓
REACT RE-RENDER
    ↓
USER SEES RESULT
```

---

This architecture provides:
- ✅ **Separation of Concerns**: Frontend, Backend, Database
- ✅ **Scalability**: Can upgrade database, add caching, load balancing
- ✅ **Maintainability**: Clear structure, modular code
- ✅ **Security**: Token auth, password hashing, SQL injection prevention
- ✅ **Performance**: Pagination, lazy loading, optimized queries
- ✅ **User Experience**: Responsive UI, dark mode, smooth navigation

