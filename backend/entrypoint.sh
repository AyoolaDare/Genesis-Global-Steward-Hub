#!/bin/bash
set -e

echo "🔧 Running Django migrations..."
python manage.py migrate --settings=${DJANGO_SETTINGS_MODULE:-cms.settings.production}

echo "👤 Ensuring superuser exists..."
python manage.py ensure_superuser --settings=${DJANGO_SETTINGS_MODULE:-cms.settings.production}

echo "📦 Collecting static files (production)..."
if [ "$DJANGO_SETTINGS_MODULE" = "cms.settings.production" ]; then
  python manage.py collectstatic --noinput --settings=${DJANGO_SETTINGS_MODULE:-cms.settings.production}
fi

echo "✅ Setup complete! Starting application..."

# Start the application
if [ "$1" = "dev" ]; then
  echo "🚀 Starting development server..."
  python manage.py runserver 0.0.0.0:8000 --settings=cms.settings.development
else
  echo "🚀 Starting production server with gunicorn..."
  gunicorn cms.wsgi:application \
    --bind 0.0.0.0:${PORT:-8000} \
    --workers 2 \
    --threads 2 \
    --worker-class sync \
    --timeout 120 \
    --access-logfile - \
    --error-logfile -
fi
