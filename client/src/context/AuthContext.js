import React, { createContext, useContext, useReducer, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: true,
  error: null,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'USER_LOADED':
      return {
        ...state,
        isAuthenticated: true,
        loading: false,
        user: action.payload,
        error: null,
      };
    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS':
      localStorage.setItem('token', action.payload.token);
      return {
        ...state,
        token: action.payload.token,
        user: action.payload.user,
        isAuthenticated: true,
        loading: false,
        error: null,
      };
    case 'AUTH_ERROR':
    case 'LOGIN_FAIL':
    case 'REGISTER_FAIL':
    case 'LOGOUT':
      localStorage.removeItem('token');
      return {
        ...state,
        token: null,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload,
      };
    case 'CLEAR_ERRORS':
      return {
        ...state,
        error: null,
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load user
  const loadUser = async () => {
    if (localStorage.token) {
      api.setAuthToken(localStorage.token);
    }

    try {
      const res = await api.get('/auth/me');
      dispatch({
        type: 'USER_LOADED',
        payload: res.data.user,
      });
    } catch (error) {
      dispatch({
        type: 'AUTH_ERROR',
        payload: error.response?.data?.message || 'Authentication failed',
      });
    }
  };

  // Register user
  const register = async (formData) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const res = await api.post('/auth/register', formData);
      dispatch({
        type: 'REGISTER_SUCCESS',
        payload: res.data,
      });
      return { success: true };
    } catch (error) {
      dispatch({
        type: 'REGISTER_FAIL',
        payload: error.response?.data?.message || 'Registration failed',
      });
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  // Login user
  const login = async (formData) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const res = await api.post('/auth/login', formData);
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: res.data,
      });
      return { success: true };
    } catch (error) {
      dispatch({
        type: 'LOGIN_FAIL',
        payload: error.response?.data?.message || 'Login failed',
      });
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  // Logout
  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  // Clear errors
  const clearErrors = () => {
    dispatch({ type: 'CLEAR_ERRORS' });
  };

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        clearErrors,
        loadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};