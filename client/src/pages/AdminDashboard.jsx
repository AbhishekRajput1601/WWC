import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const [users, setUsers] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || loading) return;
    if (user?.name !== 'admin') {
      setDataLoading(false);
      return;
    }
    const fetchData = async () => {
      try {
        const usersRes = await api.get('/admin/users');
        setUsers(usersRes.data.users || []);
        const meetingsRes = await api.get('/admin/meetings-users');
        setMeetings(meetingsRes.data.data || []);
      } catch (err) {
        // Optionally handle error
      } finally {
        setDataLoading(false);
      }
    };
    fetchData();
  }, [isAuthenticated, loading, user]);

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-wwc-50 via-white to-accent-50">
        <div className="text-center animate-fade-in">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-wwc-600 to-wwc-700 rounded-2xl flex items-center justify-center shadow-medium mb-4">
            <span className="text-white font-bold text-2xl font-display">W</span>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wwc-600 mx-auto mb-4"></div>
          <p className="text-neutral-600 font-medium">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (user?.name !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-medium p-8 text-center">
          <h2 className="text-2xl font-bold text-error-700 mb-2">Access Denied</h2>
          <p className="text-neutral-600">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      <h1 className="text-4xl font-bold text-neutral-900 mb-8">Admin Dashboard</h1>
      <div className="bg-white rounded-2xl shadow-medium border border-neutral-100 p-6">
        <h2 className="text-2xl font-bold text-wwc-700 mb-4">Meetings & Participants</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="bg-neutral-100">
                <th className="py-2 px-4 font-semibold">Meeting ID</th>
                <th className="py-2 px-4 font-semibold">Title</th>
                <th className="py-2 px-4 font-semibold">Host Name</th>
                <th className="py-2 px-4 font-semibold">Host Email</th>
                <th className="py-2 px-4 font-semibold">Status</th>
                <th className="py-2 px-4 font-semibold">Participants</th>
                <th className="py-2 px-4 font-semibold">Settings</th>
              </tr>
            </thead>
            <tbody>
              {meetings.map(m => (
                <tr key={m._id} className="border-b">
                  <td className="py-2 px-4">{m.meetingId}</td>
                  <td className="py-2 px-4">{m.title}</td>
                  <td className="py-2 px-4">{m.host || m.host}</td>
                  <td className="py-2 px-4">{m.participants || ''}</td>
                  <td className="py-2 px-4">{m.status}</td>
                  <td className="py-2 px-4">
                    {m.participants && m.participants.length > 0 ? (
                      <ul className="list-disc ml-4">
                        {m.participants.map((p, idx) => (
                          <li key={idx}>
                            {p.user?.name || p.user} ({p.user?.email || ''}) {p.isActive ? '(Active)' : '(Left)'}
                          </li>
                        ))}
                      </ul>
                    ) : 'None'}
                  </td>
                  <td className="py-2 px-4">
                    <div>
                      <span className="block">Captions: {m.settings?.allowCaptions ? 'Yes' : 'No'}</span>
                      <span className="block">Translation: {m.settings?.allowTranslation ? 'Yes' : 'No'}</span>
                      <span className="block">Max Participants: {m.settings?.maxParticipants}</span>
                      <span className="block">Recording: {m.settings?.isRecording ? 'Yes' : 'No'}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
