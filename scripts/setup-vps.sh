#!/bin/bash
set -e

# setup-vps.sh
# Ejecutar en el VPS Hetzner CPX31 con Ubuntu 24.04 LTS como root o sudo.

echo "[setup] Actualizando sistema..."
apt update && apt upgrade -y
apt install -y curl git build-essential unzip

echo "[setup] Instalando Node 22 LTS..."
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
node --version

echo "[setup] Instalando Bun..."
curl -fsSL https://bun.sh/install | bash
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"
bun --version

echo "[setup] Creando estructura de directorios..."
mkdir -p /opt/connectome-familia
mkdir -p /opt/connectome-familia/shared
mkdir -p /opt/connectome-familia/systemd
mkdir -p /opt/connectome-familia/intercom-mcpl
mkdir -p /opt/connectome-familia/discord-mcpl

echo "[setup] Instalando connectome-host y MCP SDK..."
cd /opt/connectome-familia
cat > package.json <<'EOF'
{
  "name": "connectome-familia",
  "version": "1.0.0",
  "dependencies": {
    "@animalabs/connectome-host": "latest",
    "@modelcontextprotocol/sdk": "^1.0.0"
  }
}
EOF

bun install

echo "[setup] Instalando discord-mcpl..."
cd /opt/connectome-familia/discord-mcpl
git clone https://github.com/anima-research/discord-mcpl.git .
bun install

echo "[setup] Estructura lista. Copia tus recetas y .env, luego corre install-agent.sh para cada companion."
