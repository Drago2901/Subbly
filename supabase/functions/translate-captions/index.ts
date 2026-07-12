// Translate an array of caption texts into a target language.
// Priority: 1) Sarvam AI (Indian langs), 2) OpenAI direct, 3) Lovable AI gateway, 4) MyMemory (free)
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English", es: "Spanish", fr: "French", de: "German", it: "Italian",
  pt: "Portuguese", nl: "Dutch", ru: "Russian", hi: "Hindi",
  hinglish: "Hinglish (Hindi written in Roman/Latin script, mixed casually with English — NOT Devanagari)",
  ja: "Japanese", ko: "Korean", zh: "Chinese (Simplified)", ar: "Arabic",
  tr: "Turkish", pl: "Polish", id: "Indonesian", bn: "Bengali",
  mr: "Marathi", ta: "Tamil", te: "Telugu", gu: "Gujarati",
  kn: "Kannada", ml: "Malayalam", pa: "Punjabi", ur: "Urdu",
};

// MyMemory language code mappings (ISO 639-1)
const MYMEMORY_LANG: Record<string, string> = {
  en: "en", es: "es", fr: "fr", de: "de", it: "it", pt: "pt",
  nl: "nl", ru: "ru", hi: "hi", ja: "ja", ko: "ko", zh: "zh",
  ar: "ar", tr: "tr", pl: "pl", id: "id", bn: "bn",
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
    new: "🆕", hot: "🔥", trending: "📈", viral: "🔥", share: "🔗",
    heart: "❤️", smile: "😊", laugh: "😂", cry: "😭", think: "🤔",
    money: "💰", cash: "💸", rich: "💎", diamond: "💎", gem: "💎",
  };
  
  return text.split(/\b/).map(word => {
    const cleanWord = word.toLowerCase().trim();
    if (cleanWord && emojiMap[cleanWord]) {
      return `${word} ${emojiMap[cleanWord]}`;
    }
    return word;
  }).join("");
}

async function translateWithMyMemory(texts: string[], targetLang: string): Promise<string[]> {
  const langCode = MYMEMORY_LANG[targetLang] || targetLang;
  const sourceLang = "en";
  
  return await Promise.all(
    texts.map(async (txt) => {
      if (!txt.trim()) return txt;
      try {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(txt)}&langpair=${sourceLang}|${langCode}&de=subbly@app.com`;
        const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (res.ok) {
          const data = await res.json();
          if (data?.responseStatus === 200 && data?.responseData?.translatedText) {
            const trans = data.responseData.translatedText;
            // MyMemory returns HTML entities, decode them
            return trans
              .replace(/&quot;/g, '"')
              .replace(/&#039;/g, "'")
              .replace(/&amp;/g, "&")
              .replace(/&lt;/g, "<")
              .replace(/&gt;/g, ">")
              .replace(/&nbsp;/g, " ");
          }
        }
        return txt;
      } catch (e) {
        console.warn("MyMemory translation error for text:", txt.substring(0, 30), e);
        return txt;
      }
    })
  );
}

async function translateWithLLM(texts: string[], targetName: string, apiUrl: string, apiKey: string, model: string): Promise<string[] | null> {
  try {
    const numbered = texts.map((t: string, i: number) => `${i}: ${t}`).join("\n");
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              `You are a professional subtitle translator. Translate each numbered caption line into ${targetName}. ` +
              `Preserve meaning, tone, slang and emojis. Keep each translation concise. ` +
              `Return ONLY a JSON object: {"translations":[{"index":0,"text":"..."}, ...]} with one entry per line.`,
          },
          { role: "user", content: numbered },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`LLM API error (${apiUrl}): ${res.status} ${errText.substring(0, 200)}`);
      return null;
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
    return out;
  } catch (e) {
    console.warn(`LLM translation error (${apiUrl}):`, e);
    return null;
  }
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
      return new Response(JSON.stringify({ error: "Invalid 'texts' array (must be 1-2000 items)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!texts.every((t) => typeof t === "string" && t.length <= 5000)) {
      return new Response(JSON.stringify({ error: "Each caption text must be a string under 5000 chars" }), {
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

    // --- EMOJI MODE (special pseudo-language used internally) ---
    const isEmojiRequest = language.length > 10; // emoji prompt is a long string, not a code
    if (isEmojiRequest) {
      const sarvamApiKey = Deno.env.get("SARVAM_API_KEY");
      const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
      const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

      if (openaiApiKey) {
        const result = await translateWithLLM(texts, language, "https://api.openai.com/v1/chat/completions", openaiApiKey, "gpt-4o-mini");
        if (result) {
          return new Response(JSON.stringify({ translations: result }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      if (lovableApiKey) {
        const result = await translateWithLLM(texts, language, "https://ai.gateway.lovable.dev/v1/chat/completions", lovableApiKey, "google/gemini-2.0-flash");
        if (result) {
          return new Response(JSON.stringify({ translations: result }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // Local emoji fallback
      console.info("Using local emoji processing (no LLM API key configured)");
      const translations = texts.map((t) => localAddEmojis(t));
      return new Response(JSON.stringify({ translations }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- TRANSLATION MODE ---
    const targetName = LANGUAGE_NAMES[language] || language;
    console.info(`Translating ${texts.length} captions to: ${language} (${targetName})`);

    // 1. Sarvam AI — best for Indian languages
    const sarvamApiKey = Deno.env.get("SARVAM_API_KEY");
    const SARVAM_LANGS: Record<string, string> = {
      hi: "hi-IN", hinglish: "hi-IN", bn: "bn-IN", mr: "mr-IN", ta: "ta-IN",
      te: "te-IN", gu: "gu-IN", kn: "kn-IN", ml: "ml-IN", pa: "pa-IN", ur: "ur-IN",
    };

    if (sarvamApiKey && SARVAM_LANGS[language]) {
      console.info(`Attempting Sarvam AI for: ${language}`);
      try {
        const targetLangCode = SARVAM_LANGS[language];
        const isHinglish = language === "hinglish";
        const model = isHinglish ? "mayura:v1" : "sarvam-translate:v1";

        const translations = await Promise.all(
          texts.map(async (txt) => {
            if (!txt.trim()) return txt;
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
                  model,
                }),
                signal: AbortSignal.timeout(10000),
              });
              if (res.ok) {
                const data = await res.json();
                return data?.translated_text ?? txt;
              }
              const errText = await res.text();
              console.warn(`Sarvam error ${res.status}: ${errText.substring(0, 100)}`);
              return txt;
            } catch (lineErr) {
              console.warn("Sarvam line error:", lineErr);
              return txt;
            }
          })
        );

        return new Response(JSON.stringify({ translations }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (err) {
        console.error("Sarvam global error:", err);
        // Fall through to next provider
      }
    }

    // 2. OpenAI direct
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (openaiApiKey) {
      console.info("Attempting OpenAI for translation");
      const result = await translateWithLLM(texts, targetName, "https://api.openai.com/v1/chat/completions", openaiApiKey, "gpt-4o-mini");
      if (result) {
        return new Response(JSON.stringify({ translations: result }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // 3. Lovable AI Gateway
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (lovableApiKey) {
      console.info("Attempting Lovable AI Gateway for translation");
      const result = await translateWithLLM(texts, targetName, "https://ai.gateway.lovable.dev/v1/chat/completions", lovableApiKey, "google/gemini-2.0-flash");
      if (result) {
        return new Response(JSON.stringify({ translations: result }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // 4. MyMemory free API — always works for standard languages, no key needed
    console.info(`Using MyMemory free API for: ${language}`);
    const mymemoryCode = MYMEMORY_LANG[language];
    if (!mymemoryCode) {
      // Language not supported by MyMemory — return originals
      console.warn(`Language ${language} not supported by MyMemory, returning originals`);
      return new Response(JSON.stringify({ translations: texts, warning: `Translation to ${targetName} is not available without an API key. Configure OPENAI_API_KEY or SARVAM_API_KEY in your Supabase project settings.` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const translations = await translateWithMyMemory(texts, language);
    return new Response(JSON.stringify({ translations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("translate-captions unhandled error:", err);
    return new Response(JSON.stringify({ error: "Translation failed. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
