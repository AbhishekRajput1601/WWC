import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-wwc-50 via-white to-accent-50">
      <div className="max-w-7xl mx-auto px-4 ">
        <div className="pt-20 pb-16 text-center lg:pt-32">
          {/* Hero Section */}
          <div className="animate-fade-in">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-wwc-600 to-wwc-700 rounded-3xl flex items-center justify-center shadow-hard">
              <span className="text-white font-bold text-3xl font-display">W</span>
            </div>
            <h1 className="mx-auto max-w-4xl font-display text-5xl font-bold tracking-tight text-neutral-900 sm:text-7xl">
              Welcome to{' '}
              <span className="relative whitespace-nowrap text-wwc-600">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 418 42"
                  className="absolute top-2/3 left-0 h-[0.58em] w-full fill-wwc-200/70"
                  preserveAspectRatio="none"
                >
                  <path d="m203.371.916c-26.013-2.078-76.686 1.963-124.73 9.946L67.3 12.749C35.421 18.062 18.2 21.766 6.004 25.934 1.244 27.561.828 27.778.874 28.61c.07 1.214.828 1.121 9.595-1.176 9.072-2.377 17.15-3.92 39.246-7.496C123.565 7.986 157.869 4.492 195.942 5.046c7.461.108 19.25 1.696 19.17 2.582-.107 1.183-7.874 4.31-25.75 10.366-21.992 7.45-35.43 12.534-36.701 13.884-2.173 2.308-.202 4.407 4.442 4.734 2.654.187 3.263.157 15.593-.78 35.401-2.686 57.944-3.488 88.365-3.143 46.327.526 75.721 2.23 130.788 7.584 19.787 1.924 20.814 1.98 24.557 1.332l.066-.011c1.201-.203 1.53-1.825.399-2.335-2.911-1.31-4.893-1.604-22.048-3.261-57.509-5.556-87.871-7.36-132.059-7.842-23.239-.254-33.617-.116-50.627.674-11.629.54-42.371 2.494-46.696 2.967-2.359.259 8.133-3.625 26.504-9.81 23.239-7.825 27.934-10.149 28.304-14.005.417-4.348-3.529-6-16.878-7.066Z" />
                </svg>
                <span className="relative">WWC</span>
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-xl leading-8 text-neutral-600">
              The world's most advanced video conferencing platform with{' '}
              <span className="font-semibold text-wwc-700">real-time captions</span> and{' '}
              <span className="font-semibold text-accent-600">instant translation</span>.
              Connect globally, communicate effortlessly.
            </p>
          </div>

          <div className="mt-12 flex justify-center gap-6 animate-slide-in-up">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="group inline-flex items-center justify-center rounded-2xl py-4 px-8 text-lg font-semibold border-2 border-black bg-white text-black hover:bg-gray-200 transition-all duration-300 shadow-soft hover:shadow-hard transform hover:-translate-y-1"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/signup"
                  className="group inline-flex items-center justify-center rounded-2xl py-4 px-8 text-lg font-semibold border-2 border-black bg-white text-black hover:bg-gray-200 transition-all duration-300 shadow-soft hover:shadow-hard transform hover:-translate-y-1"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Start Free Today
                </Link>
                <Link
                  to="/login"
                  className="group inline-flex items-center justify-center rounded-2xl py-4 px-8 text-lg font-semibold border-2 border-black bg-white text-black hover:bg-gray-200 transition-all duration-300 shadow-soft hover:shadow-medium transform hover:-translate-y-1"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1" />
                  </svg>
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Features Section */}
        <div className="py-20 bg-white/60 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center animate-slide-in-up">
              <div className="inline-flex items-center rounded-full px-4 py-2 bg-wwc-100 text-wwc-700 font-semibold text-sm mb-4">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Everything you need
              </div>
              <h2 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl font-display">
                Revolutionary Features for
                <span className="text-wwc-600"> Modern Teams</span>
              </h2>
              <p className="mt-6 text-lg leading-8 text-neutral-600">
                Experience the next generation of video conferencing with AI-powered features designed for seamless global communication.
              </p>
            </div>

            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-3">
                <div className="group flex flex-col bg-white rounded-2xl p-8 shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-2 border border-neutral-100">
                  <dt className="flex items-center gap-x-3 text-lg font-bold leading-7 text-neutral-900 mb-4">
                    <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-wwc-500 to-wwc-600 group-hover:from-wwc-600 group-hover:to-wwc-700 transition-all duration-300 shadow-soft">
                      <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                      </svg>
                    </div>
                    Ultra HD Video Calls
                  </dt>
                  <dd className="flex flex-auto flex-col text-base leading-7 text-neutral-600">
                    <p className="flex-auto">
                      Experience crystal-clear 4K video quality with adaptive streaming and WebRTC technology for flawless communication across any device.
                    </p>
                  </dd>
                </div>

                <div className="group flex flex-col bg-white rounded-2xl p-8 shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-2 border border-neutral-100">
                  <dt className="flex items-center gap-x-3 text-lg font-bold leading-7 text-neutral-900 mb-4">
                    <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 group-hover:from-accent-600 group-hover:to-accent-700 transition-all duration-300 shadow-soft">
                      <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                      </svg>
                    </div>
                    AI-Powered Captions
                  </dt>
                  <dd className="flex flex-auto flex-col text-base leading-7 text-neutral-600">
                    <p className="flex-auto">
                      Advanced AI converts speech to text in real-time with 99% accuracy, making every meeting accessible and searchable for all participants.
                    </p>
                  </dd>
                </div>

                <div className="group flex flex-col bg-white rounded-2xl p-8 shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-2 border border-neutral-100">
                  <dt className="flex items-center gap-x-3 text-lg font-bold leading-7 text-neutral-900 mb-4">
                    <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-success-500 to-success-600 group-hover:from-success-600 group-hover:to-success-700 transition-all duration-300 shadow-soft">
                      <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m10.5 21 5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 0 1-3.827-5.802" />
                      </svg>
                    </div>
                    Universal Translation
                  </dt>
                  <dd className="flex flex-auto flex-col text-base leading-7 text-neutral-600">
                    <p className="flex-auto">
                      Break language barriers with instant translation in 100+ languages, enabling seamless global collaboration and inclusive meetings.
                    </p>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;