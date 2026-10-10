import React, { useState } from 'react';
import { AlertTriangle, XCircle, X } from 'lucide-react';
import Button from '../common/Button';

export const AdminCancelModal = ({
  isOpen,
  onClose,
  booking,
  onConfirmCancel,
  isProcessing,
}) => {
  const [reason, setReason] = useState('');

  if (!isOpen || !booking) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirmCancel(booking.id || booking.bookingReference, reason);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-red-100 overflow-hidden text-left">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/20 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Cancel Trial Booking</h3>
              <p className="text-xs text-red-100 mt-0.5">
                Ref: {booking.bookingReference}
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500 font-bold">Parent / Student:</span>
              <span className="font-extrabold text-slate-800">{booking.parentName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-bold">Assigned Mentor:</span>
              <span className="font-extrabold text-purple-900">{booking.mentor?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-bold">Parent Local Time:</span>
              <span className="font-bold text-indigo-700">{booking.parentLocalTime}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Reason for Cancellation (Optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Parent requested reschedule, Student unavailable, Mentor emergency..."
              rows={3}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none font-medium"
            />
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 font-medium">
            <strong>Capacity Effect:</strong> Cancelling this booking releases the mentor's daily capacity slot on this India calendar day immediately for new bookings.
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isProcessing}
            >
              Back / Keep Booking
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white shadow-sm border-0"
              isLoading={isProcessing}
            >
              Confirm Cancellation
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminCancelModal;
