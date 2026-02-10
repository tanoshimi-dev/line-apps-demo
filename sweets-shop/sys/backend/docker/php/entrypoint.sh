#!/bin/bash
set -e

# Fix storage/cache permissions if directories exist (volume mount resets ownership)
if [ -d /var/www/storage ]; then
    chown -R dev:www-data /var/www/storage /var/www/bootstrap/cache 2>/dev/null || true
    chmod -R 775 /var/www/storage /var/www/bootstrap/cache 2>/dev/null || true
fi

exec "$@"
