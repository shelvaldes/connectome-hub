# Changelog

## v0.1.7 — 2026-11-10

### Added
- `chub agent:restart` restarts one agent or all and reloads its recipe.
- Weekly `upstream-check` workflow: compares the pinned `@animalabs/connectome-host` with npm, opens an issue when a newer release exists, and closes it when the versions sync.

### Fixed
- `install.sh` reminds users to run `exec zsh` when the current terminal does not see the new `chub` command.

## v0.1.6 — 2026-11-10

### Added
- `chub update` updates the hub checkout, dependencies, and global command. It refuses to run with local changes; a modified `bun.lock` is discarded safely.

### Fixed
- Mike uses the angel emoji, matching San Miguel Arcángel, instead of a devil.

## v0.1.5 — 2026-11-10

### Changed
- `chub` is now the primary CLI command. `connectome-hub` remains as an alias.

### Fixed
- `install.sh` registers both `chub` and `connectome-hub` with `bun link`.

## v0.1.4 — 2026-11-10

### Fixed
- `install.sh` now registers the `connectome-hub` command globally with `bun link`, so first-time users can run `connectome-hub agent:start` without prefixing `bun start` or navigating into `packages/cli`.
- The wizard now prints the full `connectome-hub agent:start` / `connectome-hub agent:stop` commands instead of an ambiguous `agent:start`.

## v0.1.3 — 2026-11-09

Onboarding fixes for a first-time install without prior tooling.

### Added
- `install.sh` bootstrap: installs Bun when missing, installs dependencies, and launches the wizard. `--no-launch` stops before the wizard.
- README quick start now uses `./install.sh`; manual Bun setup remains documented.

### Fixed
- Local systemd and launchd units resolve the Bun binary that runs the CLI and the host script from the installed package. They no longer point to a non-existent `~/.connectome-hub/node_modules/...` tree.
- `agent:add` installs the service unit, so `agent:start` works for agents added after `init`.
- `init` merges the existing hub config and assigns sequential WebUI ports.
- Workspace `notes/` and `shared/` directories are created during install.
- Generated recipes use the agent slug for `summaryParticipant` and include `maxStreamTokens`.
- `bun test` no longer runs compiled tests from `dist/`.

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
