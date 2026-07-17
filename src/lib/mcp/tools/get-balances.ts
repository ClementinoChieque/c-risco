import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "get_balances",
  title: "Obter saldos das contas",
  description:
    "Retorna os saldos actuais das contas Forex, Cripto e PropFirm do utilizador autenticado.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    }
    const sb = supabaseForUser(ctx);
    const [{ data: risk }, { data: prop }] = await Promise.all([
      sb.from("risk_settings").select("account_balance,crypto_account_balance").maybeSingle(),
      sb.from("propfirm_settings").select("name,funded_balance,profit_target,max_drawdown,daily_drawdown").maybeSingle(),
    ]);
    const balances = {
      forex: risk?.account_balance ?? 0,
      crypto: risk?.crypto_account_balance ?? 0,
      propfirm: {
        name: prop?.name ?? null,
        balance: prop?.funded_balance ?? 0,
        profit_target: prop?.profit_target ?? 0,
        max_drawdown: prop?.max_drawdown ?? 0,
        daily_drawdown: prop?.daily_drawdown ?? 0,
      },
    };
    return {
      content: [{ type: "text", text: JSON.stringify(balances) }],
      structuredContent: balances,
    };
  },
});
