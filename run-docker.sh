#!/bin/bash

# LegalEase Docker Runtime Script
# Runs the application in an isolated Docker container with access only to this repository

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Help function
show_help() {
    echo "Usage: ./run-docker.sh [COMMAND] [OPTIONS]"
    echo ""
    echo "Run LegalEase in an isolated Docker container with PostgreSQL"
    echo ""
    echo "Commands:"
    echo "  start, up              Start the Docker containers"
    echo "  stop, down             Stop the Docker containers"
    echo "  restart                Restart the Docker containers"
    echo "  logs                   Show application logs"
    echo "  shell                  Open shell in the running container"
    echo "  ask QUESTION           Ask a legal question via CLI"
    echo "  clean                  Remove containers and volumes"
    echo "  build                  Rebuild the Docker images"
    echo ""
    echo "Options for 'ask' command:"
    echo "  -l, --location LOC     Specify location context"
    echo "  -c, --cache            Cache documents first"
    echo ""
    echo "Examples:"
    echo "  ./run-docker.sh start                                    # Start containers"
    echo "  ./run-docker.sh ask 'How to register business?'          # Ask question"
    echo "  ./run-docker.sh ask -l 'Sydney' -c 'Planning laws'       # With location and caching"
    echo "  ./run-docker.sh logs                                     # View logs"
    echo "  ./run-docker.sh shell                                    # Debug in container"
    echo "  ./run-docker.sh clean                                    # Clean everything"
    echo ""
    echo "Environment:"
    echo "  Requires OPENAI_API_KEY in .env file"
    echo "  Containers have access only to this repository folder"
    echo "  PostgreSQL data persists between container restarts"
}

# Check if Docker is available
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed or not in PATH${NC}"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        echo -e "${RED}❌ Docker Compose is not available${NC}"
        exit 1
    fi
}

# Check if .env file exists
check_env() {
    if [ ! -f ".env" ]; then
        echo -e "${YELLOW}⚠️  .env file not found. Creating template...${NC}"
        cat > .env << EOF
# OpenAI API Key (required)
OPENAI_API_KEY=your-openai-api-key-here

# Note: This file should be added to .gitignore to avoid committing secrets
EOF
        echo -e "${RED}❌ Please add your OPENAI_API_KEY to .env file${NC}"
        exit 1
    fi
    
    if ! grep -q "OPENAI_API_KEY=" .env || grep -q "your-openai-api-key-here" .env; then
        echo -e "${RED}❌ Please set a valid OPENAI_API_KEY in .env file${NC}"
        exit 1
    fi
}

# Get Docker Compose command
get_compose_cmd() {
    if command -v docker-compose &> /dev/null; then
        echo "docker-compose"
    else
        echo "docker compose"
    fi
}

# Start containers
start_containers() {
    echo -e "${BLUE}🐳 Starting LegalEase Docker containers...${NC}"
    
    local compose_cmd=$(get_compose_cmd)
    $compose_cmd up -d --build
    
    echo -e "${BLUE}⏳ Waiting for services to be ready...${NC}"
    
    # Wait for PostgreSQL
    echo -n "Waiting for PostgreSQL"
    for i in {1..30}; do
        if docker-compose exec -T postgres pg_isready -U legalease > /dev/null 2>&1; then
            echo -e "\n${GREEN}✅ PostgreSQL is ready${NC}"
            break
        fi
        echo -n "."
        sleep 2
    done
    
    # Wait for application
    echo -n "Waiting for application"
    for i in {1..60}; do
        if curl -s http://localhost:4000/api/hello > /dev/null 2>&1; then
            echo -e "\n${GREEN}✅ Application is ready${NC}"
            break
        fi
        echo -n "."
        sleep 2
    done
    
    echo -e "${GREEN}🚀 LegalEase is running!${NC}"
    echo -e "${BLUE}📊 Dashboard: http://localhost:4000${NC}"
    echo -e "${BLUE}🔍 API Health: http://localhost:4000/api/hello${NC}"
    echo ""
    echo -e "${YELLOW}Try: ./run-docker.sh ask 'How do I register a business in Australia?'${NC}"
}

# Stop containers
stop_containers() {
    echo -e "${BLUE}🛑 Stopping LegalEase Docker containers...${NC}"
    local compose_cmd=$(get_compose_cmd)
    $compose_cmd down
    echo -e "${GREEN}✅ Containers stopped${NC}"
}

# Restart containers
restart_containers() {
    echo -e "${BLUE}🔄 Restarting LegalEase Docker containers...${NC}"
    stop_containers
    start_containers
}

# Show logs
show_logs() {
    local compose_cmd=$(get_compose_cmd)
    echo -e "${BLUE}📋 LegalEase Application Logs:${NC}"
    $compose_cmd logs -f app
}

# Open shell in container
open_shell() {
    echo -e "${BLUE}🐚 Opening shell in LegalEase container...${NC}"
    docker-compose exec app /bin/bash
}

# Ask question via Docker CLI
ask_question() {
    local args=("$@")
    echo -e "${GREEN}🏛️  LegalEase Docker CLI${NC}"
    echo "========================="
    echo ""
    
    # Check if containers are running
    if ! docker-compose ps app | grep -q "Up"; then
        echo -e "${YELLOW}⚠️  Containers not running. Starting them first...${NC}"
        start_containers
        echo ""
    fi
    
    # Execute ask.sh in container
    docker-compose exec -T app ./ask.sh "${args[@]}"
}

# Clean everything
clean_all() {
    echo -e "${YELLOW}🧹 Cleaning up Docker containers and volumes...${NC}"
    local compose_cmd=$(get_compose_cmd)
    $compose_cmd down -v --remove-orphans
    docker system prune -f
    echo -e "${GREEN}✅ Cleanup complete${NC}"
}

# Build images
build_images() {
    echo -e "${BLUE}🔨 Building Docker images...${NC}"
    local compose_cmd=$(get_compose_cmd)
    $compose_cmd build --no-cache
    echo -e "${GREEN}✅ Images built${NC}"
}

# Main script logic
main() {
    cd "$SCRIPT_DIR"
    
    # Check prerequisites
    check_docker
    
    # Parse command
    case "${1:-help}" in
        start|up)
            check_env
            start_containers
            ;;
        stop|down)
            stop_containers
            ;;
        restart)
            check_env
            restart_containers
            ;;
        logs)
            show_logs
            ;;
        shell)
            open_shell
            ;;
        ask)
            check_env
            shift
            ask_question "$@"
            ;;
        clean)
            clean_all
            ;;
        build)
            build_images
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            echo -e "${RED}❌ Unknown command: $1${NC}"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"