FROM node:22-bookworm-slim

# Install Python 3.11, git, and common dev tools
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    git \
    curl \
    wget \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Make python3/pip3 available as python/pip
RUN ln -sf /usr/bin/python3 /usr/bin/python && \
    ln -sf /usr/bin/pip3 /usr/bin/pip

# Install Claude Code globally
RUN npm install -g @anthropic-ai/claude-code

# Create a non-root user (dangerously-skip-permissions still needs a user)
RUN useradd -m -s /bin/bash developer

# Set up working directory
WORKDIR /home/developer/mycelium

# Copy project files into the image
COPY --chown=developer:developer . .

# Install Python dependencies if requirements.txt exists
RUN if [ -f backend/requirements.txt ]; then \
        pip install --no-cache-dir -r backend/requirements.txt; \
    fi

USER developer

# Default: drop into claude with dangerously-skip-permissions
CMD ["claude", "--dangerously-skip-permissions"]
