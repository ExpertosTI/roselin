#!/bin/bash
set -e

REPO_URL="https://github.com/ExpertosTI/roselin.git"
PROJECT_DIR="/opt/roseline"
STACK_NAME="roseline"
SERVICE_NAME="roseline_web"

# 1. Sync code via Git
if [ -d "$PROJECT_DIR" ]; then
    cd "$PROJECT_DIR"
    git fetch origin main
    git reset --hard origin/main
else
    git clone $REPO_URL $PROJECT_DIR
    cd $PROJECT_DIR
fi

# 2. Build locally (Swarm has no registry)
docker compose build

# 3. Ensure RenaceNet exists
docker network ls | grep RenaceNet > /dev/null || \
    docker network create --driver overlay RenaceNet

# 4. Deploy stack
docker stack deploy -c docker-compose.yml $STACK_NAME

# 5. Force service to pick up new local image
docker service update --force $SERVICE_NAME 2>/dev/null || true

# 6. Cleanup
docker image prune -f

echo "✅ Deployed! Check: docker service logs -f $SERVICE_NAME"
