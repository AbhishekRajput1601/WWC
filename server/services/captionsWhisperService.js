import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { Readable } from 'stream';
import stream from 'stream';
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const WHISPER_URL = process.env.WHISPER_URL || 'http://localhost:5001/transcribe';


async function convertToWavFile(fileOrBuffer) {
  const tmpDir = os.tmpdir();
  const id = crypto.randomBytes(8).toString('hex');
  const inputPath = path.join(tmpDir, `whisper_input_${id}`);
  const outputPath = path.join(tmpDir, `whisper_output_${id}.wav`);

  if (Buffer.isBuffer(fileOrBuffer)) {
    await fs.promises.writeFile(inputPath, fileOrBuffer);
  } else if (typeof fileOrBuffer === 'string') {
    if (await fs.promises.stat(fileOrBuffer).then(() => true).catch(() => false)) {
      await fs.promises.copyFile(fileOrBuffer, inputPath);
    } else {
      throw new Error('Input file path does not exist: ' + fileOrBuffer);
    }
  } else {
    throw new Error('Invalid input to convertToWavFile, expected Buffer or file path');
  }

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions(['-ac 1', '-ar 16000', '-acodec pcm_s16le'])
      .on('error', async (err) => {
        // cleanup
        try {
          await fs.promises.unlink(inputPath).catch(() => {});
          await fs.promises.unlink(outputPath).catch(() => {});
        } catch (e) {}
        reject(err);
      })
      .on('end', async () => {
        try {
          await fs.promises.unlink(inputPath).catch(() => {});
        } catch (e) {}
        resolve(outputPath);
      })
      .save(outputPath);
  });
}


let activeTranscriptions = 0;
const MAX_CONCURRENT = parseInt(process.env.TRANSCRIBE_CONCURRENCY || '2', 10);
const waitingQueue = [];

function acquireSlot() {
  if (activeTranscriptions < MAX_CONCURRENT) {
    activeTranscriptions += 1;
    return Promise.resolve();
  }
  return new Promise((resolve) => waitingQueue.push(resolve));
}

function releaseSlot() {
  activeTranscriptions = Math.max(0, activeTranscriptions - 1);
  const next = waitingQueue.shift();
  if (next) {
    activeTranscriptions += 1;
    next();
  }
}

export async function transcribeAudio(fileOrBuffer, language = null, translate = false) {
  await acquireSlot();

  try {
    try {
      const mem = process.memoryUsage();

    } catch (e) {
      console.error('Error logging memory usage:', e);
    }

    const outputPath = await convertToWavFile(fileOrBuffer);
    const wavStream = fs.createReadStream(outputPath);

    const form = new FormData();
    form.append('audio', wavStream, { filename: 'audio.wav', contentType: 'audio/wav' });
    if (language) form.append('language', language);
    form.append('translate', translate ? 'true' : 'false');

    let response;
    try {
      response = await axios.post(WHISPER_URL, form, {
        headers: form.getHeaders(),
        maxBodyLength: Infinity,
        timeout: parseInt(process.env.WHISPER_TIMEOUT_MS || '600000', 10),
      });
    } finally {
      try {
        wavStream.close && wavStream.close();
      } catch (e) {}
      try {
        await fs.promises.unlink(outputPath).catch(() => {});
      } catch (e) {}
    }

    return response.data;
  } catch (err) {
    if (err && err.response) {
      const status = err.response.status;
      const body = err.response.data || err.response.statusText;
      const e = new Error(`Whisper transcription failed with status ${status}: ${JSON.stringify(body)}`);
      e.code = err.code || 'WHISPER_ERROR';
      e.status = status;
      e.cause = err;
      throw e;
    }
    const e = new Error(`Whisper transcription request error: ${err && err.message ? err.message : err}`);
    e.code = err && err.code ? err.code : 'WHISPER_NETWORK_ERROR';
    e.cause = err;
    throw e;
  } finally {
    releaseSlot();
  }
}
