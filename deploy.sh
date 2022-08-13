#!/bin/bash

echo '⬇️ Pulling updates...'
git pull

echo '🚧 Building with Docker...'
docker compose up -d --build

echo '🚀 Done!'
