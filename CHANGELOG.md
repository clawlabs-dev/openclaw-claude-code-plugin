# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.9] - 2025-01-XX

### Changed
- Dependency updates for improved compatibility

## [1.0.8] - 2025-01-XX

### Added
- `skipSafetyChecks` configuration option for development/testing workflows
  - Skip ALL pre-launch safety guards (autonomy skill, heartbeat, HEARTBEAT.md, agentChannels)
  - Defaults to `false` for production safety
  - See [docs/safety.md](docs/safety.md) for details

### Changed
- Refactored `claude-launch` tool for improved safety check flow
- Updated safety documentation with skipSafetyChecks usage examples

## [1.0.7] - 2025-01-XX

### Added
- Reliable 2-level notification system architecture
  - Session-level notifications (agent-specific)
  - System-level fallback notifications
  - Improved notification routing and delivery guarantees

### Changed
- Overhauled session manager notification handling
- Simplified `claude-respond` command notification logic
- Reduced notification system complexity while improving reliability

### Fixed
- Notification delivery edge cases in multi-session scenarios
- Improved error messaging for notification failures

## [1.0.6] - 2025-01-XX

### Added
- Background notification cleanup for terminated sessions
- `maxAutoResponds` safety cap to prevent runaway agent loops (default: 10)
  - Requires user input via `/claude-respond` after threshold reached
  - Configurable via `openclaw.plugin.json`

### Changed
- Improved event routing between sessions and system channels
- Enhanced session lifecycle management

### Fixed
- Background session notification cleanup on termination
- Event routing edge cases with multiple active sessions

## [1.0.5] - 2025-01-XX

### Added
- Session filtering and testing infrastructure
- Unit tests for session filter logic (`tests/session-filter.test.ts`)
- Enhanced session listing in `claude-sessions` tool

### Changed
- Improved session manager internal state tracking
- Session persistence improvements for resume capability

### Fixed
- Session list filtering accuracy
- Session metadata display in `claude-sessions` output

## [1.0.4] - 2024-XX-XX

### Added
- `agentChannels` pre-launch safety check
- Agent channel routing via workspace directory prefix matching

### Changed
- Documentation restructuring: split detailed docs into `/docs` directory
- Improved README structure with clear getting started guide

### Fixed
- Channel routing resolution via `ctx.workspaceDir` for bare channel addresses
- 3-segment channel format support (`channel:account:target`)
- System event routing to agent channel instead of main channel

## [1.0.3] - 2024-XX-XX

### Added
- Tool factory pattern for agent context
- Autonomy design: require skill activation before launch
- Debounced waiting events to prevent notification spam

### Fixed
- Plugin config access via `api.pluginConfig` instead of `api.getConfig()`
- Message channel routing without target specification
- Channel separator changed from `:` to `|` to avoid OpenClaw core splitting issues

### Changed
- Improved `SKILL.md` documentation
- Enhanced agent channel documentation (`AGENT_CHANNELS.md`)

## [1.0.2] - 2024-XX-XX

### Added
- Comprehensive documentation overhaul
- Getting Started step-by-step guide

### Changed
- README documentation structure improvements
- Safety checks documentation moved before configuration

## [1.0.1] - 2024-XX-XX

### Added
- Initial release
- Core tools: `claude_launch`, `claude_sessions`, `claude_output`, `claude_respond`, `claude_kill`
- Background/foreground session management: `claude_fg`, `claude_bg`
- Session statistics: `claude_stats`
- Multi-session orchestration support
- Permission modes: default, plan, acceptEdits, bypassPermissions
- Configurable session limits and timeouts
- Telegram/Discord/multi-platform notification support

[1.0.9]: https://github.com/clawlabs-dev/openclaw-claude-code-plugin/compare/v1.0.8...v1.0.9
[1.0.8]: https://github.com/clawlabs-dev/openclaw-claude-code-plugin/compare/v1.0.7...v1.0.8
[1.0.7]: https://github.com/clawlabs-dev/openclaw-claude-code-plugin/compare/v1.0.6...v1.0.7
[1.0.6]: https://github.com/clawlabs-dev/openclaw-claude-code-plugin/compare/v1.0.5...v1.0.6
[1.0.5]: https://github.com/clawlabs-dev/openclaw-claude-code-plugin/compare/v1.0.4...v1.0.5
[1.0.4]: https://github.com/clawlabs-dev/openclaw-claude-code-plugin/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/clawlabs-dev/openclaw-claude-code-plugin/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/clawlabs-dev/openclaw-claude-code-plugin/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/clawlabs-dev/openclaw-claude-code-plugin/releases/tag/v1.0.1
