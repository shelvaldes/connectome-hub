# Connectome Hub

[![CI](https://github.com/shelvaldes/connectome-hub/actions/workflows/ci.yml/badge.svg)](https://github.com/shelvaldes/connectome-hub/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> A human-friendly installer and manager for the [Connectome](https://animalabs.ai/connectome/) agent stack by Anima Research.

Connectome Hub is a **UX wrapper**, not a fork. It asks questions, generates valid Connectome Host recipes, and deploys agents locally or helps you deploy them on a remote VPS. Every deployed agent runs through the official `@animalabs/connectome-host`.

## Status

**Current version: v0.1.7**

### v0.1.7 fixes
- Added `chub agent:restart` to reload a recipe without memorizing `systemctl`.
- Added the weekly upstream check workflow.

### v0.1.6 fixes
- Added `chub update` to update the hub checkout, dependencies, and global command.
- Mike now uses the angel emoji, matching San Miguel Arcángel.

### v0.1.5 fixes
- `chub` is now the primary command; `connectome-hub` remains as an alias.
- `install.sh` registers both commands.

### v0.1.4 fixes
- `install.sh` now registers the `connectome-hub` command globally with `bun link`, so `connectome-hub agent:start` works from any directory.
- The wizard message now shows the complete command instead of the ambiguous `agent:start`.

### v0.1.3 fixes
- Added `install.sh`: installs Bun when missing, installs dependencies, and launches the wizard. A new user can go from `git clone` to the wizard without setting up Bun manually.
- Local systemd and launchd units now resolve the Bun binary that runs the CLI and the host script from the installed package, instead of assuming a `node_modules` tree under `~/.connectome-hub`.
- `agent:add` now installs the service unit so `agent:start` works immediately.
- `init` merges the existing hub config and assigns sequential WebUI ports.
- Workspace mounts (`notes`, `shared`) are created during install.
- Generated recipes use the agent slug for `summaryParticipant` and include `maxStreamTokens`.
- `bun test` no longer picks up compiled tests from `dist/`.

| Feature | Status |
|---|---|
| Interactive `init` wizard | ✅ |
| Add agents with `agent:add` | ✅ |
| List agents with `agent:list` | ✅ |
| Start/stop agents with `agent:start` / `agent:stop` | ✅ |
| Local deployment (install dirs + systemd/launchd) | ✅ |
| Remote deployment script generator | ✅ |
| One-click remote `deploy` via SSH | 🚧 Coming in v0.3.0 |
| Official MCPL plugin downloader | 🚧 Coming in v0.3.0 |
| Web dashboard (Studio) | 🚧 Future |

## Requirements

- Linux (systemd user services) or macOS
- OpenRouter API key
- For remote: a VPS with SSH access

`install.sh` installs Bun automatically. If you prefer to manage it yourself, use [Bun](https://bun.sh/) 1.4.3+.

## Quick start

```bash
git clone https://github.com/shelvaldes/connectome-hub.git
cd connectome-hub
./install.sh
```

The bootstrap installs Bun if it is missing, installs dependencies, installs the `chub` command (with `connectome-hub` as an alias), and starts the wizard. To install without launching the wizard (for CI or a manual review), run `./install.sh --no-launch`.

### Manual setup

If Bun is already installed:

```bash
bun install
bun start init
```

## Commands

| Command | Description |
|---|---|
| `chub init` | First-time wizard |
| `chub agent:add` | Add a new agent |
| `chub agent:list` | List deployed agents |
| `chub agent:start [name]` | Start one or all agents (interactive picker if omitted) |
| `chub agent:stop [name]` | Stop one or all agents (interactive picker if omitted) |
| `chub agent:restart [name]` | Restart one or all agents, reloading the recipe |
| `chub update` | Update the hub checkout, dependencies, and global command |

`connectome-hub` is kept as an alias for the same commands.

## Model selection

When creating an agent, enter any OpenRouter model ID in `provider/model` format, for example:

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
├── data/                   # Chronicle memory store
└── notes/                  # Agent workspace mount

~/.connectome-hub/shared/   # Shared workspace mount
```

On Linux it also writes `~/.config/systemd/user/<agent>-agent.service` and starts it. On macOS it writes `~/Library/LaunchAgents/cc.<agent>.agent.plist`.

## Upstream updates

The Connectome Host runtime is pinned deliberately. A weekly GitHub Actions workflow checks npm for a newer release and opens an issue when one appears. The bump is reviewed against the changelog and tested with `bun run typecheck`, `bun test`, and a `provider: "mock"` boot before merging. `chub update` updates the hub itself; engine upgrades stay opt-in.

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
