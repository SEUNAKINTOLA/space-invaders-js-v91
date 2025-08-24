# syntax=docker/dockerfile:1.4
# Production Dockerfile for Space Invaders JS V91
# Uses multi-stage builds for optimal image size and security

###################
# BUILD STAGE
###################
FROM node:20-slim AS builder

# Set working directory
WORKDIR /app

# Add metadata labels
LABEL maintainer="DevOps Team"
LABEL application="Space Invaders JS V91"
LABEL version="1.0.0"

# Install dependencies for build
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY .npmrc ./

# Install dependencies with specific flags for production
RUN npm ci --only=production \
    && npm cache clean --force

# Copy source code
COPY . .

# Build application
RUN npm run build

###################
# PRODUCTION STAGE
###################
FROM node:20-slim AS production

# Set Node.js to run in production mode
ENV NODE_ENV=production

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Set working directory
WORKDIR /app

# Copy built assets from builder stage
COPY --from=builder --chown=appuser:appuser /app/dist ./dist
COPY --from=builder --chown=appuser:appuser /app/package*.json ./
COPY --from=builder --chown=appuser:appuser /app/node_modules ./node_modules

# Security: Set proper permissions
RUN chmod -R 755 /app

# Switch to non-root user
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:${PORT}/health', (res) => res.statusCode === 200 ? process.exit(0) : process.exit(1))" || exit 1

# Expose application port
ENV PORT=3000
EXPOSE ${PORT}

# Set secure configuration
ENV NODE_OPTIONS="--max-old-space-size=2048 --max-http-header-size=16384 --no-deprecation"

# Command to run the application
CMD ["node", "dist/server.js"]

###################
# Build Arguments and Environment Variables
###################
ARG BUILD_VERSION
ARG BUILD_DATE
ARG COMMIT_SHA

# Add standardized labels
LABEL org.opencontainers.image.created="${BUILD_DATE}"
LABEL org.opencontainers.image.version="${BUILD_VERSION}"
LABEL org.opencontainers.image.revision="${COMMIT_SHA}"
LABEL org.opencontainers.image.title="Space Invaders JS V91"
LABEL org.opencontainers.image.description="Production container for Space Invaders JS application"
LABEL org.opencontainers.image.vendor="Your Organization"

###################
# Security Scanning
###################
# Scan the image for vulnerabilities (requires external scanning tool)
# Example: Aqua Security's Trivy
# RUN trivy filesystem --no-progress /