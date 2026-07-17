import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_trades",
  title: "Listar negociações",
  description:
    "Lista as negociações do utilizador autenticado, opcionalmente filtradas por mercado (forex, crypto, propfirm) e/ou estado (open, closed).",
  inputSchema: {
    market: z.enum(["forex", "crypto", "propfirm"]).optional(),
    status: z.enum(["open", "closed"]).optional(),
    limit: z.number().int().min(1).max(200).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ market, status, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    }
    let q = supabaseForUser(ctx)
      .from("trades")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit ?? 50);
    if (market) q = q.eq("market", market);
    if (status) q = q.eq("status", status);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { trades: data ?? [] },
    };
  },
});
