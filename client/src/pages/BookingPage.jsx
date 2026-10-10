import React from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import StepNotice from '../components/booking/StepNotice';
import BookingForm from '../components/booking/BookingForm';
import BookingSummary from '../components/booking/BookingSummary';
import BookingSuccessModal from '../components/booking/BookingSuccessModal';
import SubscriptionPlanModal from '../components/booking/SubscriptionPlanModal';
import { useBookingState } from '../hooks/useBookingState';
import { Sparkles, CalendarCheck, Shield, Clock, Video } from 'lucide-react';

export const BookingPage = ({ onNavigate }) => {
  const {
    parentName,
    setParentName,
    parentEmail,
    setParentEmail,
    selectedTimezone,
    handleTimezoneChange,
    selectedDate,
    handleDateChange,
    selectedSlot,
    handleSlotSelect,
    availableSlots,
    isSlotsLoading,
    slotsError,
    refreshSlots,
    formErrors,
    isSubmitting,
    bookingConflictError,
    confirmedBooking,
    successModalOpen,
    setSuccessModalOpen,
    handleSubmitBooking,
    isCheckingEligibility,
    isTrialClaimed,
    eligibilityMessage,
    subscriptionModalOpen,
    setSubscriptionModalOpen,
  } = useBookingState();

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] bg-mesh-pattern">
      <Header currentView="booking" onNavigate={onNavigate} />


      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Step 3 Project Stage Notification */}
        <StepNotice />

        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-100 via-orange-100 to-amber-100 border border-amber-300/80 text-amber-900 text-xs font-black uppercase tracking-wider shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-orange-600 animate-spin" />
            <span>K-12 Coding & STEM Excellence</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
            Book Your Child's Free{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-tangerine-500 bg-clip-text text-transparent">
              1:1 Trial Class
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium max-w-2xl mx-auto">
            Connect with certified STEM & coding mentors across India, UK, and US timezones. 
            Smart automated timezone conversion with instant demo link delivery.
          </p>

          {/* Value Props - Colorful Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-xs font-bold text-slate-800">
            <div className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-white border border-indigo-100 shadow-sm hover:border-indigo-300 transition-all">
              <div className="p-1.5 rounded-xl bg-indigo-50 text-indigo-600">
                <CalendarCheck className="w-4 h-4" />
              </div>
              <span>10 Mentors</span>
            </div>

            <div className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-white border border-amber-100 shadow-sm hover:border-amber-300 transition-all">
              <div className="p-1.5 rounded-xl bg-amber-50 text-amber-600">
                <Clock className="w-4 h-4" />
              </div>
              <span>Smart Time Sync</span>
            </div>

            <div className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-white border border-emerald-100 shadow-sm hover:border-emerald-300 transition-all">
              <div className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600">
                <Video className="w-4 h-4" />
              </div>
              <span>Instant Link</span>
            </div>

            <div className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-white border border-purple-100 shadow-sm hover:border-purple-300 transition-all">
              <div className="p-1.5 rounded-xl bg-purple-50 text-purple-600">
                <Shield className="w-4 h-4" />
              </div>
              <span>100% Free Trial</span>
            </div>
          </div>
        </div>

        {/* Main Booking Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form & Slot Selection */}
          <div className="lg:col-span-8">
            <BookingForm
              parentName={parentName}
              onNameChange={setParentName}
              parentEmail={parentEmail}
              onEmailChange={setParentEmail}
              selectedTimezone={selectedTimezone}
              onTimezoneChange={handleTimezoneChange}
              selectedDate={selectedDate}
              onDateChange={handleDateChange}
              selectedSlot={selectedSlot}
              onSelectSlot={handleSlotSelect}
              availableSlots={availableSlots}
              isSlotsLoading={isSlotsLoading}
              slotsError={slotsError}
              onRefreshSlots={refreshSlots}
              conflictError={bookingConflictError}
              errors={formErrors}
              isCheckingEligibility={isCheckingEligibility}
              isTrialClaimed={isTrialClaimed}
              eligibilityMessage={eligibilityMessage}
              onOpenSubscription={() => setSubscriptionModalOpen(true)}
            />
          </div>

          {/* Right Column: Sticky Booking Summary */}
          <div className="lg:col-span-4">
            <BookingSummary
              parentName={parentName}
              parentEmail={parentEmail}
              selectedDate={selectedDate}
              selectedTimezone={selectedTimezone}
              selectedSlot={selectedSlot}
              onSubmitBooking={handleSubmitBooking}
              isSubmitting={isSubmitting}
              isTrialClaimed={isTrialClaimed}
              onOpenSubscription={() => setSubscriptionModalOpen(true)}
            />
          </div>
        </div>
      </main>

      {/* Booking Confirmation Success Modal */}
      <BookingSuccessModal
        isOpen={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        booking={confirmedBooking}
      />

      {/* Subscription Plan & Enquiry Modal for already claimed trials */}
      <SubscriptionPlanModal
        isOpen={subscriptionModalOpen}
        onClose={() => setSubscriptionModalOpen(false)}
        parentEmail={parentEmail}
        parentName={parentName}
      />

      <Footer />
    </div>
  );
};

export default BookingPage;

