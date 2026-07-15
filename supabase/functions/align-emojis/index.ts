import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    const systemPrompt = `You are a subtitle emoji aligner. You will receive a JSON array of caption objects.
Each object has an 'id' and 'text'. You need to add relevant emojis to the 'text' based on context.
Density level requested: ${density}. (high = lots of emojis, medium = some, low = few).
Respond ONLY with a valid JSON array of the updated objects. Do not include markdown or explanations.
Example output: [{"id": "1", "text": "Hello world 👋"}, {"id": "2", "text": "This is awesome! 🚀"}]`;

    const userPrompt = `Update these captions:\n${JSON.stringify(captions.map((c: any) => ({ id: c.id, text: c.text })))}`;

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://subbly.app",
        "X-Title": "Subbly Emoji Aligner",
      },
      body: JSON.stringify({
        model: "qwen/qwen3-8b",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 4096,
      }),
      signal: AbortSignal.timeout(40000),
    });

    if (!res.ok) {
      const errText = await res.text();
      let errMsg = `OpenRouter API error: ${res.status}`;
      try {
        const parsed = JSON.parse(errText);
        if (parsed?.error?.message) errMsg = parsed.error.message;
      } catch { }
      throw new Error(errMsg);
    }

    const data = await res.json();
    const rawText: string = data?.choices?.[0]?.message?.content ?? "";

    const clean = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();

    try {
      const parsed = JSON.parse(clean);
      if (Array.isArray(parsed)) {
        const updatedCaptions = captions.map((orig: any) => {
          const updated = parsed.find((p: any) => p.id === orig.id);
          return updated ? { ...orig, text: updated.text } : orig;
        });
        return new Response(JSON.stringify({ captions: updatedCaptions }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } catch (err) {
      console.error("Failed to parse JSON from AI", rawText);
      throw new Error("Failed to parse AI response");
    }

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
});
