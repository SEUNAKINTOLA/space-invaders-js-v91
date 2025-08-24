# docker/test/performance.Dockerfile

# ===== Base Stage =====
FROM nvidia/cuda:12.3.1-base-ubuntu22.04 AS base

# Set environment variables
ENV NODE_VERSION=20.10.0 \
    DEBIAN_FRONTEND=noninteractive \
    NVIDIA_VISIBLE_DEVICES=all \
    NVIDIA_DRIVER_CAPABILITIES=compute,utility,graphics

# Install essential packages and dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    gnupg \
    build-essential \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g npm@latest

# ===== Builder Stage =====
FROM base AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Build the application
RUN npm run build

# ===== Test Stage =====
FROM base AS test

WORKDIR /app

# Install Chrome for headless testing
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium-browser \
    xvfb \
    && rm -rf /var/lib/apt/lists/*

# Copy built application and test files
COPY --from=builder /app /app

# Install performance monitoring tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    linux-perf \
    nvidia-utils-525 \
    nvidia-settings \
    && rm -rf /var/lib/apt/lists/*

# Install performance testing dependencies
RUN npm install -g \
    lighthouse \
    puppeteer \
    @tensorflow/tfjs-node-gpu

# Set up virtual display for headless testing
ENV DISPLAY=:99

# Performance test specific environment variables
ENV NODE_ENV=test \
    PERFORMANCE_TEST=true \
    GPU_ENABLED=true \
    CHROME_BIN=/usr/bin/chromium-browser \
    CHROME_PATH=/usr/bin/chromium-browser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node /app/scripts/healthcheck.js || exit 1

# Create volume for test results
VOLUME ["/app/test-results"]

# Entry point script
COPY docker/test/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["npm", "run", "test:performance"]

# Labels for better container management
LABEL maintainer="Development Team" \
      version="1.0" \
      description="Performance testing environment with GPU support for Space Invaders JS" \
      org.opencontainers.image.source="https://github.com/your-repo/space-invaders-js"

# Security: Run as non-root user
RUN groupadd -r tester && useradd -r -g tester -G video tester \
    && chown -R tester:tester /app
USER tester

# Working directory
WORKDIR /app/tests/performance

# Expose port for metrics collection
EXPOSE 9090