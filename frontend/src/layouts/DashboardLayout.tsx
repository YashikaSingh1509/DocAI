import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import WorkspaceSwitcher from '../components/WorkspaceSwitcher';
import { 
  MessageSquare, FileText, CheckSquare, Wrench, Bug, LogOut, Menu, X, Sparkles
} from 'lucide-react';

const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

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
        className={`fixed inset-y-0 left-0 z-30 w-72 transform bg-gradient-to-b from-gray-900 to-gray-950 shadow-2xl flex flex-col text-white transition duration-300 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-800/60">
          <div className="flex items-center space-x-3 text-indigo-400">
            <div className="p-2 bg-indigo-500/20 rounded-xl">
              <Sparkles className="h-6 w-6 text-indigo-400" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white">Doc<span className="text-indigo-400">AI</span></span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-5 border-b border-gray-800/60 bg-gray-900/30">
          <WorkspaceSwitcher />
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) => `
                    group flex items-center rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200
                    ${isActive 
                      ? 'bg-indigo-600/15 text-indigo-300 shadow-[inset_0px_0px_0px_1px_rgba(99,102,241,0.2)]' 
                      : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-100'}
                  `}
                >
                  <item.icon className={`mr-4 h-5 w-5 transition-colors ${
                    location.pathname === item.to ? 'text-indigo-400' : 'text-gray-500 group-hover:text-gray-300'
                  }`} />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-gray-800/60 p-5 bg-gray-950/50">
          <div className="flex items-center mb-5 bg-gray-900/50 rounded-xl p-3 shadow-inner">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-purple-500 text-sm font-bold text-white shadow-lg">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="ml-3 truncate">
              <p className="truncate text-sm font-bold text-gray-100">{user?.name}</p>
              <p className="truncate text-xs font-medium text-gray-500">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center justify-center rounded-xl border border-gray-800 bg-gray-900/30 px-4 py-2.5 text-sm font-semibold text-gray-300 transition-all hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 relative">
        <header className="lg:hidden border-b border-gray-200/80 bg-white/80 backdrop-blur-md p-4 flex items-center sticky top-0 z-10">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-500 hover:text-indigo-600 transition-colors focus:outline-none">
            <Menu className="h-6 w-6" />
          </button>
          <span className="ml-4 text-xl font-bold text-gray-900 tracking-tight">DocAI</span>
        </header>
        
        <div className="flex-1 overflow-auto h-full shadow-[inset_0px_2px_10px_rgba(0,0,0,0.02)]">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
