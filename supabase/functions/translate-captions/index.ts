// translate-captions — powered by MyMemory (free, no API key required)
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// MyMemory language code map (some codes differ from ISO 639-1)
const LANG_MAP: Record<string, string> = {
  en: "en-GB", es: "es-ES", fr: "fr-FR", de: "de-DE", it: "it-IT",
  pt: "pt-PT", nl: "nl-NL", ru: "ru-RU", hi: "hi-IN", hinglish: "hi-IN",
  ja: "ja-JP", ko: "ko-KR", zh: "zh-CN", ar: "ar-SA", tr: "tr-TR",
  pl: "pl-PL", id: "id-ID", bn: "bn-IN", mr: "mr-IN", ta: "ta-IN",
  te: "te-IN", gu: "gu-IN", kn: "kn-IN", ml: "ml-IN", pa: "pa-IN",
  ur: "ur-PK",
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

async function translateOne(text: string, langpair: string): Promise<string> {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langpair}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) return text;
  const data = await res.json();
  const translated: string = data?.responseData?.translatedText ?? text;
  // MyMemory sometimes returns "MYMEMORY WARNING" strings on quota hit
  if (translated.startsWith("MYMEMORY WARNING")) return text;
  return translated;
}

async function translateWithMyMemory(
  texts: string[],
  targetLang: string,
): Promise<string[]> {
  const langpair = `en|${targetLang}`;
  const BATCH = 10; // concurrent requests per batch
  const results: string[] = new Array(texts.length);

  for (let i = 0; i < texts.length; i += BATCH) {
    const batch = texts.slice(i, i + BATCH);
    const batchResults = await Promise.all(
      batch.map((t) => translateOne(t, langpair)),
    );
    batchResults.forEach((r, j) => { results[i + j] = r; });
  }
  return results;
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

    // ── TRANSLATION MODE via MyMemory ──
    const myMemoryLang = LANG_MAP[language] ?? language;
    if (!myMemoryLang) {
      return new Response(
        JSON.stringify({ error: `Unsupported language code: "${language}"` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.info(`Translating ${texts.length} captions → ${language} via MyMemory`);
    const translations = await translateWithMyMemory(texts, myMemoryLang);

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
