const fs = require('fs');

async function testCall() {
  const url = "https://syyfclyefqjguhpwtqrq.supabase.co/functions/v1/transcribe-video";
  const token = "mock-token";
  
  // Read the speech WAV file
  const fileData = fs.readFileSync('public/test-speech.wav');
  
  // Construct FormData
  const formData = new FormData();
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
    const text = await res.text();
    console.log('Response body length:', text.length);
    if (text.length < 500) {
      console.log('Response body:', text);
    } else {
      console.log('Response body snippet:', text.substring(0, 500));
    }
  } catch (err) {
    console.error('Error calling edge function:', err);
  }
}

testCall();
