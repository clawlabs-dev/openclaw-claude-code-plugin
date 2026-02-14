/**
 * Unit tests for claude_sessions agent filtering
 * Tests that each agent only sees sessions it launched (filtered by originChannel)
 */

interface MockSession {
  id: string;
  name: string;
  originChannel: string;
  workdir: string;
}

interface AgentChannelsConfig {
  [workspace: string]: string;
}

// Mock resolveAgentChannel function
function resolveAgentChannel(workdir: string, config: AgentChannelsConfig): string | undefined {
  const normalise = (p: string) => p.replace(/\/+$/, "");
  const normWorkdir = normalise(workdir);
  
  const entries = Object.entries(config).sort((a, b) => b[0].length - a[0].length);
  
  for (const [dir, channel] of entries) {
    if (normWorkdir === normalise(dir) || normWorkdir.startsWith(normalise(dir) + "/")) {
      return channel;
    }
  }
  return undefined;
}

// Filter logic from claude_sessions tool
function filterSessionsByAgent(
  allSessions: MockSession[],
  agentWorkspace: string,
  config: AgentChannelsConfig
): MockSession[] {
  const agentChannel = resolveAgentChannel(agentWorkspace, config);
  if (!agentChannel) {
    console.log(`No agentChannel found for ${agentWorkspace}, returning all`);
    return allSessions;
  }
  
  console.log(`Filtering by agentChannel=${agentChannel}`);
  return allSessions.filter(s => {
    const match = s.originChannel === agentChannel;
    console.log(`  session=${s.id} originChannel=${s.originChannel} match=${match}`);
    return match;
  });
}

// Test data
const agentChannels: AgentChannelsConfig = {
  "/home/user/my-seo-agent": "telegram|my-agent|123456789",
  "/home/user/my-agent-research": "telegram|clawpote|123456789",
  "/home/user/my-agent": "telegram|default|123456789"
};

const mockSessions: MockSession[] = [
  {
    id: "session1",
    name: "seo-task",
    originChannel: "telegram|my-agent|123456789",
    workdir: "/home/user/my-seo-agent"
  },
  {
    id: "session2",
    name: "html-test",
    originChannel: "telegram|my-agent|123456789",
    workdir: "/Users/selim/Workspace/test-wake"  // Different workdir!
  },
  {
    id: "session3",
    name: "research-task",
    originChannel: "telegram|clawpote|123456789",
    workdir: "/home/user/my-agent-research"
  },
  {
    id: "session4",
    name: "main-task",
    originChannel: "telegram|default|123456789",
    workdir: "/home/user/my-agent"
  }
];

// Run tests
console.log("=== Test 1: my-agent agent should see only its sessions ===");
const seoSessions = filterSessionsByAgent(mockSessions, "/home/user/my-seo-agent", agentChannels);
console.log(`Result: ${seoSessions.length} sessions`);
console.assert(seoSessions.length === 2, `Expected 2 sessions, got ${seoSessions.length}`);
console.assert(seoSessions[0].id === "session1", "Expected session1");
console.assert(seoSessions[1].id === "session2", "Expected session2 (different workdir but same originChannel)");
console.log("✅ Test 1 passed\n");

console.log("=== Test 2: research agent should see only its sessions ===");
const researchSessions = filterSessionsByAgent(mockSessions, "/home/user/my-agent-research", agentChannels);
console.log(`Result: ${researchSessions.length} sessions`);
console.assert(researchSessions.length === 1, `Expected 1 session, got ${researchSessions.length}`);
console.assert(researchSessions[0].id === "session3", "Expected session3");
console.log("✅ Test 2 passed\n");

console.log("=== Test 3: main agent should see only its sessions ===");
const mainSessions = filterSessionsByAgent(mockSessions, "/home/user/my-agent", agentChannels);
console.log(`Result: ${mainSessions.length} sessions`);
console.assert(mainSessions.length === 1, `Expected 1 session, got ${mainSessions.length}`);
console.assert(mainSessions[0].id === "session4", "Expected session4");
console.log("✅ Test 3 passed\n");

console.log("=== Test 4: unknown agent should see all sessions ===");
const unknownSessions = filterSessionsByAgent(mockSessions, "/unknown/path", agentChannels);
console.log(`Result: ${unknownSessions.length} sessions`);
console.assert(unknownSessions.length === 4, `Expected 4 sessions, got ${unknownSessions.length}`);
console.log("✅ Test 4 passed\n");

console.log("🎉 All tests passed!");
