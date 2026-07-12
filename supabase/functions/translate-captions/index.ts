// translate-captions — powered by Google Gemini 2.5 Flash
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English", es: "Spanish", fr: "French", de: "German", it: "Italian",
  pt: "Portuguese", nl: "Dutch", ru: "Russian", hi: "Hindi",
  hinglish: "Hinglish (Hindi written in Roman/Latin script mixed with English — NOT Devanagari)",
  ja: "Japanese", ko: "Korean", zh: "Chinese (Simplified)", ar: "Arabic",
  tr: "Turkish", pl: "Polish", id: "Indonesian", bn: "Bengali",
  mr: "Marathi", ta: "Tamil", te: "Telugu", gu: "Gujarati",
  kn: "Kannada", ml: "Malayalam", pa: "Punjabi", ur: "Urdu",
};

function localAddEmojis(text: string): string {
  const emojiMap: Record<string, string> = {
    love: "❤️", like: "👍", happy: "😊", sad: "😢", angry: "😠", fire: "🔥",
    cool: "😎", work: "💼", money: "💵", time: "⏰", music: "🎵", video: "🎥",
    camera: "📷", phone: "📱", computer: "💻", game: "🎮", food: "🍔", coffee: "☕",
    dog: "🐶", cat: "🐱", car: "🚗", plane: "✈️", travel: "✈️", world: "🌐",
    star: "⭐", idea: "💡", check: "✅", success: "🏆", winner: "🏆", start: "🚀",
    go: "🚀", launch: "🚀", build: "🛠️", code: "💻", design: "🎨", art: "🎨",
    sound: "🔊", audio: "🔊", speak: "🗣️", talk: "🗣️", people: "👥", home: "🏠",
    perfect: "👌", absolute: "💯", hundred: "💯", wow: "😮", omg: "😱",
    magic: "✨", sparkle: "✨", great: "👏", awesome: "🤩", amazing: "🤩",
    fun: "🎉", party: "🎉", celebrate: "🎊", win: "🏆", best: "💪",
    new: "🆕", hot: "🔥", heart: "❤️", smile: "😊", laugh: "😂", think: "🤔",
  };
  return text.split(/\b/).map((word) => {
    const clean = word.toLowerCase().trim();
    return clean && emojiMap[clean] ? `${word} ${emojiMap[clean]}` : word;
  }).join("");
}

async function translateWithGemini(
  texts: string[],
  targetName: string,
  apiKey: string,
): Promise<string[]> {
  const numbered = texts.map((t, i) => `${i}: ${t}`).join("\n");

  const prompt =
    `You are a professional subtitle translator. Translate each numbered caption line into ${targetName}.\n` +
    `Rules:\n` +
    `- Preserve meaning, tone, and any emojis in the original text.\n` +
    `- Keep translations short and natural — they must fit as video subtitles.\n` +
    `- Do NOT add explanations or commentary.\n` +
    `- Return ONLY a JSON object in this exact format:\n` +
    `{"translations":[{"index":0,"text":"..."},{"index":1,"text":"..."}]}\n\n` +
    `Captions to translate:\n${numbered}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      }),
      signal: AbortSignal.timeout(30000),
    },
  );

  if (!res.ok) {
    const errText = await res.text();
    console.error(`Gemini API error ${res.status}:`, errText.substring(0, 300));
    throw new Error(`Gemini API error: ${res.status}`);
  }

  const data = await res.json();
  const rawText: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";

  let parsed: { translations?: { index: number; text: string }[] };
  try {
    // Strip markdown fences if Gemini wraps the JSON
    const clean = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
    parsed = JSON.parse(clean);
  } catch {
    console.error("Failed to parse Gemini response:", rawText.substring(0, 300));
    return texts; // return originals on parse failure
  }

  const out = [...texts];
  for (const item of parsed.translations ?? []) {
    if (
      typeof item.index === "number" &&
      item.index >= 0 &&
      item.index < out.length &&
      typeof item.text === "string"
    ) {
      out[item.index] = item.text;
    }
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
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
    const texts: string[] = body?.texts ?? [];
    const language: string = body?.language ?? "";

    if (!Array.isArray(texts) || texts.length === 0 || texts.length > 2000) {
      return new Response(JSON.stringify({ error: "Invalid 'texts' array (1–2000 items)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!texts.every((t) => typeof t === "string" && t.length <= 5000)) {
      return new Response(JSON.stringify({ error: "Each caption must be a string ≤ 5000 chars" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!language || typeof language !== "string") {
      return new Response(JSON.stringify({ error: "Missing 'language' field" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

    // ── EMOJI MODE (language is a long prompt string, not a short code) ──
    if (language.length > 10) {
      if (geminiApiKey) {
        try {
          console.info("Enhancing captions with emojis via Gemini 2.5 Flash");
          const result = await translateWithGemini(texts, language, geminiApiKey);
          return new Response(JSON.stringify({ translations: result }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } catch (e) {
          console.warn("Gemini emoji enhancement failed, using local fallback:", e);
        }
      }
      // Local emoji fallback
      const translations = texts.map((t) => localAddEmojis(t));
      return new Response(JSON.stringify({ translations }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── TRANSLATION MODE ──
    const targetName = LANGUAGE_NAMES[language];
    if (!targetName) {
      return new Response(
        JSON.stringify({ error: `Unsupported language code: "${language}"` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({
          error: "GEMINI_API_KEY is not configured. Please set it in your Supabase project → Settings → Edge Functions → Secrets.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.info(`Translating ${texts.length} captions → ${language} (${targetName}) via Gemini 2.5 Flash`);
    const translations = await translateWithGemini(texts, targetName, geminiApiKey);

    return new Response(JSON.stringify({ translations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("translate-captions error:", err);
    return new Response(JSON.stringify({ error: "Translation failed. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
