import React from 'react';
import { User, Mail, Calendar, RefreshCw, AlertCircle } from 'lucide-react';
import Card from '../common/Card';
import Input from '../common/Input';
import TimezoneSelector from './TimezoneSelector';
import SlotPicker from './SlotPicker';
import { DateTime } from 'luxon';

export const BookingForm = ({
  parentName,
  onNameChange,
  parentEmail,
  onEmailChange,
  selectedTimezone,
  onTimezoneChange,
  selectedDate,
  onDateChange,
  selectedSlot,
  onSelectSlot,
  availableSlots,
  isSlotsLoading,
  slotsError,
  onRefreshSlots,
  isCheckingEligibility = false,
  isTrialClaimed = false,
  eligibilityMessage = null,
  onOpenSubscriptionModal,
  conflictError,
  errors = {},
}) => {
  const minDate = DateTime.now().setZone(selectedTimezone).toISODate();
  const maxDate = DateTime.now().setZone(selectedTimezone).plus({ days: 30 }).toISODate();

  return (
    <div className="space-y-6">
      {/* Conflict Error Alert */}
      {conflictError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-900 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold">Scheduling Conflict</p>
            <p className="mt-0.5 leading-relaxed">{conflictError}</p>
          </div>
        </div>
      )}

      {/* Step 1: Parent Information Card */}
      <Card
        className="border-indigo-100/90 shadow-card hover:border-indigo-200 transition-all"
        header={
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white text-xs font-black shadow-sm shadow-indigo-500/30">
                1
              </span>
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Parent & Student Details
              </h3>
            </div>
            <span className="text-xs text-indigo-600 font-semibold bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
              Step 1 of 3
            </span>
          </div>
        }
      >
        <div className="space-y-4">
          {/* 1 Free Trial Notice Banner */}
          <div className="p-3 bg-gradient-to-r from-indigo-50/80 via-purple-50/80 to-amber-50/80 rounded-xl border border-indigo-100 flex items-start gap-2.5 text-xs text-slate-700">
            <span className="p-1 rounded-lg bg-indigo-600 text-white font-black text-[10px] shrink-0 mt-0.5">
              1 TRIAL
            </span>
            <div className="space-y-0.5">
              <span className="font-extrabold text-slate-900 block">Single Free Trial Policy:</span>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Each parent can use exactly <strong>one free trial per Gmail account</strong> (including dot variations and plus-tags).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="parent-name"
              name="parentName"
              label="Parent / Guardian Name"
              placeholder="e.g. Sarah Jenkins"
              icon={User}
              required
              value={parentName}
              onChange={(e) => onNameChange(e.target.value)}
              error={errors.parentName}
            />

            <div>
              <Input
                id="parent-email"
                name="parentEmail"
                label="Email Address"
                type="email"
                placeholder="e.g. sarah.jenkins@gmail.com"
                icon={Mail}
                required
                value={parentEmail}
                onChange={(e) => onEmailChange(e.target.value)}
                error={errors.parentEmail}
                helperText="We will send your 1:1 Google Meet demo link to this address."
              />

              {/* Real-time eligibility feedback */}
              {isCheckingEligibility && (
                <p className="text-[11px] text-indigo-600 font-semibold mt-1 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Checking free trial eligibility...</span>
                </p>
              )}

              {!isCheckingEligibility && isTrialClaimed && (
                <div className="mt-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs space-y-2 animate-in fade-in">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold block">Free Trial Already Used</span>
                      <p className="text-[11px] text-rose-800 leading-snug mt-0.5">
                        {eligibilityMessage || 'A free trial has already been claimed for this Gmail identity.'}
                      </p>
                    </div>
                  </div>
                  {onOpenSubscriptionModal && (
                    <button
                      type="button"
                      onClick={onOpenSubscriptionModal}
                      className="w-full text-center px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[11px] shadow-xs transition-all"
                    >
                      View Monthly Subscription Plans &amp; Enquire
                    </button>
                  )}
                </div>
              )}

              {!isCheckingEligibility && !isTrialClaimed && parentEmail && parentEmail.includes('@') && (
                <p className="text-[11px] text-emerald-700 font-bold mt-1 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Eligible for 1 Free Trial Class</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Step 2: Timezone & Date Card */}
      <Card
        className="border-sky-100/90 shadow-card hover:border-sky-200 transition-all"
        header={
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white text-xs font-black shadow-sm shadow-sky-500/30">
                2
              </span>
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Timezone & Date Selection
              </h3>
            </div>
            <span className="text-xs text-sky-600 font-semibold bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-100">
              Step 2 of 3
            </span>
          </div>
        }
      >
        <div className="space-y-5">
          <TimezoneSelector
            selectedTimezone={selectedTimezone}
            onChange={onTimezoneChange}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
            <Input
              id="booking-date"
              name="bookingDate"
              label="Select Trial Date"
              type="date"
              icon={Calendar}
              min={minDate}
              max={maxDate}
              required
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              error={errors.selectedDate}
              helperText="Bookings open up to 30 days in advance."
            />

            <div className="flex flex-col justify-end">
              <div className="p-3 bg-gradient-to-r from-emerald-50/70 to-teal-50/70 rounded-xl border border-emerald-200/80 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-emerald-950">Live Capacity Status</p>
                  <p className="text-[11px] text-emerald-800/80 font-medium">
                    {availableSlots?.length || 0} time slots open today
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onRefreshSlots}
                  disabled={isSlotsLoading}
                  className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-bold bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 shadow-xs transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isSlotsLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Step 3: Available Slots Card */}
      <Card
        className="border-orange-100/90 shadow-card hover:border-orange-200 transition-all"
        header={
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-gradient-to-tr from-tangerine-500 to-amber-500 text-white text-xs font-black shadow-sm shadow-orange-500/30">
                3
              </span>
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Available Mentor Slots
              </h3>
            </div>
            {errors.selectedSlot && (
              <span className="text-xs text-rose-600 font-bold">{errors.selectedSlot}</span>
            )}
          </div>
        }
      >
        <SlotPicker
          selectedDate={selectedDate}
          selectedTimezone={selectedTimezone}
          selectedSlot={selectedSlot}
          onSelectSlot={onSelectSlot}
          slots={availableSlots}
          isLoading={isSlotsLoading}
          error={slotsError}
          onRetry={onRefreshSlots}
        />
      </Card>
    </div>
  );
};

export default BookingForm;
