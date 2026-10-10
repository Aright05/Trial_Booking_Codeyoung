import React, { useState, useEffect, useCallback } from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import LoadingState from '../components/common/LoadingState';
import {
  fetchActiveMentors,
  fetchMentorSchedule,
} from '../services/api';
import {
  Calendar,
  Clock,
  User,
  Mail,
  Video,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Shield,
  AlertCircle,
  CalendarCheck,
  Sparkles,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { DateTime } from 'luxon';

export const MentorPage = ({ onNavigate }) => {
  const [mentors, setMentors] = useState([]);
  const [selectedMentorEmail, setSelectedMentorEmail] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'today' | 'tomorrow' | 'upcoming' | 'all' | 'custom'
  const [customDate, setCustomDate] = useState('');
  const [scheduleData, setScheduleData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // 1. Fetch available mentors list on mount
  useEffect(() => {
    let isMounted = true;
    fetchActiveMentors()
      .then((res) => {
        if (!isMounted) return;
        const list = res?.data?.mentors || [];
        setMentors(list);
        if (list.length > 0 && !selectedMentorEmail) {
          setSelectedMentorEmail(list[0].email);
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Failed to load mentors list');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Load schedule for selected mentor
  const loadSchedule = useCallback(async () => {
    if (!selectedMentorEmail) return;
    setIsLoading(true);
    setError(null);

    try {
      let fromDate = null;
      let toDate = null;
      const nowIst = DateTime.now().setZone('Asia/Kolkata');

      if (activeTab === 'today') {
        fromDate = nowIst.toFormat('yyyy-MM-dd');
        toDate = fromDate;
      } else if (activeTab === 'tomorrow') {
        fromDate = nowIst.plus({ days: 1 }).toFormat('yyyy-MM-dd');
        toDate = fromDate;
      } else if (activeTab === 'upcoming') {
        fromDate = nowIst.toFormat('yyyy-MM-dd');
        toDate = nowIst.plus({ days: 30 }).toFormat('yyyy-MM-dd');
      } else if (activeTab === 'custom' && customDate) {
        fromDate = customDate;
        toDate = customDate;
      }

      const res = await fetchMentorSchedule(selectedMentorEmail, { from: fromDate, to: toDate });
      if (res?.success && res?.data) {
        setScheduleData(res.data);
      }
    } catch (err) {
      console.error('Failed to load mentor schedule:', err);
      setError(err.message || 'Could not fetch mentor schedule.');
      setScheduleData(null);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMentorEmail, activeTab, customDate]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  const handleCopyLink = (meetingId, link) => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopiedId(meetingId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const selectedMentor = mentors.find((m) => m.email === selectedMentorEmail) || scheduleData?.mentor;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] bg-mesh-pattern">
      <Header currentView="mentor" onNavigate={onNavigate} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
        {/* Page Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-900/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Mentor Operations Portal</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              My Teaching Schedule
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-medium">
              View assigned 1:1 demo trial classes, track parent local times, launch demo classrooms, and manage your daily India capacity (max 2 classes/day).
            </p>
          </div>

          {/* Mentor Account Switcher */}
          <div className="w-full md:w-auto bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 space-y-2 shrink-0">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
              Active Mentor Account:
            </span>
            <select
              value={selectedMentorEmail}
              onChange={(e) => setSelectedMentorEmail(e.target.value)}
              className="w-full md:w-64 bg-slate-900 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl border border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {mentors.map((mentor) => (
                <option key={mentor.id} value={mentor.email}>
                  {mentor.name} ({mentor.email})
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-semibold pt-1">
              <Shield className="w-3.5 h-3.5" />
              <span>Authenticated via x-mentor-email</span>
            </div>
          </div>
        </div>

        {/* Filter Controls & Summary Strip */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('today')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'today'
                  ? 'bg-white text-indigo-700 shadow-xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('tomorrow')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'tomorrow'
                  ? 'bg-white text-indigo-700 shadow-xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tomorrow
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('upcoming')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'upcoming'
                  ? 'bg-white text-indigo-700 shadow-xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Next 30 Days
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'all'
                  ? 'bg-white text-indigo-700 shadow-xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Bookings
            </button>
          </div>

          {/* Date Picker & Refresh Action */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Custom Date:</span>
              <input
                type="date"
                value={customDate}
                onChange={(e) => {
                  setCustomDate(e.target.value);
                  setActiveTab('custom');
                }}
                className="text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={loadSchedule}
              disabled={isLoading}
              className="ml-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Schedule Content Section */}
        {isLoading ? (
          <div className="py-16">
            <LoadingState message="Fetching your assigned teaching schedule..." />
          </div>
        ) : error ? (
          <div className="p-6 bg-rose-50 border border-rose-200 rounded-3xl text-rose-900 flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold">Failed to Load Schedule</h3>
              <p className="text-xs text-rose-700">{error}</p>
              <Button size="sm" variant="danger" onClick={loadSchedule} className="mt-3">
                Retry Query
              </Button>
            </div>
          </div>
        ) : !scheduleData || scheduleData.dateGroups.length === 0 ? (
          <Card className="text-center py-16 px-6 border-dashed border-slate-300">
            <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CalendarCheck className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No Meetings Scheduled</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
              You currently have no trial classes assigned for this date range. Your maximum daily teaching capacity (2 classes/India day) is fully available.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <Button size="sm" variant="outline" onClick={() => { setActiveTab('all'); setCustomDate(''); }}>
                View All Upcoming
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-8">
            {scheduleData.dateGroups.map((group) => (
              <div key={group.date} className="space-y-3">
                {/* Date Header Strip with Daily Capacity Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-gradient-to-r from-slate-100 to-indigo-50/50 px-4 py-2.5 rounded-2xl border border-slate-200/80 gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-indigo-600 text-white shadow-2xs">
                      {group.relativeLabel}
                    </span>
                    <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                      {group.formattedDate}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <span>Daily Capacity:</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                        group.activeCount >= group.maxCapacity
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {group.activeCount} / {group.maxCapacity} Classes Booked
                    </span>
                  </div>
                </div>

                {/* Meetings List for this Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {group.meetings.map((meeting) => {
                    const isCancelled = meeting.isCancelled;

                    return (
                      <Card
                        key={meeting.id}
                        className={`transition-all ${
                          isCancelled
                            ? 'bg-slate-50/70 border-slate-200 opacity-75'
                            : 'border-indigo-100 shadow-sm hover:border-indigo-300'
                        }`}
                      >
                        <div className="space-y-4">
                          {/* Top row: Time & Status */}
                          <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                            <div className="space-y-0.5">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Mentor India Time (IST)
                              </span>
                              <div className="flex items-center gap-1.5 text-base font-black text-indigo-950">
                                <Clock className="w-4 h-4 text-indigo-600" />
                                <span className={isCancelled ? 'line-through text-slate-500' : ''}>
                                  {meeting.mentorStartTime} – {meeting.mentorEndTime} IST
                                </span>
                              </div>
                            </div>

                            <div>
                              {isCancelled ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                                  Cancelled
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  Confirmed
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Middle: Parent & Student Info */}
                          <div className="space-y-2 text-xs text-slate-700 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500 font-bold flex items-center gap-1">
                                <User className="w-3.5 h-3.5 text-slate-400" />
                                <span>Parent / Student:</span>
                              </span>
                              <span className="font-extrabold text-slate-900">{meeting.parentName}</span>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-slate-500 font-bold flex items-center gap-1">
                                <Mail className="w-3.5 h-3.5 text-slate-400" />
                                <span>Contact Email:</span>
                              </span>
                              <span className="font-mono font-semibold text-slate-800">{meeting.parentEmail}</span>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="text-slate-500 font-bold flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-purple-500" />
                                <span>Parent Local Time:</span>
                              </span>
                              <span className="font-bold text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                                {meeting.parentLocalInterval}
                              </span>
                            </div>

                            <div className="flex justify-between items-center pt-1 border-t border-slate-200/50">
                              <span className="text-slate-500 font-bold">Booking Reference:</span>
                              <span className="font-mono font-black text-indigo-900">{meeting.bookingReference}</span>
                            </div>

                            {isCancelled && meeting.cancellationReason && (
                              <div className="text-rose-700 text-[11px] font-medium pt-1">
                                <strong>Reason:</strong> {meeting.cancellationReason}
                              </div>
                            )}
                          </div>

                          {/* Bottom Row: Meeting Link Actions */}
                          {!isCancelled && (
                            <div className="space-y-2 pt-1">
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  readOnly
                                  value={meeting.demoClassLink}
                                  className="flex-1 text-[11px] font-mono text-emerald-900 bg-emerald-50/70 border border-emerald-200 px-3 py-1.5 rounded-xl select-all focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleCopyLink(meeting.id, meeting.demoClassLink)}
                                  className="p-2 rounded-xl border border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-700 transition-all shadow-xs"
                                  title="Copy Demo Link"
                                >
                                  {copiedId === meeting.id ? (
                                    <Check className="w-4 h-4 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </button>
                              </div>

                              <a
                                href={meeting.demoClassLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                              >
                                <Video className="w-4 h-4" />
                                <span>Join 1:1 Demo Classroom</span>
                                <ExternalLink className="w-3.5 h-3.5 ml-1" />
                              </a>
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default MentorPage;
