# Agent Channels — Notification Routing

## Concept
Route Claude Code session notifications to the correct Telegram bot based on the workspace directory.

## Config
In `openclaw.json` → `plugins.entries["openclaw-claude-code-plugin"].config`:

```json
{
  "agentChannels": {
    "/home/user/agent-seo": "telegram:seo-bot:123456789",
    "/home/user/agent-main": "telegram:main-bot:123456789"
  }
}
```

## Channel format
- **3 segments** `channel:account:target` — sends via a specific bot account (e.g. `telegram:seo-bot:123456789`)
- **2 segments** `channel:target` — sends via the default bot (e.g. `telegram:123456789`)

## How it works
1. Agent calls `claude_launch(prompt=..., name=...)` — **no `channel` param needed**
2. Plugin gets `workdir` from params or factory ctx
3. `resolveAgentChannel(workdir)` matches against `agentChannels` (longest prefix wins)
4. Notification sent via `openclaw message send --channel X --account Y --target Z`

## Priority chain
```
explicit channel param > ctxChannel (from factory) > agentChannels[workdir] > fallbackChannel > "unknown"
```

## Important
- Agents should **NOT** pass `channel` in `claude_launch` — it bypasses automatic routing
- Prefix matching: `/home/user/agent-seo/subdir` matches `/home/user/agent-seo`
- Entries sorted by path length (most specific wins)
