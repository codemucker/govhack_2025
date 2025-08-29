#!/bin/bash

# Script to run Claude Code in an isolated Docker container
# Only mounts this repository folder for access

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Get the absolute path to the repository root (two levels up from this script)
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
IMAGE_NAME="claude-runner"

# Help function
show_help() {
    echo "Usage: ./run-claude.sh [COMMAND]"
    echo ""
    echo "Run a development environment in an isolated Docker container with access only to this repository"
    echo ""
    echo "Commands:"
    echo "  build              Build the Claude runner Docker image"
    echo "  run                Run development environment in interactive mode"
    echo "  shell              Open shell in the container"
    echo "  exec <command>     Execute a command in the container"
    echo "  clean              Remove the Docker image"
    echo ""
    echo "Examples:"
    echo "  ./run-claude.sh build                # Build the container"
    echo "  ./run-claude.sh run                  # Start development environment"
    echo "  ./run-claude.sh shell                # Get shell access"
    echo "  ./run-claude.sh exec 'ls -la'        # Execute command"
    echo "  ./run-claude.sh clean                # Clean up"
    echo ""
    echo "The container will have access only to: $REPO_ROOT"
}

# Check if Docker is available
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed or not in PATH${NC}"
        exit 1
    fi
}

# Build the Docker image
build_image() {
    echo -e "${BLUE}🔨 Building Claude runner Docker image...${NC}"
    cd "$(dirname "${BASH_SOURCE[0]}")"
    docker build -t "$IMAGE_NAME" .
    echo -e "${GREEN}✅ Image built successfully${NC}"
}

# Run development environment interactively
run_claude() {
    echo -e "${BLUE}🛠️  Starting development environment in isolated container...${NC}"
    echo -e "${YELLOW}📁 Repository mounted at: /workspace${NC}"
    echo -e "${YELLOW}🔒 Container has access ONLY to: $REPO_ROOT${NC}"
    echo -e "${YELLOW}💡 This provides a development environment for working with the code${NC}"
    echo ""
    
    docker run -it --rm \
        --name claude-runner \
        -v "$REPO_ROOT:/workspace" \
        -w /workspace \
        "$IMAGE_NAME"
}

# Open shell in container
open_shell() {
    echo -e "${BLUE}🐚 Opening shell in Claude container...${NC}"
    echo -e "${YELLOW}📁 Repository mounted at: /workspace${NC}"
    
    docker run -it --rm \
        --name claude-runner-shell \
        -v "$REPO_ROOT:/workspace" \
        -w /workspace \
        "$IMAGE_NAME" \
        /bin/bash
}

# Execute command in container
exec_command() {
    local cmd="$1"
    echo -e "${BLUE}⚡ Executing command in Claude container: ${YELLOW}$cmd${NC}"
    
    docker run --rm \
        --name claude-runner-exec \
        -v "$REPO_ROOT:/workspace" \
        -w /workspace \
        "$IMAGE_NAME" \
        bash -c "$cmd"
}

# Clean up Docker image
clean_image() {
    echo -e "${BLUE}🧹 Removing Claude runner Docker image...${NC}"
    docker rmi "$IMAGE_NAME" 2>/dev/null || echo "Image not found"
    echo -e "${GREEN}✅ Cleanup complete${NC}"
}

# Main script logic
main() {
    check_docker
    
    case "${1:-help}" in
        build)
            build_image
            ;;
        run)
            if ! docker images | grep -q "$IMAGE_NAME"; then
                echo -e "${YELLOW}⚠️  Image not found. Building first...${NC}"
                build_image
            fi
            run_claude
            ;;
        shell)
            if ! docker images | grep -q "$IMAGE_NAME"; then
                echo -e "${YELLOW}⚠️  Image not found. Building first...${NC}"
                build_image
            fi
            open_shell
            ;;
        exec)
            if [ -z "$2" ]; then
                echo -e "${RED}❌ Please provide a command to execute${NC}"
                exit 1
            fi
            if ! docker images | grep -q "$IMAGE_NAME"; then
                echo -e "${YELLOW}⚠️  Image not found. Building first...${NC}"
                build_image
            fi
            exec_command "$2"
            ;;
        clean)
            clean_image
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