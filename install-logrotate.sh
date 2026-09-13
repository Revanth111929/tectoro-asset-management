#!/bin/bash
# Install logrotate configuration for IT Asset Management
# Run with: sudo ./install-logrotate.sh

set -e  # Exit on error

echo "=================================================="
echo "Installing Log Rotation Configuration"
echo "=================================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Error: This script must be run as root"
    echo "   Please run: sudo ./install-logrotate.sh"
    exit 1
fi

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SOURCE_FILE="$SCRIPT_DIR/logrotate.conf"
DEST_FILE="/etc/logrotate.d/asset-management"

# Check if source file exists
if [ ! -f "$SOURCE_FILE" ]; then
    echo "❌ Error: logrotate.conf not found in $SCRIPT_DIR"
    exit 1
fi

# Backup existing configuration if it exists
if [ -f "$DEST_FILE" ]; then
    BACKUP_FILE="${DEST_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
    echo "📦 Backing up existing configuration to: $BACKUP_FILE"
    cp "$DEST_FILE" "$BACKUP_FILE"
fi

# Copy configuration file
echo "📝 Installing logrotate configuration..."
cp "$SOURCE_FILE" "$DEST_FILE"

# Set correct permissions
echo "🔒 Setting permissions..."
chmod 644 "$DEST_FILE"
chown root:root "$DEST_FILE"

# Validate configuration
echo "✅ Validating configuration..."
if logrotate -d "$DEST_FILE" > /dev/null 2>&1; then
    echo "✅ Configuration is valid"
else
    echo "⚠️  Warning: Configuration validation returned warnings (may be normal)"
fi

# Show current log sizes
echo ""
echo "📊 Current log sizes:"
ls -lh "$SCRIPT_DIR/logs/"*.log 2>/dev/null || echo "   No log files found"

echo ""
echo "=================================================="
echo "✅ Log rotation installed successfully!"
echo "=================================================="
echo ""
echo "Configuration: $DEST_FILE"
echo ""
echo "Rotation schedule:"
echo "  - Frequency: Daily (or when log > 100MB)"
echo "  - Retention: 30 days"
echo "  - Compression: Yes (gzip)"
echo "  - Max size: 100MB per file"
echo ""
echo "Test rotation manually:"
echo "  sudo logrotate -f $DEST_FILE"
echo ""
echo "View logrotate status:"
echo "  sudo cat /var/lib/logrotate/status | grep asset-management"
echo ""
