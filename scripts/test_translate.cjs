const fs = require('fs');

async function testTranslate() {
  const url = "https://polshaqgsqhzcvtipssx.supabase.co/functions/v1/translate-captions";
  const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvbHNoYXFnc3FoemN2dGlwc3N4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2ODI0NjYsImV4cCI6MjA5OTI1ODQ2Nn0.2lqBOkAvcmHRnrt6--CiCNGMMs9zpHzCla6OZnNNo0o";
  
  // Construct body
  const body = {
    texts: ["Hello world, welcome to Subbly", "Create engaging captions in seconds"],
    language: "hinglish"
  };

  console.log('Sending request to', url);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    console.log('Response status:', res.status);
    const text = await res.text();
    console.log('Response body:', text);
  } catch (err) {
    console.error('Error calling translate edge function:', err);
  }
}

testTranslate();
