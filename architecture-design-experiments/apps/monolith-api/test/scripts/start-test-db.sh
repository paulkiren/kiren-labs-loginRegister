#!/bin/bash
cd "$(dirname "$0")/.."
docker-compose -f docker-compose.test.yml up -d
echo "Waiting for test database to be ready..."
sleep 3
echo "Test database is ready!"
