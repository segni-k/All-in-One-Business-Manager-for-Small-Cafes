#!/usr/bin/env sh
set -eu

cd /var/www

if [ -z "${APP_KEY:-}" ]; then
  echo "APP_KEY is missing. Generating one inside the container..."
  php artisan key:generate --force --no-interaction
fi

# Avoid stale route/config cache between deploys.
php artisan optimize:clear --no-interaction
php artisan config:cache

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "Running database migrations..."
  php artisan migrate --force --no-interaction
fi

if [ "${RUN_SEEDERS:-false}" = "true" ]; then
  echo "Running database seeders..."
  php artisan db:seed --force --no-interaction
fi

exec php artisan serve --host=0.0.0.0 --port="${PORT:-10000}"
