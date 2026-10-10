import React from 'react';
import { Clock, ShieldCheck, Heart, Mail, Sparkles } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-white border-t border-indigo-100 mt-20 text-slate-600 relative overflow-hidden">
      <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500" />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight">
                <span className="text-indigo-600">CODE</span>
                <span className="text-tangerine-500">YOUNG</span>
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 font-extrabold text-indigo-700 border border-indigo-100">
                Recruitment Assignment
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm font-medium">
              Empowering K-12 kids globally through interactive coding, math, and robotics education. 
              Equipped with smart timezone synchronization for mentors in India and parents worldwide.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Max 2 trial classes per mentor / India calendar day rule enforced</span>
            </div>
          </div>

          {/* Timezone Specs */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">Supported Regions</h4>
            <ul className="text-xs space-y-2 font-medium text-slate-600">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                <span>India (IST, UTC+5:30)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>United Kingdom (GMT/BST)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>US Eastern (ET, UTC-4/5)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span>US Pacific (PT, UTC-7/8)</span>
              </li>
            </ul>
          </div>

          {/* System Specs */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">Tech Architecture</h4>
            <ul className="text-xs space-y-1.5 font-medium text-slate-600">
              <li className="flex items-center gap-1.5"><span className="text-indigo-500 font-bold">•</span> React 18 + Vite + Tailwind</li>
              <li className="flex items-center gap-1.5"><span className="text-purple-500 font-bold">•</span> Node.js + Express API</li>
              <li className="flex items-center gap-1.5"><span className="text-emerald-500 font-bold">•</span> MongoDB + Mongoose</li>
              <li className="flex items-center gap-1.5"><span className="text-amber-500 font-bold">•</span> Luxon Multi-Zone Engine</li>
              <li className="flex items-center gap-1.5"><span className="text-rose-500 font-bold">•</span> Vitest & Supertest</li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-medium">
          <p>© {new Date().getFullYear()} Codeyoung Trial Booking System.</p>
          <div className="flex items-center gap-2 text-indigo-600 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Step 1: Vibrant UI & Project Foundation</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
