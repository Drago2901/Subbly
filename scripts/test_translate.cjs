const fs = require('fs');

async function testTranslate() {
  const url = "https://syyfclyefqjguhpwtqrq.supabase.co/functions/v1/translate-captions";
  const token = "mock-token";
  
  // Construct body
  const body = {
    texts: ["Hello world", "This is a test of the emergency broadcast system"],
    language: "the exact same language, but enhanced by adding contextually relevant emojis to important words and phrases."
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
