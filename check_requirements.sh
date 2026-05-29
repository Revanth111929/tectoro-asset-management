#!/bin/bash

# check_requirements.sh - Check if all required software is installed

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║          System Requirements Check                             ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

ALL_GOOD=true

# Check Python
echo -n "Checking Python3... "
if command -v python3 &> /dev/null; then
    VERSION=$(python3 --version 2>&1 | awk '{print $2}')
    echo "✅ Found: $VERSION"
else
    echo "❌ NOT FOUND"
    echo "   Install: sudo apt install python3 python3-pip python3-venv -y"
    ALL_GOOD=false
fi

# Check pip
echo -n "Checking pip3... "
if command -v pip3 &> /dev/null; then
    VERSION=$(pip3 --version 2>&1 | awk '{print $2}')
    echo "✅ Found: $VERSION"
else
    echo "❌ NOT FOUND"
    echo "   Install: sudo apt install python3-pip -y"
    ALL_GOOD=false
fi

# Check Node.js
echo -n "Checking Node.js... "
if command -v node &> /dev/null; then
    VERSION=$(node --version 2>&1)
    echo "✅ Found: $VERSION"
else
    echo "❌ NOT FOUND"
    echo "   Install: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs"
    ALL_GOOD=false
fi

# Check npm
echo -n "Checking npm... "
if command -v npm &> /dev/null; then
    VERSION=$(npm --version 2>&1)
    echo "✅ Found: v$VERSION"
else
    echo "❌ NOT FOUND"
    echo "   Install: sudo apt install npm -y"
    ALL_GOOD=false
fi

# Check git (optional)
echo -n "Checking git... "
if command -v git &> /dev/null; then
    VERSION=$(git --version 2>&1 | awk '{print $3}')
    echo "✅ Found: $VERSION"
else
    echo "⚠️  NOT FOUND (optional)"
    echo "   Install: sudo apt install git -y"
fi

# Check curl
echo -n "Checking curl... "
if command -v curl &> /dev/null; then
    VERSION=$(curl --version 2>&1 | head -n1 | awk '{print $2}')
    echo "✅ Found: $VERSION"
else
    echo "❌ NOT FOUND"
    echo "   Install: sudo apt install curl -y"
    ALL_GOOD=false
fi

echo ""
echo "─────────────────────────────────────────────────────────────────"

# Network info
echo ""
echo "📍 Network Information:"
IP=$(hostname -I | awk '{print $1}')
echo "   IP Address: $IP"
echo "   Hostname: $(hostname)"

echo ""
echo "─────────────────────────────────────────────────────────────────"

if [ "$ALL_GOOD" = true ]; then
    echo ""
    echo "✅ All requirements met! You're ready to go."
    echo ""
    echo "Next steps:"
    echo "  1. Run: ./START_HERE.sh"
    echo "  2. Or follow SETUP_GUIDE.md for manual setup"
    echo ""
else
    echo ""
    echo "❌ Some requirements are missing. Please install them first."
    echo ""
    echo "Quick install all (Ubuntu/Debian):"
    echo "  sudo apt update"
    echo "  sudo apt install python3 python3-pip python3-venv curl -y"
    echo "  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
    echo "  sudo apt install -y nodejs"
    echo ""
fi
