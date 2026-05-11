#!/bin/sh
set -e

echo "Running database migrations..."
cd /app
pnpm --filter @workspace/db run push --accept-data-loss 2>&1 || {
  echo "Migration failed — attempting force push..."
  pnpm --filter @workspace/db run push-force 2>&1
}

echo "Starting server..."
exec node --enable-source-maps artifacts/api-server/dist/index.mjs
