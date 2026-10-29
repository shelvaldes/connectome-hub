# Contributing to Connectome Hub

Thank you for helping make Connectome Hub better. This project is a UX wrapper around the official [Connectome](https://animalabs.ai/connectome/) stack by Anima Research.

## Principles

1. **Do not reimplement Animalabs code.** If a feature exists in `@animalabs/connectome-host`, call it; do not copy it.
2. **Stay compatible.** All generated recipes must validate against the latest official Connectome Host recipe schema.
3. **Prefer official plugins.** When adding a new surface (Discord, shell, etc.), use the official MCPL server from the Anima Research repositories.
4. **Keep it simple.** The target user does not want to read JSON schemas.

## Development setup

```bash
git clone https://github.com/shelvaldes/connectome-hub.git
cd connectome-hub
bun install
bun start init
```

## Project structure

- `packages/cli/` — interactive commands and wizard
- `packages/core/` — recipe generation, deployment, SSH helpers
- `packages/studio/` — future web dashboard
- `templates/` — starter recipe packs
- `docs/` — architecture and user-flow docs

## Pull requests

- Open an issue first for big changes.
- Keep PRs focused and small.
- Update docs if you change behavior.
- Add an entry to `changelog.d/` following the existing format.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
