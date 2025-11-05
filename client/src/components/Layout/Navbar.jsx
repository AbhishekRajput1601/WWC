import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b border-neutral-200 sticky top-0 z-50 shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center group">
              <div className="h-10 w-10 bg-gradient-to-br from-wwc-600 to-wwc-700 rounded-xl flex items-center justify-center shadow-soft group-hover:shadow-medium transition-all duration-200 group-hover:scale-105">
                <span className="text-white font-bold text-lg font-display">
                  W
                </span>
              </div>
              <div className="ml-3">
                <span className="text-3xl font-bold text-neutral-900 font-display">
                  WWC
                </span>
                <div className="text-xs text-wwc-600 font-medium -mt-1">
                  Video Conferencing
                </div>
              </div>
            </Link>
          </div>

          <div className="flex items-center space-x-6">
            {isAuthenticated ? (
              <>
                {user?.name === "admin" ? (
                  <Link
                    to="/admin-dashboard"
                    className="text-neutral-600 hover:text-wwc-600 px-3 py-2 rounded-lg text-sm font-semibold transition-colors duration-200 hover:bg-wwc-50"
                  >
                    Admin Dashboard
                  </Link>
                ) : (
                  <Link
                    to="/dashboard"
                    className="text-neutral-600 hover:text-wwc-600 px-3 py-2 rounded-lg text-sm font-semibold transition-colors duration-200 hover:bg-wwc-50"
                  >
                    Dashboard
                  </Link>
                )}
                <div className="flex items-center space-x-4">
                  <div className="hidden sm:block">
                    <span className="text-neutral-700 text-sm font-medium">
                      Welcome,{" "}
                      <span className="text-wwc-600 font-semibold">
                        {user?.name}
                      </span>
                    </span>
                  </div>
                
                  <Link to="/profile" className="flex items-center group">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center shadow-soft group-hover:shadow-medium transition-all duration-200 group-hover:scale-105 mr-2">
                 
                      {user?.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt="avatar"
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-neutral-700 font-bold text-lg">
                          {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                        </span>
                      )}
                    </div>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="border-2 border-black bg-white text-black hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 shadow-soft hover:shadow-medium transform hover:-translate-y-0.5"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="border-2 border-black bg-white text-black hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="border-2 border-black bg-white text-black hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 shadow-soft hover:shadow-medium transform hover:-translate-y-0.5"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
