# Claude Sandbox Environment

A Docker-based environment for running Claude CLI with repo access and full network connectivity, while isolating it from the rest of your system.

## Features

- **Full network access**: Container can access the internet
- **Repo access**: Current repository mounted as `/workspace` with write permissions  
- **Non-root user**: Runs as unprivileged `claude` user
- **Isolated from host**: Only has access to the current repo directory
- **Pre-configured**: Automatically runs Claude CLI with `--dangerously-skip-permissions`

## Usage

1. **Start Claude in sandbox**:
   ```bash
   ./run-claude-sandbox.sh
   ```

   This will:
   - Build the Docker image (first time only)
   - Mount the current repo to `/workspace` 
   - Start Claude CLI with dangerous permissions skipped
   - Give Claude full access to modify files in this repo

2. **What Claude can do**:
   - Read and write any files in this repository
   - Install packages and tools inside the container
   - Access the internet for research and downloads
   - Run any commands within the containerized environment

3. **What Claude cannot do**:
   - Access files outside this repository
   - Modify your host system
   - Access other directories on your computer

## What's Included

- Ubuntu 22.04 base
- Claude CLI (latest version)
- Claude Desktop (AppImage)
- Node.js and npm
- Python 3 and pip
- Git, curl, wget
- Build tools (gcc, make, etc.)
- Text editors (vim, nano)

## Safety

While Claude has full access to this repo and the internet, it's isolated from the rest of your system. Only files in this repository can be modified.