import api from '../utils/api.js';

/**
 * Captions Service
 * Handles all caption-related API requests
 */
class CaptionsService {
  /**
   * Get captions for a meeting
   * @param {string} meetingId - Meeting ID
   * @returns {Promise<Object>} Captions response
   */
  async getCaptions(meetingId) {
    try {
      const response = await api.get(`/captions/${meetingId}`);
      
      return {
        success: true,
        data: response.data,
        captions: response.data.captions
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch captions',
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Save caption to database
   * @param {string} meetingId - Meeting ID
   * @param {Object} captionData - Caption data
   * @param {string} captionData.text - Caption text
   * @param {string} captionData.speaker - Speaker name
   * @param {string} captionData.language - Original language
   * @param {number} captionData.timestamp - Timestamp
   * @returns {Promise<Object>} Save caption response
   */
  async saveCaption(meetingId, captionData) {
    try {
      const response = await api.post(`/captions/${meetingId}`, captionData);
      
      return {
        success: true,
        data: response.data,
        caption: response.data.caption
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to save caption',
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Translate caption text
   * @param {Object} translateData - Translation data
   * @param {string} translateData.text - Text to translate
   * @param {string} translateData.fromLang - Source language
   * @param {string} translateData.toLang - Target language
   * @returns {Promise<Object>} Translation response
   */
  async translateCaption(translateData) {
    try {
      const response = await api.post('/captions/translate', translateData);
      
      return {
        success: true,
        data: response.data,
        translatedText: response.data.translatedText
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to translate caption',
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Get supported languages
   * @returns {Promise<Object>} Supported languages response
   */
  async getSupportedLanguages() {
    try {
      const response = await api.get('/captions/languages');
      
      return {
        success: true,
        data: response.data,
        languages: response.data.languages
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch languages',
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Delete captions for a meeting
   * @param {string} meetingId - Meeting ID
   * @returns {Promise<Object>} Delete response
   */
  async deleteCaptions(meetingId) {
    try {
      const response = await api.delete(`/captions/${meetingId}`);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete captions',
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Export captions as file
   * @param {string} meetingId - Meeting ID
   * @param {string} format - Export format (txt, srt, vtt)
   * @returns {Promise<Object>} Export response
   */
  async exportCaptions(meetingId, format = 'txt') {
    try {
      const response = await api.get(`/captions/${meetingId}/export`, {
        params: { format },
        responseType: 'blob'
      });
      
      return {
        success: true,
        data: response.data,
        blob: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to export captions',
        error: error.response?.data || error.message
      };
    }
  }
}

export default new CaptionsService();