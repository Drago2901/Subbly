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
  const numbered = texts.map((t, i) => `${i}. ${t}`).join("\n");

  const systemPrompt =
    `You are a subtitle translator. You MUST respond with ONLY a valid JSON array of strings. ` +
    `No explanation, no markdown fences, no extra text. Just the raw JSON array. ` +
    `Example output for 3 inputs: ["translated 1","translated 2","translated 3"]`;

  const userPrompt =
    `Translate each line below into ${targetName}. ` +
    `Keep each translation short (subtitle length). Return a JSON array with exactly ${texts.length} strings.\n\n` +
    numbered;

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
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.1,
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
  const rawText: string = data?.choices?.[0]?.message?.content ?? "";
  console.info("OpenRouter raw response:", rawText.substring(0, 600));

  // Strip markdown fences and trim
  const clean = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();

  // Try JSON parse first
  try {
    const parsed = JSON.parse(clean);

    if (Array.isArray(parsed)) {
      return texts.map((orig, i) =>
        typeof parsed[i] === "string" && parsed[i].trim() ? parsed[i] : orig
      );
    }
    if (Array.isArray(parsed?.translations)) {
      return texts.map((orig, i) =>
        typeof parsed.translations[i] === "string" && parsed.translations[i].trim()
          ? parsed.translations[i] : orig
      );
    }
    if (typeof parsed === "object" && parsed !== null) {
      return texts.map((orig, i) => {
        const v = parsed[i] ?? parsed[String(i)];
        return typeof v === "string" && v.trim() ? v : orig;
      });
    }
  } catch { /* fall through to regex fallback */ }

  // Regex fallback: extract lines like "0. text", "0: text", or "0) text"
  console.warn("JSON parse failed, trying regex fallback on:", clean.substring(0, 300));
  const lines = clean.split("\n");
  const extracted: Record<number, string> = {};
  for (const line of lines) {
    const match = line.match(/^(\d+)[.:)]\s*(.+)/);
    if (match) {
      const idx = parseInt(match[1], 10);
      if (idx >= 0 && idx < texts.length) extracted[idx] = match[2].trim();
    }
  }
  if (Object.keys(extracted).length > 0) {
    return texts.map((orig, i) => extracted[i] ?? orig);
  }

  console.error("All parsers failed. Raw:", rawText.substring(0, 300));
  return texts;
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
