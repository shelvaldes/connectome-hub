# Connectome Hub

[![CI](https://github.com/shelvaldes/connectome-hub/actions/workflows/ci.yml/badge.svg)](https://github.com/shelvaldes/connectome-hub/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> A human-friendly installer and manager for the [Connectome](https://animalabs.ai/connectome/) agent stack by Anima Research.

Connectome Hub is a **UX wrapper**, not a fork. It asks questions, generates valid Connectome Host recipes, and deploys agents locally or helps you deploy them on a remote VPS. Every deployed agent runs through the official `@animalabs/connectome-host`.

## Status

**Current version: v0.1.1** — first MVP release (hotfix: manual model input).

| Feature | Status |
|---|---|
| Interactive `init` wizard | ✅ |
| Add agents with `agent:add` | ✅ |
| List agents with `agent:list` | ✅ |
| Start/stop agents with `agent:start` / `agent:stop` | ✅ |
| Local deployment (install dirs + systemd user units) | ✅ |
| Remote deployment script generator | ✅ |
| One-click remote `deploy` via SSH | 🚧 Coming in v0.2.0 |
| Official MCPL plugin downloader | 🚧 Coming in v0.2.0 |
| Web dashboard (Studio) | 🚧 Future |

## Requirements

- [Bun](https://bun.sh/) 1.4.3+
- Linux (systemd user services) or macOS
- OpenRouter API key
- For remote: a VPS with SSH access

## Quick start

```bash
git clone https://github.com/shelvaldes/connectome-hub.git
cd connectome-hub
bun install
bun start init
```

## Commands

| Command | Description |
|---|---|
| `connectome-hub init` | First-time wizard |
| `connectome-hub agent:add` | Add a new agent |
| `connectome-hub agent:list` | List deployed agents |
| `connectome-hub agent:start [name]` | Start one or all agents (interactive picker if omitted) |
| `connectome-hub agent:stop [name]` | Stop one or all agents (interactive picker if omitted) |

## Model selection

When creating an agent, you can enter any OpenRouter model ID in `provider/model` format, for example:

```
anthropic/claude-haiku-4
anthropic/claude-sonnet-4
deepseek/deepseek-r1
google/gemini-2.5-flash-preview-04-17
```

This keeps the CLI future-proof as OpenRouter updates its catalog.

## What Connectome Hub creates

For each agent, it creates an install directory:

```
~/.connectome-hub/<agent>/
├── recipes/<agent>.json   # Connectome Host recipe
├── .env                    # Secrets (API key, DATA_DIR)
└── data/                   # Chronicle memory store
```

## Architecture & flow

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/USER-FLOW.md](docs/USER-FLOW.md)

## Roadmap

See [ROADMAP.md](ROADMAP.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT © 2026 Shel Valdés.

Connectome Hub depends on the official packages published by Anima Research (`@animalabs/connectome-host` and related packages). Those upstream packages have their own licensing terms; please review them before deploying in production.
