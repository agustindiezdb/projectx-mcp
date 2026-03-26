import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

import { ensureValidSession } from "./auth/session";
import { createTimeEntryTool, CreateTimeEntrySchema } from "./tools/createTimeEntry";
import { getTimeEntriesTool, GetTimeEntriesSchema } from "./tools/getTimeEntries";
import { deleteTimeEntryTool, DeleteTimeEntrySchema } from "./tools/deleteTimeEntry";
import { getProjectsTool, GetProjectsSchema } from "./tools/getProjects";

// ─── Tool definitions ─────────────────────────────────────────────────────────

const TOOLS: Tool[] = [
  {
    name: "get_time_entries",
    description:
      "Get time entries for a date range. Returns a per-day summary showing total hours and which days are missing entries.",
    inputSchema: {
      type: "object",
      properties: {
        date_from: { type: "string", description: "Start date YYYY-MM-DD" },
        date_to: { type: "string", description: "End date YYYY-MM-DD" },
      },
      required: ["date_from", "date_to"],
    },
  },
  {
    name: "get_projects",
    description: "List available projects in ProjectX. Optionally filter by name.",
    inputSchema: {
      type: "object",
      properties: {
        search: { type: "string", description: "Optional name filter" },
      },
    },
  },
  {
    name: "create_time_entry",
    description:
      "Create a time entry in ProjectX for a specific date, project, and number of hours.",
    inputSchema: {
      type: "object",
      properties: {
        date: { type: "string", description: "Date YYYY-MM-DD" },
        hours: { type: "number", description: "Hours to log (e.g. 8 or 7.5)" },
        project: { type: "string", description: "Project name (partial match OK)" },
        description: { type: "string", description: "Optional description" },
        billable: { type: "boolean", description: "Override billable flag (defaults to project setting)" },
      },
      required: ["date", "hours", "project"],
    },
  },
  {
    name: "delete_time_entry",
    description: "Delete a time entry by its ID.",
    inputSchema: {
      type: "object",
      properties: {
        entry_id: { type: "number", description: "The numeric ID of the entry to delete" },
      },
      required: ["entry_id"],
    },
  },
];

// ─── Server ───────────────────────────────────────────────────────────────────

const server = new Server(
  { name: "projectx-mcp", version: "2.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "get_time_entries") {
      const parsed = GetTimeEntriesSchema.safeParse(args);
      if (!parsed.success) return errorResponse(parsed.error.message);
      const result = await getTimeEntriesTool(parsed.data);
      return { content: [{ type: "text", text: formatGetEntriesResult(result) }] };
    }

    if (name === "get_projects") {
      const parsed = GetProjectsSchema.safeParse(args ?? {});
      if (!parsed.success) return errorResponse(parsed.error.message);
      const result = await getProjectsTool(parsed.data);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }

    if (name === "create_time_entry") {
      const parsed = CreateTimeEntrySchema.safeParse(args);
      if (!parsed.success) return errorResponse(parsed.error.message);
      const result = await createTimeEntryTool(parsed.data);
      return {
        content: [{ type: "text", text: result.message }],
        isError: !result.success,
      };
    }

    if (name === "delete_time_entry") {
      const parsed = DeleteTimeEntrySchema.safeParse(args);
      if (!parsed.success) return errorResponse(parsed.error.message);
      const result = await deleteTimeEntryTool(parsed.data);
      return {
        content: [{ type: "text", text: result.message }],
        isError: !result.success,
      };
    }

    return errorResponse(`Unknown tool: ${name}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[server] tool "${name}" error:`, msg);
    return errorResponse(msg);
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function errorResponse(message: string) {
  return { content: [{ type: "text", text: message }], isError: true };
}

function formatGetEntriesResult(result: Awaited<ReturnType<typeof getTimeEntriesTool>>): string {
  const lines: string[] = [result.message, ""];

  for (const day of result.summary ?? []) {
    const status = day.total_hours === 0 ? "❌ MISSING" : `✅ ${day.total_hours}h`;
    lines.push(`${day.date}  ${status}`);
    for (const e of day.entries) {
      lines.push(`  • [${e.id}] ${e.project} — ${e.hours}h${e.description ? ` — ${e.description}` : ""}`);
    }
  }

  return lines.join("\n");
}

// ─── Start ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.error("[server] starting projectx-mcp");
  await ensureValidSession();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[server] ready");
}

main().catch((err) => {
  console.error("[server] fatal:", err);
  process.exit(1);
});
