import React, { useState } from 'react';
import { authService, meetingService, captionsService } from '../services';

/**
 * Test Component for API Services
 * This component helps test all the API endpoints independently
 */
const APITestComponent = () => {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});

  const updateResult = (key, result) => {
    setResults(prev => ({ ...prev, [key]: result }));
  };

  const setLoadingState = (key, state) => {
    setLoading(prev => ({ ...prev, [key]: state }));
  };

  // Test Authentication Endpoints
  const testRegister = async () => {
    setLoadingState('register', true);
    const result = await authService.register({
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      password: 'password123'
    });
    updateResult('register', result);
    setLoadingState('register', false);
  };

  const testLogin = async () => {
    setLoadingState('login', true);
    const result = await authService.login({
      email: 'test@example.com',
      password: 'password123'
    });
    updateResult('login', result);
    setLoadingState('login', false);
  };

  const testGetProfile = async () => {
    setLoadingState('profile', true);
    const result = await authService.getProfile();
    updateResult('profile', result);
    setLoadingState('profile', false);
  };

  const testUpdatePreferences = async () => {
    setLoadingState('preferences', true);
    const result = await authService.updatePreferences({
      defaultLanguage: 'es',
      captionsEnabled: true
    });
    updateResult('preferences', result);
    setLoadingState('preferences', false);
  };

  // Test Meeting Endpoints
  const testCreateMeeting = async () => {
    setLoadingState('createMeeting', true);
    const result = await meetingService.createMeeting({
      title: 'Test Meeting',
      description: 'This is a test meeting',
      scheduledTime: new Date()
    });
    updateResult('createMeeting', result);
    setLoadingState('createMeeting', false);
  };

  const testGetMeetings = async () => {
    setLoadingState('getMeetings', true);
    const result = await meetingService.getMeetings();
    updateResult('getMeetings', result);
    setLoadingState('getMeetings', false);
  };

  // Test Captions Endpoints
  const testGetLanguages = async () => {
    setLoadingState('languages', true);
    const result = await captionsService.getSupportedLanguages();
    updateResult('languages', result);
    setLoadingState('languages', false);
  };

  const testTranslateCaption = async () => {
    setLoadingState('translate', true);
    const result = await captionsService.translateCaption({
      text: 'Hello, how are you?',
      fromLang: 'en',
      toLang: 'es'
    });
    updateResult('translate', result);
    setLoadingState('translate', false);
  };

  const renderResult = (key) => {
    const result = results[key];
    if (!result) return null;

    return (
      <div className={`mt-2 p-2 rounded text-xs ${
        result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        <strong>Status:</strong> {result.success ? 'Success' : 'Error'}<br/>
        <strong>Message:</strong> {result.message || 'No message'}<br/>
        {result.data && (
          <>
            <strong>Data:</strong> {JSON.stringify(result.data, null, 2)}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">API Service Testing</h1>
      
      {/* Authentication Tests */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Authentication Endpoints</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border p-4 rounded">
            <button
              onClick={testRegister}
              disabled={loading.register}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading.register ? 'Testing...' : 'Test Register'}
            </button>
            {renderResult('register')}
          </div>
          
          <div className="border p-4 rounded">
            <button
              onClick={testLogin}
              disabled={loading.login}
              className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
            >
              {loading.login ? 'Testing...' : 'Test Login'}
            </button>
            {renderResult('login')}
          </div>
          
          <div className="border p-4 rounded">
            <button
              onClick={testGetProfile}
              disabled={loading.profile}
              className="w-full bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
            >
              {loading.profile ? 'Testing...' : 'Test Get Profile'}
            </button>
            {renderResult('profile')}
          </div>
          
          <div className="border p-4 rounded">
            <button
              onClick={testUpdatePreferences}
              disabled={loading.preferences}
              className="w-full bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 disabled:opacity-50"
            >
              {loading.preferences ? 'Testing...' : 'Test Update Preferences'}
            </button>
            {renderResult('preferences')}
          </div>
        </div>
      </div>

      {/* Meeting Tests */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Meeting Endpoints</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border p-4 rounded">
            <button
              onClick={testCreateMeeting}
              disabled={loading.createMeeting}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading.createMeeting ? 'Testing...' : 'Test Create Meeting'}
            </button>
            {renderResult('createMeeting')}
          </div>
          
          <div className="border p-4 rounded">
            <button
              onClick={testGetMeetings}
              disabled={loading.getMeetings}
              className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
            >
              {loading.getMeetings ? 'Testing...' : 'Test Get Meetings'}
            </button>
            {renderResult('getMeetings')}
          </div>
        </div>
      </div>

      {/* Captions Tests */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Caption Endpoints</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border p-4 rounded">
            <button
              onClick={testGetLanguages}
              disabled={loading.languages}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading.languages ? 'Testing...' : 'Test Get Languages'}
            </button>
            {renderResult('languages')}
          </div>
          
          <div className="border p-4 rounded">
            <button
              onClick={testTranslateCaption}
              disabled={loading.translate}
              className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
            >
              {loading.translate ? 'Testing...' : 'Test Translate Caption'}
            </button>
            {renderResult('translate')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default APITestComponent;