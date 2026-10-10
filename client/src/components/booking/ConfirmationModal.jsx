import React from 'react';
import { CheckCircle, X, Calendar, Clock, Globe, User, Mail, Video, ShieldCheck, Code, Sparkles } from 'lucide-react';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { formatDateInZone, convertTimeBetweenZones } from '../../utils/timezones';

export const ConfirmationModal = ({
  isOpen,
  onClose,
  parentName,
  parentEmail,
  selectedDate,
  selectedTimezone,
  selectedSlot,
}) => {
  if (!isOpen || !selectedSlot) return null;

  const istDetails = convertTimeBetweenZones(
    selectedDate,
    selectedSlot.istTime,
    'Asia/Kolkata',
    'Asia/Kolkata'
  );

  const payloadPreview = {
    parentName,
    parentEmail,
    date: selectedDate,
    slotId: selectedSlot.id,
    istTime: selectedSlot.istTime,
    clientTimezone: selectedTimezone,
    clientLocalTime: selectedSlot.displayTime,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-indigo-100 overflow-hidden text-left">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-950 text-white p-6 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center shadow-md shadow-orange-500/30 font-extrabold">
              <Sparkles className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Trial Class Booking Review</h3>
              <p className="text-xs text-indigo-200 font-medium">Step 1 Verification & Prepared Payload</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-3.5 text-xs text-amber-950 font-medium">
            <span className="font-extrabold text-amber-900">Step 1 Preview:</span> All fields validated successfully. In Step 2, this payload will submit to the backend API to reserve a mentor slot and dispatch the demo class email.
          </div>

          <div className="space-y-2.5 text-xs text-slate-700 bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-bold">Student / Parent:</span>
              <span className="font-extrabold text-slate-900">{parentName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-bold">Email:</span>
              <span className="font-extrabold text-slate-900">{parentEmail}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-bold">Selected Date:</span>
              <span className="font-extrabold text-slate-900">{formatDateInZone(selectedDate, selectedTimezone)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-bold">Parent Timezone:</span>
              <span className="font-extrabold text-slate-900">{selectedTimezone}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-bold">Parent Local Time:</span>
              <span className="font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">{selectedSlot.displayTime} ({selectedSlot.targetZoneShort || 'Local'})</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500 font-bold">Mentor Time (IST):</span>
              <span className="font-extrabold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">{istDetails.targetTime} IST</span>
            </div>
          </div>

          {/* JSON Payload Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              <Code className="w-3.5 h-3.5 text-indigo-500" />
              <span>Prepared Request Payload</span>
            </div>
            <pre className="text-[11px] bg-slate-900 text-indigo-300 p-3 rounded-2xl overflow-x-auto font-mono border border-slate-800">
              {JSON.stringify(payloadPreview, null, 2)}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end">
          <Button variant="primary" onClick={onClose}>
            Close Preview
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
