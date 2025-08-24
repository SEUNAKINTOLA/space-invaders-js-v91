# docker/test/e2e.Dockerfile
# Purpose: End-to-end testing environment for Space Invaders JS V91
# Last Updated: 2025-01-20

# Stage 1: Base image with core dependencies
FROM node:20-slim AS base
LABEL maintainer="DevOps Team <devops@spaceinvaders.com>"
LABEL description="E2E testing environment for Space Invaders JS V91"

# Set environment variables
ENV NODE_ENV=test \
    PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive \
    CHROME_BIN=/usr/bin/google-chrome

# Stage 2: Build dependencies
FROM base AS builder

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.11 \
    python3-pip \
    google-chrome-stable \
    xvfb \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create non-root user for security
RUN groupadd -r tester && useradd -r -g tester -G audio,video tester
WORKDIR /app

# Install Node.js dependencies
COPY package*.json ./
RUN npm ci --only=test \
    && npm cache clean --force

# Install Python dependencies for test automation
COPY requirements-test.txt ./
RUN pip3 install --no-cache-dir -r requirements-test.txt

# Stage 3: Final testing environment
FROM builder AS final

# Copy application code
COPY --chown=tester:tester . .

# Install test-specific dependencies
RUN npm install -g \
    @playwright/test \
    jest \
    cypress

# Setup virtual display for browser tests
ENV DISPLAY=:99

# Health check to ensure container is ready
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node healthcheck.js || exit 1

# Switch to non-root user
USER tester

# Setup entrypoint script
COPY docker/test/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Volume for test results
VOLUME ["/app/test-results"]

# Default command to run tests
ENTRYPOINT ["/entrypoint.sh"]
CMD ["npm", "run", "test:e2e"]

# Documentation of exposed ports (if needed for web testing)
EXPOSE 9323

# Labels for container metadata
LABEL org.opencontainers.image.source="https://github.com/organization/space-invaders-js" \
      org.opencontainers.image.version="91.0.0" \
      org.opencontainers.image.licenses="MIT" \
      com.spaceinvaders.test.type="e2e" \
      com.spaceinvaders.test.suite="enemy-combat-systems"

# Additional metadata for test tracking
ENV TEST_SUITE_ID="ecb1571b-4a41-4f5a-8d82-e1802887df45" \
    TEST_SUITE_NAME="Enemy and Combat Systems E2E Tests"