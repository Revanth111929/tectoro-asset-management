#!/usr/bin/env python3
"""
Emergency Admin Password Reset
Use this ONLY when the admin password is completely lost
"""

import sqlite3
import getpass
import sys
import os
import secrets
import string
from werkzeug.security import generate_password_hash
from datetime import datetime

DB_PATH = 'databases/local_assets.db'

def generate_secure_password(length=20):
    """Generate a cryptographically secure random password"""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*()-_=+"
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def emergency_reset():
    print("=" * 80)
    print("⚠️  EMERGENCY ADMIN PASSWORD RESET")
    print("=" * 80)
    print()
    print("⚠️  WARNING: This will reset the admin password WITHOUT verification")
    print("⚠️  Use this ONLY if the current password is completely lost")
    print()

    # Verify database exists
    if not os.path.exists(DB_PATH):
        print(f"❌ Error: Database not found at {DB_PATH}")
        print(f"   Current directory: {os.getcwd()}")
        print(f"   Please run this script from the project root directory")
        return False

    # Confirm action
    print("This action will:")
    print("  1. Reset the admin password to a new random password")
    print("  2. Create a backup of the database")
    print("  3. Log the password change")
    print()

    response = input("⚠️  Are you sure you want to continue? Type 'YES' to proceed: ")
    if response != 'YES':
        print("❌ Operation cancelled")
        return False

    # Create database backup
    print("\n📦 Creating database backup...")
    timestamp = datetime.now().strftime('%Y%m%d-%H%M%S')
    backup_path = f"{DB_PATH}.backup-emergency-reset-{timestamp}"

    try:
        import shutil
        shutil.copy2(DB_PATH, backup_path)
        print(f"✓ Backup created: {backup_path}")
    except Exception as e:
        print(f"❌ Backup failed: {e}")
        return False

    # Connect to database
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Verify admin user exists
    cursor.execute("SELECT id, username, email FROM users WHERE username = ?", ('admin',))
    row = cursor.fetchone()

    if not row:
        print("❌ Error: Admin user not found in database")
        conn.close()
        return False

    user_id, username, email = row
    print(f"\n✓ Found admin user:")
    print(f"   ID: {user_id}")
    print(f"   Username: {username}")
    print(f"   Email: {email}")

    # Choose password reset method
    print("\n📝 Choose password reset method:")
    print("  1. Generate secure random password (recommended)")
    print("  2. Set custom password")
    print()

    choice = input("Enter choice (1 or 2): ").strip()

    if choice == '1':
        # Generate random password
        new_password = generate_secure_password(20)
        print(f"\n✓ Generated secure password: {new_password}")
        print("   ⚠️  COPY THIS PASSWORD NOW - It cannot be recovered!")
        input("\n   Press Enter after copying the password...")
    elif choice == '2':
        # Custom password
        print("\n📝 Enter new password:")
        print("   Requirements:")
        print("   - Minimum 8 characters")
        print("   - Recommended: 12+ characters with mix of letters, numbers, symbols")
        print()

        while True:
            new_password = getpass.getpass("New password: ")
            confirm_password = getpass.getpass("Confirm new password: ")

            if new_password != confirm_password:
                print("❌ Passwords do not match. Try again.")
                continue

            if len(new_password) < 8:
                print("❌ Password must be at least 8 characters")
                continue

            break
    else:
        print("❌ Invalid choice")
        conn.close()
        return False

    # Update password
    print("\n🔄 Resetting password...")
    new_hash = generate_password_hash(new_password)

    cursor.execute(
        "UPDATE users SET password_hash = ?, is_active = 1 WHERE id = ?",
        (new_hash, user_id)
    )
    conn.commit()
    conn.close()

    print("✅ Admin password reset successfully!")
    print()
    print("=" * 80)
    print("NEW ADMIN CREDENTIALS")
    print("=" * 80)
    print(f"Username: {username}")
    print(f"Password: {new_password}")
    print(f"Email: {email}")
    print("=" * 80)
    print()
    print("⚠️  IMPORTANT:")
    print("  1. Copy these credentials to a secure location NOW")
    print("  2. Update ADMIN_CREDENTIALS.md file")
    print("  3. All users will need to log in again")
    print("  4. Database backup saved at:")
    print(f"     {backup_path}")
    print()
    print("  5. Test the new password:")
    print(f"     http://192.168.20.180:3000/login")
    print()

    # Log the reset
    log_file = 'logs/password_resets.log'
    os.makedirs('logs', exist_ok=True)
    with open(log_file, 'a') as f:
        f.write(f"\n{datetime.now().isoformat()} - Emergency password reset for user: {username}\n")
        f.write(f"  Method: {'Random' if choice == '1' else 'Custom'}\n")
        f.write(f"  Backup: {backup_path}\n")

    return True

if __name__ == "__main__":
    try:
        success = emergency_reset()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n❌ Operation cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
