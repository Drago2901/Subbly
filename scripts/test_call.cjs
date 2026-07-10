const fs = require('fs');

async function testCall() {
  const url = "https://polshaqgsqhzcvtipssx.supabase.co/functions/v1/transcribe-video";
  const token = "mock-token";
  
  // Read the WAV file
  const fileData = fs.readFileSync('public/test-audio.wav');
  
  // Construct FormData
  const formData = new FormData();
  // In Node.js, we can append a Blob created from the buffer
  const blob = new Blob([fileData], { type: 'audio/wav' });
  formData.append('file', blob, 'audio.wav');
  formData.append('language', 'en');

  console.log('Sending request to', url);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    console.log('Response status:', res.status);
    console.log('Response headers:', Object.fromEntries(res.headers.entries()));
    const text = await res.text();
    console.log('Response body:', text);
  } catch (err) {
    console.error('Error calling edge function:', err);
  }
}

testCall();
