import React, { useState } from 'react';
import {
  Sparkles,
  Check,
  X,
  CreditCard,
  ArrowLeft,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Calendar,
  Lock,
  Clock,
  Send,
  HelpCircle,
  Award,
} from 'lucide-react';
import Button from '../common/Button';
import { SUBSCRIPTION_PLANS } from '../../config/subscriptionPlans';
import { createSubscriptionIntent } from '../../services/api';

export const SubscriptionPlanModal = ({
  isOpen,
  onClose,
  parentEmail = '',
  parentName = '',
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [checkoutStep, setCheckoutStep] = useState('pricing'); // 'pricing' | 'checkout' | 'success'
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);
  const [createdSubscription, setCreatedSubscription] = useState(null);

  if (!isOpen) return null;

  const currentPlan = SUBSCRIPTION_PLANS.find((p) => p.id === selectedPlanId) || SUBSCRIPTION_PLANS[1];

  const handleSelectPlan = (planId) => {
    setSelectedPlanId(planId);
    setCheckoutError(null);
    setCheckoutStep('checkout');
  };

  const handleBackToPricing = () => {
    setCheckoutStep('pricing');
    setCheckoutError(null);
  };

  const handleContinueToPayment = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setCheckoutError(null);

    try {
      const payload = {
        parentName: parentName?.trim() || 'Parent / Student',
        parentEmail: parentEmail?.trim() || '',
        planId: currentPlan.id,
        phone: phone.trim(),
        notes: notes.trim(),
      };

      const res = await createSubscriptionIntent(payload);
      if (res.success && res.data) {
        setCreatedSubscription(res.data);
        setCheckoutStep('success');
      } else {
        throw new Error(res.message || 'Failed to initialize subscription checkout');
      }
    } catch (err) {
      setCheckoutError(err.message || 'Unable to process checkout. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseAndReset = () => {
    setCheckoutStep('pricing');
    setSelectedPlanId(null);
    setCheckoutError(null);
    setCreatedSubscription(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="subscription-modal-title"
    >
      <div className="bg-white w-full max-w-5xl my-auto max-h-[92vh] flex flex-col rounded-3xl shadow-2xl border border-indigo-100 text-left overflow-hidden relative">
        {/* Top Gradient Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-6 py-5 sm:py-6 shrink-0 relative">
          <button
            type="button"
            onClick={handleCloseAndReset}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all focus:outline-none focus:ring-2 focus:ring-amber-400"
            aria-label="Close subscription modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black uppercase tracking-wider border border-amber-500/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Paid Learning Memberships</span>
            </span>
            {parentEmail && (
              <span className="text-xs text-slate-300 bg-white/10 px-2.5 py-0.5 rounded-full font-mono">
                {parentEmail}
              </span>
            )}
          </div>

          <h2 id="subscription-modal-title" className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
            {checkoutStep === 'pricing' && 'Choose Your Codeyoung Learning Plan'}
            {checkoutStep === 'checkout' && 'Plan Confirmation & Demo Checkout'}
            {checkoutStep === 'success' && 'Subscription Order Initiated'}
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl font-normal">
            {checkoutStep === 'pricing' &&
              'Your free trial has already been claimed for this Gmail identity. Continue your child’s 1:1 STEM coding mentorship with one of our flexible plans.'}
            {checkoutStep === 'checkout' &&
              'Review your selected plan and student information before continuing to the payment gateway placeholder.'}
            {checkoutStep === 'success' &&
              'Your demo subscription record has been created in PostgreSQL.'}
          </p>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 lg:p-8 overflow-y-auto custom-scrollbar flex-1 bg-gradient-to-b from-indigo-50/20 via-white to-slate-50/40">
          {/* STEP 1: PRICING PLANS VIEW (3 Cards) */}
          {checkoutStep === 'pricing' && (
            <div className="space-y-6">
              {/* Notice Banner */}
              <div className="p-3.5 sm:p-4 bg-amber-50/90 border border-amber-200/90 rounded-2xl text-amber-950 flex items-start gap-3 text-xs leading-relaxed">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-extrabold text-amber-900 block">Single Free Trial Notice:</span>
                  <p className="text-amber-800 text-[11px] sm:text-xs">
                    Free trial classes are restricted to 1 per Gmail account. To schedule further 1:1 sessions, select an option below. Configurable example prices are shown for demonstration.
                  </p>
                </div>
              </div>

              {/* 3 Plans Responsive Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 items-stretch">
                {SUBSCRIPTION_PLANS.map((plan) => {
                  const isYearly = plan.id === 'yearly';
                  return (
                    <div
                      key={plan.id}
                      className={`flex flex-col justify-between rounded-3xl p-6 transition-all relative ${
                        isYearly
                          ? 'bg-gradient-to-b from-white via-indigo-50/30 to-purple-50/40 border-2 border-indigo-500 shadow-lg shadow-indigo-500/10 hover:shadow-xl hover:border-indigo-600'
                          : 'bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-indigo-300'
                      }`}
                    >
                      {/* Top Plan Header & Badge */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-black uppercase tracking-wider text-indigo-900">
                            {plan.name}
                          </span>
                          <span
                            className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                              isYearly
                                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs'
                                : 'bg-indigo-100 text-indigo-800'
                            }`}
                          >
                            {plan.badge}
                          </span>
                        </div>

                        {/* Prominent Large Price Font (40-52px on desktop) */}
                        <div className="py-2 border-b border-slate-100">
                          <div className="flex items-baseline gap-1.5 flex-wrap">
                            <span className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-none">
                              {plan.price}
                            </span>
                            <span className="text-xs sm:text-sm font-bold text-slate-500">
                              {plan.durationLabel}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-semibold mt-1">
                            Access Duration: {plan.durationDays} days
                          </p>
                        </div>

                        {/* Plan Summary Description */}
                        <p className="text-xs text-slate-600 leading-relaxed font-medium">
                          {plan.description}
                        </p>

                        {/* Features List */}
                        <div className="space-y-2.5 pt-2">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
                            Included Features
                          </span>
                          <ul className="space-y-2">
                            {plan.features.map((feature, idx) => (
                              <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-snug">
                                <div className="p-0.5 rounded-full bg-emerald-100 text-emerald-700 shrink-0 mt-0.5">
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                </div>
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Working Choose Plan Button */}
                      <div className="pt-6 mt-4 border-t border-slate-100">
                        <Button
                          type="button"
                          variant={isYearly ? 'primary' : 'outline'}
                          size="md"
                          onClick={() => handleSelectPlan(plan.id)}
                          icon={ArrowRight}
                          iconPosition="right"
                          className={`w-full font-extrabold text-xs shadow-xs ${
                            isYearly
                              ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-purple-700 text-white shadow-indigo-500/20'
                              : 'hover:border-indigo-600 hover:text-indigo-600'
                          }`}
                        >
                          Choose {plan.name}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Footer Actions */}
              <div className="pt-4 flex items-center justify-between border-t border-slate-200">
                <Button type="button" variant="outline" size="sm" onClick={handleCloseAndReset}>
                  Back to Booking Portal
                </Button>
                <span className="text-[11px] text-slate-400 font-medium">
                  Configurable mock pricing for recruitment review
                </span>
              </div>
            </div>
          )}

          {/* STEP 2: CHECKOUT & CONFIRMATION VIEW */}
          {checkoutStep === 'checkout' && (
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Back to Pricing Link */}
              <button
                type="button"
                onClick={handleBackToPricing}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors focus:outline-none"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Change Plan / Back to Pricing</span>
              </button>

              {/* Selected Plan Summary Card */}
              <div className="p-5 rounded-3xl bg-gradient-to-r from-indigo-50 via-white to-purple-50 border border-indigo-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block">
                      Selected Plan
                    </span>
                    <h3 className="text-xl font-black text-slate-900">
                      {currentPlan.name}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-slate-900">
                      {currentPlan.price}
                    </span>
                    <span className="text-xs text-slate-500 block font-semibold">
                      {currentPlan.durationLabel} ({currentPlan.durationDays} Days)
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-indigo-100 flex flex-wrap gap-2 text-xs text-slate-600">
                  <span className="font-semibold text-slate-500">Includes:</span>
                  <span>1:1 Mentor Learning Sessions</span>
                  <span>•</span>
                  <span>Mentor Schedule Access</span>
                  <span>•</span>
                  <span>Direct Notifications</span>
                </div>
              </div>

              {/* Demo Payment Notice */}
              <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-2xl text-amber-950 flex items-start gap-3 text-xs leading-relaxed">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-extrabold text-amber-900 block">Payment Integration Disclaimer:</span>
                  <p className="text-amber-900 text-[11px] sm:text-xs">
                    This project does not collect live credit card or payment credentials. Clicking <strong>Continue to Payment</strong> will create a pending demo subscription order in PostgreSQL without charging real funds.
                  </p>
                </div>
              </div>

              {checkoutError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium">
                  {checkoutError}
                </div>
              )}

              {/* Checkout Form */}
              <form onSubmit={handleContinueToPayment} className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Parent &amp; Student Checkout Details
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Parent Name</label>
                    <input
                      type="text"
                      readOnly
                      value={parentName || 'Parent / Student'}
                      className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-slate-800 font-semibold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Email Address (Gmail Account)</label>
                    <input
                      type="email"
                      readOnly
                      value={parentEmail || ''}
                      className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-slate-800 font-semibold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Contact Phone (Optional)</label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Student Age &amp; Goals</label>
                    <input
                      type="text"
                      placeholder="e.g. Grade 5 student, beginner Python"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between gap-3 flex-wrap">
                  <Button type="button" variant="outline" size="sm" onClick={handleBackToPricing}>
                    Back to Plans
                  </Button>

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    loading={isSubmitting}
                    disabled={isSubmitting}
                    icon={Lock}
                    iconPosition="left"
                    className="font-bold text-xs shadow-md"
                  >
                    {isSubmitting ? 'Processing Demo Order...' : `Continue to Payment (${currentPlan.price})`}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 3: SUCCESSFUL DEMO INTENT SCREEN */}
          {checkoutStep === 'success' && createdSubscription && (
            <div className="max-w-xl mx-auto text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl mx-auto flex items-center justify-center shadow-xs">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Demo Intent Recorded in Database
                </span>
                <h3 className="text-2xl font-black text-slate-900 pt-1">
                  Subscription Order Created
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
                  Subscription reference <strong>{createdSubscription.subscriptionId}</strong> has been saved with status <code>pending_payment</code>.
                </p>
              </div>

              {/* Order Receipt Details Card */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2 text-left max-w-md mx-auto">
                <div className="flex justify-between text-slate-600">
                  <span>Subscription ID:</span>
                  <span className="font-mono font-bold text-slate-900">{createdSubscription.subscriptionId}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Plan:</span>
                  <span className="font-bold text-slate-900">{createdSubscription.planName}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Duration:</span>
                  <span className="font-bold text-slate-900">{createdSubscription.durationDays} Days</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Price:</span>
                  <span className="font-bold text-indigo-700">{createdSubscription.priceFormatted}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Payment Status:</span>
                  <span className="font-bold text-amber-600 uppercase text-[10px] bg-amber-100 px-2 py-0.5 rounded">
                    {createdSubscription.paymentStatus}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Account Email:</span>
                  <span className="font-bold text-slate-900 truncate max-w-[200px]">{createdSubscription.parentEmail}</span>
                </div>
              </div>

              <div className="pt-3">
                <Button size="md" variant="primary" onClick={handleCloseAndReset} className="font-bold text-xs">
                  Return to Booking Portal
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlanModal;
