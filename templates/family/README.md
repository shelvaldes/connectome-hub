# Family Template

This template ships four Connectome-compatible agent recipes designed to run as a small fleet on one host.

Each recipe follows the official `@animalabs/connectome-host` schema: memory, workspace, webui, and heartbeat modules enabled. Discord / MCPL server blocks are intentionally left out of the template; the CLI adds them when the user chooses a surface.

## Agents

- `maito-gai` — father / leader
- `might-gael` — sarcastic engineer son
- `maito-dai` — philosopher son
- `maito-mei` — soprano daughter

## Usage

```bash
connectome-hub init --template family
```

Then fill in the four `PEGA AQUÍ EL PROMPT PERSONAL DE ...` placeholders before deploying.
