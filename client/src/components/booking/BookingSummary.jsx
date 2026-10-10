import React from 'react';
import { Calendar, Clock, User, Mail, Globe, Video, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { formatDateInZone } from '../../utils/timezones';

export const BookingSummary = ({
  parentName,
  parentEmail,
  selectedDate,
  selectedTimezone,
  selectedSlot,
  isTrialClaimed = false,
  onOpenSubscriptionModal,
  onOpenSubscription,
  onSubmitBooking,
  isSubmitting = false,
}) => {
  const handleOpenSubscription = onOpenSubscriptionModal || onOpenSubscription;
  const isComplete = Boolean(parentName?.trim() && parentEmail?.trim() && selectedDate && selectedSlot);

  return (
    <Card
      className="sticky top-24 border-indigo-200/80 shadow-card bg-gradient-to-b from-white via-indigo-50/20 to-white"
      header={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 shadow-xs" />
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Booking Summary</h3>
          </div>
          <Badge variant={isTrialClaimed ? 'danger' : isComplete ? 'success' : 'primary'} size="sm" dot={isComplete}>
            {isTrialClaimed ? 'Trial Used' : isComplete ? 'Ready to Confirm' : 'In Progress'}
          </Badge>
        </div>
      }
    >
      <div className="space-y-4 text-left">
        {/* Parent Details */}
        <div className="p-3.5 bg-gradient-to-r from-indigo-50/60 to-purple-50/60 rounded-2xl space-y-2 text-xs border border-indigo-100/80">
          <div className="flex items-center gap-2.5 text-slate-700">
            <div className="p-1 rounded-md bg-indigo-100 text-indigo-700 shrink-0">
              <User className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-500">Parent:</span>
            <span className="font-extrabold text-slate-900 truncate">
              {parentName?.trim() || <em className="text-slate-400 font-normal">Not entered yet</em>}
            </span>
          </div>

          <div className="flex items-center gap-2.5 text-slate-700">
            <div className="p-1 rounded-md bg-purple-100 text-purple-700 shrink-0">
              <Mail className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-500">Email:</span>
            <span className="font-extrabold text-slate-900 truncate">
              {parentEmail?.trim() || <em className="text-slate-400 font-normal">Not entered yet</em>}
            </span>
          </div>
        </div>

        {/* Schedule & Timezone Details */}
        <div className="p-3.5 bg-gradient-to-r from-sky-50/60 to-blue-50/60 rounded-2xl space-y-2.5 text-xs border border-sky-100/80">
          <div className="flex items-center gap-2.5 text-slate-700">
            <div className="p-1 rounded-md bg-sky-100 text-sky-700 shrink-0">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-500">Date:</span>
            <span className="font-extrabold text-slate-900">
              {selectedDate ? formatDateInZone(selectedDate, selectedTimezone) : <em className="text-slate-400 font-normal">Select a date</em>}
            </span>
          </div>

          <div className="flex items-center gap-2.5 text-slate-700">
            <div className="p-1 rounded-md bg-blue-100 text-blue-700 shrink-0">
              <Globe className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-500">Timezone:</span>
            <span className="font-extrabold text-slate-900 truncate">
              {selectedTimezone}
            </span>
          </div>

          <div className="flex items-center gap-2.5 text-slate-700">
            <div className="p-1 rounded-md bg-emerald-100 text-emerald-700 shrink-0">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-500">Your Time:</span>
            <span className="font-extrabold text-slate-900">
              {selectedSlot ? (
                <span className="text-indigo-700 font-black bg-white px-2.5 py-0.5 rounded-lg border border-indigo-200 shadow-xs">
                  {selectedSlot.localStartTime} - {selectedSlot.localEndTime}
                </span>
              ) : (
                <em className="text-slate-400 font-normal">Select a time slot</em>
              )}
            </span>
          </div>

          {selectedSlot?.istStartTime && (
            <div className="pt-2 border-t border-sky-200/60 flex items-center justify-between text-[11px] text-slate-600">
              <span className="font-medium">Mentor Time (India):</span>
              <span className="font-extrabold text-indigo-900 bg-white px-2 py-0.5 rounded border border-indigo-100">
                {selectedSlot.istStartTime} - {selectedSlot.istEndTime}
              </span>
            </div>
          )}
        </div>

        {/* Business Rules & Safe Dispatches */}
        <div className="space-y-2 text-[11px] text-slate-600">
          <div className="flex items-start gap-2 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100">
            <Video className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span className="leading-snug">Instant 1:1 demo classroom link provided upon reservation.</span>
          </div>
          <div className="flex items-start gap-2 bg-indigo-50/70 p-2.5 rounded-xl border border-indigo-100">
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <span className="leading-snug">1 Free Trial per Gmail account. Auto-assigns from 10 active mentors (max 2/day).</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          {isTrialClaimed ? (
            <div className="space-y-2">
              <button
                id="explore-paid-plans-btn"
                type="button"
                onClick={handleOpenSubscription}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white font-extrabold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Explore Paid Subscription Plans</span>
              </button>
              <p className="text-[11px] text-rose-600 text-center font-bold">
                Free trial has already been claimed for this Gmail identity.
              </p>
            </div>
          ) : (
            <>
              <Button
                type="button"
                variant="accent"
                size="lg"
                disabled={!isComplete || isSubmitting}
                loading={isSubmitting}
                onClick={onSubmitBooking}
                icon={ArrowRight}
                iconPosition="right"
                className="w-full shadow-lg shadow-orange-500/25"
              >
                {isSubmitting ? 'Confirming Trial Slot...' : 'Confirm Trial Class Booking'}
              </Button>

              {!isComplete && (
                <p className="text-[11px] text-slate-400 text-center mt-2 font-medium">
                  Please complete all steps above to confirm.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </Card>
  );
};

export default BookingSummary;
