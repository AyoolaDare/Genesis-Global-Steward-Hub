#!/bin/bash
# Azure App Service startup script — runs on every cold start
set -e

echo "==> Running database migrations..."
python manage.py migrate --settings=cms.settings.production

echo "==> Collecting static files..."
python manage.py collectstatic --noinput --settings=cms.settings.production

echo "==> Starting Gunicorn..."
exec gunicorn cms.wsgi:application \
    --bind "0.0.0.0:${WEBSITES_PORT:-8000}" \
    --workers 2 \
    --worker-class gthread \
    --threads 2 \
    --timeout 120 \
    --keep-alive 5 \
    --access-logfile - \
    --error-logfile - \
    --log-level warning
