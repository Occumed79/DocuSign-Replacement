#!/bin/sh
set -e

cd /app

if [ "$RUN_DB_PUSH_ON_STARTUP" = "true" ]; then
  echo "RUN_DB_PUSH_ON_STARTUP=true detected. Running safe database schema push..."
  pnpm --filter @workspace/db run push 2>&1
else
  echo "Skipping automatic database schema push. Set RUN_DB_PUSH_ON_STARTUP=true only for first-time setup or controlled deployments."
fi

echo "Starting server..."
exec node --enable-source-maps artifacts/api-server/dist/index.mjs
