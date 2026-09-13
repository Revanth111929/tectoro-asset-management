#!/usr/bin/env python3
"""
Admin Password Change Utility
Securely change the admin password with proper verification
"""

import sqlite3
import getpass
import sys
import os
from werkzeug.security import generate_password_hash, check_password_hash

DB_PATH = 'databases/local_assets.db'

def change_password():
    print("=" * 80)
    print("ADMIN PASSWORD CHANGE UTILITY")
    print("=" * 80)
    print()

    # Verify database exists
    if not os.path.exists(DB_PATH):
        print(f"❌ Error: Database not found at {DB_PATH}")
        print(f"   Current directory: {os.getcwd()}")
        print(f"   Please run this script from the project root directory")
        return False

    # Get current password
    current_password = getpass.getpass("Enter current admin password: ")

    # Verify current password
    print("\n🔍 Verifying current password...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id, password_hash, is_active FROM users WHERE username = ?", ('admin',))
    row = cursor.fetchone()

    if not row:
        print("❌ Error: Admin user not found in database")
        conn.close()
        return False

    user_id, stored_hash, is_active = row

    if not is_active:
        print("❌ Error: Admin account is disabled")
        conn.close()
        return False

    if not check_password_hash(stored_hash, current_password):
        print("❌ Error: Current password is incorrect")
        conn.close()
        return False

    print("✓ Current password verified")

    # Get new password
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

        if new_password == current_password:
            print("❌ New password must be different from current password")
            continue

        # Check password strength
        has_upper = any(c.isupper() for c in new_password)
        has_lower = any(c.islower() for c in new_password)
        has_digit = any(c.isdigit() for c in new_password)
        has_special = any(c in '!@#$%^&*()_+-=[]{}|;:,.<>?' for c in new_password)

        strength = sum([has_upper, has_lower, has_digit, has_special])

        if strength < 2:
            print("⚠️  Warning: Weak password")
            response = input("Continue anyway? (yes/no): ")
            if response.lower() != 'yes':
                continue
        elif strength == 2:
            print("✓ Moderate password strength")
        elif strength == 3:
            print("✓ Good password strength")
        else:
            print("✓ Strong password")

        break

    # Update password
    print("\n🔄 Updating password...")
    new_hash = generate_password_hash(new_password)

    cursor.execute(
        "UPDATE users SET password_hash = ? WHERE id = ?",
        (new_hash, user_id)
    )
    conn.commit()
    conn.close()

    print("✅ Admin password updated successfully!")
    print()
    print("Important notes:")
    print("  1. All users will need to log in again")
    print("  2. Store the new password securely")
    print("  3. Update ADMIN_CREDENTIALS.md file")
    print("  4. Do not share the password via insecure channels")
    print()

    return True

if __name__ == "__main__":
    try:
        success = change_password()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n❌ Operation cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
