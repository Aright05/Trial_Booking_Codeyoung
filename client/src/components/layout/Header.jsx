import React, { useState, useEffect } from 'react';
import { Sparkles, Globe2, ShieldCheck, LayoutDashboard, CalendarCheck, Video } from 'lucide-react';
import { checkServerHealth } from '../../services/api';

export const Header = ({ currentView = 'booking', onNavigate }) => {
  const [serverStatus, setServerStatus] = useState('checking');

  useEffect(() => {
    let isMounted = true;
    checkServerHealth()
      .then((res) => {
        if (isMounted) {
          setServerStatus(res?.data?.status === 'healthy' ? 'healthy' : 'offline');
        }
      })
      .catch(() => {
        if (isMounted) {
          setServerStatus('offline');
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-indigo-100/70 shadow-xs">
      {/* Top colorful gradient accent bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500" />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo & Name */}
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => onNavigate && onNavigate('booking')}
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 ring-2 ring-white">
              <Sparkles className="w-5 h-5 text-amber-200 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight">
                  <span className="text-indigo-600">CODE</span>
                  <span className="text-tangerine-500">YOUNG</span>
                </span>
                <span className="hidden sm:inline-block px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 rounded-full border border-indigo-200/80">
                  Trial System
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Live 1:1 Global Coding &amp; STEM Trial Classes
              </p>
            </div>
          </div>

          {/* Navigation Links & Server Indicator */}
          <div className="flex items-center gap-2 sm:gap-3">
            {onNavigate && (
              <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/80 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => onNavigate('booking')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                    currentView === 'booking'
                      ? 'bg-white text-indigo-700 shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CalendarCheck className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Book Trial</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('mentor')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                    currentView === 'mentor'
                      ? 'bg-white text-purple-700 shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Mentor Schedule</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('admin')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                    currentView === 'admin'
                      ? 'bg-slate-900 text-white shadow-2xs font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Admin</span>
                </button>
              </div>
            )}

            {/* Backend API status badge */}
            <div className={`hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-semibold shadow-xs ${
              serverStatus === 'healthy'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : serverStatus === 'checking'
                ? 'bg-amber-50 border-amber-200 text-amber-700'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              <span
                className={`w-2 h-2 rounded-full ${
                  serverStatus === 'healthy'
                    ? 'bg-emerald-500 animate-pulse'
                    : serverStatus === 'checking'
                    ? 'bg-amber-400'
                    : 'bg-slate-400'
                }`}
              />
              <span className="text-[11px]">
                {serverStatus === 'healthy'
                  ? 'API Online'
                  : serverStatus === 'checking'
                  ? 'Connecting...'
                  : 'Backend Standby'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
