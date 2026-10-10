import React from 'react';
import {
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  ShieldCheck,
  CalendarDays,
} from 'lucide-react';

export const AdminMentorsOverview = ({
  mentorData,
  selectedDate,
  onDateChange,
  isLoading,
}) => {
  const mentors = mentorData?.mentors || [];
  const maxCapacity = mentorData?.maxDailyCapacity || 2;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Header & Date Selector */}
      <div className="p-4 sm:p-6 border-b border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              Mentor Daily Capacity &amp; Schedule
            </h3>
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
              Asia/Kolkata (IST) Day
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Rule Enforced: Maximum 2 trial classes per mentor on any India calendar day (00:00 to 23:59 IST)
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <CalendarDays className="w-4 h-4 text-purple-600" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="text-xs px-3 py-2 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-bold text-slate-800 shadow-2xs"
          />
        </div>
      </div>

      {/* Mentors Grid */}
      <div className="p-4 sm:p-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-44 rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : mentors.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-600">No mentors found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mentors.map((mentor) => {
              const isFull = mentor.isCapacityFull;
              const bookedCount = mentor.bookedCountToday;
              const remaining = mentor.remainingCapacity;

              return (
                <div
                  key={mentor.id}
                  className={`rounded-2xl p-4 sm:p-5 border transition-all flex flex-col justify-between ${
                    isFull
                      ? 'bg-amber-50/40 border-amber-200 shadow-2xs'
                      : 'bg-white border-slate-200/80 shadow-xs hover:border-indigo-300'
                  }`}
                >
                  <div>
                    {/* Top Row: Name and Status */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                          <span>{mentor.name}</span>
                          <span className="w-2 h-2 rounded-full bg-emerald-500" title="Active Mentor" />
                        </h4>
                        <p className="text-[11px] text-slate-500 font-medium truncate max-w-[180px]">
                          {mentor.email}
                        </p>
                      </div>

                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isFull
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isFull ? 'Capacity Full' : `${remaining} Slot(s) Left`}
                      </span>
                    </div>

                    {/* Capacity Progress Bar */}
                    <div className="space-y-1.5 mb-3">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-slate-500">Daily Load (IST Day):</span>
                        <span className={isFull ? 'text-amber-700' : 'text-slate-700'}>
                          {bookedCount} / {maxCapacity} Classes
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isFull
                              ? 'bg-amber-500 w-full'
                              : bookedCount === 1
                              ? 'bg-indigo-500 w-1/2'
                              : 'w-0'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Booked Appointments for Date */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                        Appointments for {selectedDate}:
                      </span>
                      {mentor.appointments.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic">No bookings on this day yet.</p>
                      ) : (
                        <div className="space-y-1">
                          {mentor.appointments.map((app) => (
                            <div
                              key={app.id}
                              className="text-[11px] bg-slate-50 p-2 rounded-xl border border-slate-200/60 flex items-center justify-between"
                            >
                              <div className="truncate mr-2">
                                <span className="font-extrabold text-slate-800 block truncate">
                                  {app.parentName}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400">
                                  {app.bookingReference}
                                </span>
                              </div>
                              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded shrink-0">
                                {app.istTime.split('(')[0]}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMentorsOverview;
