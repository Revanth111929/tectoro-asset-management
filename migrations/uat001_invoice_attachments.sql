-- UAT Bug #001 Fix: Invoice Attachments Table
-- Date: August 3, 2026
-- Purpose: Add invoice attachment support for inventory devices

-- Create invoice_attachments table
CREATE TABLE IF NOT EXISTS invoice_attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id INTEGER NOT NULL UNIQUE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_extension VARCHAR(10) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    storage_path VARCHAR(500) NOT NULL,
    uploaded_by VARCHAR(100) NOT NULL,
    uploaded_at DATETIME NOT NULL,
    FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
);

-- Create index on asset_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_invoice_attachments_asset_id ON invoice_attachments(asset_id);

-- Create index on uploaded_at for audit queries
CREATE INDEX IF NOT EXISTS idx_invoice_attachments_uploaded_at ON invoice_attachments(uploaded_at);
