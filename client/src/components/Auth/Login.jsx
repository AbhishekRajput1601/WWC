import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { dispatch } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Direct API call to login endpoint
      const result = await authService.login(formData);
      
      if (result.success) {
        // Update auth context with user data
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            token: result.token,
            user: result.user
          }
        });
        // Navigate to correct dashboard based on role and replace history to disable back button
        if (result.data.user.name === 'admin') {
          navigate('/admin-dashboard', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Login error:', error);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-start justify-center bg-gradient-to-br from-wwc-50 via-white to-accent-50 pt-8 pb-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-wwc-600 to-wwc-700 rounded-2xl flex items-center justify-center shadow-medium">
            <span className="text-white font-bold text-2xl font-display">W</span>
          </div>
          <h2 className="mt-4 text-center text-2xl font-bold text-neutral-900 font-display">
            Welcome to WWC
          </h2>
          <p className="mt-1 text-center text-sm text-neutral-600">
            Sign in to join world-class video conferences
          </p>
          <p className="mt-1 text-center text-sm text-neutral-500">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="font-semibold text-wwc-600 hover:text-wwc-700 transition-colors duration-200"
            >
              Create one here
            </Link>
          </p>
        </div>
        <div className="bg-white shadow-medium rounded-2xl px-6 py-6 mt-4">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg animate-slide-in-up">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-error-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-neutral-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full px-4 py-3 border border-neutral-200 rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-wwc-500 focus:border-wwc-500 transition-all duration-200 bg-neutral-50 focus:bg-white"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-neutral-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="block w-full px-4 py-3 border border-neutral-200 rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-wwc-500 focus:border-wwc-500 transition-all duration-200 bg-neutral-50 focus:bg-white"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border-2 border-black text-sm font-semibold rounded-xl text-black bg-white hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-soft hover:shadow-medium transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing you in...
                  </div>
                ) : (
                  'Sign In to WWC'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;