import { withSupabase } from "npm:@supabase/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CANDIDATE_MODELS = [
  "google/gemini-2.0-flash-001",
  "openai/gpt-4o-mini",
  "meta-llama/llama-3.3-70b-instruct",
];

async function alignEmojisWithModel(
  captions: Array<{ id: string; text: string }>,
  density: string,
  openRouterKey: string,
  model: string,
): Promise<Array<{ id: string; text: string }>> {
  const systemPrompt = `You are a subtitle emoji aligner. You will receive a JSON array of caption objects.
Each object has an 'id' and 'text'. You need to add relevant emojis to the 'text' based on context.
Density level requested: ${density}. (high = lots of emojis, medium = some, low = few).
Respond ONLY with a valid JSON array of the updated objects. Do not include markdown or explanations.
Example output: [{"id": "1", "text": "Hello world 👋"}, {"id": "2", "text": "This is awesome! 🚀"}]`;

  const userPrompt = `Update these captions:\n${JSON.stringify(captions.map((c) => ({ id: c.id, text: c.text })))}`;

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openRouterKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://subbly.app",
      "X-Title": "Subbly Emoji Aligner",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 4096,
    }),
    signal: AbortSignal.timeout(12000),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.warn(`Emoji align model ${model} returned HTTP ${res.status}:`, errText.substring(0, 300));
    throw new Error(`OpenRouter error ${res.status}`);
  }

  const data = await res.json();
  const rawText: string = data?.choices?.[0]?.message?.content ?? "";
  const clean = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();

  const parsed = JSON.parse(clean);
  if (Array.isArray(parsed)) {
    return captions.map((orig) => {
      const updated = parsed.find((p: any) => String(p?.id) === String(orig.id));
      return updated && typeof updated.text === "string" ? { ...orig, text: updated.text } : orig;
    });
  }

  throw new Error(`Invalid JSON format from model ${model}`);
}

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const body = await req.json();
      const captions = body?.captions ?? [];
      const density = body?.density ?? "medium";

      if (!Array.isArray(captions) || captions.length === 0) {
        return new Response(JSON.stringify({ error: "Invalid 'captions' array" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const openRouterKey = Deno.env.get("OPENROUTER_API_KEY");
      if (!openRouterKey) {
        return new Response(JSON.stringify({ error: "OPENROUTER_API_KEY is not configured in Supabase secrets." }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      for (const model of CANDIDATE_MODELS) {
        try {
          const updatedCaptions = await alignEmojisWithModel(captions, density, openRouterKey, model);
          return new Response(JSON.stringify({ captions: updatedCaptions }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.warn(`Emoji align attempt with model '${model}' failed: ${msg}. Retrying with next model...`);
        }
      }

      // Fallback: return original captions unmodified if all AI models fail
      console.warn("All emoji alignment models failed. Returning original captions.");
      return new Response(JSON.stringify({ captions }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Alignment failed. Please try again.";
      return new Response(JSON.stringify({ error: msg }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }),
};
