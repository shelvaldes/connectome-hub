# Connectome Hub Architecture

> Connectome Hub is a UX/installer wrapper around the official [Connectome](https://animalabs.ai/connectome/) agent stack by Anima Research. We do not reimplement any part of the agent runtime, memory system, or provider layer.

## Design principle

**We are the container, not the engine.**

Every agent deployed by Connectome Hub runs through the official `@animalabs/connectome-host` process, with an official recipe JSON, using official `@animalabs/*` libraries. When Anima Research releases a new version, bumping the pinned dependency is usually enough.

## Stack

```
CLI layer (packages/cli)
├── src/index.ts         — commander entry point
├── src/wizard.ts        — Mike, the onboarding wizard
├── src/commands.ts      — agent:add, agent:list, agent:start, agent:stop
├── src/deployer.ts      — install dir writer, systemd unit generator,
                           remote deploy script generator, hub config manager
└── src/recipe-builder.ts — official Connectome Host recipe generator

Official runtime layer (owned by Anima Research)
├── @animalabs/connectome-host
├── @animalabs/agent-framework
├── @animalabs/context-manager
├── @animalabs/membrane
└── @animalabs/chronicle

Templates
└── templates/family/ — example recipe pack
```

## Project layout

```
connectome-hub/
├── packages/cli/       — interactive CLI (only active package in v0.1.0)
├── templates/          — starter recipe packs
├── docs/               — architecture, user flow, roadmap
└── .github/workflows/  — CI
```

## Agent install directory

Each agent gets a directory like:

```
~/.connectome-hub/<agent>/
├── recipes/<agent>.json   # recipe consumed by connectome-host
├── .env                    # OPENROUTER_API_KEY, DATA_DIR
└── data/                   # chronicle store, logs, session state
```

The recipe follows the official Connectome Host schema. Secrets live only in `.env`.

## Local vs remote

- **Local:** Connectome Hub writes the install directory directly on the user's machine. It can also run `systemctl --user` commands to control agents.
- **Remote:** Connectome Hub generates a bash deploy script. The user copies it to the VPS and runs it. A future `deploy` command will automate the SSH copy+run step.

## Updates from upstream

Bump `@animalabs/connectome-host` and related packages in `package.json`, then reinstall. A future `upgrade` command will automate this.
