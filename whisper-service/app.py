from faster_whisper import WhisperModel
from flask import Flask, request, jsonify
import os

app = Flask(__name__)

model_size = os.environ.get('WHISPER_MODEL_SIZE', 'base')
model = WhisperModel(model_size, device="cpu", compute_type="int8")


@app.route("/", methods=["GET"])
def home():
    return jsonify({"status": "Whisper service running"}), 200


@app.route('/transcribe', methods=['POST'])
def transcribe():
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400
        
        audio_file = request.files['audio']
        language = request.form.get('language', None)
        translate = request.form.get('translate', 'false').lower() == 'true'

        temp_path = 'temp_audio.wav'
        audio_file.save(temp_path)

        try:
            segments, info = model.transcribe(
                temp_path,
                language=language,
                task='translate' if translate else 'transcribe'
            )
        except Exception as e:
            import traceback
            print('Whisper error:', e)
            traceback.print_exc()
            os.remove(temp_path)
            return jsonify({'success': False, 'message': 'Transcription failed', 'error': str(e)}), 500

        os.remove(temp_path)

        captions = []
        for segment in segments:
            captions.append({
                'start': segment.start,
                'end': segment.end,
                'text': segment.text
            })

        return jsonify({
            'success': True,
            'language': info.language,
            'captions': captions
        })

    except Exception as e:
        import traceback
        print('Flask error:', e)
        traceback.print_exc()
        return jsonify({'success': False, 'message': 'Transcription failed', 'error': str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
