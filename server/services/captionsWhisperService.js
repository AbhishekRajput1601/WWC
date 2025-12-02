import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { Readable } from 'stream';
import stream from 'stream';
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const WHISPER_URL = process.env.WHISPER_URL || 'http://localhost:5001/transcribe';

async function convertToWavBufferFromStream(readable) {
  return new Promise((resolve, reject) => {
    const passthrough = new stream.PassThrough();
    const chunks = [];
    passthrough.on('data', (c) => chunks.push(c));
    passthrough.on('end', () => resolve(Buffer.concat(chunks)));
    passthrough.on('error', reject);

    ffmpeg(readable)
      .outputFormat('wav')
      .audioChannels(1)
      .audioFrequency(16000)
      .audioCodec('pcm_s16le')
      .on('error', (err) => reject(err))
      .pipe(passthrough);
  });
}

/**
 * transcribeAudio accepts either a file path (string) or a Buffer.
 * It converts input to a WAV buffer in-memory and sends the buffer
 * directly to the Whisper HTTP service without writing anything to disk.
 */
export async function transcribeAudio(fileOrBuffer, language = null, translate = false) {
  let wavBuffer;

  try {
    if (Buffer.isBuffer(fileOrBuffer)) {
      const readable = new Readable();
      readable._read = () => {};
      readable.push(fileOrBuffer);
      readable.push(null);
      wavBuffer = await convertToWavBufferFromStream(readable);
    } else if (typeof fileOrBuffer === 'string') {
      // file path
      const readable = fs.createReadStream(fileOrBuffer);
      wavBuffer = await convertToWavBufferFromStream(readable);
    } else {
      throw new Error('Invalid input to transcribeAudio, expected Buffer or file path');
    }

    const form = new FormData();
    form.append('audio', wavBuffer, { filename: 'audio.wav' });
    if (language) form.append('language', language);
    form.append('translate', translate ? 'true' : 'false');

    const response = await axios.post(WHISPER_URL, form, {
      headers: form.getHeaders(),
      maxBodyLength: Infinity,
      timeout: 120000,
    });

    return response.data;
  } catch (err) {
    throw err && err.response ? err.response.data || err : err;
  }
}
