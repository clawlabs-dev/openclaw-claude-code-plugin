# Development

## Project Structure

```
claude-code/
├── index.ts                    # Plugin entry point (register function)
├── openclaw.plugin.json        # Plugin manifest and config schema
├── package.json                # Dependencies
├── src/
│   ├── types.ts                # TypeScript interfaces
│   ├── shared.ts               # Global state, helpers, formatting
│   ├── session.ts              # Session class (SDK wrapper)
│   ├── session-manager.ts      # Session pool management
│   ├── notifications.ts        # NotificationRouter
│   ├── gateway.ts              # RPC method registration
│   ├── tools/
│   │   ├── claude-launch.ts    # claude_launch tool
│   │   ├── claude-sessions.ts  # claude_sessions tool
│   │   ├── claude-output.ts    # claude_output tool
│   │   ├── claude-fg.ts        # claude_fg tool
│   │   ├── claude-bg.ts        # claude_bg tool
│   │   ├── claude-kill.ts      # claude_kill tool
│   │   ├── claude-respond.ts   # claude_respond tool
│   │   └── claude-stats.ts     # claude_stats tool
│   └── commands/
│       ├── claude.ts           # /claude command
│       ├── claude-sessions.ts  # /claude_sessions command
│       ├── claude-fg.ts        # /claude_fg command
│       ├── claude-bg.ts        # /claude_bg command
│       ├── claude-kill.ts      # /claude_kill command
│       ├── claude-resume.ts    # /claude_resume command
│       ├── claude-respond.ts   # /claude_respond command
│       └── claude-stats.ts     # /claude_stats command
├── skills/
│   └── claude-code-orchestration/
│       └── SKILL.md            # Orchestration skill definition
└── docs/
    ├── API.md                  # Full API reference
    ├── ARCHITECTURE.md         # Architecture overview
    ├── NOTIFICATIONS.md        # Notification system details
    └── DEVELOPMENT.md          # This file
```

---

## Dependencies

| Package | Purpose |
|---|---|
| `@anthropic-ai/claude-agent-sdk` | Claude Code SDK — the `query()` function that powers each session. |
| `@sinclair/typebox` | JSON Schema type builder for tool parameter definitions. |
| `nanoid` | Generates short unique session IDs (8 characters). |

---

## Key Design Decisions

1. **Foreground is per-channel, not per-session.** Multiple channels can watch the same session simultaneously, and one channel can have multiple sessions in foreground.

2. **Multi-turn uses `AsyncIterable` prompts.** The `MessageStream` class implements `Symbol.asyncIterator` to feed user messages into the SDK's `query()` function as an async generator, keeping the session alive across turns.

3. **Persisted sessions survive GC.** When a session is garbage-collected (1 hour after completion), its Claude session ID is retained in a separate `persistedSessions` map so it can be resumed later. Entries are stored under three keys (internal ID, name, Claude UUID) for flexible lookup.

4. **Notifications use CLI shelling.** Since the plugin API doesn't expose a runtime `sendMessage` method, outbound notifications go through `openclaw message send` via `child_process.execFile`.

5. **Metrics are in-memory only.** Session metrics are aggregated in the `SessionManager` and reset on service restart. They are not persisted to disk. Cost data is tracked internally but not exposed in any user-facing output.

6. **Waiting-for-input uses dual detection.** End-of-turn detection (when a multi-turn result resolves) is the primary signal, backed by a 15-second safety-net timer for edge cases. A `waitingForInputFired` flag prevents duplicate wake events.

7. **Channel `"unknown"` falls through.** If `channelId` is `"unknown"`, the notification system explicitly falls through to `fallbackChannel` rather than attempting delivery to an invalid destination.

---

## Adding a New Tool or Command

1. Create a new file under `src/tools/` or `src/commands/`.
2. Export a `registerXxxTool(api)` or `registerXxxCommand(api)` function.
3. Import and call it in `index.ts` inside the `register()` function.

---

## Service Lifecycle

- **`start()`** — Creates `SessionManager` and `NotificationRouter`, wires them together, starts the long-running reminder check interval (60s), and starts a GC interval (5 min).
- **`stop()`** — Stops the notification router, kills all active sessions, clears intervals, and nulls singletons.
