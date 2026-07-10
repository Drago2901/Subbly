const fs = require('fs');

async function downloadSample() {
  const url = "http://www.voiptroubleshooter.com/open_speech/american/OSR_us_000_0010_8k.wav";
  console.log('Downloading sample from', url);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const arrayBuffer = await res.arrayBuffer();
    fs.writeFileSync('public/test-speech.wav', Buffer.from(arrayBuffer));
    console.log('Sample saved to public/test-speech.wav');
  } catch (err) {
    console.error('Failed to download sample:', err);
  }
}

downloadSample();
