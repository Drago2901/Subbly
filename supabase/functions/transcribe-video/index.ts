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


    const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
    if (!apiKey) {
      console.error("ELEVENLABS_API_KEY not configured");
      return new Response(
        JSON.stringify({
          error: "ELEVENLABS_API_KEY is not configured on the Supabase project. Please set it in your Supabase dashboard or via CLI.",
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
    // Map UI language codes to ElevenLabs ISO 639-3 codes. "hinglish" is not a
    // transcription language, so transcribe it as Hindi (translation happens later).
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
      headers: { "xi-api-key": apiKey },
      body: apiForm,
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
