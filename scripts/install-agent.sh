#!/bin/bash
set -e

# install-agent.sh <agent-name>
# Crea directorios, enlaces y unidad systemd para un companion.

AGENT=$1
if [ -z "$AGENT" ]; then
  echo "Uso: $0 <nombre-del-agente>"
  exit 1
fi

BASE=/opt/connectome-familia
HOST_PKG="$BASE/node_modules/@animalabs/connectome-host"

mkdir -p "$BASE/$AGENT"/{data,recipes,notes,logs,scripts}
chmod 700 "$BASE/$AGENT/data"

cat > "$BASE/$AGENT/$AGENT-agent.service" <<EOF
[Unit]
Description=Connectome companion: $AGENT
After=network.target intercom-mcpl.service

[Service]
Type=simple
User=root
WorkingDirectory=$BASE/$AGENT
Environment="DATA_DIR=$BASE/$AGENT/data"
Environment="OPENROUTER_API_KEY=${OPENROUTER_API_KEY}"
Environment="PATH=/root/.bun/bin:/usr/local/bin:/usr/bin:/bin"
Environment="AGENT_TIMEZONE=America/Monterrey"
EnvironmentFile=$BASE/.env
ExecStart=/root/.bun/bin/bun $HOST_PKG/src/index.ts $BASE/$AGENT/recipes/$AGENT.json --headless
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

ln -sf "$BASE/$AGENT/$AGENT-agent.service" /etc/systemd/system/$AGENT-agent.service
systemctl daemon-reload
systemctl enable $AGENT-agent.service

echo "[install] $AGENT listo. Arranca con: systemctl start $AGENT-agent"
