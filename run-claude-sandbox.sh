#!/bin/bash

# Claude Sandbox Runner
# This script creates a Docker environment to run Claude CLI with repo access

set -e

CONTAINER_NAME="claude-sandbox"
IMAGE_NAME="claude-sandbox:latest"
REPO_PATH="$(pwd)"

# Build the Docker image if it doesn't exist
if ! docker images | grep -q "claude-sandbox"; then
    echo "Building Claude sandbox Docker image..."
    docker build -f Dockerfile.claude-sandbox -t "$IMAGE_NAME" .
fi

# Stop and remove existing container if running
if docker ps -a | grep -q "$CONTAINER_NAME"; then
    echo "Stopping existing container..."
    docker stop "$CONTAINER_NAME" >/dev/null 2>&1 || true
    docker rm "$CONTAINER_NAME" >/dev/null 2>&1 || true
fi

# Run the container with repo access and network
echo "Starting Claude sandbox with repo access..."
docker run -it \
    --name "$CONTAINER_NAME" \
    --volume "$REPO_PATH:/workspace" \
    --workdir /workspace \
    --user claude \
    "$IMAGE_NAME" \
    claude --dangerously-skip-permissions

echo "Claude sandbox session ended."