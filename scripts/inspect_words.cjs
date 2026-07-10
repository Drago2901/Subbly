const fs = require('fs');

async function inspectWords() {
  const url = "https://syyfclyefqjguhpwtqrq.supabase.co/functions/v1/transcribe-video";
  const token = "mock-token";
  
  const fileData = fs.readFileSync('public/test-speech.wav');
  
  const formData = new FormData();
  const blob = new Blob([fileData], { type: 'audio/wav' });
  formData.append('file', blob, 'audio.wav');
  formData.append('language', 'en');

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await res.json();
    console.log("Transcription properties:", Object.keys(data));
    console.log("First 5 words:", JSON.stringify(data.words?.slice(0, 5), null, 2));
  } catch (err) {
    console.error('Error during word inspection:', err);
  }
}

inspectWords();
