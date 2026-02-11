# API Reference

Complete reference for all Claude Code Plugin interfaces: tools (for the OpenClaw AI agent), chat commands (for humans), and gateway RPC methods (for external systems).

---

## Tools

Tools are invoked by the OpenClaw AI agent programmatically. They follow the MCP tool calling convention.

### `claude_launch`

Launch a new Claude Code session.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `prompt` | `string` | Yes | The task prompt to execute. |
| `name` | `string` | No | Human-readable name (kebab-case). Auto-generated from prompt if omitted. |
| `workdir` | `string` | No | Working directory. Defaults to config `defaultWorkdir` or `cwd`. |
| `model` | `string` | No | Model name (e.g. `"sonnet"`, `"opus"`). |
| `max_budget_usd` | `number` | No | Maximum budget in USD. Default: `5`. |
| `system_prompt` | `string` | No | Additional system prompt appended to the session. |
| `allowed_tools` | `string[]` | No | Explicit list of allowed tools. |
| `resume_session_id` | `string` | No | Claude session ID (or name/internal ID) to resume from. |
| `fork_session` | `boolean` | No | Fork instead of continuing when resuming. |
| `multi_turn` | `boolean` | No | Enable multi-turn mode for follow-up messages via `claude_respond`. |
| `permission_mode` | `string` | No | One of `"default"`, `"plan"`, `"acceptEdits"`, `"bypassPermissions"`. |
| `channel` | `string` | No | Origin channel for notifications (e.g. `"telegram:123456789"`). Prevents `"unknown"` routing. |

### `claude_sessions`

List all sessions with status and progress.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `status` | `string` | No | Filter: `"all"` (default), `"running"`, `"completed"`, `"failed"`. |

### `claude_output`

Show output from a session.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `session` | `string` | Yes | Session name or ID. |
| `lines` | `number` | No | Number of recent lines to show (default 50). |
| `full` | `boolean` | No | Show all available output (up to 200 buffered blocks). |

### `claude_fg`

Bring a session to foreground — displays any missed background output under a "Catchup (N missed outputs):" header, then starts streaming new output to the current channel in real time.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `session` | `string` | Yes | Session name or ID. |
| `lines` | `number` | No | Number of recent buffered lines to show (default 30). |
| `channel` | `string` | No | Target channel for streaming (e.g. `"telegram:123456789"`). Prevents `"unknown"` routing. |

### `claude_bg`

Send a session back to background (stop streaming).

| Parameter | Type | Required | Description |
|---|---|---|---|
| `session` | `string` | No | Session name or ID. If omitted, detaches all foreground sessions for the current channel. |
| `channel` | `string` | No | Channel to detach from (e.g. `"telegram:123456789"`). Prevents `"unknown"` routing. |

### `claude_kill`

Terminate a running session.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `session` | `string` | Yes | Session name or ID. |

### `claude_respond`

Send a follow-up message to a running session.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `session` | `string` | Yes | Session name or ID. |
| `message` | `string` | Yes | The message to send. |
| `interrupt` | `boolean` | No | Interrupt the current turn before sending. Useful to redirect mid-response. |

### `claude_stats`

Show usage metrics. Takes no parameters.

Returns: session counts by status, average duration, and notable session (sorted by cost internally — cost values are not shown in user-facing output).

---

## Commands

All commands require authentication (`requireAuth: true`).

| Command | Arguments | Description |
|---|---|---|
| `/claude [--name <name>] <prompt>` | Required: prompt | Launch a new session. |
| `/claude_sessions` | None | List all sessions. |
| `/claude_kill <name-or-id>` | Required: session ref | Terminate a session. |
| `/claude_fg <name-or-id>` | Required: session ref | Bring a session to foreground. |
| `/claude_bg [name-or-id]` | Optional: session ref | Detach foreground session(s). |
| `/claude_resume <ref> [prompt]` | Required: session ref | Resume a completed session. |
| `/claude_resume --list` | Flag | List all resumable sessions. |
| `/claude_resume --fork <ref> [prompt]` | Required: session ref | Fork a completed session. |
| `/claude_respond <ref> <message>` | Required: session ref + message | Send a follow-up message. |
| `/claude_respond --interrupt <ref> <msg>` | Flag + session ref + message | Interrupt then send. |
| `/claude_stats` | None | Show usage metrics. |

---

## RPC Methods

All methods return `respond(true, data)` on success or `respond(false, { error })` on failure.

### `claude-code.sessions`

| Parameter | Type | Description |
|---|---|---|
| `status` | `string` | Filter: `"all"`, `"running"`, `"completed"`, `"failed"`. |

**Response:** `{ sessions: [...], count: number }`

Each session object includes: `id`, `name`, `status`, `prompt`, `workdir`, `model`, `startedAt`, `completedAt`, `durationMs`, `claudeSessionId`, `foreground`, `multiTurn`, `display`.

### `claude-code.launch`

| Parameter | Type | Description |
|---|---|---|
| `prompt` | `string` | **(required)** Task prompt. |
| `name` | `string` | Session name. |
| `workdir` | `string` | Working directory. |
| `model` | `string` | Model name. |
| `maxBudgetUsd` / `max_budget_usd` | `number` | Budget cap. |
| `systemPrompt` / `system_prompt` | `string` | System prompt. |
| `allowedTools` / `allowed_tools` | `string[]` | Allowed tools. |
| `resumeSessionId` / `resume_session_id` | `string` | Session ID to resume. |
| `forkSession` / `fork_session` | `boolean` | Fork on resume. |
| `multiTurn` / `multi_turn` | `boolean` | Multi-turn mode. |
| `originChannel` | `string` | Origin channel for notifications. |

**Response:** `{ id, name, status, workdir, model }`

### `claude-code.kill`

| Parameter | Type | Description |
|---|---|---|
| `session` / `id` | `string` | **(required)** Session name or ID. |

**Response:** `{ id, name, status, message }`

### `claude-code.output`

| Parameter | Type | Description |
|---|---|---|
| `session` / `id` | `string` | **(required)** Session name or ID. |
| `lines` | `number` | Number of lines (default 50). |
| `full` | `boolean` | Return all buffered output. |

**Response:** `{ id, name, status, durationMs, duration, lines, lineCount, result }`

### `claude-code.stats`

No parameters.

**Response:**
```json
{
  "sessionsByStatus": { "completed": 10, "failed": 2, "killed": 1, "running": 1 },
  "totalLaunched": 14,
  "averageDurationMs": 45000,
  "notableSession": { "id": "abc123", "name": "refactor-db", "prompt": "..." },
  "display": "Claude Code Plugin Stats\n..."
}
```
