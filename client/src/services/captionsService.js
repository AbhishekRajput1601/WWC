import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const captionsService = {
  // Get captions for a meeting
  async getCaptions(meetingId, language = 'en', limit = 50, page = 1) {
    const token = localStorage.getItem('token');
    const res = await axios.get(`${API_URL}/captions/${meetingId}`, {
      params: { language, limit, page },
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return res.data;
  },

  // Export captions for a meeting
  async exportCaptions(meetingId, language = 'en', format = 'txt') {
    const token = localStorage.getItem('token');
    const res = await axios.get(`${API_URL}/captions/${meetingId}/export`, {
      params: { language, format },
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      responseType: 'blob',
    });
    return res.data;
  },

  // Transcribe audio (for real-time captions)
  async transcribeAudio(audioBlob, language = 'en', translate = false) {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.wav');
    formData.append('language', language);
    formData.append('translate', translate ? 'true' : 'false');
    const res = await axios.post(`${API_URL}/whisper/transcribe`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return res.data;
  },
};

export default captionsService;
