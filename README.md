# Connectome Hub

> A human-friendly installer and manager for the [Connectome](https://animalabs.ai/connectome/) agent stack by Anima Research.

We do not reimplement the agent runtime. Connectome Hub is a **UX wrapper**: it asks questions, generates valid Connectome Host recipes, downloads official plugins, and deploys agents locally or on a remote VPS.

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## What this is

- **Not a fork** of `@animalabs/connectome-host`.
- **Not a new agent framework**.
- **A shell** that makes the official stack installable without reading JSON schemas.

When Anima Research updates their packages, Connectome Hub users get the update by running `connectome-hub upgrade`.

## Quick start

```bash
git clone https://github.com/shelvaldes/connectome-hub.git
cd connectome-hub
bun install
bun start init
```

You\'ll be asked:
1. Local or remote VPS?
2. OpenRouter API key
3. Name and personality of your first agent
4. Manual prompt or AI-generated prompt

When finished, your agent runs on the official `@animalabs/connectome-host`.

## Commands

| Command | Description |
|---|---|
| `connectome-hub init` | First-time wizard |
| `connectome-hub agent:add` | Add a new agent to your hub |
| `connectome-hub agent:list` | List agents |
| `connectome-hub agent:start [name]` | Start agents |
| `connectome-hub agent:stop [name]` | Stop agents |
| `connectome-hub deploy` | Push local config to remote VPS |
| `connectome-hub upgrade` | Bump official Animalabs dependencies |

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## User flow

See [docs/USER-FLOW.md](docs/USER-FLOW.md).

## Templates

- `templates/family/` — four-character family starter pack
- More templates coming: `single-agent`, `team`, `knowledge-miner`

## Legal / Upstream notice

This project is licensed under the MIT License © 2026 Shel Valdés.

Connectome Hub depends on the official packages published by Anima Research (`@animalabs/connectome-host` and related packages). Those upstream packages have their own licensing terms. Please review them before deploying in production.
