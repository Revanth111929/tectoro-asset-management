# Quick RBAC Reference Guide

## What Changed?

### For Standard Users (role: 'user')
❌ **Settings section is now hidden**
- Cannot see Settings in the sidebar
- Cannot access Employees page
- Cannot access Onboarding page
- Cannot access User Management page
- Cannot access Email Config page
- Trying to access via URL shows "Access Denied"

✅ **Still has full access to**:
- View all assets
- Create new assets
- Edit assets
- Lifecycle module (Temp Assignments, Asset Replacements)
- All reports and activity history

### For Viewer Users (role: 'viewer')
No changes - already restricted

### For Admin Users (role: 'admin')
No changes - still has full access to everything

---

## How to Test

### 1. Test as Standard User
1. Login with a Standard User account
2. Look at the sidebar → **Settings section should NOT be visible**
3. Try typing `/settings` in the URL → Should show "Access Denied"
4. Create an asset → Should work ✅
5. Edit an asset → Should work ✅

### 2. Test as Admin
1. Login as admin (admin / admin123)
2. Look at the sidebar → **Settings section should be visible**
3. Click Settings → User Management → Should work ✅
4. Click Settings → Employees → Should work ✅
5. Everything should work normally

---

## Quick Fixes

### If Settings Still Visible for Standard User
1. Press `Ctrl+Shift+R` in browser (hard refresh)
2. Logout and login again
3. Clear browser cache

### If Backend Not Responding
```bash
# Check if backend is running
lsof -i :5000

# If not, start it
cd /home/administrator/Desktop/asset-management
source venv/bin/activate
nohup python3 api_server.py > backend.log 2>&1 &
```

---

## User Roles Quick Reference

| Feature | Admin | Standard User | Viewer |
|---------|-------|---------------|--------|
| View Assets | ✅ | ✅ | ✅ |
| Create Assets | ✅ | ✅ | ❌ |
| Edit Assets | ✅ | ✅ | ❌ |
| Delete Assets | ✅ | ❌ | ❌ |
| Lifecycle Module | ✅ | ✅ | ❌ |
| **Settings Section** | ✅ | **❌** | ❌ |
| Reports | ✅ | ✅ | ✅ |

---

## Need Help?

1. Read `RBAC_COMPLETE_SUMMARY.md` for detailed information
2. Read `SETTINGS_RBAC_COMPLETE.md` for Settings restrictions
3. Check browser console for errors (F12)
4. Check `backend.log` for API errors

---

**Remember**: Press `Ctrl+Shift+R` after any changes to refresh the browser!
