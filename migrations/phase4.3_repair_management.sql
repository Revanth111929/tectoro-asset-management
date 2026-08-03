-- Phase 4.3: Repair Management Schema
-- Date: August 3, 2026

-- ════════════════════════════════════════════════════════════════════════════
-- ASSET REPAIRS TABLE
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS asset_repairs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    repair_number TEXT NOT NULL UNIQUE,  -- e.g., REP-2026-001
    asset_id INTEGER NOT NULL,
    
    -- Issue Details
    issue_category TEXT NOT NULL,  -- Hardware, Software, Battery, Display, etc.
    issue_description TEXT NOT NULL,
    priority TEXT NOT NULL,  -- Low, Medium, High, Critical
    
    -- Reporting
    reported_by TEXT NOT NULL,
    reported_date DATE NOT NULL,
    
    -- Repair Details
    vendor TEXT,
    engineer TEXT,
    repair_cost REAL DEFAULT 0.0,
    expected_completion_date DATE,
    actual_completion_date DATE,
    diagnosis TEXT,
    resolution TEXT,
    remarks TEXT,
    
    -- Status Tracking
    status TEXT NOT NULL DEFAULT 'Pending',  -- Pending, In Progress, Completed, Cancelled
    
    -- Employee Context (who had it when repair started)
    previous_emp_id TEXT,
    previous_employee_name TEXT,
    
    -- Completion Action
    completion_action TEXT,  -- return_to_employee, return_to_inventory, retire
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    
    FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_repairs_asset ON asset_repairs(asset_id);
CREATE INDEX IF NOT EXISTS idx_repairs_status ON asset_repairs(status);
CREATE INDEX IF NOT EXISTS idx_repairs_number ON asset_repairs(repair_number);

-- ════════════════════════════════════════════════════════════════════════════
-- REPAIR PARTS TABLE
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS repair_parts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    repair_id INTEGER NOT NULL,
    
    -- Part Details
    part_name TEXT NOT NULL,  -- Battery, SSD, RAM, Keyboard, Screen, etc.
    vendor TEXT,
    cost REAL DEFAULT 0.0,
    replacement_date DATE,
    warranty TEXT,  -- e.g., "6 months", "1 year"
    remarks TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (repair_id) REFERENCES asset_repairs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_repair_parts_repair ON repair_parts(repair_id);

-- ════════════════════════════════════════════════════════════════════════════
-- TRIGGERS FOR UPDATED_AT
-- ════════════════════════════════════════════════════════════════════════════

CREATE TRIGGER IF NOT EXISTS update_repair_timestamp 
AFTER UPDATE ON asset_repairs
FOR EACH ROW
BEGIN
    UPDATE asset_repairs SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
