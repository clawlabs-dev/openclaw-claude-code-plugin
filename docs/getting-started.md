# Getting Started — Full Setup Guide

**You don't need to create anything manually.** The plugin guides you through setup automatically the first time you launch a session. Just install the plugin and run your first command — the pre-launch safety checks handle the rest.

---

## Step-by-step first launch flow

### 1. Install the plugin

Follow the [Installation](../README.md#installation) steps and restart the gateway.

### 2. Run your first `claude_launch`

Ask your agent to launch a Claude Code session (e.g., *"Fix the bug in auth.ts"*). The agent calls `claude_launch`, which runs **automatic safety checks** before spawning any session. If a check fails, the launch is blocked with a clear, actionable message — and the agent fixes it for you (or gives you a one-liner to run).

Here's what happens on a fresh setup:

---

**Check 1: Autonomy Skill** — *"How should I handle Claude Code questions?"*

- Plugin looks for `skills/claude-code-autonomy/SKILL.md` in your agent's workspace
- **If missing →** launch is blocked. The agent asks you what autonomy level you want
- You answer in plain language, e.g.:
  - *"Auto-respond to everything except architecture decisions"*
  - *"Always ask me before responding"*
  - *"Handle everything yourself, just notify me when done"*
- The agent creates the skill files for you based on your answer
- This skill defines when the agent auto-responds (↩️) vs forwards to you (👋)

> **You do:** Answer the autonomy question once. The agent handles the rest.

---

**Check 2: Heartbeat Configuration** — *"Is the agent set up to receive wake-up calls?"*

- Plugin checks that your agent has heartbeat configured in `~/.openclaw/openclaw.json`
- **If missing →** launch is blocked. The agent shows you the exact `jq` command to run:
  ```bash
  jq '.agents.list |= map(if .id == "YOUR_AGENT" then . + {"heartbeat": {"every": "60m", "target": "last"}} else . end)' \
    ~/.openclaw/openclaw.json > /tmp/openclaw-updated.json && mv /tmp/openclaw-updated.json ~/.openclaw/openclaw.json
  ```
- Recommended interval: **60m** (system events wake the agent instantly via `--mode now`, so the heartbeat is just a safety net)
- Heartbeat must be active for system events (like "session waiting for input") to work
- After adding the config, **restart the gateway once** (`openclaw gateway restart`)

> **You do:** Run the provided `jq` command and restart the gateway. One-time setup.

---

**Check 3: HEARTBEAT.md** — *"Does the agent know what to do on heartbeat?"*

- Plugin checks for a `HEARTBEAT.md` with real content in your agent's workspace
- **If missing →** launch is blocked. The agent creates it automatically with instructions for monitoring Claude Code sessions (check for waiting sessions, read their output, respond or notify you)

> **You do:** Nothing — the agent creates this file for you.

---

### 3. All checks pass → session launches 🚀

Once all checks pass, the session spawns and you're good to go. **Future launches skip all this** — the checks only block when something is actually missing.

---

## What gets created automatically

| File | Created by | Purpose |
|------|-----------|---------|
| `skills/claude-code-autonomy/SKILL.md` | Agent (after asking you) | Your autonomy rules — when to auto-respond vs ask you |
| `skills/claude-code-autonomy/autonomy.md` | Agent (after asking you) | Your raw autonomy preferences |
| `HEARTBEAT.md` | Agent (automatically) | Heartbeat checklist for monitoring Claude Code sessions |

## What you need to do (once)

1. **Answer the autonomy question** — tell the agent how much freedom to give Claude Code sessions
2. **Run the heartbeat config command** — paste the `jq` one-liner the agent provides
3. **Restart the gateway** — `openclaw gateway restart` to pick up the new heartbeat config

That's it. After this one-time setup, every future `claude_launch` goes straight to spawning sessions.

---

## Pre-Launch Safety Checks — Full Reference

When an agent calls the `claude_launch` tool, five mandatory guards run before any session is spawned. If any check fails, the launch is blocked and an actionable error message is returned telling the agent exactly how to fix the issue. These checks are enforced only on the `claude_launch` tool — the gateway RPC `claude-code.launch` method and `/claude` chat command skip them.

### 1. Autonomy Skill

**Checks for:** `{agentWorkspace}/skills/claude-code-autonomy/SKILL.md`

The autonomy skill defines how the agent handles Claude Code interactions (auto-respond to routine questions, forward architecture decisions to the user, etc.). The skill must include 👋/🤖 notification format guidance for user-facing messages. Without it, the agent is told to ask the user what level of autonomy they want, then create the skill directory with `SKILL.md` and `autonomy.md`.

### 2. Heartbeat Configuration

**Checks for:** `heartbeat` field in `~/.openclaw/openclaw.json` under `agents.list[]` for the current agent (resolved from `ctx.agentId` or `resolveAgentId(workdir)` via the `agentChannels` mapping).

Heartbeat enables automatic "waiting for input" notifications so the agent gets nudged when a Claude Code session needs attention. The expected config:

```json
{ "heartbeat": { "every": "60m", "target": "last" } }
```

### 3. Heartbeat Interval Validation

**Checks for:** Heartbeat interval ≥ 60 minutes. A 5-second interval (`"every": "5s"`) is explicitly blocked.

The init prompt recommends `"every": "60m"`. Short intervals cause excessive heartbeat cycles and are not suitable for production agent operation.

### 4. Gateway Restart Guard

**Checks for:** The agent must NOT attempt to restart the OpenClaw gateway itself.

If the gateway needs restarting (e.g., after config changes), the agent must ask the user to do it. This prevents agents from disrupting other running agents or services by cycling the gateway process.

### 5. agentChannels Mapping

**Checks for:** A matching entry in `pluginConfig.agentChannels` for the session's working directory, resolved via `resolveAgentChannel(workdir)`.

The workspace must be mapped to a notification channel so session events (completion, waiting-for-input, etc.) reach the correct agent/chat. Uses longest-prefix matching with trailing slash normalisation.
