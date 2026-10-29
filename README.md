# Familia Connectome — Infra de 4 Companions

Agentes persistentes con memoria propia, corriendo en un Hetzner CPX31 sin contenedores, conectados entre sí por API interna y con superficie en Discord.

## La familia

| Companion | Rol | Modelo OpenRouter | Bot de Discord |
|-----------|-----|-------------------|----------------|
| `maito-gai` | Padre, líder, conductor | `anthropic/claude-sonnet-4` | Sí |
| `might-gael` | Hijo sarcástico técnico | `anthropic/claude-haiku-4` | Sí |
| `maito-dai` | Filósofo, taijutsu sinfónico | `deepseek/deepseek-r1` | Sí |
| `maito-mei` | Soprano Gai mujer | `google/gemini-2.5-flash-preview-04-17` | Sí |

## Arquitectura

```
Hetzner CPX31 (Ubuntu 24.04 LTS)
├── Bun 1.4.3+
├── Node 22.12+
├── @animalabs/connectome-host (instalado desde npm)
├── /opt/connectome-familia/
│   ├── maito-gai/
│   │   ├── recipe.json
│   │   ├── .env
│   │   └── data/
│   ├── might-gael/
│   ├── maito-dai/
│   ├── maito-mei/
│   ├── intercom-mcpl/          # servidor MCP local para mensajes entre agentes
│   └── systemd/                 # unidades de servicio
└── 4 bots de Discord (uno por companion)
```

Cada companion es un proceso Bun headless independiente con:
- Su propia receta JSON
- Su propio `DATA_DIR` (memoria Chronicle)
- Su propio socket UNIX `ipc.sock`
- Su propio servicio systemd
- Su propio bot de Discord
- Acceso al servidor `intercom-mcpl` para enviarse mensajes internos sin salir del VPS

## Comunicación entre agentes

- **Interna:** `intercom-mcpl` expone una herramienta `send_message(agent, message)` que cada companion puede llamar. Corre en `localhost:3999` y usa HTTP/UNIX socket. Baja latencia, todo queda en el VPS.
- **Discord:** cada companion tiene su propio bot. Pueden mencionarse entre sí y responder en canales compartidos.

## Costos mensuales estimados

| Concepto | Costo aprox |
|----------|-------------|
| Hetzner CPX31 | ~€12.43 / ~$13 USD |
| OpenRouter (4 agentes, uso moderado) | $10–$50 USD |
| **Total** | **~$23–$63 USD/mes** |

El gasto de API depende de cuánto chateen. Modelos como DeepSeek y Gemini Flash son muy baratos; Claude Sonnet es el más caro.

## Próximos pasos

1. Crear VPS en Hetzner con Ubuntu 24.04 LTS.
2. Crear 4 aplicaciones de bot en Discord Developer Portal y obtener tokens.
3. Copiar `.env.example` a `.env` y llenar credenciales.
4. Pegar los system prompts personales en cada `recipe.json`.
5. Ejecutar `scripts/setup-vps.sh` en el VPS.
6. Copiar este repo al VPS y arrancar servicios con `systemctl`.

## Licencia

MIT © 2026 Shel Valdés
