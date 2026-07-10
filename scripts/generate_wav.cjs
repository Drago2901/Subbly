const fs = require('fs');

function writeWavHeader(sampleRate, numChannels, bitsPerSample, numSamples) {
  const blockAlign = numChannels * (bitsPerSample / 8);
  const byteRate = sampleRate * blockAlign;
  const subChunk2Size = numSamples * blockAlign;
  const chunkSize = 36 + subChunk2Size;

  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(chunkSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(subChunk2Size, 40);

  return header;
}

const sampleRate = 16000;
const numChannels = 1;
const bitsPerSample = 16;
const durationSeconds = 2;
const numSamples = sampleRate * durationSeconds;

const header = writeWavHeader(sampleRate, numChannels, bitsPerSample, numSamples);
const data = Buffer.alloc(numSamples * 2); // 16-bit PCM (silence, so all zeros)

const fileBuffer = Buffer.concat([header, data]);
fs.writeFileSync('public/test-audio.wav', fileBuffer);
console.log('Wav file created at public/test-audio.wav');
