# Architecture

## Overview

```
┌─────────────────────────────────────────────────────┐
│                    index.ts                         │
│              (Plugin entry point)                   │
│  Registers tools, commands, RPC methods, service    │
└──────────────┬──────────────────────────────────────┘
               │
      ┌────────┼─────────────────┐
      │        │                 │
      ▼        ▼                 ▼
  Tools    Commands          Gateway RPC
  (8)      (8)               (5 methods)
      │        │                 │
      └────────┼─────────────────┘
               │
               ▼
        ┌─────────────┐     ┌────────────────────┐
        │   shared.ts  │────▶│  SessionManager    │
        │  (globals,   │     │  (spawn, resolve,  │
        │   helpers)   │     │   kill, cleanup,   │
        │              │     │   metrics, persist)│
        └─────────────┘     └────────┬───────────┘
                                     │
                            ┌────────┴───────────┐
                            │     Session        │
                            │  (Claude SDK       │
                            │   query() wrapper, │
                            │   message stream,  │
                            │   abort, output)   │
                            └────────────────────┘
                                     │
                            ┌────────┴───────────┐
                            │ NotificationRouter │
                            │  (foreground       │
                            │   streaming,       │
                            │   catchup display, │
                            │   completion,      │
                            │   session-limit,   │
                            │   long-run remind) │
                            └────────────────────┘
```

---

## Key Components

| Component | File | Responsibility |
|---|---|---|
| **Session** | `src/session.ts` | Wraps the Claude Agent SDK `query()` call. Manages the async message stream, output buffering (last 200 blocks), abort control, multi-turn `MessageStream`, idle timeouts, waiting-for-input detection (end-of-turn + 15s safety-net timer with `waitingForInputFired` guard), and event callbacks (`onOutput`, `onToolUse`, `onComplete`, `onSessionLimitReached`). |
| **SessionManager** | `src/session-manager.ts` | Manages the pool of active sessions. Enforces `maxSessions`, generates unique names, wires notification callbacks, persists Claude session IDs for resume, records metrics, triggers agent events on completion and waiting-for-input, and runs periodic garbage collection. |
| **NotificationRouter** | `src/notifications.ts` | Routes events to the right chat channels. Debounces foreground text streaming (500ms), shows compact tool-use indicators, sends completion/failure/session-limit notifications, foreground catchup display, and periodically checks for sessions running longer than 10 minutes. |
| **Gateway** | `src/gateway.ts` | Exposes 5 JSON-RPC methods for external/programmatic access. |
| **Shared** | `src/shared.ts` | Global singletons (`sessionManager`, `notificationRouter`, `pluginConfig`), helper functions (name generation, duration formatting, session listing, stats formatting), and channel resolution logic. |
| **Types** | `src/types.ts` | TypeScript interfaces: `SessionConfig`, `ClaudeSession`, `PluginConfig`, `SessionStatus`, `PermissionMode`. |
