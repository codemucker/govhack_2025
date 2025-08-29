# Dockerfile for running Claude Code in an isolated environment
# This container has access only to this repository folder

FROM node:20-slim

# Install system dependencies needed for development
RUN apt-get update && apt-get install -y \
    git \
    curl \
    wget \
    jq \
    python3 \
    python3-pip \
    build-essential \
    vim \
    nano \
    && rm -rf /var/lib/apt/lists/*

# Note: Claude Code runs through IDE/editor, not as a CLI tool
# This container provides a development environment for working with the code

# Create workspace directory
WORKDIR /workspace

# Set up git configuration (required for development)
RUN git config --global user.name "Claude Code" \
    && git config --global user.email "claude@anthropic.com"

# Install Node.js development tools
RUN npm install -g typescript @types/node

# Install Encore CLI
RUN curl -L https://encore.dev/install.sh | bash
ENV PATH="/root/.encore/bin:$PATH"

# Create a non-root user for security
RUN useradd -m -s /bin/bash claude \
    && chown -R claude:claude /workspace

# Install Encore CLI for the claude user as well
USER claude
RUN curl -L https://encore.dev/install.sh | bash
ENV PATH="/home/claude/.encore/bin:$PATH"

# Default command opens an interactive shell for development
CMD ["/bin/bash"]