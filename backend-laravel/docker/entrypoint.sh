#!/usr/bin/env sh
set -eu

cd /var/www

if [ -z "${APP_KEY:-}" ]; then
  echo "APP_KEY is missing. Generating one inside the container..."
  php artisan key:generate --force --no-interaction
fi

php artisan config:cache

if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
  php artisan migrate --force --no-interaction
fi

exec php artisan serve --host=0.0.0.0 --port="${PORT:-10000}"
