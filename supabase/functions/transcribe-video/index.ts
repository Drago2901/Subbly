// Transcribe an uploaded audio/video file via Groq Whisper, OpenAI Whisper, or ElevenLabs Scribe v2
import { withSupabase } from "npm:@supabase/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface NormalizedWord {
  text: string;
  start: number;
  end: number;
  type?: string;
}

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, _ctx) => {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const groqKey = Deno.env.get("GROQ_API_KEY");
      const openaiKey = Deno.env.get("OPENAI_API_KEY");
      const elevenKey = Deno.env.get("ELEVENLABS_API_KEY");

      if (!groqKey && !openaiKey && !elevenKey) {
        return new Response(
          JSON.stringify({
            error: "No Speech-to-Text API key configured (ELEVENLABS_API_KEY, GROQ_API_KEY, or OPENAI_API_KEY). Please configure one in Supabase secrets.",
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      const incoming = await req.formData();
      const file = incoming.get("file");
      if (!(file instanceof File)) {
        return new Response(JSON.stringify({ error: "Missing 'file' in form data" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
      if (file.size > MAX_FILE_SIZE) {
        return new Response(
          JSON.stringify({ error: "File exceeds 50MB size limit. Please upload a smaller video or extract audio first." }),
          {
            status: 413,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      const isValidMime =
        file.type.startsWith("audio/") ||
        file.type.startsWith("video/") ||
        /\.(mp4|mov|webm|mkv|wav|mp3|m4a|ogg|aac|flac)$/i.test(file.name);

      if (!isValidMime) {
        return new Response(
          JSON.stringify({ error: "Invalid file type. Please provide an audio or video file." }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      const rawLanguage = (incoming.get("language") as string) || "";

      const startTime = Date.now();

      // 1. If GROQ_API_KEY is available, use Groq Whisper-large-v3-turbo (sub-second ultra-fast transcription)
      if (groqKey) {
        try {
          const groqForm = new FormData();
          groqForm.append("file", file);
          groqForm.append("model", "whisper-large-v3-turbo");
          groqForm.append("response_format", "verbose_json");
          groqForm.append("timestamp_granularities[]", "word");
          if (rawLanguage && rawLanguage !== "auto" && rawLanguage !== "hinglish") {
            groqForm.append("language", rawLanguage);
          }

          const groqRes = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
            method: "POST",
            headers: { Authorization: `Bearer ${groqKey}` },
            body: groqForm,
            signal: AbortSignal.timeout(15000), // 15s timeout
          });

          if (groqRes.ok) {
            const data = await groqRes.json();
            const words: NormalizedWord[] = (data.words || [])
              .map((w: { word?: string; text?: string; start: number; end: number }) => ({
                text: (w.word || w.text || "").trim(),
                start: typeof w.start === "number" ? w.start : 0,
                end: typeof w.end === "number" ? w.end : 0,
                type: "word",
              }))
              .filter((w: NormalizedWord) => w.text.length > 0);

            console.log(`Transcribed via Groq Whisper Turbo in ${Date.now() - startTime}ms (${words.length} words)`);
            return new Response(
              JSON.stringify({
                text: data.text || words.map((w) => w.text).join(" "),
                words,
                provider: "groq-whisper-large-v3-turbo",
                tookMs: Date.now() - startTime,
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          const errText = await groqRes.text().catch(() => "");
          console.warn(`Groq transcription failed (HTTP ${groqRes.status}): ${errText.substring(0, 200)}, falling back to next provider...`);
        } catch (groqErr) {
          console.warn("Groq error, falling back...", groqErr);
        }
      }

      // 2. If OPENAI_API_KEY is available, use OpenAI Whisper-1
      if (openaiKey) {
        try {
          const oaiStartTime = Date.now();
          const oaiForm = new FormData();
          oaiForm.append("file", file);
          oaiForm.append("model", "whisper-1");
          oaiForm.append("response_format", "verbose_json");
          oaiForm.append("timestamp_granularities[]", "word");
          if (rawLanguage && rawLanguage !== "auto" && rawLanguage !== "hinglish") {
            oaiForm.append("language", rawLanguage);
          }

          const oaiRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
            method: "POST",
            headers: { Authorization: `Bearer ${openaiKey}` },
            body: oaiForm,
            signal: AbortSignal.timeout(25000), // 25s timeout
          });

          if (oaiRes.ok) {
            const data = await oaiRes.json();
            const words: NormalizedWord[] = (data.words || [])
              .map((w: { word?: string; text?: string; start: number; end: number }) => ({
                text: (w.word || w.text || "").trim(),
                start: typeof w.start === "number" ? w.start : 0,
                end: typeof w.end === "number" ? w.end : 0,
                type: "word",
              }))
              .filter((w: NormalizedWord) => w.text.length > 0);

            console.log(`Transcribed via OpenAI Whisper in ${Date.now() - oaiStartTime}ms (${words.length} words)`);
            return new Response(
              JSON.stringify({
                text: data.text || words.map((w) => w.text).join(" "),
                words,
                provider: "openai-whisper-1",
                tookMs: Date.now() - startTime,
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          const errText = await oaiRes.text().catch(() => "");
          console.warn(`OpenAI transcription failed (HTTP ${oaiRes.status}): ${errText.substring(0, 200)}, falling back to ElevenLabs...`);
        } catch (oaiErr) {
          console.warn("OpenAI error, falling back...", oaiErr);
        }
      }

      // 3. ElevenLabs Scribe v2
      if (!elevenKey) {
        return new Response(
          JSON.stringify({ error: "Transcription failed: no working speech engine available." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Map UI language codes to ElevenLabs ISO 639-3 codes
      const LANG_MAP: Record<string, string> = {
        en: "eng", es: "spa", fr: "fra", de: "deu", it: "ita", pt: "por",
        nl: "nld", ru: "rus", hi: "hin", hinglish: "hin", ja: "jpn", ko: "kor",
        zh: "zho", ar: "ara", tr: "tur", pl: "pol", id: "ind",
      };
      const language = LANG_MAP[rawLanguage] ?? (rawLanguage === "auto" ? "" : rawLanguage);

      const elevenStartTime = Date.now();
      const apiForm = new FormData();
      apiForm.append("file", file);
      apiForm.append("model_id", "scribe_v2");
      apiForm.append("timestamps_granularity", "word");
      apiForm.append("tag_audio_events", "false");
      apiForm.append("diarize", "false");
      if (language) apiForm.append("language_code", language);

      const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
        method: "POST",
        headers: { "xi-api-key": elevenKey },
        body: apiForm,
        signal: AbortSignal.timeout(60000), // 60s timeout
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("ElevenLabs error:", res.status, errText);
        let errMsg = "Transcription failed. Please try again.";
        try {
          const parsed = JSON.parse(errText);
          if (parsed?.detail?.message) {
            errMsg = parsed.detail.message;
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

      // Normalize words: extract clean spoken words, discarding phantom spacing tokens
      const normalizedWords: NormalizedWord[] = (data.words || [])
        .map((w: { text?: string; word?: string; start: number; end: number; type?: string }) => ({
          text: (w.text || w.word || "").trim(),
          start: typeof w.start === "number" ? w.start : 0,
          end: typeof w.end === "number" ? w.end : 0,
          type: w.type || "word",
        }))
        .filter((w: NormalizedWord) => w.text.length > 0 && w.type !== "spacing" && w.type !== "audio_event");

      console.log(`Transcribed via ElevenLabs Scribe v2 in ${Date.now() - elevenStartTime}ms (${normalizedWords.length} words)`);
      return new Response(
        JSON.stringify({
          text: data.text || normalizedWords.map((w) => w.text).join(" "),
          words: normalizedWords,
          provider: "elevenlabs-scribe-v2",
          tookMs: Date.now() - elevenStartTime,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (err) {
      console.error("transcribe-video error:", err);
      return new Response(JSON.stringify({ error: "Transcription failed. Please try again." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }),
};

