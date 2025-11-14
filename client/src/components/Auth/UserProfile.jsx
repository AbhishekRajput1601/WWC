import React, { useEffect, useState } from "react";
import authService from "../../services/authService";
import { useAuth } from "../../context/AuthContext";

const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({});
  const [avatarPreview, setAvatarPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { user: ctxUser, dispatch, loadUser } = useAuth();

  useEffect(() => {
    // Use context user when available to avoid extra requests
    const init = async () => {
      setLoading(true);
      setError("");
      let resUser = ctxUser;
      if (!ctxUser) {
        const res = await authService.getProfile();
        if (res.success) resUser = res.user;
        else setError(res.message);
      }

      if (resUser) {
        setUser(resUser);
        setForm({
          name: resUser?.name || "",
          email: resUser?.email || "",
          avatar: resUser?.avatar || "",
          role: resUser?.role ?? "user",
          preferences: {
            defaultLanguage: resUser?.preferences?.defaultLanguage || "en",
            captionsEnabled: resUser?.preferences?.captionsEnabled ?? true,
          },
        });
        setAvatarPreview(resUser?.avatar || "");
      }
      setLoading(false);
    };

    init();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith("preferences.")) {
      const prefKey = name.split(".")[1];
      setForm({
        ...form,
        preferences: {
          ...form.preferences,
          [prefKey]: type === "checkbox" ? checked : value,
        },
      });
    } else if (name === "avatar") {
      setForm({ ...form, avatar: value });
      setAvatarPreview(value);
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    const payload = {
      userId: user?.id,
      name: form.name,
      email: form.email,
      role: form.role,
    };

   
    const prevUser = user;
    setUser({ ...user, ...payload });
    try {
      const res = await authService.updateUserDetails(payload);
      if (res.success) {
        setSuccess("Profile updated successfully!");
        const updatedUser = res.user ? res.user : { ...prevUser, ...payload };
        setUser(updatedUser);
        if (dispatch) dispatch({ type: 'USER_LOADED', payload: updatedUser });
      } else {
        setUser(prevUser);
        setError(res.message || 'Update failed');
      }
    } catch (err) {
      setUser(prevUser);
      setError("Failed to update user details");
    }
    setLoading(false);
  };

  if (loading && !user) return <div>Loading...</div>;
  if (error && !user) return <div className="text-red-500">{error}</div>;

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Your Profile</h2>
        <div className="text-sm text-gray-500">Last saved: {success ? 'Just now' : '—'}</div>
      </div>

      {error && <div className="text-red-600 mb-4">{error}</div>}
      {success && <div className="text-green-600 mb-4">{success}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 flex flex-col items-center p-4 border rounded-lg">
          {avatarPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarPreview} alt="avatar" className="h-28 w-28 rounded-full object-cover mb-3" />
          ) : (
            <div className="h-28 w-28 rounded-full bg-gray-200 flex items-center justify-center text-4xl font-bold text-gray-600 mb-3">{form.name ? form.name.charAt(0).toUpperCase() : 'U'}</div>
          )}
          <div className="text-center">
            <div className="font-medium">{form.name || 'Unnamed'}</div>
            <div className="text-sm text-gray-500">{form.email}</div>
          </div>
        </div>

        <div className="col-span-1 md:col-span-2 p-4 border rounded-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="mt-1 block w-full border rounded-md px-3 py-2 bg-gray-50"
                  required
                  disabled
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Profile Image URL</label>
              <input
                type="url"
                name="avatar"
                placeholder="https://..."
                value={form.avatar || ''}
                onChange={handleChange}
                className="mt-1 block w-full border rounded-md px-3 py-2"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <input
                  type="text"
                  name="role"
                  value={form.role}
                  className="mt-1 block w-full border rounded-md px-3 py-2 bg-gray-50"
                  disabled={form.role === 'admin'}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Default language</label>
                <input
                  type="text"
                  name="preferences.defaultLanguage"
                  value={form.preferences?.defaultLanguage || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full border rounded-md px-3 py-2"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={async () => {
                  // reset to last saved
                  if (user) {
                    setForm({
                      name: user.name || '',
                      email: user.email || '',
                      avatar: user.avatar || '',
                      role: user.role || 'user',
                      preferences: user.preferences || { defaultLanguage: 'en', captionsEnabled: true },
                    });
                    setAvatarPreview(user.avatar || '');
                    setError('');
                    setSuccess('');
                  } else if (loadUser) {
                    await loadUser();
                  }
                }}
                className="px-4 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Reset
              </button>

              <button
                type="submit"
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
