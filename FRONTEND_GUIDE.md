# Frontend Development Guide - Activity History Page

## Quick Start: Build Activity History Page

### Step 1: Create the Page Component

**File**: `frontend/src/pages/ActivityHistory.js`

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ActivityHistory.css';

const API_URL = 'http://192.168.20.180:5000/api';

function ActivityHistory() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action_type: '',
    date_from: '',
    date_to: '',
    search: '',
    page: 1,
    per_page: 50
  });
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });
      
      const response = await axios.get(`${API_URL}/audit-logs?${params}`);
      setLogs(response.data.logs);
      setTotal(response.data.total);
      setPages(response.data.pages);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] && key !== 'page' && key !== 'per_page') {
        params.append(key, filters[key]);
      }
    });
    window.open(`${API_URL}/audit-logs/export?${params}`, '_blank');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getActionBadge = (actionType) => {
    const colors = {
      'ASSET_CREATED': 'success',
      'ASSET_UPDATED': 'info',
      'ASSET_DELETED': 'danger',
      'ASSET_ASSIGNED': 'primary',
      'ASSET_RETURNED': 'secondary',
      'STATUS_CHANGED': 'warning'
    };
    const color = colors[actionType] || 'default';
    return <span className={`badge badge-${color}`}>{actionType}</span>;
  };

  return (
    <div className="activity-history">
      <div className="page-header">
        <h1>Activity History</h1>
        <button onClick={exportToCSV} className="btn btn-primary">
          Export to CSV
        </button>
      </div>

      {/* Filters */}
      <div className="filters">
        <input
          type="text"
          placeholder="Search assets, employees..."
          value={filters.search}
          onChange={(e) => setFilters({...filters, search: e.target.value, page: 1})}
          className="form-control"
        />
        
        <select
          value={filters.action_type}
          onChange={(e) => setFilters({...filters, action_type: e.target.value, page: 1})}
          className="form-control"
        >
          <option value="">All Actions</option>
          <option value="ASSET_CREATED">Created</option>
          <option value="ASSET_UPDATED">Updated</option>
          <option value="ASSET_DELETED">Deleted</option>
          <option value="ASSET_ASSIGNED">Assigned</option>
          <option value="ASSET_RETURNED">Returned</option>
          <option value="STATUS_CHANGED">Status Changed</option>
        </select>

        <input
          type="date"
          value={filters.date_from}
          onChange={(e) => setFilters({...filters, date_from: e.target.value, page: 1})}
          className="form-control"
          placeholder="From Date"
        />

        <input
          type="date"
          value={filters.date_to}
          onChange={(e) => setFilters({...filters, date_to: e.target.value, page: 1})}
          className="form-control"
          placeholder="To Date"
        />
      </div>

      {/* Results Table */}
      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <>
          <div className="results-info">
            Showing {logs.length} of {total} results
          </div>

          <table className="table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>Asset</th>
                <th>Serial</th>
                <th>Employee</th>
                <th>Field</th>
                <th>Old Value</th>
                <th>New Value</th>
                <th>Performed By</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td>{formatDate(log.timestamp)}</td>
                  <td>{getActionBadge(log.action_type)}</td>
                  <td>{log.asset_name}</td>
                  <td>{log.asset_serial}</td>
                  <td>{log.employee_name}</td>
                  <td>{log.field_name}</td>
                  <td>{log.old_value}</td>
                  <td>{log.new_value}</td>
                  <td>{log.performed_by}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="pagination">
            <button 
              onClick={() => setFilters({...filters, page: filters.page - 1})}
              disabled={filters.page === 1}
              className="btn"
            >
              Previous
            </button>
            <span>Page {filters.page} of {pages}</span>
            <button 
              onClick={() => setFilters({...filters, page: filters.page + 1})}
              disabled={filters.page >= pages}
              className="btn"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default ActivityHistory;
```

### Step 2: Add CSS

**File**: `frontend/src/pages/ActivityHistory.css`

```css
.activity-history {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.filters {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 15px;
  margin-bottom: 20px;
}

.form-control {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.results-info {
  margin-bottom: 15px;
  color: #666;
  font-size: 14px;
}

.table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.table th {
  background: #f8f9fa;
  padding: 12px;
  text-align: left;
  font-weight: 600;
  border-bottom: 2px solid #dee2e6;
}

.table td {
  padding: 12px;
  border-bottom: 1px solid #dee2e6;
}

.table tbody tr:hover {
  background: #f8f9fa;
}

.badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.badge-success { background: #28a745; color: white; }
.badge-info { background: #17a2b8; color: white; }
.badge-danger { background: #dc3545; color: white; }
.badge-primary { background: #007bff; color: white; }
.badge-secondary { background: #6c757d; color: white; }
.badge-warning { background: #ffc107; color: black; }

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 20px;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

### Step 3: Add Route

**File**: `frontend/src/App.js`

```jsx
import ActivityHistory from './pages/ActivityHistory';

// In your Routes:
<Route path="/activity-history" element={<ActivityHistory />} />
```

### Step 4: Add to Sidebar

**File**: `frontend/src/components/Layout.js` (or wherever your sidebar is)

```jsx
<NavLink to="/activity-history">
  <i className="fas fa-history"></i>
  Activity History
</NavLink>
```

---

## API Endpoints Reference

All endpoints return JSON and support CORS.

### 1. Get Audit Logs
```
GET /api/audit-logs
```

**Query Parameters:**
- `action_type` - Filter by action type
- `module` - Filter by module
- `asset_id` - Filter by asset ID
- `employee_id` - Filter by employee ID
- `performed_by` - Filter by user
- `date_from` - Start date (YYYY-MM-DD)
- `date_to` - End date (YYYY-MM-DD)
- `search` - Text search
- `page` - Page number (default: 1)
- `per_page` - Results per page (default: 50)

**Response:**
```json
{
  "logs": [...],
  "total": 150,
  "pages": 3,
  "current_page": 1,
  "per_page": 50,
  "has_next": true,
  "has_prev": false
}
```

### 2. Get Recent Activities
```
GET /api/audit-logs/recent?limit=20
```

**Response:**
```json
{
  "logs": [...],
  "total": 20
}
```

### 3. Get Asset History
```
GET /api/audit-logs/asset/:asset_id
```

### 4. Export to CSV
```
GET /api/audit-logs/export?date_from=2026-01-01&action_type=ASSET_CREATED
```

Returns CSV file for download.

### 5. Dashboard Stats
```
GET /api/dashboard/lifecycle-stats
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "assets_under_repair": 0,
    "active_temp_assignments": 0,
    "pending_exits": 0,
    "recent_replacements": 8,
    "overdue_temp_assignments": 0,
    "total_audit_logs": 1234,
    "today_activities": 45,
    "assets_by_status": {
      "available": 12,
      "assigned": 45,
      "temporary_assignment": 2,
      "under_repair": 3,
      "returned": 5
    }
  },
  "recent_activities": [...]
}
```

---

## Styling Guidelines

### Color Palette
- Primary: `#007bff` (Blue)
- Success: `#28a745` (Green)
- Danger: `#dc3545` (Red)
- Warning: `#ffc107` (Yellow)
- Info: `#17a2b8` (Cyan)
- Secondary: `#6c757d` (Gray)

### Action Type Colors
- ASSET_CREATED → Green (success)
- ASSET_UPDATED → Blue (info)
- ASSET_DELETED → Red (danger)
- ASSET_ASSIGNED → Blue (primary)
- ASSET_RETURNED → Gray (secondary)
- STATUS_CHANGED → Yellow (warning)

### Responsive Design
```css
@media (max-width: 768px) {
  .filters {
    grid-template-columns: 1fr;
  }
  
  .table {
    font-size: 12px;
  }
}
```

---

## Testing Your Implementation

### 1. Create Test Data
```bash
# Create some assets
for i in {1..5}; do
  curl -X POST http://192.168.20.180:5000/api/assets \
    -H "Content-Type: application/json" \
    -d "{\"asset_name\":\"Test Laptop $i\",\"serial_number\":\"TEST-$i\",\"category\":\"Laptop\"}"
done
```

### 2. Verify API Response
```bash
curl http://192.168.20.180:5000/api/audit-logs/recent | jq
```

### 3. Test Filters
```bash
# Filter by date
curl "http://192.168.20.180:5000/api/audit-logs?date_from=2026-06-01" | jq

# Filter by action
curl "http://192.168.20.180:5000/api/audit-logs?action_type=ASSET_CREATED" | jq

# Search
curl "http://192.168.20.180:5000/api/audit-logs?search=Laptop" | jq
```

### 4. Test Export
```bash
curl "http://192.168.20.180:5000/api/audit-logs/export" -o audit_logs.csv
```

---

## Common Issues & Solutions

### Issue 1: CORS Error
**Solution**: Backend already has CORS enabled. Make sure you're using the correct API URL.

### Issue 2: No Data Showing
**Solution**: Create some test assets first. The audit logs are created automatically.

### Issue 3: Pagination Not Working
**Solution**: Make sure you're updating the `filters` state with the new page number.

### Issue 4: Export Not Downloading
**Solution**: Use `window.open()` or `window.location.href` to trigger download.

---

## Next Components to Build

After Activity History, build these in order:

1. **Dashboard Widget** (Easiest)
   - Just add a card to existing dashboard
   - Call `/api/dashboard/lifecycle-stats`

2. **Asset Timeline** (Medium)
   - Add "History" tab to asset detail page
   - Visual timeline of events

3. **Temporary Assignments** (Complex)
   - Full CRUD interface
   - Modal for creating assignments

4. **Asset Replacements** (Medium)
   - Add to asset detail page
   - Modal workflow

5. **Employee Exits** (Most Complex)
   - Multi-step wizard
   - Asset collection checklist

---

**Happy Coding!** 🎨  
The backend is ready. The APIs are tested. Now make it beautiful! ✨
