#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if [[ ! -f .env ]]; then
  echo "Missing docker/.env — copy from .env.example and set REDIS_PASSWORD."
  exit 1
fi

if [[ ! -f ../backend/.env.production ]]; then
  echo "Missing backend/.env.production — copy from .env.production.example and fill in secrets."
  exit 1
fi

exec docker compose -f docker-compose.prod.yml --env-file .env up -d --build "$@"
