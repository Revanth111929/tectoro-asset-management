"""
Run this script from your project root:
  python3 step7_approuter_patch.py

Adds EmailConfig route to App.js and a sidebar link in Layout.js
"""
import re

# ── App.js patch ──────────────────────────────────────────────────────────────
with open('frontend/src/App.js', 'r') as f:
    app_content = f.read()

# Add import
if 'EmailConfig' not in app_content:
    # Find last import line
    last_import_match = list(re.finditer(r'^import .+;', app_content, re.MULTILINE))
    if last_import_match:
        last_import = last_import_match[-1]
        insert_pos  = last_import.end()
        app_content = (app_content[:insert_pos]
                       + "\nimport EmailConfig from './pages/EmailConfig';"
                       + app_content[insert_pos:])
        print("✅ EmailConfig import added to App.js")

# Add route — find the Settings route and add after it
if '/email-config' not in app_content:
    # Look for Settings route pattern
    settings_pattern = re.search(r'<Route[^>]+/settings[^/]', app_content, re.IGNORECASE)
    if settings_pattern:
        # Find the end of that Route element
        end = app_content.find('/>', settings_pattern.start())
        if end == -1:
            end = app_content.find('</Route>', settings_pattern.start())
            insert_at = end + len('</Route>')
        else:
            insert_at = end + 2
        app_content = (app_content[:insert_at]
                       + '\n            <Route path="/email-config" element={<EmailConfig />} />'
                       + app_content[insert_at:])
        print("✅ /email-config route added to App.js")
    else:
        print("⚠️  Could not find Settings route — add this manually to App.js:")
        print('   <Route path="/email-config" element={<EmailConfig />} />')

with open('frontend/src/App.js', 'w') as f:
    f.write(app_content)


# ── Layout.js sidebar patch ───────────────────────────────────────────────────
with open('frontend/src/components/Layout.js', 'r') as f:
    layout_content = f.read()

if '/email-config' not in layout_content:
    # Find the Settings nav item and insert Email Config after it
    settings_nav = re.search(r'<NavItem[^>]+to=["\']\/settings["\']', layout_content)
    if settings_nav:
        # Find end of that NavItem element
        end = layout_content.find('/>', settings_nav.start()) + 2
        email_nav = """
                <NavItem to="/email-config" icon="bi-envelope-gear">Email Config</NavItem>"""
        layout_content = layout_content[:end] + email_nav + layout_content[end:]
        print("✅ Email Config nav item added to Layout.js sidebar")
    else:
        print("⚠️  Could not auto-add sidebar link. Add this manually in Layout.js near Settings:")
        print('   <NavItem to="/email-config" icon="bi-envelope-gear">Email Config</NavItem>')

    with open('frontend/src/components/Layout.js', 'w') as f:
        f.write(layout_content)
