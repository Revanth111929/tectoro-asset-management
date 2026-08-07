# Evidence Collection Steps - Employee Status Update

## Prerequisites
1. Start the backend: `python3 app.py`
2. Start the frontend: `cd frontend && npm start`
3. Open browser to `http://localhost:3000`
4. Login as admin

## Step 1: Open Browser DevTools
1. Press F12 or Right-click → Inspect
2. Go to **Network** tab
3. Check "Preserve log" option
4. Clear existing entries (trash icon)

## Step 2: Navigate to Employee Edit Page
1. Click **Employee Master** in sidebar
2. Find employee **RG025**
3. Click **Edit** button (pencil icon)
4. Should navigate to `/employees/edit/RG025`

## Step 3: Change Status
1. In the **Status** dropdown, change from **Active** to **Inactive**
2. Click **Update Employee** button
3. **DO NOT CLOSE DEVTOOLS**

## Step 4: Capture Network Request in DevTools

Find the request to `/api/employees/RG025` (or similar) in Network tab

### Record the following:

**1. Request URL:**
```
(Copy exact URL from DevTools)
```

**2. HTTP Method:**
```
(Should show PUT, POST, or other)
```

**3. Request Headers → Authorization:**
```
Bearer eyJ... (first 50 characters)
```

**4. Request Payload (click on request → Payload tab):**
```json
{
  "emp_id": "...",
  "employee_name": "...",
  "status": "...",
  ...
}
```

**5. Response Status Code:**
```
(200, 404, 405, 500, etc.)
```

**6. Response Body (click on request → Response tab):**
```json
{
  ...
}
```

## Step 5: Database Verification

Open a terminal and run:

```bash
cd /home/administrator/Desktop/asset-management
python3 << 'EOF'
import sqlite3
import os

db_path = os.path.join('instance', 'assets.db')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

query = "SELECT emp_id, employee_name, status, updated_at FROM employees WHERE emp_id='RG025'"
print(f"SQL Query: {query}\n")

cursor.execute(query)
result = cursor.fetchone()

if result:
    print("Database Result:")
    print(f"  emp_id: {result[0]}")
    print(f"  employee_name: {result[1]}")
    print(f"  status: {result[2]}")
    print(f"  updated_at: {result[3]}")
else:
    print("No employee found")

conn.close()
EOF
```

**Record the output:**
```
(Paste terminal output here)
```

## Step 6: API Verification

Test the GET endpoints directly:

```bash
# Get your auth token first from DevTools Application → Local Storage → token
TOKEN="paste_your_token_here"

# Test GET single employee
curl -X GET http://localhost:5000/api/employees/RG025 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq

# Test search endpoint
curl -X GET "http://localhost:5000/api/employees?q=RG025" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq
```

**Record both outputs:**
```json
GET /api/employees/RG025:
{
  ...
}

GET /api/employees?q=RG025:
[
  {
    ...
  }
]
```

## Step 7: Check Employee Master Page

1. Go back to **Employee Master** page (click back or navigate to `/employees`)
2. Find employee RG025 in the table
3. Check the **Status** badge

**Record what you see:**
- Badge Color: (green/yellow/gray)
- Badge Text: (Active/Inactive/Exited)

## Expected Scenarios

### Scenario A: Request Failed (405/404)
- Network tab shows status 405 Method Not Allowed or 404 Not Found
- Database query shows status = "Active" (unchanged)
- API GET shows status = "Active" (unchanged)
- Employee Master shows "Active" badge

**Conclusion:** Request never reached backend handler

### Scenario B: Request Succeeded but Database Not Updated
- Network tab shows status 200 OK
- Database query shows status = "Active" (unchanged)
- API GET shows status = "Active" (unchanged)
- Employee Master shows "Active" badge

**Conclusion:** Backend handler received request but didn't update database

### Scenario C: Database Updated but Frontend Cached
- Network tab shows status 200 OK
- Database query shows status = "Inactive" (changed ✓)
- API GET shows status = "Inactive" (changed ✓)
- Employee Master shows "Active" badge (stale)

**Conclusion:** Update worked, frontend cache issue

### Scenario D: Everything Works
- Network tab shows status 200 OK
- Database query shows status = "Inactive" (changed ✓)
- API GET shows status = "Inactive" (changed ✓)
- Employee Master shows "Inactive" badge (correct ✓)

**Conclusion:** No bug - works as expected

---

## After Evidence Collection

Provide the captured information:
1. DevTools Network request details
2. Database query result
3. API GET responses
4. Frontend display status

Only then can we identify the exact failure point and implement the correct fix.
