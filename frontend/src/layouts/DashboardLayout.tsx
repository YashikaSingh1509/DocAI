import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import WorkspaceSwitcher from '../components/WorkspaceSwitcher';
import { 
  MessageSquare, FileText, CheckSquare, Wrench, Bug, LogOut, Menu, X, Sparkles
} from 'lucide-react';

const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { to: '/', icon: MessageSquare, label: 'Chat' },
    { to: '/documents', icon: FileText, label: 'Documents' },
    { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
    { to: '/tool-history', icon: Wrench, label: 'Tool History' },
    { to: '/debug', icon: Bug, label: 'Debug' },
  ];

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden font-sans">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-gray-900 flex flex-col text-white transition duration-200 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center space-x-2 text-blue-400">
            <Sparkles className="h-6 w-6" />
            <span className="text-xl font-bold text-white">DocAI</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-800">
          <WorkspaceSwitcher />
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) => `
                    flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors
                    ${isActive ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}
                  `}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-gray-800 p-4">
          <div className="flex items-center mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="ml-3 truncate">
              <p className="truncate text-sm font-medium text-white">{user?.name}</p>
              <p className="truncate text-xs text-gray-400">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-white">
        <header className="lg:hidden border-b border-gray-200 bg-white p-4 flex items-center">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-500 hover:text-gray-700 focus:outline-none">
            <Menu className="h-6 w-6" />
          </button>
          <span className="ml-4 text-lg font-semibold text-gray-900">DocAI</span>
        </header>
        
        <div className="flex-1 overflow-auto h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
