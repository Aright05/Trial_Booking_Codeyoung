import React from 'react';
import { Globe2, Clock, Sparkles } from 'lucide-react';
import { SUPPORTED_TIMEZONES, getTimezoneDisplayInfo } from '../../utils/timezones';

export const TimezoneSelector = ({
  selectedTimezone,
  onChange,
  className = '',
}) => {
  const currentZoneInfo = getTimezoneDisplayInfo(selectedTimezone);

  return (
    <div className={`space-y-2 text-left ${className}`}>
      <div className="flex items-center justify-between">
        <label htmlFor="timezone-select" className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <div className="p-1 rounded-md bg-indigo-100 text-indigo-700">
            <Globe2 className="w-3.5 h-3.5" />
          </div>
          <span>Your Local Timezone</span>
          <span className="text-rose-500">*</span>
        </label>
        <span className="text-xs text-indigo-900 bg-indigo-50 border border-indigo-100/80 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5 shadow-xs">
          <Clock className="w-3 h-3 text-indigo-600" />
          <span>Current: <strong className="text-indigo-700">{currentZoneInfo.formattedCurrentTime}</strong></span>
        </span>
      </div>

      <div className="relative">
        <select
          id="timezone-select"
          value={selectedTimezone}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-xl border border-indigo-200/80 bg-white px-3.5 py-2.5 pr-10 text-sm font-semibold text-slate-900 shadow-xs transition-all duration-150 hover:border-indigo-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        >
          {SUPPORTED_TIMEZONES.map((tz) => (
            <option key={tz.id} value={tz.id}>
              {tz.name} — {tz.city}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-indigo-500">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      <div className="flex items-center justify-between px-3.5 py-2 bg-gradient-to-r from-indigo-50/90 via-purple-50/50 to-blue-50/90 rounded-xl border border-indigo-100 text-xs text-indigo-950">
        <div className="flex items-center gap-1.5 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span>
            Timezone Offset: <span className="font-bold text-indigo-900">{currentZoneInfo.offset}</span>
          </span>
        </div>
        {currentZoneInfo.isDST && (
          <span className="text-[11px] bg-amber-100 text-amber-800 font-extrabold px-2 py-0.5 rounded-md border border-amber-200">
            Daylight Saving Active
          </span>
        )}
      </div>
    </div>
  );
};

export default TimezoneSelector;
