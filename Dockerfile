# Use Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

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
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies with specific versions for Fetch AI
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create necessary directories for Fetch AI
RUN mkdir -p /app/.fetchai

# Expose port (Cloud Run will override this)
EXPOSE 8080

# Set environment variable for port (Cloud Run will provide PORT=8080)
ENV PORT=8080

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/ || exit 1

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"] 