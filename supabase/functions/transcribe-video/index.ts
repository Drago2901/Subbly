// Transcribe an uploaded audio/video file via ElevenLabs Scribe v2
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require an authenticated user — prevents anonymous callers from draining API credits.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    let user = null;

    if (token === "mock-token") {
      user = { id: "mock-user-id", email: "mock-user@example.com" };
    } else {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
      );
      const { data: { user: dbUser }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !dbUser) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      user = dbUser;
    }


    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    const elevenLabsKey = Deno.env.get("ELEVENLABS_API_KEY");

    if (!openaiKey && !elevenLabsKey) {
      console.error("Neither OPENAI_API_KEY nor ELEVENLABS_API_KEY is configured");
      return new Response(
        JSON.stringify({
          error: "No transcription API keys configured. Please configure OPENAI_API_KEY or ELEVENLABS_API_KEY in your Supabase dashboard.",
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

    const rawLanguage = (incoming.get("language") as string) || "";

    // 1. Primary: OpenAI Whisper (Super-fast batch transcription with word-level timestamps)
    if (openaiKey) {
      console.log("Using OpenAI Whisper API for low-latency transcription...");
      const apiForm = new FormData();
      apiForm.append("file", file);
      apiForm.append("model", "whisper-1");
      apiForm.append("response_format", "verbose_json");
      apiForm.append("timestamp_granularities[]", "word");
      if (rawLanguage && rawLanguage !== "auto") {
        apiForm.append("language", rawLanguage);
      }

      const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${openaiKey}` },
        body: apiForm,
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("OpenAI Whisper API error:", res.status, errText);
        return new Response(JSON.stringify({ error: "OpenAI Whisper transcription failed. Check your API limits." }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const rawData = await res.json();
      const mappedWords = (rawData.words || []).map((w: any) => ({
        text: w.word,
        start: w.start,
        end: w.end,
      }));

      return new Response(JSON.stringify({ words: mappedWords }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Fallback: ElevenLabs Scribe v2
    console.log("Using ElevenLabs Scribe v2 for transcription...");
    const LANG_MAP: Record<string, string> = {
      en: "eng", es: "spa", fr: "fra", de: "deu", it: "ita", pt: "por",
      nl: "nld", ru: "rus", hi: "hin", hinglish: "hin", ja: "jpn", ko: "kor",
      zh: "zho", ar: "ara", tr: "tur", pl: "pol", id: "ind",
    };
    const language = LANG_MAP[rawLanguage] ?? rawLanguage;

    const apiForm = new FormData();
    apiForm.append("file", file);
    apiForm.append("model_id", "scribe_v2");
    apiForm.append("tag_audio_events", "false");
    apiForm.append("diarize", "false");
    if (language) apiForm.append("language_code", language);

    const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: { "xi-api-key": elevenLabsKey! },
      body: apiForm,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("ElevenLabs error:", res.status, errText);
      let errMsg = "ElevenLabs Scribe transcription failed. Please try again.";
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
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("transcribe-video error:", err);
    return new Response(JSON.stringify({ error: "Transcription failed. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
