#!/bin/bash
#
# HTTPS Setup Script for Asset Management Application
# This script sets up production HTTPS with Nginx + Gunicorn
#

set -e

echo "========================================="
echo "Asset Management - HTTPS Setup"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/home/administrator/Desktop/asset-management"
SERVER_IP="192.168.20.180"
HTTPS_PORT=443
HTTP_PORT=80
BACKEND_PORT=5000
DOMAIN_NAME="asset-management.local"  # Optional DNS name

echo "Configuration:"
echo "  App Directory: $APP_DIR"
echo "  Server IP: $SERVER_IP"
echo "  HTTPS Port: $HTTPS_PORT"
echo "  Backend Port: $BACKEND_PORT"
echo ""

# Check if running as root/sudo
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}ERROR: This script must be run with sudo${NC}"
    echo "Usage: sudo bash setup_https.sh"
    exit 1
fi

# 1. Install Nginx if not present
echo "Step 1: Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    apt-get update
    apt-get install -y nginx
    echo -e "${GREEN}✓ Nginx installed${NC}"
else
    echo -e "${GREEN}✓ Nginx already installed${NC}"
fi

# 2. Install Gunicorn in venv
echo ""
echo "Step 2: Installing Gunicorn..."
cd "$APP_DIR"
source venv/bin/activate
pip install gunicorn -q
echo -e "${GREEN}✓ Gunicorn installed${NC}"

# 3. Generate SSL Certificate
echo ""
echo "Step 3: Generating SSL Certificate..."
SSL_DIR="$APP_DIR/ssl"
mkdir -p "$SSL_DIR"

# Check if certificate already exists
if [ -f "$SSL_DIR/cert.pem" ] && [ -f "$SSL_DIR/key.pem" ]; then
    echo -e "${YELLOW}! Certificate already exists${NC}"
    read -p "Regenerate certificate? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Skipping certificate generation"
    else
        rm -f "$SSL_DIR"/*
    fi
fi

if [ ! -f "$SSL_DIR/cert.pem" ]; then
    # Create OpenSSL config with SAN
    cat > "$SSL_DIR/openssl.cnf" << EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
x509_extensions = v3_req

[dn]
C=IN
ST=Telangana
L=Hyderabad
O=Organization
OU=IT Department
CN=$SERVER_IP

[v3_req]
subjectAltName = @alt_names
basicConstraints = CA:FALSE
keyUsage = digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth

[alt_names]
IP.1 = $SERVER_IP
DNS.1 = $DOMAIN_NAME
DNS.2 = localhost
EOF

    # Generate self-signed certificate with SAN
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$SSL_DIR/key.pem" \
        -out "$SSL_DIR/cert.pem" \
        -config "$SSL_DIR/openssl.cnf" \
        -extensions v3_req

    # Set permissions
    chmod 600 "$SSL_DIR/key.pem"
    chmod 644 "$SSL_DIR/cert.pem"
    chown -R administrator:administrator "$SSL_DIR"

    echo -e "${GREEN}✓ SSL Certificate generated${NC}"
    echo -e "${YELLOW}⚠ Certificate is self-signed - browsers will show warning${NC}"
    echo "  To trust: Import $SSL_DIR/cert.pem to browser/system trust store"
fi

# 4. Backup Apache config and stop it (it's on port 80)
echo ""
echo "Step 4: Configuring web server..."
systemctl stop apache2 || true
systemctl disable apache2 || true
echo -e "${GREEN}✓ Apache2 stopped (port 80 freed for Nginx)${NC}"

# 5. Create Nginx configuration
echo ""
echo "Step 5: Creating Nginx configuration..."
cat > /etc/nginx/sites-available/asset-management << 'NGINXEOF'
# Asset Management Application - HTTPS Configuration
# Terminates TLS and proxies to Gunicorn backend

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name 192.168.20.180 asset-management.local;

    # Redirect all HTTP requests to HTTPS
    return 301 https://$host$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name 192.168.20.180 asset-management.local;

    # SSL Configuration
    ssl_certificate /home/administrator/Desktop/asset-management/ssl/cert.pem;
    ssl_certificate_key /home/administrator/Desktop/asset-management/ssl/key.pem;

    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Large file upload support (for Excel bulk imports)
    client_max_body_size 50M;
    client_body_timeout 300s;

    # Logging
    access_log /var/log/nginx/asset-management-access.log;
    error_log /var/log/nginx/asset-management-error.log;

    # API Proxy to Backend (Gunicorn on port 5000)
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;

        # Preserve original request info
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;

        # Timeouts for long-running requests
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;

        # Disable buffering for real-time responses
        proxy_buffering off;
    }

    # Static file serving (optional - if you want Nginx to serve frontend)
    location / {
        root /home/administrator/Desktop/asset-management/frontend/build;
        try_files $uri $uri/ /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Health check endpoint (bypasses frontend routing)
    location = /health {
        proxy_pass http://127.0.0.1:5000/api/health;
        proxy_set_header Host $host;
        access_log off;
    }
}
NGINXEOF

# Enable site
ln -sf /etc/nginx/sites-available/asset-management /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

echo -e "${GREEN}✓ Nginx configuration created${NC}"

# 6. Test Nginx configuration
echo ""
echo "Step 6: Testing Nginx configuration..."
nginx -t
echo -e "${GREEN}✓ Nginx configuration valid${NC}"

# 7. Create Gunicorn configuration
echo ""
echo "Step 7: Creating Gunicorn configuration..."
cat > "$APP_DIR/gunicorn_config.py" << 'GUNICORNEOF'
# Gunicorn Configuration for Asset Management Application
import multiprocessing

# Server socket
bind = "127.0.0.1:5000"
backlog = 2048

# Worker processes
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"
worker_connections = 1000
timeout = 300  # 5 minutes for long-running imports
keepalive = 2

# Logging
accesslog = "/home/administrator/Desktop/asset-management/logs/gunicorn-access.log"
errorlog = "/home/administrator/Desktop/asset-management/logs/gunicorn-error.log"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process naming
proc_name = "asset-management-api"

# Server mechanics
daemon = False
pidfile = "/home/administrator/Desktop/asset-management/gunicorn.pid"
user = None  # Run as current user
group = None
umask = 0
tmp_upload_dir = None

# SSL (not needed - Nginx terminates TLS)
# keyfile = None
# certfile = None
GUNICORNEOF

chmod 644 "$APP_DIR/gunicorn_config.py"
chown administrator:administrator "$APP_DIR/gunicorn_config.py"

# Create logs directory
mkdir -p "$APP_DIR/logs"
chown -R administrator:administrator "$APP_DIR/logs"

echo -e "${GREEN}✓ Gunicorn configuration created${NC}"

# 8. Create systemd service for backend
echo ""
echo "Step 8: Creating systemd service..."
cat > /etc/systemd/system/asset-management-api.service << 'SYSTEMDEOF'
[Unit]
Description=Asset Management API Server (Gunicorn)
After=network.target

[Service]
Type=notify
User=administrator
Group=administrator
WorkingDirectory=/home/administrator/Desktop/asset-management
Environment="PATH=/home/administrator/Desktop/asset-management/venv/bin"
EnvironmentFile=/home/administrator/Desktop/asset-management/.env

ExecStart=/home/administrator/Desktop/asset-management/venv/bin/gunicorn \
    --config /home/administrator/Desktop/asset-management/gunicorn_config.py \
    --env SCRIPT_NAME=/api \
    api_server:app

ExecReload=/bin/kill -s HUP $MAINPID
KillMode=mixed
TimeoutStopSec=5
PrivateTmp=true
Restart=on-failure
RestartSec=10s

# Security
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=read-only
ReadWritePaths=/home/administrator/Desktop/asset-management/databases
ReadWritePaths=/home/administrator/Desktop/asset-management/logs
ReadWritePaths=/home/administrator/Desktop/asset-management/uploads

[Install]
WantedBy=multi-user.target
SYSTEMDEOF

systemctl daemon-reload
systemctl enable asset-management-api.service

echo -e "${GREEN}✓ Systemd service created${NC}"

# 9. Update CORS configuration
echo ""
echo "Step 9: Updating CORS configuration..."
# Add HTTPS origin to .env if not present
if ! grep -q "ALLOWED_ORIGINS" "$APP_DIR/.env"; then
    echo "" >> "$APP_DIR/.env"
    echo "# CORS Allowed Origins (comma-separated)" >> "$APP_DIR/.env"
    echo "ALLOWED_ORIGINS=https://192.168.20.180,https://asset-management.local,http://localhost:3000" >> "$APP_DIR/.env"
else
    # Update existing ALLOWED_ORIGINS
    sed -i 's|ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=https://192.168.20.180,https://asset-management.local,http://localhost:3000|' "$APP_DIR/.env"
fi

echo -e "${GREEN}✓ CORS configuration updated${NC}"

# 10. Start services
echo ""
echo "Step 10: Starting services..."

# Stop Flask development server if running
pkill -f "python.*api_server.py" || true
sleep 2

# Start Gunicorn
systemctl restart asset-management-api.service
echo -e "${GREEN}✓ Backend API started${NC}"

# Start Nginx
systemctl restart nginx
echo -e "${GREEN}✓ Nginx started${NC}"

# 11. Verify services
echo ""
echo "Step 11: Verifying services..."
sleep 3

if systemctl is-active --quiet asset-management-api.service; then
    echo -e "${GREEN}✓ Backend API is running${NC}"
else
    echo -e "${RED}✗ Backend API failed to start${NC}"
    systemctl status asset-management-api.service --no-pager
fi

if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✓ Nginx is running${NC}"
else
    echo -e "${RED}✗ Nginx failed to start${NC}"
    systemctl status nginx --no-pager
fi

# 12. Show listening ports
echo ""
echo "Listening ports:"
ss -tlnp | grep -E ':(80|443|5000)' || echo "  No services listening"

echo ""
echo "========================================="
echo "HTTPS Setup Complete!"
echo "========================================="
echo ""
echo -e "${GREEN}✓ Application URL: https://192.168.20.180${NC}"
echo ""
echo "Next steps:"
echo "  1. Open browser: https://192.168.20.180"
echo "  2. Accept security warning (self-signed certificate)"
echo "  3. Test login and application features"
echo ""
echo "Certificate location: $SSL_DIR/cert.pem"
echo "To trust certificate: Import to browser/system trust store"
echo ""
echo "Service management:"
echo "  Backend:  systemctl status asset-management-api"
echo "  Nginx:    systemctl status nginx"
echo "  Logs:     journalctl -u asset-management-api -f"
echo "            tail -f /var/log/nginx/asset-management-error.log"
echo ""
echo "Configuration files:"
echo "  Nginx:     /etc/nginx/sites-available/asset-management"
echo "  Gunicorn:  $APP_DIR/gunicorn_config.py"
echo "  Service:   /etc/systemd/system/asset-management-api.service"
echo "  CORS:      $APP_DIR/.env (ALLOWED_ORIGINS)"
echo ""
