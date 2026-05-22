import { createMcpHandler } from "mcp-handler";
import { registerPublicAtlasMcpTools } from "@/lib/server/public-mcp";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const handler = createMcpHandler(
  async (server) => {
    registerPublicAtlasMcpTools(server);
  },
  {
    serverInfo: {
      name: "agentic-ai-atlas-public",
      version: "0.1.0",
    },
  },
  {
    basePath: "/api",
    disableSse: true,
    maxDuration: 60,
  },
);

export { handler as GET, handler as POST, handler as DELETE };
