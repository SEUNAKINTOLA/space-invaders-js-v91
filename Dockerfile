# syntax=docker/dockerfile:1.4
# Space Invaders JS V91 Test Environment
# Production-grade Dockerfile with security and performance optimizations

# Use multi-stage build for smaller final image
FROM python:3.11-slim-bullseye AS builder

# Set build arguments and environment variables
ARG APP_DIR=/app
ARG TEST_DIR=/app/tests
ARG POETRY_VERSION=1.6.1
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    POETRY_HOME="/opt/poetry" \
    POETRY_VIRTUALENVS_IN_PROJECT=true \
    POETRY_NO_INTERACTION=1

# Install system dependencies and security updates
RUN apt-get update && apt-get upgrade -y \
    && apt-get install --no-install-recommends -y \
        curl \
        build-essential \
        libpq-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry for dependency management
RUN curl -sSL https://install.python-poetry.org | python3 -
ENV PATH="${POETRY_HOME}/bin:${PATH}"

# Set working directory
WORKDIR ${APP_DIR}

# Copy dependency files
COPY pyproject.toml poetry.lock ./

# Install dependencies
RUN poetry install --no-root --no-dev

# Development stage with test dependencies
FROM builder AS development

# Install development/test dependencies
RUN poetry install --no-root

# Copy application code
COPY . .

# Create non-root user for security
RUN groupadd -r testrunner && useradd -r -g testrunner testrunner \
    && chown -R testrunner:testrunner ${APP_DIR}

# Switch to non-root user
USER testrunner

# Set environment variables for testing
ENV PYTHONPATH=${APP_DIR} \
    TEST_ENV=docker

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD python -c "import sys; sys.exit(0 if __import__('urllib.request').request.urlopen('http://localhost:8000/health').getcode()==200 else 1)"

# Volume for test results and coverage reports
VOLUME ["/app/test-results", "/app/coverage"]

# Default command to run tests
CMD ["poetry", "run", "pytest", \
     "--junitxml=/app/test-results/junit.xml", \
     "--cov=/app", \
     "--cov-report=xml:/app/coverage/coverage.xml", \
     "--cov-report=html:/app/coverage/htmlcov", \
     "tests/"]

# Production stage (minimal image for test execution)
FROM python:3.11-slim-bullseye AS production

# Set production environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    APP_DIR=/app

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
        libpq5 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r testrunner && useradd -r -g testrunner testrunner

# Set working directory
WORKDIR ${APP_DIR}

# Copy only necessary files from builder
COPY --from=builder ${APP_DIR}/.venv ${APP_DIR}/.venv
COPY --from=builder ${APP_DIR}/pyproject.toml ${APP_DIR}/poetry.lock ./
COPY . .

# Set ownership
RUN chown -R testrunner:testrunner ${APP_DIR}

# Switch to non-root user
USER testrunner

# Add virtual environment to path
ENV PATH="${APP_DIR}/.venv/bin:${PATH}"

# Default command
CMD ["pytest", "tests/"]