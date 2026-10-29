# Connectome Hub Architecture

> Connectome Hub is a UX/installer wrapper around the official [Connectome stack](https://animalabs.ai/connectome/) by Anima Research. We do not reimplement any part of the agent runtime, memory system, or provider layer.

## Design principle

**We are the container, not the engine.**

Every agent deployed by Connectome Hub runs through the official `@animalabs/connectome-host` process, with an official recipe JSON, using official `@animalabs/*` libraries. When Anima Research releases a new version, bumping the dependency is usually enough for users to get the update.

## Stack layers

```
User-facing layer
├── CLI (packages/cli)
│   ├── commands: init, agent:add, agent:list, deploy, upgrade
│   └── wizard (packages/cli/src/wizard.ts)
│       └── Mike: temporary onboarding agent
├── Studio (packages/studio) — future web dashboard
└── Templates (templates/)

Orchestration layer
└── Core (packages/core)
    ├── recipe-builder.ts — generates valid Connectome Host recipes
    ├── deployer.ts     — local or remote deployment
    ├── ssh.ts          — remote VPS operations
    └── plugin-resolver.ts — downloads official MCPL servers

Official runtime layer (owned by Anima Research)
├── @animalabs/connectome-host
├── @animalabs/agent-framework
├── @animalabs/context-manager
├── @animalabs/membrane
└── @animalabs/chronicle

Official plugins (separate repos)
├── anima-research/discord-mcpl
├── anima-research/heartbeat-mcpl
├── anima-research/terminal-sessions-mcp
└── user-provided MCP servers
```

## Package layout

```
connectome-hub/
├── package.json          # Bun workspace root, pins official deps
├── packages/
│   ├── cli/              # interactive installer and manager
│   ├── core/             # recipe generation and deployment logic
│   └── studio/           # future web dashboard
├── templates/            # starter recipe packs
│   ├── empty/
│   ├── single-agent/
│   └── family/
└── plugins/              # directory where official MCPL servers are cloned
```

## Recipe compatibility

All generated recipes validate against the official Connectome Host recipe schema (`src/recipe.ts`). They use `${VAR}` substitution for secrets so recipes stay safe to commit, while `.env` carries credentials.

## Updates from upstream

When Anima publishes a new `@animalabs/connectome-host` version, a user can run:

```bash
connectome-hub upgrade
```

This bumps the pinned dependency, reinstalls, and restarts agents. No Connectome Hub code changes are required unless the recipe schema changes.
