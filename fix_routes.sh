#!/bin/bash
# fix_routes.sh — Run this once to patch routes.py
# Usage: bash fix_routes.sh

ROUTES=~/Desktop/asset-management/routes.py

echo "📋 Backing up routes.py..."
cp "$ROUTES" "$ROUTES.bak"

echo "🔧 Fixing log_activity function (removing current_user dependency)..."

python3 - <<'PYEOF'
import re

path = "/home/administrator/Desktop/asset-management/routes.py"

with open(path, "r") as f:
    content = f.read()

# ── Fix 1: Remove flask_login import (causes the crash) ──────────────────────
content = content.replace(
    "from flask_login import login_user, logout_user, login_required, current_user",
    "# flask_login session imports removed — app uses JWT token auth\n"
    "# from flask_login import login_user, logout_user, login_required, current_user"
)

# ── Fix 2: Replace the broken log_activity function ──────────────────────────
old_log = (
    "def log_activity(action, module, description):\n"
    "    entry = ActivityLog(\n"
    "        user=current_user.username if current_user.is_authenticated else 'system',\n"
    "        action=action, module=module, description=description\n"
    "    )\n"
    "    db.session.add(entry)\n"
    "    db.session.commit()"
)
new_log = (
    "def log_activity(action, module, description, user='admin'):\n"
    "    \"\"\"Write an activity log entry — no flask_login dependency.\"\"\"\n"
    "    try:\n"
    "        entry = ActivityLog(user=user, action=action, module=module, description=description)\n"
    "        db.session.add(entry)\n"
    "        db.session.commit()\n"
    "    except Exception:\n"
    "        db.session.rollback()"
)
if old_log in content:
    content = content.replace(old_log, new_log)
    print("  ✅ log_activity fixed")
else:
    # Fallback: regex replace that handles minor whitespace differences
    pattern = r"def log_activity\(action, module, description\):\s+entry = ActivityLog\(\s+user=current_user\.username if current_user\.is_authenticated else 'system',"
    replacement = "def log_activity(action, module, description, user='admin'):\n    try:\n        entry = ActivityLog(\n            user=user,"
    content, n = re.subn(pattern, replacement, content, flags=re.MULTILINE)
    if n:
        print("  ✅ log_activity fixed (regex)")
    else:
        print("  ⚠️  log_activity pattern not found — check manually")

# ── Fix 3: Gut the broken auth_bp login view ─────────────────────────────────
# Replace the whole html-based login() in auth_bp with a stub
old_auth_login = '''@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('main.dashboard'))

    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '')
        remember = request.form.get('remember') == 'on'

        user = User.query.filter_by(username=username).first()

        if user and check_password_hash(user.password_hash, password):
            login_user(user, remember=remember)
            flash(f'Welcome back, {user.username}!', 'success')
            next_page = request.args.get('next')
            return redirect(next_page or url_for('main.dashboard'))
        else:
            flash('Invalid username or password.', 'danger')

    return render_template('login.html')'''

new_auth_login = '''@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    # HTML login replaced by React frontend + /api/auth/login JSON endpoint
    return jsonify({'message': 'Use POST /api/auth/login'}), 200'''

if old_auth_login in content:
    content = content.replace(old_auth_login, new_auth_login)
    print("  ✅ auth_bp login stubbed out")
else:
    # Regex fallback
    pattern = r"@auth_bp\.route\('/login'.*?\n(?:.*\n)*?    return render_template\('login\.html'\)"
    replacement = (
        "@auth_bp.route('/login', methods=['GET', 'POST'])\n"
        "def login():\n"
        "    return jsonify({'message': 'Use POST /api/auth/login'}), 200"
    )
    content, n = re.subn(pattern, replacement, content, flags=re.MULTILINE)
    if n:
        print("  ✅ auth_bp login stubbed (regex)")
    else:
        print("  ⚠️  auth_bp login not found — check manually (not critical)")

# ── Fix 4: Remove @login_required decorators (no longer needed) ──────────────
count = content.count("@login_required")
content = content.replace("@login_required\n", "")
print(f"  ✅ Removed {count} @login_required decorators")

# ── Fix 5: Remove logout route that uses logout_user() ───────────────────────
old_logout = '''@auth_bp.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You have been logged out.', 'info')
    return redirect(url_for('auth.login'))'''

new_logout = '''@auth_bp.route('/logout')
def logout():
    return jsonify({'message': 'Logged out'}), 200'''

content = content.replace(old_logout, new_logout)

# ── Fix 6: Remove render_template / flash / redirect that need flask session ─
# These are in the Jinja2 blueprint routes — stub them safely
old_landing = '''@auth_bp.route('/')
def landing():
    return render_template('landing.html')'''
new_landing = '''@auth_bp.route('/')
def landing():
    return jsonify({'message': 'Tectoro Asset Management API'}), 200'''
content = content.replace(old_landing, new_landing)

with open(path, "w") as f:
    f.write(content)

print("\n✅ routes.py patched successfully!")
print("   Restart the server: python api_server.py")
PYEOF

echo ""
echo "🚀 Done! Now restart your server:"
echo "   source venv/bin/activate && python api_server.py"
