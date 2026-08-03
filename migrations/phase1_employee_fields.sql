-- Phase 1: Add new fields to Employee table
-- These fields support the Employee Master requirements
-- SQLite doesn't support IF NOT EXISTS for columns, so check first

-- Add Team field
ALTER TABLE employees ADD COLUMN team VARCHAR(100);

-- Add Project field
ALTER TABLE employees ADD COLUMN project VARCHAR(150);

-- Add Manager field  
ALTER TABLE employees ADD COLUMN manager VARCHAR(150);

-- Add Microsoft License field
ALTER TABLE employees ADD COLUMN microsoft_license VARCHAR(100);

