#!/bin/bash

echo '⬇️ Pulling updates...'
git pull

echo '🚧 Building with Docker...'
docker compose up -d --build

if [ $? == 0 ]
then
  echo '🚀 Done!'
else
  echo '🚨 Error occured!'
fi
