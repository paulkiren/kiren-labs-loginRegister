#!/bin/bash
cd "$(dirname "$0")/.."
docker-compose -f docker-compose.test.yml down
echo "Test database stopped!"
