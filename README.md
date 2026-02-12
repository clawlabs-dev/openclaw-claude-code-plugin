# Claude Code Plugin

**An OpenClaw plugin that orchestrates Claude Code sessions as managed background processes.**

Launch, monitor, and interact with multiple Claude Code SDK sessions directly from any OpenClaw channel (Telegram, Discord, etc.). Turn OpenClaw into a control plane for autonomous coding agents — launch tasks, stream output in real time, send follow-up messages, resume previous conversations, and catch up on missed output — all without leaving your chat interface.

[![Demo Video](https://img.youtube.com/vi/vbX1Y0Nx4Tc/maxresdefault.jpg)](https://youtube.com/shorts/vbX1Y0Nx4Tc)

*Orchestrating two parallel Claude Code agents from Telegram — building an X clone and an Instagram clone simultaneously.*

---

## Features

- **Multi-session management** — Run up to N concurrent sessions (configurable), each with a unique ID and human-readable name
- **Foreground / background model** — Sessions run in the background by default; bring any session to the foreground to stream output in real time
- **Foreground catchup** — When foregrounding, missed background output is displayed before live streaming begins
- **Multi-turn conversations** — Send follow-up messages, refine instructions, or have iterative dialogues with a running agent
- **Session resume & fork** — Resume any completed session or fork it into a new branch of conversation
- **Real-time notifications** — Completion alerts, session-limit warnings, long-running reminders, and live tool-use indicators
- **Background visibility** — See `🔔 Claude asks:` and `↩️ Responded:` in-channel even when sessions run in the background
- **Waiting-for-input wake events** — `openclaw system event` fired when sessions become idle, waking the orchestrator
- **Channel propagation** — Notifications routed to the correct user channel via `channel` parameter
- **Triple interface** — Every operation available as a chat command, agent tool, and gateway RPC method
- **Automatic cleanup** — Completed sessions garbage-collected after 1 hour; persisted IDs survive for resume

---

## Installation

### From npm

```bash
openclaw plugins install @betrue/openclaw-claude-code-plugin
```

### From source

```bash
git clone git@github.com:alizarion/openclaw-claude-code-plugin.git
openclaw plugins install ./openclaw-claude-code-plugin
```

### For development (symlink)

```bash
git clone git@github.com:alizarion/openclaw-claude-code-plugin.git
openclaw plugins install --link ./openclaw-claude-code-plugin
```

### After installation

Restart the gateway to load the plugin:

```bash
openclaw gateway restart
```

Ensure `openclaw` CLI is available in your PATH — the plugin shells out to `openclaw message send` for notifications and `openclaw system event` for agent triggers.

---

## Configuration

Configuration is defined in `openclaw.plugin.json` and passed to the plugin via `api.pluginConfig`.

| Option | Type | Default | Description |
|---|---|---|---|
| `maxSessions` | `number` | `5` | Max concurrently active sessions. |
| `defaultBudgetUsd` | `number` | `5` | Default max budget in USD. |
| `defaultModel` | `string` | — | Default model (e.g. `"sonnet"`, `"opus"`). |
| `defaultWorkdir` | `string` | — | Default working directory. Falls back to `process.cwd()`. |
| `idleTimeoutMinutes` | `number` | `30` | Idle timeout for multi-turn sessions. |
| `maxPersistedSessions` | `number` | `50` | Max completed sessions kept for resume. |
| `fallbackChannel` | `string` | — | Fallback notification channel (e.g. `"telegram:123456789"`). |
| `agentChannels` | `Record<string, string>` | — | Map workdir paths to notification channels. See [Agent Channels](docs/AGENT_CHANNELS.md). |
| `permissionMode` | `string` | `"bypassPermissions"` | Default permission mode: `"default"`, `"plan"`, `"acceptEdits"`, `"bypassPermissions"`. |

```json
{
  "maxSessions": 3,
  "defaultBudgetUsd": 10,
  "defaultModel": "sonnet",
  "defaultWorkdir": "/home/user/projects",
  "permissionMode": "bypassPermissions",
  "agentChannels": {
    "/home/user/agent-seo": "telegram:seo-bot:123456789"
  }
}
```

---

## Quick Usage

### Chat Commands

```
/claude Fix the authentication bug in src/auth.ts
/claude --name fix-auth Fix the authentication bug
/claude_sessions
/claude_fg fix-auth
/claude_respond fix-auth Also add unit tests
/claude_resume fix-auth Add error handling
```

### Agent Tools

```
claude_launch(prompt: "Fix auth bug", workdir: "/app", name: "fix-auth")
claude_sessions(status: "running")
claude_fg(session: "fix-auth")
claude_respond(session: "fix-auth", message: "Also add tests")
```

### Gateway RPC

```json
{ "method": "claude-code.launch", "params": { "prompt": "Fix auth", "workdir": "/app" } }
{ "method": "claude-code.sessions", "params": { "status": "running" } }
{ "method": "claude-code.output", "params": { "session": "fix-auth", "full": true } }
```

For the full API reference (all parameter tables, response schemas), see [docs/API.md](docs/API.md).

---

## Skill Example

Claude Code Plugin is a **transparent transport layer** — it spawns sessions and delivers notifications, but business logic lives in **OpenClaw skills**. Here's a minimal skill that orchestrates coding agent sessions:

### `coding-agent/SKILL.md`

```markdown
---
name: Coding Agent Orchestrator
description: Orchestrates Claude Code sessions with smart auto-response rules for routine questions and user forwarding for critical decisions.
metadata: {"openclaw": {"requires": {"plugins": ["openclaw-claude-code-plugin"]}}}
---

# Coding Agent Orchestrator

You are a coding agent orchestrator. You manage Claude Code sessions via the claude-code plugin tools.

## Auto-response rules

When a Claude Code session asks a question (wake event), analyze it and decide:

### Auto-respond (use `claude_respond` immediately):
- Permission requests for file reads, writes, or bash commands -> "Yes, proceed."
- Confirmation prompts like "Should I continue?" -> "Yes, continue."
- Questions about approach when only one is reasonable -> respond with the obvious choice

### Forward to user:
- Architecture decisions (Redis vs PostgreSQL, REST vs GraphQL...)
- Destructive operations (deleting files, dropping tables...)
- Anything involving credentials, secrets, or production environments
- When in doubt -> always forward to the user

## Workflow

1. User sends a coding task -> `claude_launch(prompt, multi_turn: true)`
2. Session runs in background. Monitor via wake events.
3. On wake event -> `claude_output` to read the question, then auto-respond or forward.
4. On user reply to a forwarded question -> `claude_respond` with their answer.
5. On completion -> summarize the result and notify the user.
```

A comprehensive orchestration skill is available at [`skills/claude-code-orchestration/SKILL.md`](skills/claude-code-orchestration/SKILL.md).

---

## Documentation

| Document | Description |
|---|---|
| [docs/API.md](docs/API.md) | Full API reference — tools, commands, and RPC methods with parameter tables |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Architecture diagram and component breakdown |
| [docs/NOTIFICATIONS.md](docs/NOTIFICATIONS.md) | Notification matrix, delivery details, and agent wake events |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | Project structure, dependencies, design decisions, and contribution guide |
| [docs/AGENT_CHANNELS.md](docs/AGENT_CHANNELS.md) | Agent-specific notification routing via workspace directory mapping |
| [docs/AGENT_CHANNELS.md](docs/AGENT_CHANNELS.md) | Agent-specific notification routing via workspace directory mapping |

---

## License

See the project repository for license information.
