import api from '../utils/api.js';

class AuthService {
  /**
   * Update user details
   * @param {Object} details - User details to update
   * @returns {Promise<Object>} Update response
   */
  async updateUserDetails(details) {
    try {
      const response = await api.post('/auth/update-details', details);
      return response.data;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update user details',
        error: error.response?.data || error.message
      };
    }
  }
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @param {string} userData.name - User's full name
   * @param {string} userData.email - User's email address
   * @param {string} userData.password - User's password
   * @returns {Promise<Object>} Registration response
   */
  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData);
      
      // Store token in localStorage if registration is successful
      if (response.data.success && response.data.token) {
        localStorage.setItem('token', response.data.token);
        api.setAuthToken(response.data.token);
      }
      
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed',
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Login user
   * @param {Object} credentials - Login credentials
   * @param {string} credentials.email - User's email address
   * @param {string} credentials.password - User's password
   * @returns {Promise<Object>} Login response
   */
  async login(credentials) {
    try {
      const response = await api.post('/auth/login', credentials);
      
      // Store token in localStorage if login is successful
      if (response.data.success && response.data.token) {
        localStorage.setItem('token', response.data.token);
        api.setAuthToken(response.data.token);
      }
      
      return {
        success: true,
        data: response.data,
        user: response.data.user,
        token: response.data.token
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Logout user
   * @returns {Promise<Object>} Logout response
   */
  async logout() {
    try {
      // Call logout endpoint if it exists
      await api.post('/auth/logout');
      
      // Clear local storage and auth token
      localStorage.removeItem('token');
      api.setAuthToken(null);
      
      return {
        success: true,
        message: 'Logged out successfully'
      };
    } catch (error) {
      // Even if the API call fails, clear local storage
      localStorage.removeItem('token');
      api.setAuthToken(null);
      
      return {
        success: true,
        message: 'Logged out successfully'
      };
    }
  }

  /**
   * Get current user profile
   * @returns {Promise<Object>} User profile response
   */
  async getProfile() {
    try {
      const response = await api.get('/auth/me');
      
      return {
        success: true,
        data: response.data,
        user: response.data.user
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get user profile',
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Update user preferences
   * @param {Object} preferences - User preferences to update
   * @returns {Promise<Object>} Update response
   */
  async updatePreferences(preferences) {
    try {
      const response = await api.put('/auth/preferences', preferences);
      
      return {
        success: true,
        data: response.data,
        user: response.data.user
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update preferences',
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} Authentication status
   */
  isAuthenticated() {
    const token = localStorage.getItem('token');
    return !!token;
  }

  /**
   * Get stored token
   * @returns {string|null} JWT token
   */
  getToken() {
    return localStorage.getItem('token');
  }
}

export default new AuthService();