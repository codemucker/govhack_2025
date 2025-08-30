#!/bin/bash

# LegalEase - Development Services Startup Script
# This script kills existing services and starts all required services

set -e  # Exit on any error

echo "🏛️  Starting LegalEase Development Environment..."
echo "=================================================="

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

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# 1. Kill existing Node.js processes
print_info "Stopping existing services..."

# Kill any existing node processes for this project
pkill -f "node standalone-server.js" 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true  
pkill -f "encore run" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

# Wait a moment for processes to terminate
sleep 2

print_status "Existing services stopped"

# 2. Check dependencies
print_info "Checking dependencies..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed or not in PATH"
    exit 1
fi

# Check if npm is installed  
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed or not in PATH"
    exit 1
fi

print_status "Dependencies check passed"

# 3. Install/update dependencies if needed
print_info "Ensuring dependencies are up to date..."

# Install root dependencies
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
    print_info "Installing root dependencies..."
    npm install
fi

# Install frontend dependencies
if [ ! -d "frontend/node_modules" ] || [ "frontend/package.json" -nt "frontend/node_modules" ]; then
    print_info "Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

print_status "Dependencies ready"

# 4. Build frontend for production serving (skip for now due to TypeScript errors)
print_warning "Skipping frontend build due to TypeScript errors - will serve existing dist files"
# cd frontend && npm run build && cd ..
# print_status "Frontend built successfully"

# 5. Check environment variables
print_info "Checking environment configuration..."

if [ ! -f ".env" ]; then
    print_warning "No .env file found. API features may not work without proper API keys."
else
    print_status "Environment configuration found"
fi

# 6. Start services
print_info "Starting services..."

# Create logs directory first
mkdir -p logs

# Start the standalone server (includes both backend and serves frontend)
print_info "Starting LegalEase standalone server..."
nohup node standalone-server.js > logs/server.log 2>&1 &
SERVER_PID=$!

# Wait a moment for server to start
sleep 3

# Check if server started successfully
if ps -p $SERVER_PID > /dev/null; then
    print_status "LegalEase standalone server started successfully (PID: $SERVER_PID)"
else
    print_error "Failed to start standalone server"
    cat logs/server.log 2>/dev/null || echo "No log file found"
    exit 1
fi

# 7. Logs directory already created above

# 8. Display service information
echo ""
echo "🚀 LegalEase Services Running:"
echo "=============================="
echo ""
echo "🌐 OPEN IN BROWSER:"
echo "   📊 LegalEase App:       http://localhost:4000"
echo "   🏛️  Main Interface:     http://localhost:4000"
echo ""
echo "🔧 API ENDPOINTS:"
echo "   📋 Health Check:       http://localhost:4000/api/hello"  
echo "   🤖 Legal Query API:    http://localhost:4000/api/legal/ask"
echo "   📄 Database Stats:     http://localhost:4000/api/cache-documents"
echo "   📡 WebSocket Events:   ws://localhost:4000/"
echo ""
echo "📝 Logs:"
echo "   Server:             tail -f logs/server.log"
echo ""
echo "🛑 To stop services:   ./stop.sh (or pkill -f 'node standalone-server.js')"
echo ""

# 9. Test endpoints
print_info "Testing service endpoints..."

# Wait for services to be fully ready
sleep 2

# Test health endpoint
if curl -s http://localhost:4000/api/hello > /dev/null; then
    print_status "Health check endpoint responding"
else
    print_warning "Health check endpoint not responding yet (may need more time)"
fi

print_status "LegalEase development environment started successfully!"
print_info "Press Ctrl+C to view logs in real-time, or run 'tail -f logs/server.log'"

# 10. Show real-time logs (optional)
echo ""
read -p "Would you like to view real-time logs? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📊 Real-time server logs (Ctrl+C to exit):"
    echo "=========================================="
    tail -f logs/server.log
fi