# Architecture — OpenClaw Claude Code Plugin

## Overview

OpenClaw plugin that enables AI agents to orchestrate Claude Code sessions from messaging channels (Telegram, Discord, Rocket.Chat). Agents can spawn, monitor, resume, and manage Claude Code as background development tasks.

## System Context

```
User (Telegram/Discord) → OpenClaw Gateway → Agent → Plugin Tools → Claude Code Sessions
                                                  ↓
                                        NotificationRouter → openclaw message send → User
```

## Core Components

### 1. Plugin Entry (`index.ts`)
- Registers 8 tools, 8 commands, 5 gateway RPC methods, and 1 service
- Creates SessionManager and NotificationRouter during service start
- Wires outbound messaging via `openclaw message send` CLI

### 2. SessionManager (`src/session-manager.ts`)
- Manages lifecycle of Claude Code processes (spawn, track, kill, resume)
- Enforces `maxSessions` concurrent limit
- Persists completed sessions for resume (up to `maxPersistedSessions`)
- GC interval cleans up stale sessions every 5 minutes

### 3. Session (`src/session.ts`)
- Wraps a single Claude Code PTY process via `@anthropic-ai/claude-agent-sdk`
- Handles output buffering, foreground streaming, and multi-turn conversation
- Implements waiting-for-input detection with 15s safety-net timer
- Double-firing guard (`waitingForInputFired`) prevents duplicate wake events

### 4. NotificationRouter (`src/notifications.ts`)
- Routes notifications to appropriate channels based on session state
- Debounced foreground streaming (500ms per channel per session)
- Background mode: minimal notifications (only questions and responses)
- Long-running session reminders (>10min, once per session)
- Completion/failure notifications in foreground only

### 5. Shared State (`src/shared.ts`)
- Module-level mutable references: `sessionManager`, `notificationRouter`, `pluginConfig`
- Set during service `start()`, nulled during `stop()`

## Data Flow

### Session Launch
```
Agent calls claude_launch → tool validates params → SessionManager.spawn()
  → Session created with PTY → Claude Code process starts
  → Origin channel stored for notifications
  → Pre-launch safety checks (autonomy skill, heartbeat config)
```

### Waiting for Input (Wake)
```
Session detects idle (end-of-turn or 15s timer)
  → NotificationRouter.onWaitingForInput()
  → Background: 🔔 notification to origin channel
  → openclaw system event --mode now (broadcast wake)
  → Orchestrator agent wakes up, reads output, forwards to user
```

### Session Completion
```
Claude Code process exits
  → Session status → completed/failed
  → System event broadcast
  → Orchestrator agent retrieves output, summarizes to user
```

## Key Design Decisions

1. **CLI for outbound messages** — No runtime API for sending messages; uses `openclaw message send` subprocess
2. **Broadcast wake events** — Uses `openclaw system event --mode now` instead of targeted routing; agent filters by session ownership
3. **PTY-based sessions** — Full terminal emulation for Claude Code compatibility
4. **Background notification suppression** — Completion/failure suppressed in background; orchestrator handles user-facing summaries
5. **maxAutoResponds limit** — Prevents infinite agent loops; resets on user interaction (`userInitiated: true`)
6. **Channel propagation** — Tools accept optional `channel` param to route to correct user instead of falling back to "unknown"

## Configuration

See `openclaw.plugin.json` for full config schema. Key settings:
- `maxSessions` (5) — concurrent session limit
- `fallbackChannel` — default notification target
- `idleTimeoutMinutes` (30) — auto-kill for idle multi-turn sessions
- `maxAutoResponds` (10) — agent auto-respond limit per session
- `permissionMode` (bypassPermissions) — Claude Code permission mode

## Sharded Docs

- [Coding Standards](architecture/coding-standards.md)
- [Tech Stack](architecture/tech-stack.md)
- [Source Tree](architecture/source-tree.md)
