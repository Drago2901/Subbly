// Translate caption texts using MyMemory (free, no API key needed).
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// MyMemory language code mappings (ISO 639-1)
const MYMEMORY_LANG: Record<string, string> = {
  en: "en", es: "es", fr: "fr", de: "de", it: "it", pt: "pt",
  nl: "nl", ru: "ru", hi: "hi", hinglish: "hi", ja: "ja", ko: "ko",
  zh: "zh", ar: "ar", tr: "tr", pl: "pl", id: "id", bn: "bn",
  ta: "ta", te: "te", gu: "gu", ml: "ml", pa: "pa", ur: "ur",
  mr: "mr", kn: "kn",
};

function localAddEmojis(text: string): string {
  const emojiMap: Record<string, string> = {
    love: "❤️", like: "👍", happy: "😊", sad: "😢", angry: "😠", fire: "🔥",
    cool: "😎", work: "💼", money: "💵", time: "⏰", music: "🎵", video: "🎥",
    camera: "📷", phone: "📱", computer: "💻", game: "🎮", food: "🍔", coffee: "☕",
    dog: "🐶", cat: "🐱", car: "🚗", plane: "✈️", travel: "✈️", world: "🌐",
    star: "⭐", idea: "💡", check: "✅", cross: "❌", warning: "⚠️", info: "ℹ️",
    question: "❓", success: "🏆", winner: "🏆", fail: "👎", start: "🚀", go: "🚀",
    launch: "🚀", build: "🛠️", code: "💻", dev: "💻", design: "🎨", art: "🎨",
    sound: "🔊", audio: "🔊", microphone: "🎤", speak: "🗣️", talk: "🗣️",
    people: "👥", user: "👤", friend: "👥", family: "👨‍👩‍👧‍👦", home: "🏠",
    school: "🏫", office: "🏢", shop: "🛒", buy: "🛒", sell: "📈",
    perfect: "👌", absolute: "💯", hundred: "💯", wow: "😮", omg: "😱",
    magic: "✨", sparkle: "✨", key: "🔑", lock: "🔒", unlock: "🔓",
    great: "👏", awesome: "🤩", amazing: "🤩", beautiful: "😍", fun: "🎉",
    party: "🎉", celebrate: "🎊", win: "🏆", best: "💪", strong: "💪",
    new: "🆕", hot: "🔥", heart: "❤️", smile: "😊", laugh: "😂",
    cry: "😭", think: "🤔", money: "💰", cash: "💸", rich: "💎",
  };
  return text.split(/\b/).map((word) => {
    const clean = word.toLowerCase().trim();
    return clean && emojiMap[clean] ? `${word} ${emojiMap[clean]}` : word;
  }).join("");
}

async function translateWithMyMemory(texts: string[], targetLang: string): Promise<string[]> {
  const langCode = MYMEMORY_LANG[targetLang] || targetLang;
  return await Promise.all(
    texts.map(async (txt) => {
      if (!txt.trim()) return txt;
      try {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(txt)}&langpair=en|${langCode}&de=subbly@app.com`;
        const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (res.ok) {
          const data = await res.json();
          if (data?.responseStatus === 200 && data?.responseData?.translatedText) {
            return data.responseData.translatedText
              .replace(/&quot;/g, '"')
              .replace(/&#039;/g, "'")
              .replace(/&amp;/g, "&")
              .replace(/&lt;/g, "<")
              .replace(/&gt;/g, ">")
              .replace(/&nbsp;/g, " ");
          }
        }
        return txt;
      } catch {
        return txt;
      }
    })
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require authenticated user
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
    const texts: string[] = body?.texts;
    const language: string = body?.language;

    if (!Array.isArray(texts) || texts.length === 0 || texts.length > 2000) {
      return new Response(JSON.stringify({ error: "Invalid 'texts' array (must be 1–2000 items)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!texts.every((t) => typeof t === "string" && t.length <= 5000)) {
      return new Response(JSON.stringify({ error: "Each caption must be a string under 5000 chars" }), {
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

    // Emoji mode — language is a long prompt string, not a short code
    if (language.length > 10) {
      const translations = texts.map((t) => localAddEmojis(t));
      return new Response(JSON.stringify({ translations }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Translation mode via MyMemory
    const langCode = MYMEMORY_LANG[language];
    if (!langCode) {
      return new Response(
        JSON.stringify({ error: `Language code "${language}" is not supported.` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.info(`Translating ${texts.length} captions → ${language} (${langCode})`);
    const translations = await translateWithMyMemory(texts, language);

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
