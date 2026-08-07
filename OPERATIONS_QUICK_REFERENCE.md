# Operations Engine - Quick Reference Card

**Version:** Phase 4 Complete  
**Date:** August 3, 2026

---

## 🎯 OPERATION MATRIX

| Operation | Source Status | Target Status | Employee Impact | Requires |
|-----------|--------------|---------------|-----------------|----------|
| **Assign** | Available | Assigned | Assigns to employee | Employee ID |
| **Return** | Assigned | Available | Removes from employee | None |
| **Transfer (Simple)** | Assigned | Assigned | Move to new employee | Employee ID, Reason |
| **Transfer (Swap)** | Assigned | Assigned | Exchange with another | Two Employee IDs, Reason |
| **Send for Repair** | Assigned | Under Repair | Removes from employee | Issue details, Priority |
| **Complete Repair** | Under Repair | Available/Assigned/Retired | Based on action | Completion action |
| **Replace Part** | Any active | Unchanged | No change | Part name |
| **Retire** | Any active | Retired | Removes if assigned | Retirement reason |

---

## 🔄 WORKFLOW EXAMPLES

### New Device Assignment
```
Available → [Assign] → Assigned to Employee
```

### Device Return
```
Assigned to Employee → [Return] → Available
```

### Employee Transfer
```
Assigned to Employee A → [Transfer] → Assigned to Employee B
```

### Device Swap
```
Employee A: Device 1
Employee B: Device 2
          ↓ [Swap]
Employee A: Device 2
Employee B: Device 1
```

### Repair (Return to Employee)
```
Assigned to Employee → [Send for Repair] → Under Repair
                                            ↓
                    [Complete Repair: Return to Employee]
                                            ↓
                          Assigned to Same Employee
```

### Repair (Return to Inventory)
```
Assigned to Employee → [Send for Repair] → Under Repair
                                            ↓
                   [Complete Repair: Return to Inventory]
                                            ↓
                                      Available
```

### Repair (Retire)
```
Assigned to Employee → [Send for Repair] → Under Repair
                                            ↓
                      [Complete Repair: Retire]
                                            ↓
                                       Retired
```

### Quick Part Swap
```
Assigned to Employee → [Replace Part] → Still Assigned (status unchanged)
```

### Retirement
```
Any Status → [Retire] → Retired (permanent)
```

---

## 📋 REQUIRED FIELDS

### Assign
- ✓ Employee ID (from autocomplete)
- Optional: Comments

### Return
- Optional: Comments

### Transfer
- ✓ Target Employee ID
- ✓ Transfer Reason
- Optional: Swap Asset ID
- Optional: Comments

### Send for Repair
- ✓ Issue Category
- ✓ Issue Description
- ✓ Priority
- Optional: Vendor, Engineer, Expected Date, Comments

### Complete Repair
- ✓ Completion Action (return_to_inventory|return_to_employee|retire)
- Optional: Diagnosis, Resolution, Repair Cost, Comments

### Replace Part
- ✓ Part Name
- Optional: Vendor, Cost, Engineer, Warranty, Reason, Comments

### Retire
- ✓ Retirement Reason
- Optional: Additional Notes

---

## 🎨 UI LOCATIONS

**Where to Find Operations:**
- Asset View Page → Header (next to Edit button)
- Operations shown based on current asset status
- Each operation opens a modal dialog

**Context-Aware Display:**
- Available assets: Show "Assign"
- Assigned assets: Show "Return", "Transfer", "Send for Repair"
- Under Repair assets: Show "Complete Repair"
- All active assets: Show "Replace Part", "Retire"
- Retired assets: No operations (view only)

---

## 🔔 TOAST NOTIFICATIONS

**Success Messages:**
- ✅ Asset '[name]' assigned to [employee]
- ✅ Asset '[name]' returned to inventory
- ✅ Assets swapped: '[asset1]' ↔ '[asset2]'
- ✅ Asset '[name]' transferred from [emp1] to [emp2]
- ✅ Asset '[name]' sent for repair - Repair #[number]
- ✅ Repair completed - Asset [action result]
- ✅ Part '[name]' replaced successfully
- ✅ Asset '[name]' retired

**Error Messages:**
- ❌ Asset is not available (Status: [status])
- ❌ Employee [id] not found
- ❌ Please select an employee
- ❌ Transfer reason is required
- ❌ Issue description is required
- ❌ Retirement reason is required

---

## 🗄️ DATABASE IMPACT

**Every operation creates:**
1. Lifecycle Event (asset_lifecycle table)
2. Audit Log (audit_logs table)

**Some operations create:**
3. Repair Record (asset_repairs table) - for repair/part replacement
4. Part Record (repair_parts table) - for part replacements

**Every operation updates:**
5. Asset record (assets table) - status, employee fields, date

---

## 🔐 PERMISSIONS

| Role | Can Perform Operations? |
|------|------------------------|
| **Admin** | ✅ All operations |
| **User** | ✅ All operations |
| **Viewer** | ❌ Read-only (no operations) |

---

## 💡 TIPS

1. **Always use operations** - Don't manually edit asset status or employee fields
2. **Transfer reason is mandatory** - Document why assets are moved
3. **Repair tickets are permanent** - Can't delete repair history
4. **Retirement is permanent** - Retired assets can't be assigned again
5. **Use standalone part replacement** - For quick swaps without full repair
6. **Complete repair options** - Choose wisely: inventory, employee, or retire
7. **Employee context preserved** - During repair, previous employee is remembered
8. **Swap requires both assigned** - Both assets must have current assignments
9. **Lifecycle tracks everything** - Check lifecycle for complete asset history
10. **Audit logs searchable** - All operations logged for compliance

---

## 🚨 IMPORTANT NOTES

**Permanent Operations:**
- Retirement (cannot be undone without manual intervention)
- All operations create permanent history records

**Irreversible Actions:**
- Completing a repair
- Retiring an asset
- Part replacements (tracked but not undoable)

**Status Restrictions:**
- Retired assets: Cannot be assigned
- Under Repair assets: Cannot be assigned/transferred
- Available assets: Cannot be returned or transferred

**Best Practices:**
- Always add comments for future reference
- Use descriptive transfer reasons
- Document repair issues thoroughly
- Track part replacement costs
- Choose retirement reasons carefully

---

## 📞 TROUBLESHOOTING

**Problem:** Operation button not showing  
**Solution:** Check asset status - operations are context-aware

**Problem:** "Employee not found" error  
**Solution:** Employee must exist in Employee Master and be Active

**Problem:** Cannot assign retired asset  
**Solution:** Retirement is permanent; asset must be manually reactivated if needed

**Problem:** Complete Repair disabled  
**Solution:** No in-progress repairs found; send asset for repair first

**Problem:** Swap option not showing  
**Solution:** Target employee must have assigned assets in same category

---

## 📊 REPORTING

**Operation Data Available In:**
- Lifecycle Timeline (per asset)
- Activity History (system-wide)
- Audit Logs (detailed trail)
- Reports (filtered queries)
- Dashboard (real-time counters)

**Searchable By:**
- Asset ID, Name, Serial
- Employee ID, Name
- Operation Type
- Date Range
- Performed By (user)

---

**Last Updated:** August 3, 2026  
**Phase:** 4 Complete  
**Status:** Production Ready
