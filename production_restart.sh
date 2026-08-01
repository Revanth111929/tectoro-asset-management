#!/bin/bash
# Production Restart Script
# Stops and starts the application

echo "════════════════════════════════════════════════════════════"
echo "🔄 Restarting Asset Management Application"
echo "════════════════════════════════════════════════════════════"
echo ""

# Stop the application
./production_stop.sh

echo ""
echo "⏳ Waiting 2 seconds before restart..."
sleep 2
echo ""

# Start the application
./production_start.sh
