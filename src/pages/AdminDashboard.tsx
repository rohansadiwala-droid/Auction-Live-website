import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import PlayersAdmin from './admin/PlayersAdmin';
import TeamsAdmin from './admin/TeamsAdmin';
import LiveAuctionAdmin from './admin/LiveAuctionAdmin';
import { LogOut, Users, Shield, Radio } from 'lucide-react';

export default function AdminDashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/');
  };

  const navItems = [
    { path: '/admin', label: 'Live Control', icon: Radio },
    { path: '/admin/players', label: 'Players', icon: Users },
    { path: '/admin/teams', label: 'Teams', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-slate-900 border-r border-slate-800 p-4 flex flex-col">
        <h2 className="text-xl font-bold text-white mb-8 px-4">Admin Panel</h2>
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors mt-auto"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto h-screen">
        <Routes>
          <Route path="/" element={<LiveAuctionAdmin />} />
          <Route path="/players" element={<PlayersAdmin />} />
          <Route path="/teams" element={<TeamsAdmin />} />
        </Routes>
      </div>
    </div>
  );
}
