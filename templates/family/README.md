# Family Template

This directory ships four Connectome-compatible agent recipes designed to run as a small fleet on one host.

Each recipe follows the official `@animalabs/connectome-host` schema: memory, workspace, webui, and heartbeat modules enabled. Discord / MCPL server blocks are intentionally left out of the template; the CLI adds them when the user chooses a surface.

## Agents

- `maito-gai` — father / leader
- `might-gael` — sarcastic engineer son
- `maito-dai` — philosopher son
- `maito-mei` — soprano daughter

## Usage

Copy the recipe you want into your agent install directory and fill in the `systemPrompt` placeholder before deploying. There is no `--template` flag yet; template selection is planned for a future release.
