const fs = require('fs');
const path = require('path');

async function downloadVideo() {
  const url = "https://www.w3schools.com/html/mov_bbb.mp4";
  console.log('Downloading sample video from', url);
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const arrayBuffer = await res.arrayBuffer();
    const outputPath = path.join(__dirname, '../public/sample.mp4');
    fs.writeFileSync(outputPath, Buffer.from(arrayBuffer));
    console.log('Sample video saved to', outputPath);
  } catch (err) {
    console.error('Failed to download sample video:', err);
  }
}

downloadVideo();
