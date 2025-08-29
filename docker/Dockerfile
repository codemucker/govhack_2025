# LegalEase Docker Container
FROM node:20-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    jq \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install Encore CLI
RUN curl -L https://encore.dev/install.sh | bash
ENV PATH="/root/.encore/bin:$PATH"

# Create app directory
WORKDIR /app

# Copy package files from parent directory
COPY ../package*.json ./

# Install dependencies
RUN npm install

# Copy only necessary application files
COPY ../api ./api
COPY ../frontend ./frontend
COPY ../ask.sh ./
COPY ../.env ./

# Make scripts executable
RUN chmod +x ask.sh

# Copy migration files
COPY ../api/migrations ./api/migrations

# Create directory for logs
RUN mkdir -p /app/logs

# Expose the port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:4000/api/hello || exit 1

# Default command - just run the backend
CMD ["source", ".env", "&&", "encore", "run", "--port", "4000"]