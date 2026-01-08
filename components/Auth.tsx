
import React, { useState } from 'react';
import { LogoIcon } from './Icons';

interface AuthProps {
  onLogin: () => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('test@fitpilot.com');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    // Simulate a network request
    setTimeout(() => {
      // In this version, we don't validate credentials.
      // We just log the user in.
      onLogin();
      setIsLoading(false);
    }, 500);
  };
  
  const handleModeChange = (newIsLogin: boolean) => {
    setIsLogin(newIsLogin);
    setError(null);
    setEmail('');
    setPassword('');
  };


  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full mx-auto">
        <div className="flex justify-center mb-6">
            <div className="flex items-center space-x-2 text-3xl font-bold text-gray-800">
                <LogoIcon className="w-10 h-10" />
                <span>FitPilot</span>
            </div>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-lg">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-center text-gray-800">
              {isLogin ? 'Welcome Back!' : 'Create Your Account'}
            </h2>
            <p className="text-center text-gray-500 text-sm mt-1">
              {isLogin ? 'Sign in to access your personalized plan.' : 'Get started on your fitness journey.'}
            </p>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-6 rounded-r-lg">
              <div className="flex items-center">
                  <div className="py-1">
                  <svg className="h-5 w-5 text-yellow-500 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 011-1h.008a1 1 0 011 1v3.008a1 1 0 01-1 1h-.008a1 1 0 01-1-1V5z" clipRule="evenodd" />
                  </svg>
                  </div>
                  <div className="ml-2">
                  <p className="text-sm text-yellow-700">
                      Use the pre-filled test account or{' '}
                      <button onClick={() => handleModeChange(false)} className="font-medium underline hover:text-yellow-800">create your own</button>.
                  </p>
                  </div>
              </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password"className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>
            
            {error && <p className="text-sm text-red-600">{error}</p>}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
              >
                {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  {isLogin ? "Don't have an account?" : 'Already have an account?'}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => handleModeChange(!isLogin)}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {isLogin ? 'Sign Up Now' : 'Sign In Instead'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
