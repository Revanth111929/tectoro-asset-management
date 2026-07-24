#!/bin/bash
# fix_timeline_theme.sh
# Removes the @media (prefers-color-scheme: dark) block from AssetHistoryTimeline.css
# This block was overriding the in-app light/dark toggle with the OS-level dark mode setting.

CSS_FILE=~/Desktop/asset-management/frontend/src/components/AssetHistoryTimeline.css

echo "📋 Backing up..."
cp "$CSS_FILE" "$CSS_FILE.bak"

python3 - <<'PYEOF'
import re

path = "/home/administrator/Desktop/asset-management/frontend/src/components/AssetHistoryTimeline.css"

with open(path, "r") as f:
    content = f.read()

# Remove the entire "Dark mode support" @media block
pattern = r"/\* Dark mode support \*/\s*@media \(prefers-color-scheme: dark\) \{(?:[^{}]*\{[^{}]*\}[^{}]*)*\}"
new_content, n = re.subn(pattern, "", content, flags=re.DOTALL)

if n == 0:
    print("⚠️  Pattern not matched — trying simpler split approach")
    # Fallback: cut everything from "/* Dark mode support */" to "/* Print styles */"
    start = content.find("/* Dark mode support */")
    end = content.find("/* Print styles */")
    if start != -1 and end != -1:
        new_content = content[:start] + content[end:]
        n = 1

with open(path, "w") as f:
    f.write(new_content)

print(f"✅ Removed {n} dark-mode override block(s)")
PYEOF

echo "🚀 Now rebuild the frontend:"
echo "   cd ~/Desktop/asset-management/frontend && npm run build"
