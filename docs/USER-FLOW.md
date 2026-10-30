# Connectome Hub User Flow

## Install

```bash
git clone https://github.com/shelvaldes/connectome-hub.git
cd connectome-hub
bun install
bun start init
```

## First run (`init`)

1. **Target**
   - Local (this machine)
   - Remote VPS (you will get a deploy script)

2. **Provider**
   - OpenRouter API key

3. **Mike** — temporary onboarding agent
   - Asks for agent name and personality
   - Lets you paste your own system prompt or generate one from the description

4. **Result**
   - Local: install dir created at `~/.connectome-hub/<agent>/`
   - Remote: deploy script generated at `~/.connectome-hub/deploy.sh`

## Day-to-day commands

```bash
connectome-hub agent:add      # add another agent
connectome-hub agent:list     # list agents
connectome-hub agent:start    # start one or all agents (interactive picker)
connectome-hub agent:stop     # stop one or all agents (interactive picker)
```

## Remote deployment

Run `init` or `agent:add` with `remote` target. Copy the generated script to your VPS and run it:

```bash
scp ~/.connectome-hub/deploy-<agent>.sh user@host:/tmp/
ssh user@host bash /tmp/deploy-<agent>.sh
```

A future `deploy` command will automate this over SSH.

## Plugins

When you enable a surface (Discord, shell, etc.), Connectome Hub will download the official MCPL server from Anima Research repositories and wire it into the recipe. Not yet implemented in v0.1.0.
