import React from 'react';
import { Clock, Sun, Sunset, Moon, Sparkles, AlertCircle, Users } from 'lucide-react';
import Badge from '../common/Badge';
import LoadingState from '../common/LoadingState';
import { DateTime } from 'luxon';

export const SlotPicker = ({
  selectedDate,
  selectedTimezone,
  selectedSlot,
  onSelectSlot,
  slots = [],
  isLoading = false,
  error = null,
  onRetry,
}) => {
  if (isLoading) {
    return <LoadingState message="Calculating real-time mentor availability & capacity across timezones..." />;
  }

  if (error) {
    return (
      <div className="text-center py-8 px-4 bg-rose-50/60 rounded-2xl border border-rose-200">
        <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
        <p className="text-xs text-rose-800 font-semibold mb-3">{error}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="text-xs font-bold text-rose-700 hover:text-rose-900 underline"
          >
            Try Refreshing Slots
          </button>
        )}
      </div>
    );
  }

  if (!slots || slots.length === 0) {
    return (
      <div className="text-center py-10 px-4 bg-gradient-to-br from-amber-50/80 via-orange-50/50 to-amber-100/60 rounded-3xl border-2 border-dashed border-amber-300 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-orange-500/25">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h4 className="text-base font-black text-amber-950 mb-1">No Available Mentors for this Date</h4>
        <p className="text-xs text-amber-900/80 max-w-md mx-auto mb-4 font-medium leading-relaxed">
          All 10 mentors have reached their maximum limit (2 trial classes / India calendar day) or have booked slots. Please select another date to view available times.
        </p>
      </div>
    );
  }

  // Categorize slots based on local hour
  const morningSlots = [];
  const afternoonSlots = [];
  const eveningSlots = [];

  slots.forEach((slot) => {
    const dt = DateTime.fromISO(slot.startAt, { zone: selectedTimezone });
    const hour = dt.hour;

    if (hour < 12) {
      morningSlots.push(slot);
    } else if (hour < 17) {
      afternoonSlots.push(slot);
    } else {
      eveningSlots.push(slot);
    }
  });

  const renderSlotGroup = (title, icon, colorTheme, groupSlots) => {
    if (groupSlots.length === 0) return null;
    const IconComponent = icon;

    const themeStyles = {
      morning: {
        badgeBg: 'bg-amber-100/80 text-amber-800 border-amber-200',
        iconColor: 'text-amber-600',
        slotDefault: 'border-amber-200/80 bg-gradient-to-b from-white to-amber-50/40 hover:border-amber-400 hover:bg-amber-50/60 text-slate-800',
      },
      afternoon: {
        badgeBg: 'bg-sky-100/80 text-sky-800 border-sky-200',
        iconColor: 'text-sky-600',
        slotDefault: 'border-sky-200/80 bg-gradient-to-b from-white to-sky-50/40 hover:border-sky-400 hover:bg-sky-50/60 text-slate-800',
      },
      evening: {
        badgeBg: 'bg-purple-100/80 text-purple-800 border-purple-200',
        iconColor: 'text-purple-600',
        slotDefault: 'border-purple-200/80 bg-gradient-to-b from-white to-purple-50/40 hover:border-purple-400 hover:bg-purple-50/60 text-slate-800',
      },
    };

    const currentTheme = themeStyles[colorTheme] || themeStyles.morning;

    return (
      <div className="space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-700">
          <div className={`p-1 rounded-lg ${currentTheme.badgeBg}`}>
            <IconComponent className={`w-3.5 h-3.5 ${currentTheme.iconColor}`} />
          </div>
          <span>{title}</span>
          <span className="text-[11px] font-bold text-slate-400">({groupSlots.length} available)</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {groupSlots.map((slot) => {
            const isSelected = selectedSlot?.startAt === slot.startAt;
            return (
              <button
                key={slot.startAt}
                type="button"
                onClick={() => onSelectSlot(slot)}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all duration-200 ${
                  isSelected
                    ? 'border-indigo-600 bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30 scale-[1.03] ring-2 ring-indigo-400 ring-offset-1'
                    : `${currentTheme.slotDefault} shadow-xs hover:scale-[1.01]`
                }`}
              >
                <span className={`text-sm font-extrabold ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                  {slot.localStartTime}
                </span>
                <span className={`text-[10px] font-semibold mt-0.5 ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`}>
                  {slot.istStartTime}
                </span>
                <div className={`mt-1.5 flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                }`}>
                  <Users className="w-2.5 h-2.5" />
                  <span>{slot.availableMentorCount} {slot.availableMentorCount === 1 ? 'mentor' : 'mentors'} free</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5 text-left">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <div className="p-1 rounded-md bg-indigo-100 text-indigo-700">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <span>Select 50-Min Trial Class Time</span>
            <span className="text-rose-500">*</span>
          </label>
          <p className="text-[11px] text-slate-500 font-medium">
            Showing real-time availability from PostgreSQL. Times adjust automatically to your local timezone.
          </p>
        </div>
        <Badge variant="success" size="sm" dot>
          Live PostgreSQL Engine
        </Badge>
      </div>

      <div className="space-y-4">
        {renderSlotGroup('Morning', Sun, 'morning', morningSlots)}
        {renderSlotGroup('Afternoon', Sunset, 'afternoon', afternoonSlots)}
        {renderSlotGroup('Evening & Night', Moon, 'evening', eveningSlots)}
      </div>
    </div>
  );
};

export default SlotPicker;
