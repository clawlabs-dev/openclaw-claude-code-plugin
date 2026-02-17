# Notification System

## Level 1 — Session Lifecycle (Always sent to Telegram)
Sent by SessionManager via `openclaw message send` (fire-and-forget).

| Emoji | Event | When | Agent Reaction |
|-------|-----------|---------------------|--------------------------------------|
| ↩️    | Launched  | Session started     | No                                   |
| 🔔    | Claude asks | Waiting for input | Yes - claude_respond                 |
| ↩️    | Responded | Agent replied       | No                                   |
| ✅    | Completed | Session finished    | Yes - claude_output + summarize      |
| ❌    | Failed    | Session error       | No                                   |
| ⛔    | Killed    | Session terminated  | No                                   |

## Level 2 — Foreground Streaming (Optional)
Sent by NotificationRouter when claude_fg is active. Real-time tool calls, reasoning, read/write.

## Level 3 — Agent Behavior (Not plugin responsibility)
The plugin is agent-agnostic. How agents react to 🔔 and ✅ is configured in their HEARTBEAT.md/AGENTS.md.

## Wake Mechanism

### Primary: Detached Spawn
`spawn("openclaw", ["agent", "--agent", id, "--message", text, "--deliver", ...], { detached: true })` + `child.unref()`
- Non-blocking, agent response routed to Telegram via --deliver
- Used for 🔔 waiting and ✅ completed

### Fallback: System Event
`openclaw system event --mode now`
- Requires heartbeat to be configured
- Known bug #14527: skipped if HEARTBEAT.md is empty

## Configuration
Notifications route to Telegram via agentChannels config mapping workspace paths to channel strings.

Read src/session-manager.ts for accurate details about the implementation.
