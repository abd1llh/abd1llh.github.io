#!/bin/sh
set -e

if [ -f /app/server/package.json ]; then
  cd /app/server
  if [ ! -d node_modules ]; then
    npm ci --omit=dev 2>/dev/null || npm install --omit=dev
  fi
  node index.js &
fi

exec nginx -g 'daemon off;'
