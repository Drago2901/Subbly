// Translate captions to English and/or add tasteful emojis using Lovable AI Gateway.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Cap = { id: string; text: string };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const captions: Cap[] = body?.captions ?? [];
    const translate: boolean = !!body?.translate;
    const emojis: boolean = !!body?.emojis;

    if (!captions.length || (!translate && !emojis)) {
      return new Response(JSON.stringify({ captions }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const instructions: string[] = [];
    if (translate) instructions.push("Translate each caption's text into natural English.");
    if (emojis) instructions.push("Add 1 tasteful, contextually relevant emoji to each caption (at the end). Skip if no emoji fits.");
    instructions.push("Preserve the same id for every caption. Keep text concise. Do not invent new captions or merge them.");

    const sys = `You enhance video subtitle captions. ${instructions.join(" ")} Return strictly via the provided tool.`;

    const tool = {
      type: "function",
      function: {
        name: "return_captions",
        description: "Return the updated captions array.",
        parameters: {
          type: "object",
          properties: {
            captions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  text: { type: "string" },
                },
                required: ["id", "text"],
                additionalProperties: false,
              },
            },
          },
          required: ["captions"],
          additionalProperties: false,
        },
      },
    };

    // Chunk to keep prompts small.
    const chunkSize = 60;
    const out: Cap[] = [];
    for (let i = 0; i < captions.length; i += chunkSize) {
      const chunk = captions.slice(i, i + chunkSize);
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: sys },
            { role: "user", content: JSON.stringify({ captions: chunk }) },
          ],
          tools: [tool],
          tool_choice: { type: "function", function: { name: "return_captions" } },
        }),
      });
      if (!res.ok) {
        const errText = await res.text();
        console.error("AI gateway error", res.status, errText);
        return new Response(JSON.stringify({ error: `AI ${res.status}: ${errText}` }), {
          status: res.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const data = await res.json();
      const call = data?.choices?.[0]?.message?.tool_calls?.[0];
      const args = call?.function?.arguments ? JSON.parse(call.function.arguments) : null;
      const updated: Cap[] = args?.captions ?? [];
      // Merge by id, fall back to original text
      const map = new Map(updated.map((u) => [u.id, u.text]));
      for (const c of chunk) out.push({ id: c.id, text: map.get(c.id) ?? c.text });
    }

    return new Response(JSON.stringify({ captions: out }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("enhance-captions error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
