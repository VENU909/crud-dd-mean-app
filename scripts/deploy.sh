#!/usr/bin/env bash
set -e
cd ~/crud-dd-mean-app || exit 1
git fetch --all && git reset --hard origin/main
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d --remove-orphans
docker image prune -f
