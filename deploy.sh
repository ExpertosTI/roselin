#!/bin/bash
# ─────────────────────────────────────────────────────────────
# DEPLOYMENT PROTOCOL — THE ROSELINE EFFECT (DOCKER SWARM)
# ─────────────────────────────────────────────────────────────
set -e

PROJECT_DIR="/opt/theroselineeffect.shop"
STACK_NAME="roseline"
SERVICE_NAME="roseline_app"

echo "🚀 Iniciando despliegue de: $STACK_NAME..."

# 1. Navegar al directorio del proyecto en el servidor
if [ -d "$PROJECT_DIR" ]; then
    cd "$PROJECT_DIR"
else
    echo "❌ Error: Directorio $PROJECT_DIR no encontrado en el servidor."
    echo "Por favor clona el repositorio en esa ruta antes de ejecutar."
    exit 1
fi

# 2. Compilar la imagen localmente (Swarm no usa registro remoto en este nodo)
echo "📦 Compilando imagen Docker..."
docker compose build

# 3. Asegurar que existe la red overlay externa 'RenaceNet'
echo "🌐 Verificando red RenaceNet..."
docker network ls | grep RenaceNet > /dev/null || \
    docker network create --driver overlay RenaceNet

# 4. Desplegar el stack en Docker Swarm
echo "⛵ Desplegando stack en Swarm..."
docker stack deploy -c docker-compose.yml $STACK_NAME

# 5. Forzar la actualización del servicio para cargar la nueva imagen
echo "🔄 Actualizando servicio para aplicar cambios..."
docker service update --force $SERVICE_NAME 2>/dev/null || true

# 6. Limpieza de imágenes huérfanas
echo "🧹 Limpiando imágenes obsoletas..."
docker image prune -f

echo "✅ Despliegue completado con éxito."
echo "Para ver los logs en tiempo real ejecuta: docker service logs -f $SERVICE_NAME"
