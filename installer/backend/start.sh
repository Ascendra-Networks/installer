#!/bin/bash

# Start script for Ascendra Installer Backend

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   Ascendra Installer Backend - Startup Script            ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found"
    echo "Creating .env from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✓ Created .env file"
        echo ""
        echo "⚠️  Please edit .env and configure the following:"
        echo "   - GHCR_USERNAME"
        echo "   - GHCR_PASSWORD"
        echo ""
        read -p "Press Enter to continue or Ctrl+C to exit and configure .env..."
    else
        echo "❌ .env.example not found"
        exit 1
    fi
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✓ Dependencies installed"
    echo ""
fi

# Check if Terraform is installed
echo "🔍 Checking prerequisites..."
if ! command -v terraform &> /dev/null; then
    echo "❌ Terraform not found in PATH"
    echo "   Please install Terraform: https://www.terraform.io/downloads"
    exit 1
else
    echo "✓ Terraform found: $(terraform version | head -n1)"
fi

# Check if Ansible is installed
if ! command -v ansible-playbook &> /dev/null; then
    echo "❌ Ansible not found in PATH"
    echo "   Please install Ansible: https://docs.ansible.com/ansible/latest/installation_guide/"
    exit 1
else
    echo "✓ Ansible found: $(ansible --version | head -n1)"
fi

echo ""
echo "🚀 Starting backend server..."
echo ""

# Start the server
npm start


