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
  name: "list_analyses",
  title: "Listar análises (win/loss)",
  description:
    "Lista as análises (Acertos e Erros) do utilizador autenticado, opcionalmente filtradas por mercado e tipo.",
  inputSchema: {
    market: z.enum(["forex", "crypto", "propfirm"]).optional(),
    type: z.enum(["win", "loss"]).optional(),
    limit: z.number().int().min(1).max(200).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ market, type, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    }
    let q = supabaseForUser(ctx)
      .from("trade_analyses")
      .select("id,market,type,asset_pair,amount,risk_reward,risk_percentage,notes,created_at,setup_id")
      .order("created_at", { ascending: false })
      .limit(limit ?? 50);
    if (market) q = q.eq("market", market);
    if (type) q = q.eq("type", type);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { analyses: data ?? [] },
    };
  },
});
