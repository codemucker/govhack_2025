#!/bin/bash

# LegalEase - Development Mode (Frontend + Backend separately)

set -e  # Exit on any error

echo "🚧 Starting LegalEase Development Mode (Separate Frontend + Backend)"
echo "===================================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# 1. Stop existing services
print_info "Stopping existing services..."
./stop.sh 2>/dev/null || true

# 2. Start backend
print_info "Starting backend server..."
mkdir -p logs
nohup node standalone-server.js > logs/server.log 2>&1 &
BACKEND_PID=$!
sleep 3

if ps -p $BACKEND_PID > /dev/null; then
    print_status "Backend server started (PID: $BACKEND_PID)"
else
    echo -e "${RED}❌ Failed to start backend server${NC}"
    exit 1
fi

# 3. Start frontend dev server
print_info "Starting frontend development server..."
cd frontend
nohup npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
sleep 3

if ps -p $FRONTEND_PID > /dev/null; then
    print_status "Frontend dev server started (PID: $FRONTEND_PID)"
else
    print_warning "Frontend dev server may have issues - check logs"
fi

# 4. Display service information
echo ""
echo "🚀 LegalEase Development Mode Running:"
echo "====================================="
echo ""
echo "🌐 OPEN IN BROWSER:"
echo -e "   ${GREEN}📊 Frontend (Dev):      http://localhost:3000${NC}"
echo -e "   ${BLUE}🔧 Backend API:         http://localhost:4003${NC}"
echo ""
echo "🔧 API ENDPOINTS:"
echo "   📋 Health Check:       http://localhost:4003/api/hello"
echo "   🤖 Legal Query API:    http://localhost:4003/api/legal/ask"
echo "   📄 Database Stats:     http://localhost:4003/api/cache-documents"
echo ""
echo "📝 LOGS:"
echo "   Backend:              tail -f logs/server.log"
echo "   Frontend:             tail -f logs/frontend.log"
echo ""
echo "🛑 To stop: ./stop.sh"
echo ""

# 5. Test endpoints
print_info "Testing backend endpoint..."
if curl -s http://localhost:4003/api/hello > /dev/null; then
    print_status "Backend API responding"
else
    print_warning "Backend API not responding yet"
fi

print_status "Development environment started!"
echo ""
echo -e "${GREEN}🌐 Main App: http://localhost:3000 (Frontend Dev Server)${NC}"
echo -e "${BLUE}🔧 API: http://localhost:4003 (Backend)${NC}"
echo ""

# Optional: Show logs
read -p "View real-time logs? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📊 Showing backend logs (Ctrl+C to exit):"
    echo "========================================"
    tail -f logs/server.log
fi