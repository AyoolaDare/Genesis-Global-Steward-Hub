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

# Collect static files at build time (WhiteNoise serves them at runtime)
RUN python manage.py collectstatic --noinput \
    --settings=cms.settings.production || true

EXPOSE 8000

# Render passes $PORT; gunicorn binds to it.
CMD ["sh", "-c", "python manage.py migrate --settings=cms.settings.production && gunicorn cms.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 2 --timeout 120 --access-logfile -"]
