# Changelog

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
