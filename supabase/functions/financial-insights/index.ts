import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    // Fetch last 3 months of transactions, accounts, and goals in parallel
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const [txRes, accRes, goalRes] = await Promise.all([
      supabase
        .from("transactions")
        .select("name, amount, type, status, due_date, is_recurring, categories(name)")
        .gte("due_date", threeMonthsAgo.toISOString().split("T")[0])
        .order("due_date", { ascending: false })
        .limit(200),
      supabase.from("accounts").select("name, balance, type"),
      supabase.from("goals").select("name, target_amount, current_amount, deadline"),
    ]);

    if (txRes.error) throw txRes.error;
    if (accRes.error) throw accRes.error;
    if (goalRes.error) throw goalRes.error;

    const contextData = {
      transactions: txRes.data,
      accounts: accRes.data,
      goals: goalRes.data,
    };

    const prompt = `Você é um consultor financeiro pessoal. Analise os dados financeiros abaixo e retorne um JSON com a seguinte estrutura exata (sem markdown, apenas JSON puro):

{
  "health_score": <número de 0 a 100>,
  "summary": "<resumo de 1-2 frases sobre a saúde financeira>",
  "insights": [
    {
      "type": "alert" | "tip" | "praise",
      "icon": "<emoji relevante>",
      "title": "<título curto>",
      "description": "<descrição em 1-2 frases>"
    }
  ]
}

Regras:
- health_score: 0-40 = ruim, 41-70 = ok, 71-100 = bom
- Gere entre 3 e 5 insights
- "alert" para problemas (gastos excessivos, metas atrasadas)
- "tip" para sugestões de melhoria
- "praise" para pontos positivos
- Se não houver dados suficientes, dê dicas gerais de educação financeira
- Sempre em português do Brasil
- Responda APENAS com o JSON, sem texto adicional

Dados financeiros:
${JSON.stringify(contextData, null, 2)}`;

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Você é um assistente financeiro que responde apenas em JSON válido." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      throw new Error(`AI Gateway error: ${aiResponse.status} - ${errText}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) throw new Error("Empty AI response");

    // Parse JSON from response (handle potential markdown wrapping)
    let parsed;
    try {
      const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      throw new Error("Failed to parse AI response as JSON");
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Financial insights error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
