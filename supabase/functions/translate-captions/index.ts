// translate-captions — ultra-fast AI translation powered by Groq LPU, Google Gemini, and OpenRouter

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English", es: "Spanish", fr: "French", de: "German", it: "Italian",
  pt: "Portuguese", nl: "Dutch", ru: "Russian", hi: "Hindi (Devanagari script)",
  hinglish: "Hinglish (conversational spoken Hindi written strictly in Roman/Latin script, e.g., 'Aap kaise ho', 'Yeh video bohot awesome hai')",
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

function buildPrompts(texts: string[], targetName: string) {
  const isHinglish = targetName.toLowerCase().includes("hinglish");
  const numbered = texts.map((t, i) => `${i + 1}. ${t}`).join("\n");

  const systemPrompt =
    `You are an expert subtitle translation engine. ` +
    `Translate each of the numbered subtitle lines into ${targetName}. ` +
    (isHinglish
      ? `\nCRITICAL HINGLISH MANDATE: Translate into natural conversational Hinglish (spoken Hindi mixed with common English words, written STRICTLY in the English/Latin alphabet, e.g. "Aap kaise ho", "Yeh video bohot awesome hai"). ABSOLUTELY NO Devanagari script or Hindi characters (like आप, हैं, क्या). Use ONLY Latin letters (a-z, A-Z).\n`
      : "") +
    `Keep translations concise, natural, and matching the rhythm of video subtitles. ` +
    `Preserve punctuation and capitalization. ` +
    `You MUST respond with a valid JSON object in this exact schema:\n` +
    `{"translations": ["translated line 1", "translated line 2", ...]}\n` +
    `The "translations" array MUST contain exactly ${texts.length} strings in the exact same sequence as the inputs. ` +
    `Do not include line numbers in the strings. Output ONLY the JSON object with no markdown fences or extra text.`;

  const userPrompt = `Translate these ${texts.length} subtitle lines into ${targetName}:\n\n${numbered}`;

  return { systemPrompt, userPrompt };
}

function extractTranslations(raw: string, expectedCount: number, originalTexts: string[]): string[] {
  let clean = raw.trim();
  // Strip markdown code fences if present anywhere
  const fenceMatch = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenceMatch) {
    clean = fenceMatch[1].trim();
  } else {
    // If model included introductory text before JSON, isolate first { or [ to matching end
    const firstBrace = clean.indexOf("{");
    const firstBracket = clean.indexOf("[");
    const startIdx = firstBrace !== -1 && firstBracket !== -1
      ? Math.min(firstBrace, firstBracket)
      : firstBrace !== -1
      ? firstBrace
      : firstBracket;
    if (startIdx !== -1) {
      const lastBrace = clean.lastIndexOf("}");
      const lastBracket = clean.lastIndexOf("]");
      const endIdx = Math.max(lastBrace, lastBracket);
      if (endIdx > startIdx) {
        clean = clean.substring(startIdx, endIdx + 1).trim();
      }
    }
  }

  try {
    const parsed = JSON.parse(clean);
    let list: unknown[] | null = null;
    if (Array.isArray(parsed)) {
      list = parsed;
    } else if (Array.isArray(parsed?.translations)) {
      list = parsed.translations;
    } else if (Array.isArray(parsed?.lines)) {
      list = parsed.lines;
    } else if (Array.isArray(parsed?.subtitles)) {
      list = parsed.subtitles;
    } else if (Array.isArray(parsed?.data)) {
      list = parsed.data;
    } else if (Array.isArray(parsed?.results)) {
      list = parsed.results;
    } else if (Array.isArray(parsed?.captions)) {
      list = parsed.captions;
    } else if (typeof parsed === "object" && parsed !== null) {
      list = [];
      for (let i = 0; i < expectedCount; i++) {
        list.push(parsed[i] ?? parsed[String(i)] ?? parsed[String(i + 1)]);
      }
    }

    if (list && list.length > 0) {
      const results: string[] = [];
      for (let i = 0; i < expectedCount; i++) {
        const item = list[i];
        if (typeof item === "string" && item.trim()) {
          results.push(item.replace(/^\d+[.:)]\s*/, "").trim());
        } else if (typeof item === "object" && item !== null && "text" in item && typeof (item as { text: unknown }).text === "string") {
          results.push(((item as { text: string }).text || "").replace(/^\d+[.:)]\s*/, "").trim());
        } else {
          results.push(originalTexts[i] ?? "");
        }
      }
      return results;
    }
  } catch {
    // fall through to regex extraction
  }

  // Regex fallback: extract lines matching "1. text" or "1: text" or quotes
  const lines = raw.split("\n");
  const extracted: Record<number, string> = {};
  for (const line of lines) {
    const match = line.match(/^(\d+)[.:)]\s*(.+)/);
    if (match) {
      const idx = parseInt(match[1], 10);
      const zeroIdx = idx > 0 && idx <= expectedCount ? idx - 1 : idx;
      if (zeroIdx >= 0 && zeroIdx < expectedCount) {
        extracted[zeroIdx] = match[2].replace(/^["']|["']$/g, "").trim();
      }
    }
  }

  if (Object.keys(extracted).length > 0) {
    return originalTexts.map((orig, i) => extracted[i] ?? orig);
  }

  throw new Error("Failed to parse translations from model output");
}

function isHinglishValid(results: string[]): boolean {
  return !results.some((r) => /[\u0900-\u097F]/.test(r));
}

function hasMeaningfulTranslation(results: string[], original: string[], targetName: string): boolean {
  if (!results || results.length !== original.length) return false;
  const isHinglish = targetName.toLowerCase().includes("hinglish");
  if (isHinglish && !isHinglishValid(results)) {
    return false; // Devanagari script is strictly invalid for Hinglish; trigger failover
  }
  if (targetName.toLowerCase().startsWith("english")) return true;
  return results.some((r, i) => r.trim().toLowerCase() !== (original[i] ?? "").trim().toLowerCase());
}

// ── 1. GROQ LPU INFERENCE (Sub-second speed: ~200–500ms) ───────────
async function translateWithGroq(
  texts: string[],
  targetName: string,
  apiKey: string,
  model = "llama-3.3-70b-versatile",
): Promise<string[]> {
  const { systemPrompt, userPrompt } = buildPrompts(texts, targetName);

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.1,
      response_format: { type: "json_object" },
      max_completion_tokens: 4096,
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq API error ${res.status}: ${errText.substring(0, 200)}`);
  }

  const data = await res.json();
  const rawText: string = data?.choices?.[0]?.message?.content ?? "";
  return extractTranslations(rawText, texts.length, texts);
}

// ── 2. GOOGLE GEMINI DIRECT API (~600–900ms) ────────────────────────
async function translateWithGemini(
  texts: string[],
  targetName: string,
  apiKey: string,
  model = "gemini-2.0-flash",
): Promise<string[]> {
  const { systemPrompt, userPrompt } = buildPrompts(texts, targetName);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
        maxOutputTokens: 4096,
      },
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errText.substring(0, 200)}`);
  }

  const data = await res.json();
  const rawText: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return extractTranslations(rawText, texts.length, texts);
}

// ── 3. OPENROUTER MULTI-MODEL FALLBACK ──────────────────────────────
async function translateWithOpenRouter(
  texts: string[],
  targetName: string,
  apiKey: string,
  model = "google/gemini-2.0-flash-001",
): Promise<string[]> {
  const { systemPrompt, userPrompt } = buildPrompts(texts, targetName);

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://subbly.app",
      "X-Title": "Subbly Caption Translator",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.1,
      response_format: { type: "json_object" },
      max_tokens: 4096,
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenRouter API error ${res.status}: ${errText.substring(0, 200)}`);
  }

  const data = await res.json();
  const rawText: string = data?.choices?.[0]?.message?.content ?? "";
  return extractTranslations(rawText, texts.length, texts);
}

// ── MULTI-TIER BATCH TRANSLATION ────────────────────────────────────
async function translateBatchWithProviders(
  texts: string[],
  targetName: string,
  keys: { groqKey?: string; geminiKey?: string; openRouterKey?: string },
): Promise<string[]> {
  let fallbackCandidate: string[] | null = null;

  // Tier 1: Groq (Primary ultra-fast LPU inference)
  if (keys.groqKey) {
    const groqModels = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
    for (const model of groqModels) {
      try {
        const result = await translateWithGroq(texts, targetName, keys.groqKey, model);
        const isHinglish = targetName.toLowerCase().includes("hinglish");
        if (isHinglish && !isHinglishValid(result)) {
          console.warn(`Groq (${model}) returned Devanagari script for Hinglish, failing over.`);
          continue;
        }
        if (hasMeaningfulTranslation(result, texts, targetName)) {
          return result;
        }
        if (!fallbackCandidate && result && result.length === texts.length) {
          fallbackCandidate = result;
        }
      } catch (err) {
        console.warn(`Groq (${model}) translation failed:`, err instanceof Error ? err.message : err);
      }
    }
  }

  // Tier 2: Gemini Direct API (Fast native Google AI endpoint)
  if (keys.geminiKey) {
    const geminiModels = ["gemini-2.0-flash", "gemini-1.5-flash"];
    for (const model of geminiModels) {
      try {
        const result = await translateWithGemini(texts, targetName, keys.geminiKey, model);
        const isHinglish = targetName.toLowerCase().includes("hinglish");
        if (isHinglish && !isHinglishValid(result)) {
          console.warn(`Gemini (${model}) returned Devanagari script for Hinglish, failing over.`);
          continue;
        }
        if (hasMeaningfulTranslation(result, texts, targetName)) {
          return result;
        }
        if (!fallbackCandidate && result && result.length === texts.length) {
          fallbackCandidate = result;
        }
      } catch (err) {
        console.warn(`Gemini (${model}) translation failed:`, err instanceof Error ? err.message : err);
      }
    }
  }

  // Tier 3: OpenRouter Fallback
  if (keys.openRouterKey) {
    const openRouterModels = [
      "google/gemini-2.0-flash-001",
      "openai/gpt-4o-mini",
      "meta-llama/llama-3.3-70b-instruct",
    ];
    for (const model of openRouterModels) {
      try {
        const result = await translateWithOpenRouter(texts, targetName, keys.openRouterKey, model);
        const isHinglish = targetName.toLowerCase().includes("hinglish");
        if (isHinglish && !isHinglishValid(result)) {
          console.warn(`OpenRouter (${model}) returned Devanagari script for Hinglish, failing over.`);
          continue;
        }
        if (hasMeaningfulTranslation(result, texts, targetName)) {
          return result;
        }
        if (!fallbackCandidate && result && result.length === texts.length) {
          fallbackCandidate = result;
        }
      } catch (err) {
        console.warn(`OpenRouter (${model}) translation failed:`, err instanceof Error ? err.message : err);
      }
    }
  }

  // If models returned valid candidate (e.g. brand names / proper nouns that don't change), use it!
  if (fallbackCandidate && fallbackCandidate.length === texts.length) {
    return fallbackCandidate;
  }

  console.warn(`All translation providers failed to alter text for ${texts.length} captions to ${targetName}. Preserving source texts.`);
  return texts;
}

async function translateAllCaptions(
  texts: string[],
  targetName: string,
  keys: { groqKey?: string; geminiKey?: string; openRouterKey?: string },
): Promise<string[]> {
  // Use BATCH_SIZE = 14 so that short-form videos complete in parallel sub-second calls without timeouts
  const BATCH_SIZE = 14;
  const chunks: string[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    chunks.push(texts.slice(i, i + BATCH_SIZE));
  }

  // Execute up to 4 batches concurrently to balance speed with provider rate limits
  const results: string[][] = new Array(chunks.length);
  const CONCURRENCY = 4;
  for (let i = 0; i < chunks.length; i += CONCURRENCY) {
    const slice = chunks.slice(i, i + CONCURRENCY);
    const sliceIndices = slice.map((_, idx) => i + idx);
    const sliceResults = await Promise.all(
      slice.map((chunk) => translateBatchWithProviders(chunk, targetName, keys)),
    );
    for (let j = 0; j < sliceResults.length; j++) {
      results[sliceIndices[j]] = sliceResults[j];
    }
  }

  return results.flat();
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawApiKey = req.headers.get("apikey") || "";
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim() || rawApiKey;

    // Validate authorization: accept valid project anon/publishable key, mock-token, or active user JWT
    let isAuthorized = false;
    if (token === "mock-token") {
      isAuthorized = true;
    } else if (token) {
      try {
        const parts = token.split(".");
        if (parts.length >= 2) {
          const payloadJson = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
          const payload = JSON.parse(payloadJson);
          if (
            payload.role === "anon" ||
            payload.role === "authenticated" ||
            payload.role === "service_role" ||
            payload.sub
          ) {
            isAuthorized = true;
          }
        }
      } catch (e) {
        console.warn("Error checking token role:", e);
      }
    }

    if (!isAuthorized) {
      return new Response(
        JSON.stringify({ error: "Please log in to your account or provide a valid key to translate captions." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
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

    // ── TRANSLATION MODE ──
    const targetName = LANGUAGE_NAMES[language];
    if (!targetName) {
      return new Response(
        JSON.stringify({ error: `Unsupported language code: "${language}"` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const groqKey = Deno.env.get("GROQ_API_KEY");
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    const openRouterKey = Deno.env.get("OPENROUTER_API_KEY");

    if (!groqKey && !geminiKey && !openRouterKey) {
      return new Response(
        JSON.stringify({ error: "No AI translation API key configured (GROQ_API_KEY, GEMINI_API_KEY, or OPENROUTER_API_KEY)." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.info(`Translating ${texts.length} captions → ${language} (${targetName}) [Groq: ${!!groqKey}, Gemini: ${!!geminiKey}, OpenRouter: ${!!openRouterKey}]`);
    const translations = await translateAllCaptions(texts, targetName, {
      groqKey,
      geminiKey,
      openRouterKey,
    });

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
};

export default { fetch: handler };
