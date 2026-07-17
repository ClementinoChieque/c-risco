import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listTradesTool from "./tools/list-trades";
import createTradeTool from "./tools/create-trade";
import listAnalysesTool from "./tools/list-analyses";
import listSetupsTool from "./tools/list-setups";
import getBalancesTool from "./tools/get-balances";

// Issuer must be the direct supabase.co host, built from the project ref
// (inlined by Vite at build time — never read at runtime).
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "c-risco-mcp",
  title: "C-RISCO — Gestão de Trades",
  version: "0.1.0",
  instructions:
    "Ferramentas para gerir o diário de trading C-RISCO do utilizador: listar/criar negociações, consultar saldos (Forex, Cripto, PropFirm), listar análises (Acertos/Erros) e setups do playbook. Todos os dados são isolados por utilizador via RLS.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listTradesTool, createTradeTool, listAnalysesTool, listSetupsTool, getBalancesTool],
});
