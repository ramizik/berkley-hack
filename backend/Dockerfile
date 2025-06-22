# Use Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Set environment variables to force PEP 517 mode and avoid gRPC build issues
ENV PIP_USE_PEP517=true
ENV GRPC_PYTHON_BUILD_SYSTEM_OPENSSL=1
ENV GRPC_PYTHON_BUILD_WITH_CYTHON=1

# Install system dependencies for audio processing and Fetch AI
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libsndfile1 \
    libasound2-dev \
    portaudio19-dev \
    python3-dev \
    curl \
    git \
    pkg-config \
    libssl-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements files
COPY requirements-build.txt .
COPY requirements.txt .

# Install Python dependencies with specific versions for Fetch AI
# Install build dependencies first, then main dependencies
# Force clean install of Pydantic v2 for letta-client compatibility
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir --use-pep517 -r requirements-build.txt && \
    pip uninstall -y pydantic || true && \
    pip install --no-cache-dir --use-pep517 -r requirements.txt

# Copy application code
COPY . .

# Create necessary directories for Fetch AI
RUN mkdir -p /app/.fetchai

# Test the build
RUN python test_build.py

# Test Groq SDK compatibility
RUN python test_groq_fix.py

# Expose port (Cloud Run will override this)
EXPOSE 8080

# Set environment variable for port (Cloud Run will provide PORT=8080)
ENV PORT=8080

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/ || exit 1

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"] 