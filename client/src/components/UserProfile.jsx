import React, { useEffect, useState } from 'react';
import { authService } from '../services';

const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({});
  const [avatarPreview, setAvatarPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      setError('');
      const res = await authService.getProfile();
      if (res.success) {
        // Ensure role is set from user data, fallback to 'user' if missing
        setUser(res.user);
        setForm({
          name: res.user?.name || '',
          email: res.user?.email || '',
          avatar: res.user?.avatar || '',
          role: res.user?.role ?? 'user',
          preferences: {
            defaultLanguage: res.user?.preferences?.defaultLanguage || 'en',
            captionsEnabled: res.user?.preferences?.captionsEnabled ?? true,
          },
        });
        setAvatarPreview(res.user?.avatar || '');
      } else {
        setError(res.message);
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('preferences.')) {
      const prefKey = name.split('.')[1];
      setForm({
        ...form,
        preferences: {
          ...form.preferences,
          [prefKey]: type === 'checkbox' ? checked : value,
        },
      });
    } else if (name === 'avatar') {
      setForm({ ...form, avatar: value });
      setAvatarPreview(value);
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    // Use updateUserDetails API for updating user details
    const payload = {
      userId: user?.id,
      name: form.name,
      email: form.email,
      role: form.role,
    };

    console.log("Updating user details with payload:", payload);
    try {
      const res = await authService.updateUserDetails(payload);
      if (res.success) {
        setSuccess('Profile updated successfully!');
        setUser({ ...user, ...payload });
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError('Failed to update user details');
    }
    setLoading(false);
  };

  if (loading && !user) return <div>Loading...</div>;
  if (error && !user) return <div className="text-red-500">{error}</div>;

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">User Profile</h2>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      {success && <div className="text-green-500 mb-2">{success}</div>}
      <div className="flex flex-col items-center mb-6">
        <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center text-3xl font-bold text-neutral-700">
          {form.name ? form.name.charAt(0).toUpperCase() : 'U'}
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium">Name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block font-medium">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
            required
            disabled
          />
        </div>
        <div>
          <label className="block font-medium">Role</label>
          <input
            type="text"
            name="role"
            value={form.role}
            className="w-full border px-3 py-2 rounded bg-gray-100"
            disabled={form.role === 'admin'}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block font-medium">Default Language</label>
          <input
            type="text"
            name="preferences.defaultLanguage"
            value={form.preferences?.defaultLanguage}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? 'Updating...' : 'Update Profile'}
        </button>
      </form>
    </div>
  );
};

export default UserProfile;
