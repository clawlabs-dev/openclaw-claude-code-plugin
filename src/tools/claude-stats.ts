import { Type } from "@sinclair/typebox";
import { sessionManager, formatStats } from "../shared";

export function registerClaudeStatsTool(api: any): void {
  api.registerTool(
    {
      name: "claude_stats",
      description:
        "Show Claude Code Plugin usage metrics: session counts by status, average duration, and notable sessions.",
      parameters: Type.Object({}),
      async execute(_id: string, _params: any) {
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

        const metrics = sessionManager.getMetrics();
        const text = formatStats(metrics);

        return {
          content: [{ type: "text", text }],
        };
      },
    },
    { optional: false },
  );
}
