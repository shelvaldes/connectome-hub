# Changelog

## v0.1.2 — 2026-11-09

Bug fixes based on first manual review.

### Fixed
- `deployLocal()` now writes and starts systemd user services on Linux and launchd plists on macOS.
- `buildRemoteScript()` now writes a `package.json` before `bun install`, exports `~/.bun/bin` to PATH, and tolerates environments without `systemctl`.
- `wizard.ts` no longer sends the user to a directory without `package.json`; it starts the agent automatically on local installs.
- `agent:add` assigns sequential WebUI ports so agents do not collide on port 7340.
- Generated recipes now include workspace mounts (`notes`, `shared`).
- Model selection is now a free-text OpenRouter model ID instead of a hardcoded dropdown.
- Removed the false `connectome-hub init --template family` promise from `templates/family/README.md`.

## v0.1.1 — 2026-10-30

Hotfix: allow any OpenRouter model ID instead of a fixed dropdown list.

### Fixed
- `agent:add` and `init` now accept a manual OpenRouter model ID (`provider/model`) with a sensible default.
- Removed the hardcoded model list that could break when OpenRouter updates its catalog.

## v0.1.0 — 2026-10-30

First MVP release.

### Added
- Interactive `init` wizard (Mike, the temporary onboarding agent)
- `agent:add` to create additional agents
- `agent:list` to view deployed agents
- `agent:start` / `agent:stop` to control agents locally or print SSH commands for remote
- Local deployment: creates install dirs, recipes, `.env`, and systemd user unit templates
- Remote deployment: generates bash deploy scripts for VPS
- `templates/family/` example recipe pack
- MIT license
- GitHub Actions CI (typecheck + tests)
