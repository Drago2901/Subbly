// translate-captions — powered by OpenRouter (multi-model AI translation)
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

async function translateWithOpenRouter(
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
    `- Return ONLY a JSON array of translated strings in the same order, like: ["translation0","translation1",...]\n\n` +
    `Captions to translate:\n${numbered}`;

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://subbly.app",
      "X-Title": "Subbly Caption Translator",
    },
    body: JSON.stringify({
      model: "meta-llama/llama-3.1-8b-instruct",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 4096,
    }),
    signal: AbortSignal.timeout(40000),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`OpenRouter API error ${res.status}:`, errText.substring(0, 500));
    let errMsg = `OpenRouter API error: ${res.status}`;
    try {
      const parsed = JSON.parse(errText);
      if (parsed?.error?.message) errMsg = parsed.error.message;
    } catch { /* not JSON */ }
    throw new Error(errMsg);
  }

  const data = await res.json();
  const rawText: string = data?.choices?.[0]?.message?.content ?? "[]";
  console.info("OpenRouter raw response:", rawText.substring(0, 500));

  try {
    const clean = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
    const parsed = JSON.parse(clean);

    // Format 1: plain array ["t1", "t2", ...]
    if (Array.isArray(parsed)) {
      const out = texts.map((orig, i) =>
        typeof parsed[i] === "string" && parsed[i].trim() ? parsed[i] : orig
      );
      return out;
    }

    // Format 2: { translations: ["t1", "t2", ...] }
    if (Array.isArray(parsed?.translations)) {
      const out = texts.map((orig, i) =>
        typeof parsed.translations[i] === "string" && parsed.translations[i].trim()
          ? parsed.translations[i]
          : orig
      );
      return out;
    }

    // Format 3: { "0": "t1", "1": "t2", ... }
    if (typeof parsed === "object" && parsed !== null) {
      return texts.map((orig, i) => {
        const v = parsed[i] ?? parsed[String(i)];
        return typeof v === "string" && v.trim() ? v : orig;
      });
    }
  } catch {
    console.error("Failed to parse OpenRouter response:", rawText.substring(0, 300));
  }

  return texts; // fallback to originals on parse failure
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
    if (!language || typeof language !== "string") {
      return new Response(JSON.stringify({ error: "Missing 'language' field" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── EMOJI MODE (language is a long prompt string, not a short code) ──
    if (language.length > 10) {
      const translations = texts.map((t) => localAddEmojis(t));
      return new Response(JSON.stringify({ translations }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── TRANSLATION MODE via OpenRouter ──
    const targetName = LANGUAGE_NAMES[language];
    if (!targetName) {
      return new Response(
        JSON.stringify({ error: `Unsupported language code: "${language}"` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const openRouterKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!openRouterKey) {
      return new Response(
        JSON.stringify({ error: "OPENROUTER_API_KEY is not configured in Supabase secrets." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.info(`Translating ${texts.length} captions → ${language} (${targetName}) via OpenRouter`);
    const translations = await translateWithOpenRouter(texts, targetName, openRouterKey);

    return new Response(JSON.stringify({ translations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("translate-captions error:", err);
    const msg = err instanceof Error ? err.message : "Translation failed. Please try again.";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
