import React from 'react';
import { DashboardIcon, ListIcon, UserIcon } from './Icons';

export enum View {
  PROFILE = 'PROFILE',
  DASHBOARD = 'DASHBOARD',
  RECOMMENDATIONS = 'RECOMMENDATIONS',
}

interface NavProps {
  currentView: View;
  setCurrentView: (view: View) => void;
}

const NavButton: React.FC<{
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
      className={`flex-1 flex flex-col items-center justify-center p-2 text-sm transition-colors duration-200 ${isActive ? 'text-indigo-600' : 'text-gray-500 hover:text-indigo-500'}`}
    >
      <div className={`w-7 h-7 mb-1 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}>
        {icon}
      </div>
      {label}
    </button>
  );
};

export const Nav: React.FC<NavProps> = ({ currentView, setCurrentView }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 shadow-t-lg z-50 flex md:hidden">
      <NavButton
        label="Dashboard"
        view={View.DASHBOARD}
        currentView={currentView}
        onClick={setCurrentView}
        icon={<DashboardIcon />}
      />
      <NavButton
        label="Plan"
        view={View.RECOMMENDATIONS}
        currentView={currentView}
        onClick={setCurrentView}
        icon={<ListIcon />}
      />
      <NavButton
        label="Profile"
        view={View.PROFILE}
        currentView={currentView}
        onClick={setCurrentView}
        icon={<UserIcon />}
      />
    </nav>
  );
};