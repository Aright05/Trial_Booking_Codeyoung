import React from 'react';
import { Sparkles, CheckCircle2, ShieldCheck, LayoutDashboard } from 'lucide-react';

export const StepNotice = () => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl shadow-indigo-950/10 mb-8 border border-indigo-700/50">
      {/* Decorative colored glow orbs */}
      <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-500 text-slate-950 flex items-center justify-center shrink-0 font-bold shadow-md shadow-emerald-500/30">
            <LayoutDashboard className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
                Step 6: Admin Dashboard &amp; Operations Center Active
              </span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[11px] text-indigo-200 font-medium">Real-Time PostgreSQL Metrics</span>
            </div>
            <p className="text-xs text-indigo-100 mt-1 max-w-2xl leading-relaxed">
              Full administrative visibility over trial bookings, mentor capacity tracking (2 classes max / IST day), booking cancellation with capacity release, and notification auditing.
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-1.5 text-xs font-bold bg-white/10 backdrop-blur-md text-emerald-200 px-3.5 py-2 rounded-xl border border-white/20 shadow-inner">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Admin &amp; Booking Active</span>
        </div>
      </div>
    </div>
  );
};

export default StepNotice;
