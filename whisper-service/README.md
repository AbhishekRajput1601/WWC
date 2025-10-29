# Whisper Service (faster-whisper)

This microservice provides speech-to-text transcription and translation using OpenAI Whisper via faster-whisper.

## Setup

1. Install Python 3.8+
2. Install dependencies:
   ```sh
   pip install -r requirements.txt
   ```
3. Run the service:
   ```sh
   python app.py
   ```

## API

### POST /transcribe
- **audio**: audio file (wav, mp3, etc.)
- **language**: (optional) source language code
- **translate**: (optional, 'true'/'false') if true, translates to English

Returns JSON with detected language and captions (start, end, text).
