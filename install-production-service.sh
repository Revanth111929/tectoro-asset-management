#!/bin/bash
# Asset Management - Production Auto-Start Installation Script
# This script installs and configures the systemd service for automatic startup

set -e  # Exit on any error

echo "================================================================"
echo " Asset Management - Production Auto-Start Installation"
echo "================================================================"
echo ""

# Check if running with sudo
if [ "$EUID" -ne 0 ]; then
    echo "ERROR: This script must be run with sudo"
    echo "Usage: sudo ./install-production-service.sh"
    exit 1
fi

PROJECT_DIR="/home/administrator/Desktop/asset-management"
SERVICE_FILE="/etc/systemd/system/asset-management.service"

echo "Step 1: Stopping any existing manual processes..."
pkill -f "gunicorn.*api_server" 2>/dev/null && echo "  ✓ Stopped existing gunicorn" || echo "  ✓ No gunicorn to stop"
pkill -f "python.*api_server" 2>/dev/null && echo "  ✓ Stopped existing python" || echo "  ✓ No python to stop"
sleep 2
echo ""

echo "Step 2: Creating systemd service file..."
cat > "$SERVICE_FILE" << 'EOF'
[Unit]
Description=Tectoro Asset Management Backend API
After=network.target

[Service]
Type=simple
User=administrator
Group=administrator
WorkingDirectory=/home/administrator/Desktop/asset-management
Environment="PATH=/home/administrator/Desktop/asset-management/venv/bin:/usr/local/bin:/usr/bin:/bin"
Environment="APP_ENV=office"
EnvironmentFile=-/home/administrator/Desktop/asset-management/.env
ExecStart=/home/administrator/Desktop/asset-management/venv/bin/gunicorn \
    --bind 0.0.0.0:3000 \
    --workers 2 \
    --timeout 120 \
    --access-logfile /home/administrator/Desktop/asset-management/logs/gunicorn-access.log \
    --error-logfile /home/administrator/Desktop/asset-management/logs/gunicorn-error.log \
    --log-level info \
    --capture-output \
    api_server:app

Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF

echo "  ✓ Service file created at $SERVICE_FILE"
echo ""

echo "Step 3: Setting correct permissions..."
chmod 644 "$SERVICE_FILE"
echo "  ✓ Permissions set to 644"
echo ""

echo "Step 4: Reloading systemd daemon..."
systemctl daemon-reload
echo "  ✓ Systemd reloaded"
echo ""

echo "Step 5: Enabling service for automatic startup..."
systemctl enable asset-management.service
echo "  ✓ Service enabled"
echo ""

echo "Step 6: Starting service..."
systemctl start asset-management.service
echo "  ✓ Service started"
echo ""

echo "Step 7: Waiting for service to initialize..."
sleep 5
echo ""

echo "================================================================"
echo " Verification"
echo "================================================================"
echo ""

echo "Service Status:"
systemctl status asset-management.service --no-pager -l || true
echo ""

echo "Service Enabled:"
systemctl is-enabled asset-management.service && echo "  ✓ YES" || echo "  ✗ NO"
echo ""

echo "Service Active:"
systemctl is-active asset-management.service && echo "  ✓ YES" || echo "  ✗ NO"
echo ""

echo "Port 3000 Status:"
ss -lntp | grep ":3000" && echo "  ✓ Port 3000 is listening" || echo "  ✗ Port 3000 not listening"
echo ""

echo "Health Check:"
curl -s http://localhost:3000/api/health | python3 -m json.tool 2>/dev/null && echo "  ✓ API responding" || echo "  ✗ API not responding"
echo ""

echo "================================================================"
echo " Installation Summary"
echo "================================================================"
echo ""
echo "Service File: $SERVICE_FILE"
echo "Service Name: asset-management.service"
echo "Service User: administrator"
echo "Working Directory: $PROJECT_DIR"
echo "Port: 3000"
echo "Workers: 2"
echo "Database: $PROJECT_DIR/databases/local_assets.db"
echo "Environment: APP_ENV=office"
echo ""
echo "================================================================"
echo " Management Commands"
echo "================================================================"
echo ""
echo "View status:   sudo systemctl status asset-management.service"
echo "Stop service:  sudo systemctl stop asset-management.service"
echo "Start service: sudo systemctl start asset-management.service"
echo "Restart:       sudo systemctl restart asset-management.service"
echo "View logs:     sudo journalctl -u asset-management.service -f"
echo "Disable:       sudo systemctl disable asset-management.service"
echo ""
echo "================================================================"
echo " ✓ Installation Complete!"
echo "================================================================"
echo ""
echo "The Asset Management application will now start automatically"
echo "after Ubuntu reboots. No manual intervention required."
echo ""
echo "To test automatic startup, reboot the system:"
echo "  sudo reboot"
echo ""
echo "After reboot, verify the service is running:"
echo "  sudo systemctl status asset-management.service"
echo "  curl http://localhost:3000/api/health"
echo ""
