import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const WHISPER_URL = process.env.WHISPER_URL || 'http://localhost:5005/transcribe';

export async function transcribeAudio(filePath, language = null, translate = false) {

  const ext = filePath.split('.').pop().toLowerCase();
  let wavPath;
  if (ext === 'wav') {
    wavPath = filePath.replace(/\.wav$/, '') + '_converted.wav';
  } else {
    wavPath = filePath.replace(/\.[^/.]+$/, '') + '.wav';
  }
  await new Promise((resolve, reject) => {
    ffmpeg(filePath)
      .output(wavPath)
      .audioChannels(1)
      .audioFrequency(16000)
      .audioCodec('pcm_s16le')
      .format('wav')
      .on('start', commandLine => {
        console.log('FFmpeg command:', commandLine);
      })
      .on('end', () => {
        console.log('FFmpeg conversion finished:', wavPath);
        resolve();
      })
      .on('error', err => {
        console.error('FFmpeg error:', err);
        reject(err);
      })
      .run();
  });

  const form = new FormData();
  form.append('audio', fs.createReadStream(wavPath));
  if (language) form.append('language', language);
  form.append('translate', translate ? 'true' : 'false');

  try {
    const response = await axios.post(WHISPER_URL, form, {
      headers: form.getHeaders(),
      maxBodyLength: Infinity,
    });
    fs.unlinkSync(wavPath);
    return response.data;
  } catch (err) {
    fs.unlinkSync(wavPath);
    throw err.response ? err.response.data : err;
  }
}
