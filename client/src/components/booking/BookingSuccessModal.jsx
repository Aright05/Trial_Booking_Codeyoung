import React, { useState } from 'react';
import {
  CheckCircle2,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  Clock,
  User,
  Mail,
  Video,
  ShieldCheck,
  Send,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import Button from '../common/Button';

export const BookingSuccessModal = ({
  isOpen,
  onClose,
  booking,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !booking) return null;

  const handleCopyLink = () => {
    if (booking.demoClassLink) {
      navigator.clipboard.writeText(booking.demoClassLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const notification = booking.notification || {};
  const parentNotif = notification.parent || {};
  const mentorNotif = notification.mentor || {};

  const getStatusBadge = (status) => {
    if (status === 'sent') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>Sent</span>
        </span>
      );
    }
    if (status === 'failed') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
          <AlertCircle className="w-3 h-3 text-amber-600" />
          <span>Delivery Delayed / Retry Queued</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
        <Send className="w-3 h-3 text-indigo-500 animate-pulse" />
        <span>Pending Dispatch</span>
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border border-indigo-100 text-left custom-scrollbar">
        {/* Top celebratory header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 text-white p-6 relative">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center shadow-lg font-black border border-white/30">
              <CheckCircle2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-black uppercase tracking-wider mb-1">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Confirmed &amp; Reserved in PostgreSQL</span>
              </div>
              <h3 className="text-xl font-black text-white">Trial Class Booked Successfully!</h3>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Reference & Mentor Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 gap-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700">Booking Reference</span>
              <p className="text-base font-black font-mono text-indigo-950">{booking.bookingReference}</p>
            </div>
            
            <div className="flex items-center gap-2.5 sm:text-right">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-xs ring-2 ring-white">
                {booking.mentor?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'MN'}
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 block">Assigned STEM Mentor</span>
                <p className="text-sm font-extrabold text-purple-950">{booking.mentor?.name || 'Assigned Mentor'}</p>
                <p className="text-[11px] font-mono text-slate-500 font-semibold">{booking.mentor?.email || 'mentor@codeyoung.test'}</p>
              </div>
            </div>
          </div>

          {/* Time & Parent Details */}
          <div className="space-y-2.5 text-xs text-slate-700 bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-bold flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Parent / Student:</span>
              </span>
              <span className="font-extrabold text-slate-900">{booking.parentName}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-bold flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Email Address:</span>
              </span>
              <span className="font-extrabold text-slate-900">{booking.parentEmail}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-bold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span>Your Local Time:</span>
              </span>
              <span className="font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                {booking.parentLocalTime}
              </span>
            </div>

            <div className="flex justify-between py-1">
              <span className="text-slate-500 font-bold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-purple-600" />
                <span>Mentor India Time:</span>
              </span>
              <span className="font-extrabold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                {booking.mentorLocalTime}
              </span>
            </div>
          </div>

          {/* Demo Meeting Link Section */}
          <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200/90 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                <Video className="w-4 h-4 text-emerald-600" />
                <span>1:1 Live Demo Class Meeting Link</span>
              </span>
              <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                Active &amp; Persistent
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={booking.demoClassLink}
                className="flex-1 bg-white border border-emerald-200 text-xs font-mono text-emerald-900 px-3 py-2 rounded-xl focus:outline-none select-all"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shrink-0 shadow-sm"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-emerald-800 font-medium">
              This is a secure 1:1 demonstration classroom link. Please join 5 minutes before your scheduled class.
            </p>
          </div>

          {/* Email Delivery Status Card */}
          <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-indigo-600" />
                <span>Email Notification Status</span>
              </span>
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide">
                Nodemailer Engine
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {/* Parent Email Status */}
              <div className="bg-white p-2.5 rounded-xl border border-indigo-100/80 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 block">Parent Confirmation:</span>
                  <span className="text-[11px] text-slate-800 font-semibold truncate block max-w-[140px]">
                    {booking.parentEmail}
                  </span>
                </div>
                <div>{getStatusBadge(parentNotif.status || notification.status)}</div>
              </div>

              {/* Mentor Email Status */}
              <div className="bg-white p-2.5 rounded-xl border border-indigo-100/80 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 block">Mentor Alert:</span>
                  <span className="text-[11px] text-slate-800 font-semibold truncate block max-w-[140px]">
                    {booking.mentor?.name || 'Assigned Mentor'}
                  </span>
                </div>
                <div>{getStatusBadge(mentorNotif.status || notification.status)}</div>
              </div>
            </div>

            {/* Test Sandbox Preview Links if Ethereal sandbox used */}
            {(parentNotif.previewUrl || mentorNotif.previewUrl) && (
              <div className="pt-1 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-indigo-900">Sandbox Previews:</span>
                {parentNotif.previewUrl && (
                  <a
                    href={parentNotif.previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold rounded-lg transition-all shadow-2xs"
                  >
                    <span>Parent Email Preview</span>
                    <ExternalLink className="w-3 h-3 text-indigo-500" />
                  </a>
                )}
                {mentorNotif.previewUrl && (
                  <a
                    href={mentorNotif.previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-purple-50 border border-purple-200 text-purple-700 text-[11px] font-bold rounded-lg transition-all shadow-2xs"
                  >
                    <span>Mentor Email Preview</span>
                    <ExternalLink className="w-3 h-3 text-purple-500" />
                  </a>
                )}
              </div>
            )}

            {/* Reassurance Notice */}
            <div className="flex items-start gap-1.5 text-[11px] text-indigo-800/80 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
              <span>
                Your slot is 100% reserved and confirmed in PostgreSQL. If email dispatch is delayed, your booking reference and meeting link above remain valid.
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={onClose}>
            Done / Book Another
          </Button>

          <a
            href={booking.demoClassLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-md"
          >
            <span>Open Demo Room</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccessModal;
