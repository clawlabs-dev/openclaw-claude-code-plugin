# AGENTS.md — OpenClaw Claude Code Plugin

## Repository Overview

**Name:** `openclaw-claude-code-plugin`
**Purpose:** OpenClaw plugin that orchestrates Claude Code SDK sessions as managed background processes
**Language:** TypeScript
**Platform:** Node.js (v18+)
**Plugin Type:** OpenClaw Gateway Extension
**Current Version:** 1.0.9

This plugin enables launching, monitoring, and controlling Claude Code SDK sessions directly from any OpenClaw-supported platform (Telegram, Discord, etc.) without leaving the chat interface.

### Key Features
- Multi-session orchestration (configurable max concurrent sessions)
- Background/foreground session management
- Rich notification system with 2-level architecture
- Safety guards: autonomy skill requirement, heartbeat checks, channel routing validation
- Session resume capability with persistent state
- Budget tracking and usage statistics
- Configurable permission modes (default, plan, acceptEdits, bypassPermissions)

### Core Tools Provided
- `claude_launch` — Launch new Claude Code sessions
- `claude_sessions` — List and filter active/completed sessions
- `claude_output` — Get session output and logs
- `claude_respond` — Send messages to running sessions
- `claude_kill` — Terminate sessions
- `claude_fg` / `claude_bg` — Foreground/background session control
- `claude_stats` — View usage statistics

---

## Architecture

### Plugin Structure
```
openclaw-claude-code-plugin/
├── index.ts                     # Plugin entrypoint (exports extension)
├── openclaw.plugin.json         # Plugin metadata & config schema
├── package.json                 # NPM package manifest
├── src/
│   ├── commands/                # CLI commands (/claude, /claude-sessions, etc.)
│   ├── tools/                   # Agent-facing tools (claude_launch, etc.)
│   ├── session-manager.ts       # Core session lifecycle & orchestration
│   ├── session.ts               # Session state & wrapper logic
│   ├── notifications.ts         # 2-level notification routing
│   ├── gateway.ts               # OpenClaw gateway integration
│   ├── shared.ts                # Shared utilities & constants
│   └── types.ts                 # TypeScript type definitions
├── dist/                        # Compiled output (esbuild)
└── docs/                        # Documentation
```

### Technology Stack
- **Runtime:** Node.js 18+
- **Language:** TypeScript (compiled via esbuild)
- **SDK:** `@anthropic-ai/claude-agent-sdk` (v0.2.37)
- **Build Tool:** esbuild (CommonJS output)
- **Testing:** tsx for TypeScript test execution

### Key Design Patterns
1. **Tool Factory Pattern** — Agent context injected via factory functions
2. **Session Manager Singleton** — Central orchestrator for all sessions
3. **2-Level Notification Architecture** — Session-specific + system fallback channels
4. **Safety Guard Chain** — Pre-launch checks (autonomy skill, heartbeat, agentChannels)
5. **Persistent State** — Completed sessions kept in memory for resume (configurable limit)

---

## Development Workflow

### Setup
```bash
# Clone the repository
git clone https://github.com/clawlabs-dev/openclaw-claude-code-plugin.git
cd openclaw-claude-code-plugin

# Install dependencies
npm install

# Build the plugin
npm run build
```

### Build Process
```bash
# Build TypeScript to dist/index.js
npm run build

# Output: dist/index.js (minified CommonJS bundle)
```

**Build Command:**
```bash
esbuild index.ts --bundle --platform=node --target=node18 --format=cjs --outfile=dist/index.js --minify --external:openclaw --external:openclaw/plugin-sdk --external:@anthropic-ai/claude-agent-sdk
```

### Testing
```bash
# Run session filter tests
npm test

# Manual testing via OpenClaw CLI
openclaw plugins install /path/to/openclaw-claude-code-plugin
openclaw gateway restart
```

### Code Quality
- **Linting:** Not currently configured (TODO: add ESLint)
- **Type Checking:** TypeScript strict mode enabled
- **Security:** Never commit `.env` files; use example placeholders

### Git Workflow
```bash
# Feature branches
git checkout -b feat/your-feature
git commit -m "feat: description"
git push origin feat/your-feature

# Version bumps
# 1. Update version in package.json
# 2. Update version in openclaw.plugin.json (keep in sync)
# 3. Update CHANGELOG.md with new version entry
# 4. Commit: "chore: bump to vX.Y.Z"
# 5. Push to main
# 6. GitHub Actions auto-creates release
```

---

## Testing

### Unit Tests
```bash
npm test  # Runs tsx tests/session-filter.test.ts
```

Current test coverage:
- Session filtering logic
- Session list state management

### Integration Testing
Manual testing workflow:
1. Install plugin in local OpenClaw instance
2. Configure `openclaw.json` with test channels
3. Launch test session: `/claude Fix the bug in test.ts`
4. Verify:
   - Session launches successfully
   - Notifications arrive on correct channel
   - Session appears in `/claude-sessions` list
   - `/claude-respond` delivers messages
   - `/claude-kill` terminates session cleanly

### Safety Guard Testing
Test the pre-launch checks:
```bash
# Test autonomy skill requirement
# (Should fail if skill not activated)

# Test heartbeat check
# (Should fail if HEARTBEAT.md missing)

# Test agentChannels routing
# (Should warn if no channel configured for workdir)

# Skip all checks for testing
# Set skipSafetyChecks: true in config
```

---

## Release Process

### Automated Release via GitHub Actions

**Trigger:** Push to `main` branch with modified `package.json` version

**Workflow:**
1. Agent/developer updates version in `package.json` (e.g., `1.0.9` → `1.1.0`)
2. Agent/developer updates `CHANGELOG.md` with new version entry
3. Commit changes: `git commit -m "chore: bump to v1.1.0"`
4. Push to main: `git push origin main`
5. GitHub Actions workflow (`.github/workflows/release.yml`):
   - Detects version change in `package.json`
   - Checks if release already exists
   - Extracts changelog notes for version
   - Creates git tag `v1.1.0`
   - Creates GitHub release with changelog notes
   - Marks release as latest

**Pre-Release Checklist:**
- [ ] Update `package.json` version
- [ ] Update `openclaw.plugin.json` version (keep in sync)
- [ ] Update `CHANGELOG.md` with new version entry (Keep-a-Changelog format)
- [ ] Verify build succeeds: `npm run build`
- [ ] Test locally with `openclaw plugins install /path/to/plugin`
- [ ] Commit with conventional commit message: `chore: bump to vX.Y.Z`
- [ ] Push to main

**Manual Release (if needed):**
```bash
# Create tag manually
git tag v1.1.0
git push origin v1.1.0

# Create release via GitHub CLI
gh release create v1.1.0 \
  --title "v1.1.0" \
  --notes "$(awk '/^## \[1.1.0\]/,/^## \[/' CHANGELOG.md | head -n -1 | tail -n +2)"
```

### Version Numbering

Follow [Semantic Versioning](https://semver.org/):
- **MAJOR** (e.g., 2.0.0): Breaking API changes, incompatible config schema changes
- **MINOR** (e.g., 1.1.0): New features, backward-compatible enhancements
- **PATCH** (e.g., 1.0.10): Bug fixes, documentation updates, security patches

### Publishing to NPM

**Scope:** `@betrue/openclaw-claude-code-plugin`
**Access:** Public

```bash
# Build before publishing
npm run build

# Publish to NPM
npm publish

# Verify package
npm view @betrue/openclaw-claude-code-plugin
```

**NPM Version Sync:** Ensure `package.json` version matches GitHub release tags.

---

## Configuration

### Plugin Config Schema
See `openclaw.plugin.json` for full schema. Key options:

```json
{
  "maxSessions": 5,
  "defaultBudgetUsd": 5,
  "defaultModel": "sonnet",
  "idleTimeoutMinutes": 30,
  "maxPersistedSessions": 50,
  "fallbackChannel": "telegram|bot-name|123456789",
  "permissionMode": "bypassPermissions",
  "agentChannels": {
    "/home/user/projects/my-app": "telegram|bot|987654321"
  },
  "maxAutoResponds": 10,
  "skipSafetyChecks": false
}
```

**Important:**
- `agentChannels`: Map working directories to notification channels
- `maxAutoResponds`: Safety cap for runaway agent loops
- `skipSafetyChecks`: Only use for development/testing (bypasses ALL safety guards)

---

## Dependencies

### Production Dependencies
- `@anthropic-ai/claude-agent-sdk@0.2.37` — Claude Code SDK integration

### Dev Dependencies
- `esbuild@^0.27.3` — TypeScript → CommonJS bundler
- `@sinclair/typebox@^0.34.48` — Runtime type validation
- `nanoid@^3.3.7` — Unique ID generation

### External (Provided by OpenClaw)
- `openclaw` — Gateway runtime
- `openclaw/plugin-sdk` — Plugin development SDK

---

## Completion Criteria for Changes

Before marking any task complete:

1. **Build succeeds:** `npm run build` completes without errors
2. **Tests pass:** `npm test` completes successfully (if applicable)
3. **Type check passes:** No TypeScript errors in `src/`
4. **Local integration test:** Install plugin locally and verify feature works
5. **Documentation updated:** README/CHANGELOG/AGENTS.md reflect changes
6. **Version bumped:** If releasing, update `package.json` + `openclaw.plugin.json` + `CHANGELOG.md`

### For New Features
- [ ] Add tool/command to appropriate `src/tools/` or `src/commands/` directory
- [ ] Register tool in `index.ts` exports
- [ ] Update README with usage examples
- [ ] Add CHANGELOG entry
- [ ] Test with real OpenClaw session

### For Bug Fixes
- [ ] Identify root cause via code inspection or logs
- [ ] Add test case if missing (prevents regression)
- [ ] Fix bug in minimal scope
- [ ] Update CHANGELOG with fix description
- [ ] Test fix in local OpenClaw instance

### For Documentation
- [ ] Ensure technical accuracy (match actual code behavior)
- [ ] Test all example commands/configs
- [ ] Check for broken links
- [ ] Update CHANGELOG if user-facing docs changed

---

## Security Policy

- **Never commit secrets:** API keys, tokens, credentials belong in `.env` (gitignored)
- **Validate user input:** All tool parameters should be validated before use
- **Channel authorization:** Verify channel access in `agentChannels` routing
- **Budget limits:** Enforce `defaultBudgetUsd` to prevent cost overruns
- **Session isolation:** Each session should have isolated state
- **Sensitive logging:** Avoid logging full message content; redact API keys in logs

---

## Common Troubleshooting

### "Session failed to launch"
- Check `skipSafetyChecks` config (should be `false` for production)
- Verify autonomy skill is activated: `/claude-autonomy`
- Verify HEARTBEAT.md exists in workspace
- Check `agentChannels` config for workdir routing

### "Notifications not arriving"
- Verify `fallbackChannel` configured correctly (format: `platform|account|target`)
- Check OpenClaw gateway logs: `openclaw gateway logs`
- Test channel manually: send message via OpenClaw CLI

### "Session stuck in waiting-for-input"
- Use `/claude-respond <session-id> <message>` to reply
- Check notification was delivered (agent may need user decision)
- Verify `maxAutoResponds` not exceeded (default: 10)

### "Build fails"
- Clear `dist/` and rebuild: `rm -rf dist && npm run build`
- Verify Node.js version: `node --version` (should be v18+)
- Check dependencies: `npm install`

---

## Contributing

This is a fork maintained by ClawLabs. For contributions:

1. Fork this repository (or create feature branch)
2. Make changes following commit conventions (`feat:`, `fix:`, `docs:`, `chore:`)
3. Test locally with OpenClaw
4. Update CHANGELOG.md
5. Submit PR with clear description

**Commit Conventions:**
- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation only
- `chore:` — Tooling, dependencies, non-code changes
- `refactor:` — Code restructuring without behavior change

**Git Author:**
```bash
git -c user.email=notimexreirei@gmail.com -c user.name="Daniel (OpenClaw)" commit -m "feat: description"
```

---

## Upstream Sync

**Original Repository:** `alizarion/openclaw-claude-code-plugin`
**Fork:** `clawlabs-dev/openclaw-claude-code-plugin`

To sync with upstream:
```bash
# Add upstream remote (one-time)
git remote add upstream https://github.com/alizarion/openclaw-claude-code-plugin.git

# Fetch upstream changes
git fetch upstream

# Merge upstream main into fork
git checkout main
git merge upstream/main

# Resolve conflicts if any, then push
git push origin main
```

---

## Future Improvements

Potential enhancements (see GitHub issues for details):

- [ ] Add ESLint configuration for code quality
- [ ] Expand test coverage (unit tests for session manager, notification system)
- [ ] Add integration test suite with mock OpenClaw gateway
- [ ] Improve error messages with actionable recovery steps
- [ ] Add session export/import for cross-machine resume
- [ ] Support custom Claude Code SDK flags per session
- [ ] Add session templates/presets for common workflows
- [ ] Metrics dashboard for session usage analytics

---

## Resources

- [OpenClaw Documentation](https://openclaw.dev)
- [Claude Agent SDK](https://github.com/anthropics/claude-agent-sdk)
- [Keep a Changelog](https://keepachangelog.com)
- [Semantic Versioning](https://semver.org)
- [Conventional Commits](https://www.conventionalcommits.org)

---

*Last Updated: 2025-02-23*
*Plugin Version: 1.0.9*
