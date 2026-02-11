# Notification System

The `NotificationRouter` implements a notification matrix based on session state and channel mode.

---

## Notification Matrix

| Event | Background session | Foreground session |
|---|---|---|
| Session started | Silent | Silent (streaming begins) |
| Assistant text output | Silent | Streamed to chat (500ms debounce) |
| Tool call | Silent | Compact indicator (e.g. `🔧 Bash — git status`) |
| Tool result | Silent | Silent |
| Session completed (success) | Notify origin channel | Notify all channels |
| Session completed (error) | Notify origin channel | Notify all channels |
| Session limit reached | Notify origin channel | Notify all channels |
| Session > 10 minutes | One-time reminder | Silent (user sees output) |
| Waiting for input | `🔔 [name] Claude asks:` + preview to origin channel + fire `openclaw system event` | `💬 Session waiting for input` + fire `openclaw system event` |
| Agent responds (`claude_respond`) | `↩️ [name] Responded:` echoed to origin channel | `↩️ [name] Responded:` echoed to origin channel |

---

## Notification Delivery

Notifications are sent via the `openclaw message send` CLI command. The channel ID format is `"channel:target"` (e.g. `"telegram:123456789"`, `"discord:987654321"`). Bare numeric IDs are assumed to be Telegram chat IDs.

---

## Background Visibility

When a session is running in the background, users can follow the conversation without foregrounding:

- **🔔 Claude asks** — When a session becomes idle and waiting for input (e.g. Claude asked a question or needs a decision), the origin channel receives a `🔔 [name] Claude asks:` message with a preview of the last output, so the user sees what Claude needs.
- **↩️ Responded** — When the agent (or user via `claude_respond`) sends a follow-up message, a `↩️ [name] Responded:` message is echoed to the origin channel with the response content, so the full conversation is visible in-channel.

This makes the plugin a transparent transport layer — the user sees both sides of the conversation in their chat, even when sessions run in the background.

---

## Agent Event Triggers

When a session completes, an `openclaw system event` is fired with a summary of the session result, prompting the OpenClaw AI agent to process the output and relay it to the user.

When any session (single or multi-turn) becomes idle and waiting for input, an `openclaw system event` is also fired to wake the orchestrator. Idle detection uses end-of-turn detection (for multi-turn results) combined with a 15-second safety-net timer. A `waitingForInputFired` flag prevents duplicate wake events from being fired for the same idle period.
