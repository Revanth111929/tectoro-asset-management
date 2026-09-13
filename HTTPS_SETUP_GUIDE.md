# HTTPS Setup Guide - Asset Management Application

## Overview

This guide documents the complete HTTPS implementation for the production asset management application.

**Target URL:** `https://192.168.20.180`

---

## Architecture

### Before (Development)

```
Browser
    ↓ HTTP :3000
Flask Development Server (python api_server.py)
    ↓
SQLite Database
```

### After (Production with HTTPS)

```
Browser
    ↓ HTTPS :443 (TLS terminated)
Nginx
    ↓ HTTP :5000 (localhost only)
Gunicorn + Flask Application
    ↓
SQLite Database
```

---

## Installation Steps

### Prerequisites

- Ubuntu/Debian Linux
- Python 3 with venv
- Sudo access
- Port 80 and 443 available

### Step 1: Run Setup Script

```bash
cd /home/administrator/Desktop/asset-management
sudo bash setup_https.sh
```

The script will:
1. Install Nginx
2. Install Gunicorn in virtualenv
3. Generate self-signed SSL certificate with IP SAN
4. Stop Apache2 (frees port 80)
5. Configure Nginx as HTTPS termination proxy
6. Configure Gunicorn as production WSGI server
7. Create systemd service for auto-start
8. Update CORS configuration
9. Start all services
10. Verify installation

### Step 2: Test HTTPS

```bash
cd /home/administrator/Desktop/asset-management
bash test_https.sh
```

### Step 3: Access Application

Open browser: `https://192.168.20.180`

**Note:** You'll see a security warning because the certificate is self-signed.

**To proceed:**
- Click "Advanced" or "Show Details"
- Click "Proceed to 192.168.20.180 (unsafe)" or "Accept the Risk"

**To eliminate warning:** Import the certificate to your browser/system trust store.

---

## SSL Certificate

### Certificate Details

**Type:** Self-signed X.509 certificate
**Location:** `/home/administrator/Desktop/asset-management/ssl/`
**Files:**
- `cert.pem` - Public certificate
- `key.pem` - Private key (permissions: 600)
- `openssl.cnf` - OpenSSL configuration

**Subject Alternative Names (SAN):**
- IP: 192.168.20.180
- DNS: asset-management.local
- DNS: localhost

**Validity:** 365 days from generation

### Trust Certificate (Optional)

#### Chrome/Edge
1. Go to Settings → Privacy and security → Security → Manage certificates
2. Import `cert.pem` into "Trusted Root Certification Authorities"
3. Restart browser

#### Firefox
1. Go to Settings → Privacy & Security → Certificates → View Certificates
2. Import `cert.pem` into "Authorities" tab
3. Check "Trust this CA to identify websites"
4. Restart browser

#### Linux System-wide
```bash
sudo cp /home/administrator/Desktop/asset-management/ssl/cert.pem /usr/local/share/ca-certificates/asset-management.crt
sudo update-ca-certificates
```

---

## Configuration Files

### 1. Nginx Configuration

**File:** `/etc/nginx/sites-available/asset-management`

**Key features:**
- HTTP → HTTPS redirect (port 80 → 443)
- TLS 1.2 and 1.3 support
- Security headers (HSTS, X-Frame-Options, etc.)
- Large file upload support (50MB for Excel imports)
- API proxy to Gunicorn on localhost:5000
- Static file serving from frontend/build
- Health check endpoint

**Test configuration:**
```bash
sudo nginx -t
```

**Reload after changes:**
```bash
sudo systemctl reload nginx
```

### 2. Gunicorn Configuration

**File:** `/home/administrator/Desktop/asset-management/gunicorn_config.py`

**Key settings:**
- Bind: 127.0.0.1:5000 (localhost only)
- Workers: (CPU cores × 2) + 1
- Timeout: 300 seconds (for long imports)
- Logging: gunicorn-access.log and gunicorn-error.log

### 3. Systemd Service

**File:** `/etc/systemd/system/asset-management-api.service`

**Features:**
- Auto-start on boot
- Auto-restart on failure
- Loads environment variables from .env
- Runs as administrator user
- Protected filesystem access

**Commands:**
```bash
# Status
sudo systemctl status asset-management-api

# Start
sudo systemctl start asset-management-api

# Stop
sudo systemctl stop asset-management-api

# Restart
sudo systemctl restart asset-management-api

# Enable auto-start
sudo systemctl enable asset-management-api

# View logs
sudo journalctl -u asset-management-api -f
```

### 4. CORS Configuration

**File:** `/home/administrator/Desktop/asset-management/.env`

**Line:**
```
ALLOWED_ORIGINS=https://192.168.20.180,https://asset-management.local,http://localhost:3000
```

**Includes:**
- Production HTTPS origin
- Development localhost (for testing)
- Optional DNS name

---

## Security Features

### 1. HTTPS/TLS

- **Protocol:** TLS 1.2 and 1.3
- **Cipher Suites:** HIGH (no aNULL, no MD5)
- **Session Cache:** 10MB shared cache
- **Certificate:** Self-signed with IP SAN

### 2. Security Headers

Automatically added by Nginx:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

### 3. Proxy Headers

Nginx forwards original request information:

```
X-Real-IP: <client-ip>
X-Forwarded-For: <client-ip>
X-Forwarded-Proto: https
X-Forwarded-Host: <hostname>
X-Forwarded-Port: 443
```

The backend recognizes requests as HTTPS through `X-Forwarded-Proto`.

### 4. Secure Cookies

Authentication cookies automatically use:
- `Secure` flag (HTTPS only)
- `HttpOnly` flag (not accessible via JavaScript)
- `SameSite=Lax` (CSRF protection)

### 5. Backend Isolation

- Backend binds to `127.0.0.1:5000` (localhost only)
- Not accessible from external network
- Only Nginx can reach backend

---

## Service Management

### Start/Stop Services

```bash
# Start everything
sudo systemctl start asset-management-api
sudo systemctl start nginx

# Stop everything
sudo systemctl stop asset-management-api
sudo systemctl stop nginx

# Restart after configuration changes
sudo systemctl restart asset-management-api
sudo systemctl reload nginx  # Nginx reload is graceful
```

### View Logs

```bash
# Backend API logs (Gunicorn)
sudo journalctl -u asset-management-api -f
tail -f ~/Desktop/asset-management/logs/gunicorn-error.log
tail -f ~/Desktop/asset-management/logs/gunicorn-access.log

# Nginx logs
sudo tail -f /var/log/nginx/asset-management-access.log
sudo tail -f /var/log/nginx/asset-management-error.log
```

### Check Status

```bash
# Service status
sudo systemctl status asset-management-api
sudo systemctl status nginx

# Listening ports
sudo ss -tlnp | grep -E ':(80|443|5000)'

# Process list
ps aux | grep -E 'gunicorn|nginx'
```

---

## Testing

### Automated Tests

```bash
cd /home/administrator/Desktop/asset-management
bash test_https.sh
```

Tests:
- HTTP → HTTPS redirect
- HTTPS homepage
- Health check endpoint
- SSL certificate validity
- Service status
- Port status

### Manual Browser Tests

1. **HTTPS Access:** `https://192.168.20.180`
   - Should load application
   - Accept certificate warning

2. **HTTP Redirect:** `http://192.168.20.180`
   - Should automatically redirect to HTTPS

3. **Login:** Test authentication
   - Login with admin credentials
   - Verify JWT token works over HTTPS

4. **API Requests:** Open DevTools → Network
   - All requests should show `https://`
   - No mixed content warnings
   - Status codes: 200, 201, 401, etc.

5. **File Upload:** Test Excel bulk import
   - Employee bulk import
   - Asset bulk import
   - Should complete successfully

### API Health Check

```bash
# HTTPS
curl -k https://192.168.20.180/api/health

# HTTP (should redirect)
curl -L http://192.168.20.180/api/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "IT Asset Management API is running"
}
```

---

## Troubleshooting

### Issue 1: Certificate Warning in Browser

**Symptom:** Browser shows "Your connection is not private"

**Cause:** Self-signed certificate is not trusted

**Solutions:**
1. **Temporary:** Click "Advanced" → "Proceed anyway"
2. **Permanent:** Import certificate to browser/system trust store (see above)
3. **Production:** Replace with CA-signed certificate

---

### Issue 2: 502 Bad Gateway

**Symptom:** Nginx shows 502 error

**Cause:** Backend (Gunicorn) is not running

**Solution:**
```bash
# Check backend status
sudo systemctl status asset-management-api

# View backend logs
sudo journalctl -u asset-management-api -n 50

# Restart backend
sudo systemctl restart asset-management-api
```

---

### Issue 3: Connection Refused

**Symptom:** Browser cannot connect to https://192.168.20.180

**Cause:** Nginx is not running or port 443 is blocked

**Solution:**
```bash
# Check Nginx status
sudo systemctl status nginx

# Start Nginx
sudo systemctl start nginx

# Check port 443
sudo ss -tlnp | grep :443

# Check firewall
sudo ufw status
```

---

### Issue 4: Mixed Content Warnings

**Symptom:** Console shows "Mixed Content" errors

**Cause:** Some resources loading over HTTP

**Solution:**
1. Open DevTools → Console
2. Identify HTTP resources
3. Update frontend to use HTTPS or relative URLs
4. Rebuild frontend: `cd frontend && npm run build`

---

### Issue 5: CORS Errors

**Symptom:** API requests blocked by CORS policy

**Cause:** Origin not in ALLOWED_ORIGINS

**Solution:**
```bash
# Check CORS configuration
grep ALLOWED_ORIGINS ~/Desktop/asset-management/.env

# Add HTTPS origin
echo "ALLOWED_ORIGINS=https://192.168.20.180,http://localhost:3000" >> ~/Desktop/asset-management/.env

# Restart backend
sudo systemctl restart asset-management-api
```

---

### Issue 6: Long Request Timeouts

**Symptom:** Excel uploads fail with 504 Gateway Timeout

**Cause:** Timeout too short for large files

**Solution:**
1. Edit Nginx config: `/etc/nginx/sites-available/asset-management`
2. Increase timeouts:
   ```
   client_body_timeout 600s;
   proxy_read_timeout 600s;
   ```
3. Edit Gunicorn config: `~/Desktop/asset-management/gunicorn_config.py`
4. Increase timeout:
   ```python
   timeout = 600
   ```
5. Reload services:
   ```bash
   sudo systemctl reload nginx
   sudo systemctl restart asset-management-api
   ```

---

## Maintenance

### Renew Certificate

Self-signed certificate expires after 365 days.

```bash
cd /home/administrator/Desktop/asset-management
sudo bash setup_https.sh
# Select "y" when asked to regenerate certificate
```

### Update Application

```bash
cd /home/administrator/Desktop/asset-management

# Pull changes
git pull

# Update Python dependencies
source venv/bin/activate
pip install -r requirements.txt

# Rebuild frontend
cd frontend
npm install
npm run build
cd ..

# Restart backend
sudo systemctl restart asset-management-api
```

### Backup

```bash
# Backup SSL certificates
cp -r ~/Desktop/asset-management/ssl ~/Desktop/asset-management-ssl-backup

# Backup database
cp ~/Desktop/asset-management/databases/*.db ~/backups/

# Backup configuration
sudo cp /etc/nginx/sites-available/asset-management ~/backups/nginx-asset-management.conf
cp ~/Desktop/asset-management/.env ~/backups/
```

---

## Production Checklist

- [x] Nginx installed and configured
- [x] Gunicorn installed and configured
- [x] SSL certificate generated with IP SAN
- [x] HTTPS listening on port 443
- [x] HTTP redirects to HTTPS
- [x] Backend isolated to localhost:5000
- [x] Systemd service configured
- [x] Auto-start on boot enabled
- [x] CORS configured for HTTPS
- [x] Security headers enabled
- [x] Large file upload support
- [x] Logging configured
- [x] Health check endpoint working
- [x] Frontend built for production
- [ ] Certificate trusted (optional)
- [ ] DNS configured (optional)
- [ ] Firewall rules configured
- [ ] Monitoring configured (optional)

---

## Performance

### Expected Performance

- **SSL Handshake:** < 100ms
- **API Response:** < 200ms (simple queries)
- **Page Load:** < 2s (first load), < 500ms (cached)
- **File Upload:** Depends on file size and network

### Optimization Tips

1. **Enable GZIP compression** in Nginx
2. **Enable HTTP/2** (already enabled)
3. **Configure caching** for static assets (already configured)
4. **Increase Gunicorn workers** for high traffic
5. **Use CDN** for static assets (optional)

---

## Support

### Quick Commands

```bash
# View all logs
sudo journalctl -xe

# Check backend health
curl -k https://192.168.20.180/api/health

# Reload Nginx (graceful)
sudo systemctl reload nginx

# Restart backend
sudo systemctl restart asset-management-api

# View listening ports
sudo ss -tlnp | grep -E ':(80|443|5000)'

# Test SSL certificate
echo | openssl s_client -connect 192.168.20.180:443 -servername 192.168.20.180 2>/dev/null | openssl x509 -noout -text
```

### Configuration File Locations

- Nginx: `/etc/nginx/sites-available/asset-management`
- Gunicorn: `~/Desktop/asset-management/gunicorn_config.py`
- Systemd: `/etc/systemd/system/asset-management-api.service`
- SSL: `~/Desktop/asset-management/ssl/`
- Environment: `~/Desktop/asset-management/.env`
- Logs: `~/Desktop/asset-management/logs/`

---

## Version

**Setup Date:** August 30, 2026
**Application:** IT Asset Management System
**HTTPS:** Enabled ✅
**Production Ready:** Yes ✅
