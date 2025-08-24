# docker/test/audio.Dockerfile
# Purpose: Audio testing environment for Space Invaders JS V91
# Last Updated: 2025-01-20

# Start with Ubuntu 24.04 LTS base image for stability and audio support
FROM ubuntu:24.04

# Metadata labels following OCI standard
LABEL maintainer="SpaceInvaders Development Team"
LABEL version="1.0"
LABEL description="Audio testing environment for Space Invaders JS"
LABEL org.opencontainers.image.source="https://github.com/spaceinvaders/js-v91"

# Prevent interactive prompts during build
ARG DEBIAN_FRONTEND=noninteractive

# Set environment variables for audio configuration
ENV PULSE_SERVER=/run/pulse/native \
    AUDIODEV=null \
    PYTHONUNBUFFERED=1

# Install essential audio packages and testing dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Audio libraries
    pulseaudio \
    alsa-utils \
    libasound2 \
    libasound2-dev \
    libportaudio2 \
    libportaudiocpp0 \
    libpulse0 \
    # Python and testing dependencies
    python3.11 \
    python3-pip \
    python3-venv \
    # FFmpeg for audio processing
    ffmpeg \
    # Additional utilities
    curl \
    wget \
    git \
    # Cleanup to reduce image size
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment and install Python audio packages
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python audio testing dependencies
RUN pip install --no-cache-dir \
    pytest==8.0.0 \
    pytest-xdist==3.5.0 \
    pytest-timeout==2.2.0 \
    sounddevice==0.4.6 \
    numpy==1.26.0 \
    scipy==1.12.0 \
    pyaudio==0.2.14 \
    simpleaudio==1.0.4

# Create audio test directory
WORKDIR /app/tests

# Copy test files
COPY tests/e2e/test_39fdbcf5-ee21-45cf-9fda-4554d138be63_complete.py ./e2e/
COPY tests/performance/benchmark_39fdbcf5-ee21-45cf-9fda-4554d138be63.py ./performance/

# Setup virtual audio device
RUN mkdir -p /etc/pulse && \
    echo "default-server = unix:/run/pulse/native" > /etc/pulse/client.conf && \
    echo "autospawn = no" >> /etc/pulse/client.conf && \
    echo "daemon-binary = /bin/true" >> /etc/pulse/client.conf

# Create entrypoint script
COPY <<EOF /entrypoint.sh
#!/bin/bash
set -e

# Start pulseaudio server
pulseaudio --start --log-target=syslog

# Run tests with specified arguments
exec pytest "\$@"
EOF

RUN chmod +x /entrypoint.sh

# Health check to verify audio setup
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD pulseaudio --check || exit 1

# Set entrypoint
ENTRYPOINT ["/entrypoint.sh"]

# Default command (can be overridden)
CMD ["--verbose", "e2e/test_39fdbcf5-ee21-45cf-9fda-4554d138be63_complete.py"]

# Documentation for usage
# Build: docker build -t spaceinvaders-audio-test -f docker/test/audio.Dockerfile .
# Run: docker run --rm spaceinvaders-audio-test