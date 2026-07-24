#!/bin/bash
# run_all_steps.sh
# Run from your project root: bash run_all_steps.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "═══════════════════════════════════════════"
echo " Asset Acknowledgment Feature — Auto Setup"
echo "═══════════════════════════════════════════"
echo ""

cd ~/Desktop/asset-management

echo "▶ Step 1: Updating models.py..."
python3 "$SCRIPT_DIR/step1_models_patch.py"

echo ""
echo "▶ Step 2: Replacing email_service.py..."
cp "$SCRIPT_DIR/email_service.py" email_service.py
echo "✅ email_service.py replaced"

echo ""
echo "▶ Step 3: Patching routes.py..."
python3 "$SCRIPT_DIR/step3_routes_patch.py"

echo ""
echo "▶ Step 4: Patching frontend/src/services/api.js..."
python3 "$SCRIPT_DIR/step4_api_js_patch.py"

echo ""
echo "▶ Step 5: Copying EmailConfig.js page..."
cp "$SCRIPT_DIR/EmailConfig.js" frontend/src/pages/EmailConfig.js
echo "✅ EmailConfig.js copied"

echo ""
echo "▶ Step 6: Copying AckButton.js component..."
cp "$SCRIPT_DIR/AckButton.js" frontend/src/components/AckButton.js
echo "✅ AckButton.js copied"

echo ""
echo "▶ Step 7: Patching App.js router + Layout.js sidebar..."
python3 "$SCRIPT_DIR/step7_approuter_patch.py"

echo ""
echo "▶ Step 8: Updating requirements.txt..."
python3 "$SCRIPT_DIR/step8_requirements_patch.py"

echo ""
echo "▶ Step 9: Rebuilding React frontend..."
cd frontend && npm run build && cd ..

echo ""
echo "▶ Step 10: Committing and pushing..."
git add .
git commit -m "Add asset acknowledgment workflow + email config UI"
git push

echo ""
echo "═══════════════════════════════════════════"
echo " ✅ All done! Deploy in progress on Render."
echo "═══════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "  1. Go to Render → tectoro-asset-management → Environment"
echo "  2. Add: EMAIL_ENCRYPT_KEY = (run: python3 -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\")"
echo "  3. Add: APP_BASE_URL = https://tectoro-asset-management.onrender.com"
echo "  4. After deploy: go to Settings → Email Config in your app"
echo "  5. Enter your Outlook SMTP details and click Test before saving"
echo ""
