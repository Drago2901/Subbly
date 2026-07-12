// Translate an array of caption texts into a target language via Lovable AI Gateway.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  nl: "Dutch",
  ru: "Russian",
  hi: "Hindi",
  hinglish: "Hinglish (Hindi written in Roman/Latin script, mixed casually with English the way young Indians text — NOT Devanagari)",
  ja: "Japanese",
  ko: "Korean",
  zh: "Chinese",
  ar: "Arabic",
  tr: "Turkish",
  pl: "Polish",
  id: "Indonesian",
  bn: "Bengali",
  mr: "Marathi",
  ta: "Tamil",
  te: "Telugu",
  gu: "Gujarati",
  kn: "Kannada",
  ml: "Malayalam",
  pa: "Punjabi",
  ur: "Urdu",
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
  };
  
  return text.split(/\b/).map(word => {
    const cleanWord = word.toLowerCase().trim();
    if (cleanWord && emojiMap[cleanWord]) {
      return `${word} ${emojiMap[cleanWord]}`;
    }
    return word;
  }).join("");
}

async function translateMyMemory(texts: string[], targetLang: string): Promise<string[]> {
  const sourceLang = "en";
  return await Promise.all(
    texts.map(async (txt) => {
      try {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(txt)}&langpair=${sourceLang}|${targetLang}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const trans = data?.responseData?.translatedText || txt;
          return trans
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'")
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">");
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
    // Require an authenticated user — prevents anonymous callers from draining AI credits.
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
    const texts = body?.texts;
    const language = body?.language;

    if (!Array.isArray(texts) || texts.length === 0 || texts.length > 2000) {
      return new Response(JSON.stringify({ error: "Invalid 'texts' array" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!texts.every((t) => typeof t === "string" && t.length <= 5000)) {
      return new Response(JSON.stringify({ error: "Invalid caption text" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const targetName = typeof language === "string" ? (LANGUAGE_NAMES[language] || language) : "";
    if (!targetName) {
      return new Response(JSON.stringify({ error: "Missing 'language'" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sarvamApiKey = Deno.env.get("SARVAM_API_KEY");
    const SARVAM_LANGS: Record<string, string> = {
      hi: "hi-IN",
      hinglish: "hi-IN",
      bn: "bn-IN",
      mr: "mr-IN",
      ta: "ta-IN",
      te: "te-IN",
      gu: "gu-IN",
      kn: "kn-IN",
      ml: "ml-IN",
      pa: "pa-IN",
      ur: "ur-IN",
    };

    if (sarvamApiKey && typeof language === "string" && SARVAM_LANGS[language]) {
      console.info(`Using Sarvam AI for translating to: ${language}`);
      try {
        const targetLangCode = SARVAM_LANGS[language];
        const isHinglish = language === "hinglish";
        const model = isHinglish ? "mayura:v1" : "sarvam-translate:v1";

        const translations = await Promise.all(
          texts.map(async (txt) => {
            try {
              const res = await fetch("https://api.sarvam.ai/translate", {
                method: "POST",
                headers: {
                  "api-subscription-key": sarvamApiKey,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  input: txt,
                  source_language_code: "auto",
                  target_language_code: targetLangCode,
                  model: model,
                }),
              });
              if (res.ok) {
                const data = await res.json();
                return data?.translated_text ?? txt;
              }
              const errText = await res.text();
              console.warn(`Sarvam translation line error: ${res.status} ${errText}`);
              return txt;
            } catch (lineErr) {
              console.warn("Sarvam translation line connection error:", lineErr);
              return txt;
            }
          })
        );

        return new Response(JSON.stringify({ translations }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (err) {
        console.error("Sarvam translation global error:", err);
        // Fall through to other APIs
      }
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
      if (openaiApiKey) {
        console.info("Using configured OPENAI_API_KEY for direct translation/emojis.");
        const numbered = texts.map((t: string, i: number) => `${i}: ${t}`).join("\n");
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openaiApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content:
                  `You are a professional subtitle translator. Translate each numbered caption line into ${targetName}. ` +
                  `Preserve meaning, tone, slang and emojis. Keep each translation concise so it still fits as a subtitle. ` +
                  `Return ONLY a JSON object of the form {"translations":[{"index":0,"text":"..."}, ...]} with one entry per input line, in the same order. Do not add commentary.`,
              },
              { role: "user", content: numbered },
            ],
            response_format: { type: "json_object" },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const content = data?.choices?.[0]?.message?.content ?? "{}";
          let parsed: { translations?: { index: number; text: string }[] };
          try {
            parsed = JSON.parse(content);
          } catch {
            parsed = {};
          }

          const out = [...texts];
          for (const item of parsed.translations ?? []) {
            if (typeof item.index === "number" && item.index >= 0 && item.index < out.length && typeof item.text === "string") {
              out[item.index] = item.text;
            }
          }

          return new Response(JSON.stringify({ translations: out }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } else {
          const errText = await res.text();
          console.error("OpenAI API direct error:", res.status, errText);
        }
      }

      console.warn("LOVABLE_API_KEY and OPENAI_API_KEY not configured, using local emoji processing / keyless translation.");
      const isEmojiRequest = typeof language === "string" && language.includes("emojis");
      if (isEmojiRequest) {
        const translations = texts.map((t) => localAddEmojis(t));
        return new Response(JSON.stringify({ translations }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        const langCode = typeof language === "string" ? language : "en";
        const translations = await translateMyMemory(texts, langCode);
        return new Response(JSON.stringify({ translations }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const numbered = texts.map((t: string, i: number) => `${i}: ${t}`).join("\n");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash",
        messages: [
          {
            role: "system",
            content:
              `You are a professional subtitle translator. Translate each numbered caption line into ${targetName}. ` +
              `Preserve meaning, tone, slang and emojis. Keep each translation concise so it still fits as a subtitle. ` +
              `Return ONLY a JSON object of the form {"translations":[{"index":0,"text":"..."}, ...]} with one entry per input line, in the same order. Do not add commentary.`,
          },
          { role: "user", content: numbered },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (res.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (res.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!res.ok) {
      const errText = await res.text();
      console.error("AI gateway error:", res.status, errText);
      let errMsg = "Translation failed. Please try again.";
      try {
        const parsed = JSON.parse(errText);
        if (parsed?.error?.message) {
          errMsg = parsed.error.message;
        } else if (parsed?.message) {
          errMsg = parsed.message;
        }
      } catch {
        // Not JSON
      }
      return new Response(JSON.stringify({ error: errMsg }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content ?? "{}";
    let parsed: { translations?: { index: number; text: string }[] };
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = {};
    }

    const out = [...texts];
    for (const item of parsed.translations ?? []) {
      if (typeof item.index === "number" && item.index >= 0 && item.index < out.length && typeof item.text === "string") {
        out[item.index] = item.text;
      }
    }

    return new Response(JSON.stringify({ translations: out }), {
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
