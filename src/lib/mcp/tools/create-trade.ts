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
  name: "create_trade",
  title: "Criar negociação",
  description:
    "Cria uma nova negociação para o utilizador autenticado. O mercado deve ser forex, crypto ou propfirm.",
  inputSchema: {
    market: z.enum(["forex", "crypto", "propfirm"]),
    pair: z.string().min(1),
    direction: z.enum(["long", "short"]),
    entry_price: z.number(),
    stop_loss: z.number(),
    take_profit: z.number(),
    position_size: z.number(),
    risk_amount: z.number(),
    risk_percentage: z.number(),
    risk_reward_ratio: z.number(),
    potential_profit: z.number(),
    notes: z.string().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    }
    const { data, error } = await supabaseForUser(ctx)
      .from("trades")
      .insert({ ...input, user_id: ctx.getUserId() })
      .select()
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { trade: data },
    };
  },
});
