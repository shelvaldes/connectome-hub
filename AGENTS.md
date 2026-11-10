# Connectome Hub

- Stack: Bun + TypeScript. `./install.sh` bootstraps Bun, dependencies, and the wizard.
- Development checks: `bun install`, `bun run typecheck`, `bun test`.
- Before touching the runtime, smoke test with the host's `provider: "mock"` recipe.
- The API key lives only in `~/.connectome-hub/<agent>/.env` (chmod 600). Never commit it.
- This repo is the container, not the engine: do not reimplement `@animalabs/*`; use `@animalabs/connectome-host`.
- Validate generated recipes against the current Connectome Host schema before claiming compatibility.
- Follow `CONTRIBUTING.md`; update docs and `CHANGELOG.md` when behavior changes.
