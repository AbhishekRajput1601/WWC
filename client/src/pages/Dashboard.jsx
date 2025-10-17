import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [joinMeetingId, setJoinMeetingId] = useState('');
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    description: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchMeetings();
  }, [isAuthenticated, navigate]);

  const fetchMeetings = async () => {
    try {
      const response = await api.get('/meetings');
      setMeetings(response.data.meetings);
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/meetings', newMeeting);
      const meeting = response.data.meeting;
      setMeetings([meeting, ...meetings]);
      setShowCreateForm(false);
      setNewMeeting({ title: '', description: '' });
      navigate(`/meeting/${meeting.meetingId}`);
    } catch (error) {
      console.error('Error creating meeting:', error);
    }
  };

  const handleJoinMeeting = (e) => {
    e.preventDefault();
    if (joinMeetingId.trim()) {
      navigate(`/meeting/${joinMeetingId.trim()}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.name}!
            </h1>
            <p className="mt-2 text-gray-600">
              Start a new meeting or join an existing one
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Start New Meeting
                </h3>
                {!showCreateForm ? (
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    Create Meeting
                  </button>
                ) : (
                  <form onSubmit={handleCreateMeeting} className="space-y-4">
                    <input
                      type="text"
                      placeholder="Meeting title"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      value={newMeeting.title}
                      onChange={(e) => setNewMeeting({...newMeeting, title: e.target.value})}
                      required
                    />
                    <textarea
                      placeholder="Description (optional)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      rows="3"
                      value={newMeeting.description}
                      onChange={(e) => setNewMeeting({...newMeeting, description: e.target.value})}
                    />
                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        Create & Start
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCreateForm(false)}
                        className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Join Meeting
                </h3>
                <form onSubmit={handleJoinMeeting}>
                  <input
                    type="text"
                    placeholder="Enter meeting ID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 mb-4"
                    value={joinMeetingId}
                    onChange={(e) => setJoinMeetingId(e.target.value)}
                    required
                  />
                  <button
                    type="submit"
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    Join Meeting
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Recent Meetings */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Recent Meetings
              </h3>
            </div>
            <div className="px-6 py-4">
              {meetings.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No meetings yet. Create your first meeting to get started!
                </p>
              ) : (
                <div className="space-y-4">
                  {meetings.slice(0, 5).map((meeting) => (
                    <div
                      key={meeting._id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {meeting.title}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Meeting ID: {meeting.meetingId}
                        </p>
                        <p className="text-sm text-gray-500">
                          Created: {new Date(meeting.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          meeting.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : meeting.status === 'ended'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {meeting.status}
                        </span>
                        {meeting.status !== 'ended' && (
                          <button
                            onClick={() => navigate(`/meeting/${meeting.meetingId}`)}
                            className="bg-primary-600 text-white px-3 py-1 rounded text-sm hover:bg-primary-700"
                          >
                            Join
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;