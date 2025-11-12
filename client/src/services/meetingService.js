import api from '../utils/api.js';

class MeetingService {
  /**
   * Create a new meeting
   * @param {Object} meetingData - Meeting creation data
   * @param {string} meetingData.title - Meeting title
   * @param {string} meetingData.description - Meeting description
   * @param {Date} meetingData.scheduledTime - Scheduled meeting time
   * @returns {Promise<Object>} Meeting creation response
   */
  async createMeeting(meetingData) {
    try {
      const response = await api.post('/meetings', meetingData);
      
      return {
        success: true,
        data: response.data,
        meeting: response.data.meeting
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create meeting',
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * @returns {Promise<Object>} Meetings list response
   */
  async getMeetings() {
    try {
      const response = await api.get('/meetings');
      
      return {
        success: true,
        data: response.data,
        meetings: response.data.meetings
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch meetings',
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Get meeting by ID
   * @param {string} meetingId - Meeting ID
   * @returns {Promise<Object>} Meeting details response
   */
  async getMeeting(meetingId) {
    try {
      const response = await api.get(`/meetings/${meetingId}`);
      
      return {
        success: true,
        data: response.data,
        meeting: response.data.meeting
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch meeting',
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Join a meeting
   * @param {string} meetingId - Meeting ID to join
   * @returns {Promise<Object>} Join meeting response
   */
  async joinMeeting(meetingId) {
    try {
      const response = await api.post(`/meetings/${meetingId}/join`);
      
      return {
        success: true,
        data: response.data,
        meeting: response.data.meeting
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to join meeting',
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Leave a meeting
   * @param {string} meetingId - Meeting ID to leave
   * @returns {Promise<Object>} Leave meeting response
   */
  async leaveMeeting(meetingId) {
    try {
      const response = await api.post(`/meetings/${meetingId}/leave`);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to leave meeting',
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Update meeting details
   * @param {string} meetingId - Meeting ID
   * @param {Object} updateData - Meeting update data
   * @returns {Promise<Object>} Update response
   */
  async updateMeeting(meetingId, updateData) {
    try {
      const response = await api.put(`/meetings/${meetingId}`, updateData);
      
      return {
        success: true,
        data: response.data,
        meeting: response.data.meeting
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update meeting',
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Delete a meeting
   * @param {string} meetingId - Meeting ID to delete
   * @returns {Promise<Object>} Delete response
   */
  async deleteMeeting(meetingId) {
    try {
      const response = await api.delete(`/meetings/${meetingId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete meeting',
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * End a meeting
   * @param {string} meetingId - Meeting ID to end
   * @returns {Promise<Object>} End meeting response
   */
  async endMeeting(meetingId) {
    try {
      const response = await api.post(`/meetings/${meetingId}/end`);
      return {
        success: true,
        data: response.data,
        meeting: response.data.meeting
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to end meeting',
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Upload a recording blob for a meeting
   * @param {string} meetingId
   * @param {Blob|File} fileBlob
   */
  async uploadRecording(meetingId, fileBlob) {
    try {
      const formData = new FormData();
      formData.append('file', fileBlob, `recording-${meetingId}.webm`);

      const response = await api.post(`/meetings/${meetingId}/recordings`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to upload recording', error: error.response?.data || error.message };
    }
  }
}

export default new MeetingService();