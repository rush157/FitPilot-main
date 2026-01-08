import React from 'react';
import { LogoIcon, DashboardIcon, ListIcon, UserIcon } from './Icons';
import { View } from './Nav';

interface HeaderProps {
    onLogoClick: () => void;
    user: boolean;
    onLogout: () => void;
    isPlanAccepted: boolean;
    currentView: View;
    setCurrentView: (view: View) => void;
}

const HeaderNavButton: React.FC<{
  label: string;
  view: View;
  currentView: View;
  onClick: (view: View) => void;
  icon: React.ReactNode;
}> = ({ label, view, currentView, onClick, icon }) => {
  const isActive = currentView === view;
  return (
    <button
      onClick={() => onClick(view)}
      className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${isActive ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:bg-gray-100'}`}
    >
      <div className={`w-5 h-5 mr-2 ${isActive ? 'text-indigo-600' : 'text-gray-500'}`}>
          {icon}
      </div>
      {label}
    </button>
  );
};

export const Header: React.FC<HeaderProps> = ({ onLogoClick, user, onLogout, isPlanAccepted, currentView, setCurrentView }) => {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
           <button onClick={onLogoClick} className="flex items-center space-x-2 text-2xl font-bold text-gray-800">
                <LogoIcon />
                <span>FitPilot</span>
            </button>

            {user && isPlanAccepted && (
                <div className="hidden md:flex items-center space-x-4">
                    <HeaderNavButton label="Dashboard" view={View.DASHBOARD} currentView={currentView} onClick={setCurrentView} icon={<DashboardIcon />} />
                    <HeaderNavButton label="My Plan" view={View.RECOMMENDATIONS} currentView={currentView} onClick={setCurrentView} icon={<ListIcon />} />
                    <HeaderNavButton label="Profile" view={View.PROFILE} currentView={currentView} onClick={setCurrentView} icon={<UserIcon />} />
                </div>
            )}

            {user && (
                <button 
                    onClick={onLogout} 
                    className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors"
                >
                    Logout
                </button>
            )}
        </div>
      </div>
    </header>
  );
};