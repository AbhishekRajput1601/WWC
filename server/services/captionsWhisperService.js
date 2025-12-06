import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { fileTypeFromBuffer } from 'file-type';
import { Readable } from 'stream';
import stream from 'stream';
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const WHISPER_URL = process.env.WHISPER_URL || 'http://localhost:5001/transcribe';

async function convertToWavFile(fileOrBuffer, inputType = null) {
  const tmpDir = os.tmpdir();
  const id = crypto.randomBytes(8).toString('hex');
  // determine extension from inputType (mime) or detect from buffer
  let ext = '';
  let detected = null;

  // if we have a provided inputType (mime), map common types
  if (inputType) {
    const t = inputType.toLowerCase();
    if (t.includes('webm')) ext = '.webm';
    else if (t.includes('ogg')) ext = '.ogg';
    else if (t.includes('wav')) ext = '.wav';
    else if (t.includes('mp3')) ext = '.mp3';
    else if (t.includes('mp4')) ext = '.mp4';
  }

  const inputPathBase = path.join(tmpDir, `whisper_input_${id}`);
  const outputPath = path.join(tmpDir, `whisper_output_${id}.wav`);

  if (Buffer.isBuffer(fileOrBuffer)) {
    // try to detect file type from buffer if ext not determined
    try {
      const ft = await fileTypeFromBuffer(fileOrBuffer);
      if (ft && ft.ext) {
        detected = ft;
        if (!ext) ext = `.${ft.ext}`;
      }
    } catch (e) {
      // detection failed; continue with provided ext or default
      console.debug('FileType detection failed:', e && e.message ? e.message : e);
    }

    if (!ext) ext = '.webm';
    const inputPath = `${inputPathBase}${ext}`;
    await fs.promises.writeFile(inputPath, fileOrBuffer);
  } else if (typeof fileOrBuffer === 'string') {
    if (await fs.promises.stat(fileOrBuffer).then(() => true).catch(() => false)) {
      // copy to a temp path keeping existing extension if possible
      const srcExt = path.extname(fileOrBuffer) || '.wav';
      const inputPath = `${inputPathBase}${srcExt}`;
      await fs.promises.copyFile(fileOrBuffer, inputPath);
    } else {
      throw new Error('Input file path does not exist: ' + fileOrBuffer);
    }
  } else {
    throw new Error('Invalid input to convertToWavFile, expected Buffer or file path');
  }
  // find the actual inputPath we wrote
  const inputPath = `${inputPathBase}${ext}`;

  return new Promise((resolve, reject) => {
    console.debug('convertToWavFile: running ffmpeg on', inputPath, 'detected=', detected ? detected.mime : null);

    const tryFfmpeg = (fileToConvert) => {
      return new Promise((res, rej) => {
        ffmpeg(fileToConvert)
          .outputOptions(['-ac 1', '-ar 16000', '-acodec pcm_s16le'])
          .on('error', async (err) => {
            rej(err);
          })
          .on('end', async () => {
            res(outputPath);
          })
          .save(outputPath);
      });
    };

    (async () => {
      try {
        // first attempt
        await tryFfmpeg(inputPath);
        try {
          await fs.promises.unlink(inputPath).catch(() => {});
        } catch (e) {}
        resolve(outputPath);
        return;
      } catch (firstErr) {
        console.error('ffmpeg conversion error for', inputPath, firstErr && firstErr.message ? firstErr.message : firstErr);
        // if we have the original buffer, attempt alternative extensions
        if (Buffer.isBuffer(fileOrBuffer)) {
          const altExts = ['.webm', '.ogg', '.mp3', '.wav', '.m4a'];
          // ensure current ext is tried first was already, now try others
          const tried = new Set([ext]);
          for (const alt of altExts) {
            if (tried.has(alt)) continue;
            const altInput = `${inputPathBase}${alt}`;
            try {
              await fs.promises.writeFile(altInput, fileOrBuffer);
              try {
                await tryFfmpeg(altInput);
                // success
                try {
                  await fs.promises.unlink(altInput).catch(() => {});
                } catch (e) {}
                // cleanup original
                try { await fs.promises.unlink(inputPath).catch(() => {}); } catch (e) {}
                resolve(outputPath);
                return;
              } catch (altErr) {
                console.error('ffmpeg conversion error for alt input', altInput, altErr && altErr.message ? altErr.message : altErr);
                try { await fs.promises.unlink(altInput).catch(() => {}); } catch (e) {}
                tried.add(alt);
                continue;
              }
            } catch (writeErr) {
              console.debug('Failed to write alt input file', altInput, writeErr && writeErr.message ? writeErr.message : writeErr);
            }
          }
        }

        // nothing worked
        try {
          await fs.promises.unlink(inputPath).catch(() => {});
          await fs.promises.unlink(outputPath).catch(() => {});
        } catch (e) {}
        reject(firstErr);
      }
    })();
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

export async function transcribeAudio(fileOrBuffer, language = null, translate = false, inputType = null) {
  await acquireSlot();

  try {
    try {
      const mem = process.memoryUsage();

    } catch (e) {
      console.error('Error logging memory usage:', e);
    }

    const outputPath = await convertToWavFile(fileOrBuffer, inputType);
    const wavBuffer = await fs.promises.readFile(outputPath);

    async function sleep(ms) {
      return new Promise((res) => setTimeout(res, ms));
    }

    function parseRetryAfter(header) {
      if (!header) return null;
      const sec = Number(header);
      if (!Number.isNaN(sec)) return sec * 1000;
      const date = Date.parse(header);
      if (!Number.isNaN(date)) {
        return Math.max(0, date - Date.now());
      }
      return null;
    }

    function isHtmlResponse(data) {
      if (!data) return false;
      if (typeof data === 'string') {
        return data.trim().startsWith('<');
      }
      return false;
    }

  const MAX_RETRIES = parseInt(process.env.WHISPER_MAX_RETRIES || '5', 10);
  const TIMEOUT = parseInt(process.env.WHISPER_TIMEOUT_MS || '600000', 10);

    async function sendWithRetries(attempt = 0) {
      try {
        const form = new FormData();
        const wavStream = Readable.from(wavBuffer);
        form.append('audio', wavStream, { filename: 'audio.wav', contentType: 'audio/wav' });
        if (language) form.append('language', language);
        form.append('translate', translate ? 'true' : 'false');

        const headers = Object.assign({}, form.getHeaders());
        headers['User-Agent'] = headers['User-Agent'] || 'wwc-captions-service/1.0';

        const resp = await axios.post(WHISPER_URL, form, {
          headers,
          maxBodyLength: Infinity,
          timeout: TIMEOUT,
        });

        if (isHtmlResponse(resp.data)) {
          const e = new Error('Received HTML response from whisper endpoint (possible Cloudflare or proxy challenge)');
          e.status = resp.status || 502;
          e.responseBody = typeof resp.data === 'string' ? resp.data.slice(0, 1024) : resp.data;
          throw e;
        }

        return resp;
      } catch (err) {
        const status = err && err.response ? err.response.status : null;
        if (status === 429 && attempt < MAX_RETRIES) {
          const header = err.response && err.response.headers ? err.response.headers['retry-after'] || err.response.headers['Retry-After'] : null;
          const retryMs = parseRetryAfter(header) || Math.min(30000, 1000 * Math.pow(2, attempt));
          const jitter = Math.floor(Math.random() * 500);
          const wait = retryMs + jitter;
          console.warn(`transcribeAudio: received 429, retrying in ${wait}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
          await sleep(wait);
          return sendWithRetries(attempt + 1);
        }

        if (status && status >= 500 && attempt < MAX_RETRIES) {
          const wait = Math.min(30000, 1000 * Math.pow(2, attempt)) + Math.floor(Math.random() * 500);
          console.warn(`transcribeAudio: server error ${status}, retrying in ${wait}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
          await sleep(wait);
          return sendWithRetries(attempt + 1);
        }
        throw err;
      }
    }

    let response;
    try {
      response = await sendWithRetries(0);
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
