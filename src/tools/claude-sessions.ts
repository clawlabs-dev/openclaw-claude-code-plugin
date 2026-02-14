import { Type } from "@sinclair/typebox";
import { sessionManager, formatSessionListing, resolveAgentChannel } from "../shared";
import type { OpenClawPluginToolContext } from "../types";

export function makeClaudeSessionsTool(ctx?: OpenClawPluginToolContext) {
  return {
    name: "claude_sessions",
    description:
      "List all Claude Code sessions with their status and progress.",
    parameters: Type.Object({
      status: Type.Optional(
        Type.Union(
          [
            Type.Literal("all"),
            Type.Literal("running"),
            Type.Literal("completed"),
            Type.Literal("failed"),
          ],
          { description: 'Filter by status (default "all")' },
        ),
      ),
    }),
    async execute(_id: string, params: any) {
      if (!sessionManager) {
        return {
          content: [
            {
              type: "text",
              text: "Error: SessionManager not initialized. The claude-code service must be running.",
            },
          ],
        };
      }

      const filter = params.status || "all";
      const allSessions = sessionManager.list(filter);

      // Filter by agent's originChannel if context is available
      let sessions = allSessions;
      if (ctx?.workspaceDir) {
        const agentChannel = resolveAgentChannel(ctx.workspaceDir);
        if (agentChannel) {
          console.log(`[claude_sessions] Filtering sessions by agentChannel=${agentChannel}`);
          sessions = allSessions.filter(s => {
            const match = s.originChannel === agentChannel;
            console.log(`[claude_sessions]   session=${s.id} originChannel=${s.originChannel} match=${match}`);
            return match;
          });
        } else {
          console.log(`[claude_sessions] No agentChannel found for workspaceDir=${ctx.workspaceDir}, returning all sessions`);
        }
      }

      if (sessions.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No sessions found.",
            },
          ],
        };
      }

      const lines = sessions.map(formatSessionListing);

      return {
        content: [
          {
            type: "text",
            text: lines.join("\n\n"),
          },
        ],
      };
    },
  };
}
