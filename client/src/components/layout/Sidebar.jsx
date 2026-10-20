import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Compass,
  Users,
  CalendarCheck,
  ShieldCheck,
  Ticket,
  Bell,
  Sparkles,
  ChevronRight,
  GraduationCap,
  Layers,
  ArrowRight,
  UserCheck,
  CheckCircle2
} from 'lucide-react';

export default function Sidebar({ onCreateEventClick }) {
  const { user, role, switchRole } = useAuth();
  const location = useLocation();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const navItems = [
    {
      name: 'Discover Hub & Events',
      path: '/',
      icon: Compass,
      badge: 'Live'
    },
    {
      name: 'Student Hub & Directory',
      path: '/clubs',
      icon: Users,
      badge: '64'
    },
    {
      name: 'Coordinator Event Manager',
      path: '/coordinator',
      icon: CalendarCheck,
      badge: role === 'coordinator' ? 'Active' : null,
      highlight: true
    },
    {
      name: 'Governance / Admin Approvals',
      path: '/governance',
      icon: ShieldCheck,
      badge: '7 Req',
      badgeColor: 'bg-amber-100 text-amber-700'
    },
    {
      name: 'My Registered Events',
      path: '/my-events',
      icon: Ticket
    },
    {
      name: 'Campus Announcements',
      path: '/announcements',
      icon: Bell
    }
  ];

  const handleRoleSwitch = async (targetRole) => {
    setRoleMenuOpen(false);
    await switchRole(targetRole);
  };

  return (
    <aside className="w-72 bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 h-screen sticky top-0 select-none z-30">
      {/* Brand Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/25">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-slate-900 font-sans">CampusConnect</span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100">
                Hub
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">College Community Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-4 py-2 overflow-y-auto space-y-1.5">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-indigo-50 text-indigo-600 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                <span className="truncate">{item.name}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    item.badgeColor
                      ? item.badgeColor
                      : isActive
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}

        {/* Promo Card: Host a Campus Event */}
        <div className="pt-5 pb-2">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white relative overflow-hidden shadow-lg shadow-indigo-950/10">
            <div className="absolute top-0 right-0 -mt-2 -mr-2 w-20 h-20 bg-indigo-500/20 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Host a Campus Event</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              Submit club proposals for administrative approval in under 3 minutes.
            </p>
            <button
              onClick={onCreateEventClick}
              className="w-full flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium py-2 px-3 rounded-lg shadow-sm transition"
            >
              <span>+ Submit Proposal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* User Persona & Role Switcher */}
      <div className="p-4 border-t border-slate-200/80 bg-slate-50/50 relative">
        {/* Role Menu Popover */}
        {roleMenuOpen && (
          <div className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 mb-1">
              Switch Interactive Persona
            </div>

            <button
              onClick={() => handleRoleSwitch('student')}
              className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition ${
                role === 'student' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div>
                <div className="font-medium text-slate-900">Aarav Sharma</div>
                <div className="text-[10px] text-slate-500">Student • Computer Science</div>
              </div>
              {role === 'student' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
            </button>

            <button
              onClick={() => handleRoleSwitch('coordinator')}
              className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition ${
                role === 'coordinator' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div>
                <div className="font-medium text-slate-900">Priya Patel</div>
                <div className="text-[10px] text-slate-500">Club Coordinator • Robotics Guild</div>
              </div>
              {role === 'coordinator' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
            </button>

            <button
              onClick={() => handleRoleSwitch('admin')}
              className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition ${
                role === 'admin' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div>
                <div className="font-medium text-slate-900">Dr. Rajesh Menon</div>
                <div className="text-[10px] text-slate-500">College Administrator • Dean</div>
              </div>
              {role === 'admin' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
            </button>
          </div>
        )}

        <div
          onClick={() => setRoleMenuOpen(!roleMenuOpen)}
          className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-100/80 cursor-pointer transition border border-transparent hover:border-slate-200"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                alt={user?.name || 'User'}
                className="w-9 h-9 rounded-full object-cover border border-slate-200"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
            </div>
            <div className="overflow-hidden">
              <div className="font-semibold text-xs text-slate-900 truncate">
                {user?.name || 'Aarav Sharma'}
              </div>
              <div className="text-[10px] text-slate-500 capitalize truncate">
                {role === 'admin' ? 'Dean • Admin' : role === 'coordinator' ? 'Coordinator • Robotics' : user?.department || 'Student'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase">
              {role}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
