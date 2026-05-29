# Role-Based Access Control Guide

## Overview
The asset management system now supports role-based access control with two user roles:
- **Admin**: Full access to all features
- **Viewer**: Read-only access (cannot add, edit, or delete)

## User Roles

### Admin Role
Admins have full access to all features:
- ✓ View all assets and inventory
- ✓ Add new assets
- ✓ Edit existing assets
- ✓ Delete assets
- ✓ Import assets from CSV
- ✓ Export data
- ✓ Bulk actions (status changes, bulk delete)
- ✓ Access settings
- ✓ View reports and warranty information

### Viewer Role
Viewers have read-only access:
- ✓ View all assets and inventory
- ✓ View asset details
- ✓ View reports and warranty information
- ✓ Export data
- ✗ Cannot add new assets
- ✗ Cannot edit existing assets
- ✗ Cannot delete assets
- ✗ Cannot import assets
- ✗ Cannot perform bulk actions
- ✗ Cannot access settings

## Adding a Viewer User

### Method 1: Using the Script (Recommended)
Run the provided script to add a viewer user:

```bash
python3 add_viewer_user.py
```

The script will prompt you for:
- Username
- Password
- Password confirmation

Example:
```
Enter username for viewer: john.viewer
Enter password: ********
Confirm password: ********

✓ Successfully created viewer user: john.viewer
```

### Method 2: Manual Database Entry
If you prefer to add users manually:

```python
import sqlite3
from werkzeug.security import generate_password_hash

conn = sqlite3.connect('assets.db')
cursor = conn.cursor()

username = 'viewer1'
password = 'your_password'
password_hash = generate_password_hash(password)

cursor.execute(
    'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
    (username, password_hash, 'viewer')
)

conn.commit()
conn.close()
```

## UI Changes for Viewers

When a viewer logs in, they will see:

### Sidebar Menu
- Dashboard (visible)
- Assets (visible)
- Inventory categories (visible)
- Reports (visible)
- Warranty (visible)
- Settings (hidden)

### Asset List Page
- "Add Asset" button (hidden)
- Edit buttons (hidden)
- Delete buttons (hidden)
- Checkboxes for bulk selection (hidden)
- Bulk actions dropdown (hidden)
- View button (visible)
- Export functionality (visible)

### Inventory Category Pages
- "Add New" button (hidden)
- Edit buttons (hidden)
- Delete option in bulk actions (hidden)
- Checkboxes for bulk selection (hidden)
- View button (visible)
- Export functionality (visible)

### Protected Routes
Viewers attempting to access admin-only routes will be redirected:
- `/assets/add` → redirected to `/assets`
- `/assets/edit/:id` → redirected to `/assets`
- `/assets/import` → redirected to `/assets`
- `/settings` → redirected to `/assets`

## Testing Role-Based Access

### Test as Admin
1. Login with admin credentials (default: admin/admin)
2. Verify all buttons and actions are visible
3. Test adding, editing, and deleting assets

### Test as Viewer
1. Create a viewer user using `add_viewer_user.py`
2. Login with viewer credentials
3. Verify:
   - Can view all assets
   - Cannot see Add/Edit/Delete buttons
   - Cannot access Settings
   - Can export data
   - Can view reports

## Default Admin User
The system comes with a default admin user:
- **Username**: admin
- **Password**: admin

⚠️ **Important**: Change the default admin password in production!

## Changing User Roles

To change a user's role, update the database directly:

```sql
-- Change user to admin
UPDATE users SET role = 'admin' WHERE username = 'username';

-- Change user to viewer
UPDATE users SET role = 'viewer' WHERE username = 'username';
```

Or use Python:
```python
import sqlite3

conn = sqlite3.connect('assets.db')
cursor = conn.cursor()

cursor.execute('UPDATE users SET role = ? WHERE username = ?', ('viewer', 'username'))

conn.commit()
conn.close()
```

## Security Notes

1. **Password Security**: All passwords are hashed using Werkzeug's security functions
2. **Token Expiry**: Authentication tokens expire after 24 hours
3. **Route Protection**: Admin-only routes are protected at the routing level
4. **UI Protection**: Buttons and actions are hidden based on permissions
5. **API Protection**: Backend API endpoints should also validate user roles (already implemented)

## Troubleshooting

### Viewer can still see edit buttons
- Clear browser cache and reload
- Check that the user's role in the database is 'viewer'
- Verify localStorage has the correct user role

### Cannot login as viewer
- Verify the user exists in the database
- Check the password is correct
- Ensure the role is set to 'viewer' (not 'Viewer' - case sensitive)

### Permission checks not working
- Verify `permissions.js` is imported in the component
- Check that `canPerform()` is called correctly
- Ensure user data is stored in localStorage after login

## Files Modified

### Frontend
- `frontend/src/utils/permissions.js` - Permission utility functions
- `frontend/src/components/Layout.js` - Role-based sidebar menu
- `frontend/src/pages/AssetList.js` - Permission checks for actions
- `frontend/src/pages/InventoryCategory.js` - Permission checks for actions
- `frontend/src/App.js` - Route protection

### Backend
- `models.py` - User model with role field (already existed)
- `routes.py` - Login endpoint returns user role (already existed)

### Scripts
- `add_viewer_user.py` - Script to add viewer users

## Future Enhancements

Potential improvements for role-based access:
- Add more granular roles (e.g., 'editor', 'manager')
- Add department-based access control
- Add audit logging for user actions
- Add user management UI for admins
- Add password reset functionality
- Add email verification for new users
