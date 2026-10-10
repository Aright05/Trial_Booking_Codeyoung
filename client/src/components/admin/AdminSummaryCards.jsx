import React from 'react';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Users,
  Bell,
  AlertTriangle,
  MailCheck,
} from 'lucide-react';

export const AdminSummaryCards = ({ stats, isLoading }) => {
  if (isLoading && !stats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-2xl bg-white/70 animate-pulse border border-slate-200/80 p-4"
          />
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: 'Total Bookings',
      value: stats?.totalBookings ?? 0,
      icon: Calendar,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      badge: 'All Time',
    },
    {
      label: 'Confirmed Classes',
      value: stats?.confirmedBookings ?? 0,
      icon: CheckCircle2,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      badge: 'Active Capacity',
    },
    {
      label: 'Cancelled Classes',
      value: stats?.cancelledBookings ?? 0,
      icon: XCircle,
      color: 'text-slate-600 bg-slate-100 border-slate-200',
      badge: 'Capacity Released',
    },
    {
      label: 'Active Mentors',
      value: stats?.activeMentors ?? 10,
      icon: Users,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      badge: 'Max 2 / IST Day',
    },
    {
      label: 'Notification Status',
      value: stats?.notifications?.sent ?? 0,
      icon: MailCheck,
      color: stats?.notifications?.attentionRequired > 0 ? 'text-amber-600 bg-amber-50 border-amber-200' : 'text-teal-600 bg-teal-50 border-teal-200',
      badge: stats?.notifications?.attentionRequired > 0 ? `${stats.notifications.attentionRequired} Need Attention` : 'All Dispatched',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4 mb-8">
      {cards.map((card, idx) => {
        const IconComponent = card.icon;
        return (
          <div
            key={idx}
            className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-xl border ${card.color}`}>
                <IconComponent className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {card.badge}
              </span>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {card.value}
              </p>
              <p className="text-xs font-bold text-slate-500 mt-0.5">{card.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AdminSummaryCards;
