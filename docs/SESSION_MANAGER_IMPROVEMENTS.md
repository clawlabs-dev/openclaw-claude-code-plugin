## Session Manager Improvements (Comparison with openclaw-codex-plugin)

### Context
After comparing the session management architecture in `openclaw-claude-code-plugin` (this repo) with `openclaw-codex-plugin`, several potential improvements were identified. While the two plugins have fundamentally different architectures (Claude Agent SDK vs direct CLI process spawning), some patterns could be adapted.

### Current Architecture Differences

**openclaw-claude-code-plugin:**
- Uses `@anthropic-ai/claude-agent-sdk` for session management
- Session wrapper in `src/session.ts` (476 lines)
- SessionManager in `src/session-manager.ts` (655 lines)
- Separate notification routing in `src/notifications.ts` (379 lines)
- 2-level notification architecture (session + system fallback)

**openclaw-codex-plugin:**
- Directly spawns and manages `codex` CLI processes
- All-in-one SessionManager in `src/session-manager.ts` (1084 lines)
- JSONL event stream parsing
- Inline notification handling
- Different lifecycle hooks (waiting-for-input, thread.started, etc.)

### Potential Improvements to Consider

#### 1. Enhanced Waiting-State Notifications
**Codex plugin pattern:**
- Tracks waiting state explicitly in session object
- Uses separate notification channels for different waiting states
- More granular control over notification timing

**Application to claude-code plugin:**
- Could enhance `src/notifications.ts` to track waiting states more explicitly
- Already has debouncing (`WAITING_EVENT_DEBOUNCE_MS`) but could add state tracking
- Consider adding `waitingReason` field to session state

#### 2. Better Error Context in Notifications
**Codex plugin pattern:**
- Includes error details, exit codes, and stderr in failure notifications
- Provides actionable recovery suggestions in notification messages

**Application to claude-code plugin:**
- Enhance error messages in `src/session.ts` event handlers
- Add more context to failure notifications (exit codes, last output, etc.)
- Consider adding recovery suggestions based on error type

#### 3. Session Resume Improvements
**Codex plugin pattern:**
- Tracks `resumeSessionId` to show resume chain
- Explicitly shows "resumed from X" in session metadata

**Application to claude-code plugin:**
- Already has persistence (`persistedSessions` map) but could track resume chain
- Add `resumeFromId` field to `PersistedSessionInfo`
- Show resume history in `/claude-sessions` output

#### 4. More Granular Session Status Tracking
**Codex plugin pattern:**
- Has `interrupted` status separate from `killed`
- Tracks `turnsCompleted` for multi-turn sessions
- Explicit `respondCount` for rate limiting

**Application to claude-code plugin:**
- Consider adding `interrupted` status for graceful stops vs kills
- Track turn count explicitly (useful for debugging multi-turn issues)
- Already has `maxAutoResponds` safety cap, could expose current count in status

#### 5. Structured Event Logging
**Codex plugin pattern:**
- Keeps array of parsed `CodexEvent` objects
- Allows querying specific event types (tool_use, thinking, etc.)
- Enables richer session output filtering

**Application to claude-code plugin:**
- Could parse Claude SDK output into structured events
- Would enable better filtering in `/claude-output` tool
- Useful for debugging and analytics

### Recommendations

**High Priority (could implement now):**
1. ✅ Enhanced error context in notifications (low risk, high value)
2. ✅ Track resume chain in persisted sessions (simple addition)
3. ✅ Add `interrupted` status for graceful stops

**Medium Priority (needs design):**
4. ⚠️ Structured event logging (requires SDK output parsing strategy)
5. ⚠️ More granular waiting-state tracking (need to identify SDK event types)

**Low Priority (breaking changes or major refactor):**
6. ❌ Merge notification system into session manager (would undo v1.0.7 architecture)
7. ❌ Switch from Claude SDK to direct CLI spawning (fundamental architecture change)

### Implementation Plan (if pursuing high-priority items)

#### Step 1: Enhanced Error Notifications
```typescript
// In src/session.ts, enhance completion handler:
if (result.error) {
  const errorContext = {
    error: result.error,
    exitCode: this.process?.exitCode ?? null,
    lastOutput: this.outputLog.slice(-500), // last 500 chars
    costUsd: result.costUsd,
  };

  await this.notificationRouter?.send(
    this.sessionChannel,
    `❌ Session "${this.name}" failed\n\n` +
    `Error: ${result.error}\n` +
    (errorContext.exitCode ? `Exit code: ${errorContext.exitCode}\n` : '') +
    `Cost: $${result.costUsd.toFixed(4)}\n\n` +
    `Last output:\n${errorContext.lastOutput}`
  );
}
```

#### Step 2: Resume Chain Tracking
```typescript
// In src/types.ts:
interface PersistedSessionInfo {
  claudeSessionId: string;
  name: string;
  prompt: string;
  workdir: string;
  model?: string;
  completedAt?: number;
  status: SessionStatus;
  costUsd: number;
  originAgentId?: string;
  originChannel?: string;
  resumedFromId?: string; // NEW: track resume chain
}

// In src/session-manager.ts, resume method:
if (resumeSessionId) {
  const resumedInfo = this.persistedSessions.get(resumeSessionId);
  if (resumedInfo) {
    session.resumedFromId = resumeSessionId;
    // Include in persisted info when session completes
  }
}
```

#### Step 3: Add Interrupted Status
```typescript
// In src/types.ts:
export type SessionStatus =
  | "starting"
  | "running"
  | "waiting-for-input"
  | "completed"
  | "failed"
  | "killed"
  | "interrupted"; // NEW: graceful stop vs hard kill

// In src/session.ts, add graceful stop method:
async interrupt(): Promise<void> {
  if (!this.process || this.status !== 'running') return;

  // Send SIGINT for graceful shutdown
  this.process.kill('SIGINT');
  this.status = 'interrupted';

  // Wait up to 5s for graceful exit, then force kill
  await new Promise(resolve => setTimeout(resolve, 5000));
  if (this.process && !this.process.killed) {
    this.process.kill('SIGKILL');
  }
}
```

### Testing Recommendations

If implementing any of these improvements:

1. **Test error notification enhancement:**
   - Launch session that will fail (bad workdir, invalid model, etc.)
   - Verify notification includes error details, exit code, last output
   - Check notification arrives on correct channel

2. **Test resume chain tracking:**
   - Launch session A, let it complete
   - Resume from A to create session B
   - Resume from B to create session C
   - Verify chain is tracked: C → B → A

3. **Test interrupted status:**
   - Launch long-running session
   - Send interrupt (SIGINT)
   - Verify graceful shutdown completes
   - Check status is `interrupted` not `killed`
   - Verify notification differentiates between interrupt and kill

### Risks & Considerations

**Error notification enhancement:**
- Risk: Low (additive change)
- Breaking: No
- Performance: Negligible (just string formatting)

**Resume chain tracking:**
- Risk: Low (additive field)
- Breaking: No (backward compatible)
- Storage: Linear growth with session count (bounded by `maxPersistedSessions`)

**Interrupted status:**
- Risk: Medium (behavior change in kill flow)
- Breaking: Potentially (if tools/commands check for specific statuses)
- Testing: Need to verify graceful shutdown doesn't break existing kill behavior

### Decision

**Recommendation:** File this as a GitHub issue for future consideration. Do NOT implement immediately because:

1. Current v1.0.9 architecture is stable and tested
2. v1.0.7 specifically improved notification system - don't regress
3. These are nice-to-haves, not critical bugs
4. Better to let patterns mature in codex plugin first, then selectively adopt

**Next Steps:**
1. Create GitHub issue with this analysis
2. Label as `enhancement`, `good-first-issue` (for error context improvement)
3. Milestone: v1.1.0 or v1.2.0 (not urgent)
4. Let community feedback guide prioritization

---

*Analysis Date: 2025-02-23*
*Comparison: openclaw-claude-code-plugin v1.0.9 vs openclaw-codex-plugin (latest)*
