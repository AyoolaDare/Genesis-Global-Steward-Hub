# Production Dockerfile — used by Render (or any container-based host)
FROM python:3.12-slim

# Prevent .pyc files and enable unbuffered stdout/stderr for logs
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# System-level deps for psycopg2
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies first (layer-cached unless requirements change)
COPY requirements/ requirements/
RUN pip install --no-cache-dir -r requirements/production.txt

# Copy source
COPY . .

# Make entrypoint script executable
RUN chmod +x entrypoint.sh

EXPOSE 8000

# Use entrypoint script for graceful initialization
ENTRYPOINT ["./entrypoint.sh"]
CMD ["prod"]
