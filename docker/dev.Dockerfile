# docker/dev.Dockerfile

# Use multi-stage build for optimal development experience
# Stage 1: Base development image
FROM node:20-bullseye-slim AS base

# Set working directory
WORKDIR /app

# Install essential development dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Stage 2: Development environment
FROM base AS development

# Add metadata labels
LABEL maintainer="Development Team"
LABEL project="Space Invaders JS V91"
LABEL version="1.0.0"
LABEL environment="development"

# Set environment variables
ENV NODE_ENV=development
ENV PATH /app/node_modules/.bin:$PATH

# Copy package files
COPY package*.json ./

# Install dependencies with specific flags for development
RUN npm install --no-audit --no-fund \
    && npm cache clean --force

# Copy project files
COPY . .

# Copy configuration files
COPY .babelrc .eslintrc.js jest.config.js webpack.config.js ./

# Expose development port
EXPOSE 3000

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Set up development command
CMD ["npm", "run", "dev"]

# Add volume for node_modules
VOLUME ["/app/node_modules"]

# Add volume for source code
VOLUME ["/app/src"]

# Development specific environment variables
ENV WEBPACK_DEV_SERVER_HOST=0.0.0.0
ENV WEBPACK_DEV_SERVER_PORT=3000
ENV CHOKIDAR_USEPOLLING=true

# Set user to non-root for security
USER node

# Development specific entrypoint script
COPY docker/scripts/dev-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/dev-entrypoint.sh
ENTRYPOINT ["dev-entrypoint.sh"]

# Development specific arguments
ARG NODE_OPTIONS="--max-old-space-size=4096"
ENV NODE_OPTIONS=$NODE_OPTIONS

# Add development tools
RUN npm install -g \
    nodemon \
    webpack-dev-server \
    && npm cache clean --force

# Add development specific scripts
COPY docker/scripts/watch.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/watch.sh

# Development specific configurations
COPY docker/config/dev.env ./config/

# Add development specific aliases
RUN echo 'alias ll="ls -la"' >> ~/.bashrc && \
    echo 'alias nr="npm run"' >> ~/.bashrc

# Development specific error handling
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# Add signal handling for graceful shutdown
STOPSIGNAL SIGTERM