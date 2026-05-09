#!/usr/bin/env bash
set -euo pipefail

COMPOSE=${COMPOSE:-docker compose}

check_internal_url() {
  local name="$1"
  local url="$2"
  local require_db="${3:-false}"

  printf 'Checking %s -> %s\n' "$name" "$url"
  $COMPOSE exec -T frontend node -e "const url = process.argv[1]; const requireDb = process.argv[2] === 'true'; fetch(url).then(async (response) => { if (!response.ok) { throw new Error('Unexpected status ' + response.status); } if (requireDb) { const data = await response.json(); if (data.db_connected !== true) { throw new Error('db_connected is not true'); } } }).catch((error) => { console.error(error.message); process.exit(1); })" "$url" "$require_db"
}

check_internal_url "frontend" "http://localhost:5173"
check_internal_url "auth-service" "http://auth-service:8000/health" true
check_internal_url "core-service" "http://core-service:8000/health" true
check_internal_url "ai-service" "http://ai-service:8000/health" true

printf 'Smoke checks passed.\n'
