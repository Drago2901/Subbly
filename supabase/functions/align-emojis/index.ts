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
  "qwen/qwen-2.5-72b-instruct",
];

interface CaptionInput {
  id: string | number;
  text: string;
  [key: string]: unknown;
}

async function alignEmojisBatch(
  captions: CaptionInput[],
  density: string,
  openRouterKey: string,
  model: string,
): Promise<CaptionInput[]> {
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
    signal: AbortSignal.timeout(20000),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.warn(`Emoji align model ${model} returned HTTP ${res.status}:`, errText.substring(0, 300));
    throw new Error(`OpenRouter error ${res.status}`);
  }

  const data = await res.json();
  const rawText: string = data?.choices?.[0]?.message?.content ?? "";
  let clean = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();

  // Extract JSON array boundary if surrounded by conversational text
  const firstBracket = clean.indexOf("[");
  const lastBracket = clean.lastIndexOf("]");
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    clean = clean.substring(firstBracket, lastBracket + 1);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(clean);
  } catch {
    parsed = JSON.parse(rawText);
  }

  const list = Array.isArray(parsed)
    ? parsed
    : Array.isArray((parsed as Record<string, unknown>)?.captions)
    ? (parsed as { captions: unknown[] }).captions
    : Array.isArray((parsed as Record<string, unknown>)?.data)
    ? (parsed as { data: unknown[] }).data
    : null;

  if (Array.isArray(list)) {
    return captions.map((orig) => {
      const updated = list.find((p) => {
        if (!p || typeof p !== "object") return false;
        const candidate = p as { id?: string | number };
        return String(candidate.id) === String(orig.id);
      }) as { text?: string } | undefined;
      return updated && typeof updated.text === "string" ? { ...orig, text: updated.text } : orig;
    });
  }

  throw new Error(`Invalid JSON format from model ${model}`);
}

async function alignEmojisWithFallback(
  captions: CaptionInput[],
  density: string,
  openRouterKey: string,
): Promise<CaptionInput[]> {
  for (const model of CANDIDATE_MODELS) {
    try {
      const updatedCaptions = await alignEmojisBatch(captions, density, openRouterKey, model);
      return updatedCaptions;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`Emoji align attempt with model '${model}' failed: ${msg}. Retrying with next model...`);
    }
  }
  console.warn("All emoji alignment models failed for batch. Returning original captions.");
  return captions;
}

export default {
  fetch: withSupabase({ auth: 'user' }, async (req: Request, _ctx: unknown) => {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const body = await req.json();
      const captions: CaptionInput[] = body?.captions ?? [];
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

      // Process in chunks of 30 for reliability and fast responses
      const BATCH_SIZE = 30;
      const chunks: CaptionInput[][] = [];
      for (let i = 0; i < captions.length; i += BATCH_SIZE) {
        chunks.push(captions.slice(i, i + BATCH_SIZE));
      }

      const batchResults = await Promise.all(
        chunks.map((chunk) => alignEmojisWithFallback(chunk, density, openRouterKey))
      );

      const updatedCaptions = batchResults.flat();

      return new Response(JSON.stringify({ captions: updatedCaptions }), {
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
