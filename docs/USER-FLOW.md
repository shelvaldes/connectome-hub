# Connectome Hub User Flow

## First install

```bash
git clone https://github.com/shelvaldes/connectome-hub.git
cd connectome-hub
bun install
bun start init
```

## Wizard flow

1. **Target**
   - Local (this machine)
   - Remote VPS (SSH credentials)

2. **Provider**
   - OpenRouter API key (single key, many models)

3. **Onboarding agent (Mike)**
   - Temporary guide that asks questions and hands control to the first user agent.
   - Comment preserved in source: `// En nombre de San Miguel Arcángel`

4. **First agent**
   - Name
   - Personality description
   - Prompt choice: manual paste or auto-generate from description
   - Model (default: `anthropic/claude-haiku-4` via OpenRouter)

5. **Create another or finish**
   - Loop back to agent creation
   - Or finish setup and deploy

## After setup

```bash
connectome-hub agent:add     # add another agent anytime
connectome-hub agent:list    # list deployed agents
connectome-hub agent:start   # start all (or one by name)
connectome-hub agent:stop    # stop
connectome-hub deploy        # push local config to remote VPS
connectome-hub upgrade       # bump official Animalabs deps
```

## Remote deployment

If the user chose remote, the CLI connects via SSH, installs Bun/Node on the VPS, copies the generated recipes, installs the official dependencies, and registers each agent as a systemd service.

## Plugins

When the user enables a surface (Discord, shell, etc.), the CLI clones the official MCPL server from the Anima Research repository and wires it into the recipe. No custom protocol is invented.
