import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
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
      setNewMeeting({ title: '', description: '' });
      navigate(`/meeting/${meeting.meetingId}`);
    } catch (error) {
      console.error('Error creating meeting:', error);
    }
  };

  const handleJoinMeeting = (e) => {
    e.preventDefault();
    if (joinMeetingId.trim()) {
      // Call backend to add user as participant before navigating
      (async () => {
        try {
          await api.post('/meetings/add-user-in-meeting', {
            meetingId: joinMeetingId.trim(),
            userId: user.id,
          });
          // Optionally log for debug
          // console.log(user.id, joinMeetingId.trim());
        } catch (err) {
          // Optionally show error to user
          console.error('Error joining meeting:', err);
        } finally {
          navigate(`/meeting/${joinMeetingId.trim()}`);
        }
      })();
    }
  };

  const handleDeleteMeeting = async (meetingId) => {
    if (window.confirm('Are you sure you want to delete this meeting?')) {
      try {
        // Call backend to delete meeting by meetingId (UUID)
        await api.delete(`/meetings/delete-meeting/${meetingId}`);
        setMeetings(meetings.filter(meeting => meeting.meetingId !== meetingId));
      } catch (error) {
        console.error('Error deleting meeting:', error);
        alert('Failed to delete meeting. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-wwc-50 via-white to-accent-50 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-wwc-600 to-wwc-700 rounded-2xl flex items-center justify-center shadow-medium">
            <div className="animate-pulse-soft">
              <span className="text-white font-bold text-2xl font-display">W</span>
            </div>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wwc-600 mx-auto mb-4"></div>
          <p className="text-neutral-600 font-medium">Loading your WWC dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 min-h-screen bg-gradient-to-br from-wwc-50 via-white to-accent-50">
      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
        <div className="">
          {/* Header Section */}
          <div className="text-center animate-slide-in-up">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-wwc-600 to-wwc-700 rounded-3xl shadow-hard ">
              <span className="text-white font-bold text-3xl font-display">W</span>
            </div>
            <h1 className="text-4xl font-bold text-neutral-900 font-display mb-2">
              Welcome back, <span className="text-wwc-600">{user?.name}</span>! 
            </h1>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Ready to host world-class meetings? Start a new session or join an existing conference with just a click.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Create Meeting Card */}
            <div className="bg-white overflow-hidden shadow-medium rounded-2xl border border-neutral-100 hover:shadow-hard transition-all duration-300 animate-slide-in-right">
              <div className="p-8">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-wwc-500 to-wwc-600 rounded-xl flex items-center justify-center shadow-soft mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900 font-display">
                    Start New Meeting
                  </h3>
                </div>
                
                <form onSubmit={handleCreateMeeting} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-800 mb-2">Meeting Title</label>
                    <input
                      type="text"
                      placeholder="e.g., Team Standup, Client Review..."
                      className="w-full px-4 py-3 border-2 border-neutral-300 rounded-xl text-neutral-900 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-wwc-500 focus:border-wwc-500 transition-all duration-200 bg-white shadow-sm"
                      value={newMeeting.title}
                      onChange={(e) => setNewMeeting({...newMeeting, title: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-neutral-800 mb-2">Description (Optional)</label>
                    <textarea
                      placeholder="Add meeting agenda or notes..."
                      className="w-full px-4 py-3 border-2 border-neutral-300 rounded-xl text-neutral-900 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-wwc-500 focus:border-wwc-500 transition-all duration-200 bg-white shadow-sm resize-none"
                      rows="3"
                      value={newMeeting.description}
                      onChange={(e) => setNewMeeting({...newMeeting, description: e.target.value})}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-white text-black border-2 border-black py-4 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200 shadow-soft hover:shadow-medium transform hover:-translate-y-1"
                  >
                    <div className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Create & Start Meeting
                    </div>
                  </button>
                </form> 
              </div>
            </div>

            {/* Join Meeting Card */}
            <div className="bg-white overflow-hidden shadow-medium rounded-2xl border border-neutral-100 hover:shadow-hard transition-all duration-300 animate-slide-in-right">
              <div className="p-8">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-success-500 to-success-600 rounded-xl flex items-center justify-center shadow-soft mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900 font-display">
                    Join Meeting
                  </h3>
                </div>
                
                <form onSubmit={handleJoinMeeting} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-800 mb-2">Meeting ID</label>
                    <input
                      type="text"
                      placeholder="Enter Meeting ID To Join Meeting"
                      className="w-full px-4 py-3 border-2 border-neutral-300 rounded-xl text-neutral-900 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-success-500 focus:border-success-500 transition-all duration-200 bg-white font-mono text-lg tracking-wider shadow-sm"
                      value={joinMeetingId}
                      onChange={(e) => setJoinMeetingId(e.target.value)}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-white text-black border-2 border-black py-4 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200 shadow-soft hover:shadow-medium transform hover:-translate-y-1"
                  >
                    <div className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                      Join Conference
                    </div>
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Recent Meetings */}
          <div className="bg-white shadow-medium rounded-2xl border border-neutral-100 animate-slide-in-up">
            <div className="px-8 py-6 border-b border-neutral-100">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-accent-500 to-accent-600 rounded-lg flex items-center justify-center shadow-soft mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-neutral-900 font-display">
                  Recent Meetings
                </h3>
              </div>
            </div>
            <div className="px-8 py-6">
              {meetings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-neutral-500 text-lg font-medium">
                    No meetings yet
                  </p>
                  <p className="text-neutral-400 text-sm mt-1">
                    Create your first meeting to get started with WWC!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {meetings.slice(0, 5).map((meeting) => (
                    <div
                      key={meeting._id}
                      className="group flex items-center justify-between p-6 bg-neutral-50 hover:bg-gradient-to-r hover:from-wwc-50 hover:to-accent-50 rounded-xl border border-neutral-100 hover:border-wwc-200 transition-all duration-200 hover:shadow-soft"
                    >
                      <div className="flex-1">
                        <h4 className="font-bold text-neutral-900 mb-2 group-hover:text-wwc-700 transition-colors">
                          {meeting.title}
                        </h4>
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="inline-flex items-center text-neutral-600">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                            </svg>
                            ID: <span className="font-mono font-semibold ml-1">{meeting.meetingId}</span>
                          </span>
                          <span className="inline-flex items-center text-neutral-500">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {new Date(meeting.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          meeting.status === 'active' 
                            ? 'bg-success-100 text-success-800 border border-success-200' 
                            : meeting.status === 'ended'
                            ? 'bg-error-100 text-error-800 border border-error-200'
                            : 'bg-warning-100 text-warning-800 border border-warning-200'
                        }`}>
                          {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
                        </span>
                        
                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteMeeting(meeting.meetingId)}
                          className="bg-white text-black border-2 border-black px-3 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-all duration-200 shadow-soft hover:shadow-medium"
                          title="Delete Meeting"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                        
                        {meeting.status !== 'ended' && (
                          <button
                            onClick={() => navigate(`/meeting/${meeting.meetingId}`)}
                            className="bg-white text-black border-2 border-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-all duration-200 shadow-soft hover:shadow-medium transform hover:-translate-y-0.5"
                          >
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                              </svg>
                              Join
                            </div>
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