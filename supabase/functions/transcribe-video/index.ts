// Transcribe an uploaded audio/video file via ElevenLabs Scribe v2
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
    const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "ELEVENLABS_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
      return new Response(JSON.stringify({ error: `ElevenLabs ${res.status}: ${errText}` }), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("transcribe-video error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
