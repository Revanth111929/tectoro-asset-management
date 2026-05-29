#!/bin/bash

# START_HERE.sh - Quick start script for Asset Management System
# This script helps you start both backend and frontend servers

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     Asset Management System - Quick Start                     ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Get IP address
IP=$(hostname -I | awk '{print $1}')
echo "📍 Your IP Address: $IP"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "   Install it with: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs"
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 is not installed!"
    echo "   Install it with: sudo apt install python3 python3-pip python3-venv -y"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ Python version: $(python3 --version)"
echo ""

# Setup backend
echo "🔧 Setting up Backend..."
if [ ! -d "venv" ]; then
    echo "   Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
echo "   Installing Python dependencies..."
pip install -q -r requirements.txt

# Setup frontend
echo ""
echo "⚛️  Setting up Frontend..."
cd frontend

if [ ! -d "node_modules" ]; then
    echo "   Installing npm dependencies (this may take a few minutes)..."
    npm install --silent
fi

# Create .env file with IP
echo "REACT_APP_API_URL=http://$IP:5000/api" > .env
echo "   ✅ Created .env with API URL: http://$IP:5000/api"

cd ..

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    🎉 Setup Complete!                          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "📝 To start the application:"
echo ""
echo "   Terminal 1 (Backend):"
echo "   $ cd /home/administrator/asset-management"
echo "   $ source venv/bin/activate"
echo "   $ python3 api_server.py"
echo ""
echo "   Terminal 2 (Frontend):"
echo "   $ cd /home/administrator/asset-management/frontend"
echo "   $ npm start"
echo ""
echo "🌐 Access the app:"
echo "   • On this computer:  http://localhost:3000"
echo "   • From other devices: http://$IP:3000"
echo ""
echo "🔐 Login credentials:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "📖 For detailed instructions, see: SETUP_GUIDE.md"
echo ""
