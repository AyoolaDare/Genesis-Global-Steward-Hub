from .base import *
from decouple import config

DEBUG = False

# Hard failure if not set — no insecure default in production
SECRET_KEY = config('SECRET_KEY')

# JWT must use a separate signing key in production (independent of SECRET_KEY)
_JWT_SIGNING_KEY = config('JWT_SIGNING_KEY')
SIMPLE_JWT = {
    **SIMPLE_JWT,
    'SIGNING_KEY': _JWT_SIGNING_KEY,
}

# Cron secret — hard fail if missing
CRON_SECRET = config('CRON_SECRET')
# Paystack — optional until payment integration is live
PAYSTACK_SECRET_KEY = config('PAYSTACK_SECRET_KEY', default='')

ALLOWED_HOSTS = config('ALLOWED_HOSTS', cast=lambda v: [s.strip() for s in v.split(',')])

# ── Database — Azure Database for PostgreSQL Flexible Server ───────────────
DATABASES = {
    'default': {
        'ENGINE':       'django.db.backends.postgresql',
        'NAME':         config('DB_NAME'),
        'USER':         config('DB_USER'),
        'PASSWORD':     config('DB_PASSWORD'),
        'HOST':         config('DB_HOST'),   # e.g. cms-church-db.postgres.database.azure.com
        'PORT':         config('DB_PORT', default='5432'),
        'OPTIONS':      {'sslmode': 'require'},
        'CONN_MAX_AGE': 60,
    }
}

# ── CORS / CSRF ────────────────────────────────────────────────────────────
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = config('CORS_ALLOWED_ORIGINS', cast=normalize_origin_list)
CSRF_TRUSTED_ORIGINS  = config('CSRF_TRUSTED_ORIGINS', cast=normalize_origin_list)

# ── Static files — WhiteNoise serves from /staticfiles/ on App Service ─────
MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# ── Media files — Azure Blob Storage (replaces Cloudinary) ─────────────────
_AZURE_ACCOUNT_NAME    = config('AZURE_STORAGE_ACCOUNT_NAME')
_AZURE_MEDIA_CONTAINER = config('AZURE_MEDIA_CONTAINER', default='media')

DEFAULT_FILE_STORAGE = 'storages.backends.azure_storage.AzureStorage'

STORAGES = {
    'default': {
        'BACKEND': 'storages.backends.azure_storage.AzureStorage',
        'OPTIONS': {
            'account_name':    _AZURE_ACCOUNT_NAME,
            'account_key':     config('AZURE_STORAGE_ACCOUNT_KEY'),
            'azure_container': _AZURE_MEDIA_CONTAINER,
            'overwrite_files': False,
        },
    },
    'staticfiles': {
        'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage',
    },
}

MEDIA_URL = (
    f"https://{_AZURE_ACCOUNT_NAME}.blob.core.windows.net/{_AZURE_MEDIA_CONTAINER}/"
)

# ── Email (disabled until SendGrid is configured) ──────────────────────────
EMAIL_BACKEND = 'django.core.mail.backends.dummy.EmailBackend'

# ── HTTPS / Security headers ───────────────────────────────────────────────
SECURE_PROXY_SSL_HEADER        = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT            = True
SESSION_COOKIE_SECURE          = True
CSRF_COOKIE_SECURE             = True
SECURE_HSTS_SECONDS            = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD            = True
SECURE_CONTENT_TYPE_NOSNIFF    = True
REFERRER_POLICY                = 'strict-origin-when-cross-origin'

# ── API docs — admin-only in production ────────────────────────────────────
SPECTACULAR_SETTINGS = {
    **SPECTACULAR_SETTINGS,
    'SERVE_PERMISSIONS':    ['rest_framework.permissions.IsAdminUser'],
    'SERVE_AUTHENTICATION': ['rest_framework.authentication.SessionAuthentication'],
}

# ── Logging — structured for Azure App Service log stream ──────────────────
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'azure': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'azure',
        },
    },
    'loggers': {
        'django.security': {'handlers': ['console'], 'level': 'WARNING', 'propagate': False},
        'django.request':  {'handlers': ['console'], 'level': 'ERROR',   'propagate': False},
    },
    'root': {'handlers': ['console'], 'level': 'WARNING'},
}
