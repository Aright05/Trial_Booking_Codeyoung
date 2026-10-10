import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  X,
  CreditCard,
  MessageSquare,
  ShieldAlert,
  Send,
  HelpCircle,
  Clock,
  BookOpen,
  Award,
} from 'lucide-react';
import Button from '../common/Button';

export const SubscriptionPlanModal = ({
  isOpen,
  onClose,
  parentEmail,
  parentName,
}) => {
  const [selectedPlan, setSelectedPlan] = useState('stem-monthly');
  const [enquirySubmitted, setEnquirySubmitted] = useState(false);
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const plans = [
    {
      id: 'stem-monthly',
      name: 'STEM Explorer 1:1',
      badge: 'Popular',
      price: '$120 / month',
      classes: '8 live 1:1 classes / month (2 classes / week)',
      features: [
        'Dedicated certified STEM & Coding mentor',
        'Customized curriculum for grades 1-8',
        'Hands-on scratch, web & game development',
        'Recorded classes and personalized feedback',
      ],
    },
    {
      id: 'python-pro',
      name: 'Python & AI Pro 1:1',
      badge: 'Advanced',
      price: '$170 / month',
      classes: '12 live 1:1 classes / month (3 classes / week)',
      features: [
        'Advanced Python, Data Science & AI intro',
        'Real-world portfolio projects & apps',
        'Competition and hackathon mentorship',
        'Official Codeyoung STEM Certification',
      ],
    },
  ];

  const handleEnquirySubmit = (e) => {
    e.preventDefault();
    setEnquirySubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border border-indigo-100 text-left custom-scrollbar relative">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2 border border-amber-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Codeyoung Academic Plans</span>
          </div>
          <h2 className="text-2xl font-black text-white">
            1:1 Paid Learning Subscriptions
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Free trial already claimed for this Gmail identity. Continue your child's STEM journey with our dedicated 1:1 monthly plans.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Important Gateway Notice */}
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-950 flex items-start gap-3 text-xs">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Payment Integration Notice</p>
              <p className="text-amber-900 leading-relaxed">
                Direct online credit card payment gateway integration is currently running in demonstration mode. Please review the plan details below and request a counselor callback to enroll without entering payment details.
              </p>
            </div>
          </div>

          {enquirySubmitted ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-3xl mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Enquiry Submitted Successfully!</h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                Thank you for your interest. A Codeyoung academic counselor will contact you at <strong>{parentEmail}</strong> within 24 hours with custom enrollment schedules.
              </p>
              <div className="pt-3">
                <Button size="sm" variant="outline" onClick={onClose}>
                  Back to Booking Portal
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Plan Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {plans.map((plan) => {
                  const isSelected = selectedPlan === plan.id;
                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`cursor-pointer rounded-2xl p-5 border-2 transition-all space-y-3 relative ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/40 shadow-sm'
                          : 'border-slate-200 hover:border-indigo-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-wider text-indigo-700">
                          {plan.name}
                        </span>
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full">
                          {plan.badge}
                        </span>
                      </div>

                      <div>
                        <span className="text-xl font-black text-slate-900">{plan.price}</span>
                        <p className="text-[11px] text-slate-600 font-medium mt-0.5">{plan.classes}</p>
                      </div>

                      <ul className="space-y-1.5 text-xs text-slate-700 pt-2 border-t border-slate-100">
                        {plan.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>

              {/* Enquiry Callback Form */}
              <form onSubmit={handleEnquirySubmit} className="space-y-4 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Request Enrollment Information &amp; Callback
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Parent Name</label>
                    <input
                      type="text"
                      readOnly
                      value={parentName || 'Parent / Student'}
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-800 font-semibold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                    <input
                      type="email"
                      readOnly
                      value={parentEmail || ''}
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-800 font-semibold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Phone Number (Optional)</label>
                    <input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Learning Goals / Notes</label>
                    <input
                      type="text"
                      placeholder="e.g. Python for 10-year-old"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <Button type="button" variant="outline" size="sm" onClick={onClose}>
                    Close
                  </Button>
                  <Button type="submit" variant="primary" size="sm">
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Plan Enquiry</span>
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlanModal;
