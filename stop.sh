#!/bin/bash

# LegalEase - Stop All Services Script

set -e  # Exit on any error

echo "🛑 Stopping LegalEase Development Environment..."
echo "==============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Kill all related Node.js processes
print_info "Stopping all LegalEase services..."

# Kill specific processes
pkill -f "node standalone-server.js" 2>/dev/null && print_status "Standalone server stopped" || print_warning "No standalone server process found"
pkill -f "npm run dev" 2>/dev/null && print_status "Development servers stopped" || true
pkill -f "encore run" 2>/dev/null && print_status "Encore server stopped" || true  
pkill -f "vite" 2>/dev/null && print_status "Vite dev servers (frontend + admin) stopped" || true

# Wait for processes to terminate gracefully
sleep 2

# Force kill any remaining processes (if needed)
pkill -9 -f "node.*4000" 2>/dev/null && print_warning "Force killed remaining processes on port 4000" || true

print_status "All LegalEase services stopped successfully!"

# Check if any processes are still running
print_info "Checking for any remaining processes..."

REMAINING=$(ps aux | grep -E "(node standalone-server|encore|vite)" | grep -v grep | wc -l)
if [ $REMAINING -eq 0 ]; then
    print_status "No remaining processes found"
else
    print_warning "Some processes may still be running:"
    ps aux | grep -E "(node standalone-server|encore|vite)" | grep -v grep || true
fi

echo ""
echo "🏛️  LegalEase development environment stopped."
echo "   To restart: ./start.sh"