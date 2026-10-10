import React, { useState, useEffect, useCallback } from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import AdminSummaryCards from '../components/admin/AdminSummaryCards';
import AdminBookingsTable from '../components/admin/AdminBookingsTable';
import AdminMentorsOverview from '../components/admin/AdminMentorsOverview';
import AdminCancelModal from '../components/admin/AdminCancelModal';
import {
  fetchAdminStats,
  fetchAdminBookings,
  fetchAdminMentors,
  cancelAdminBooking,
  retryAdminNotification,
  fetchActiveMentors,
} from '../services/api';
import {
  LayoutDashboard,
  Users,
  Key,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  CalendarCheck,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import Button from '../components/common/Button';

export const AdminPage = ({ onNavigateToBooking }) => {
  const [adminKey, setAdminKey] = useState(
    () => localStorage.getItem('cy_admin_api_key') || 'codeyoung-admin-secret-dev'
  );
  const [keyInput, setKeyInput] = useState(adminKey);
  const [showKeyConfig, setShowKeyConfig] = useState(false);

  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' | 'mentors'
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    mentorId: 'all',
    date: '',
    search: '',
    page: 1,
    limit: 10,
  });

  const [mentorData, setMentorData] = useState(null);
  const [allMentors, setAllMentors] = useState([]);
  const [selectedMentorDate, setSelectedMentorDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [cancelModalBooking, setCancelModalBooking] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successToast, setSuccessToast] = useState(null);

  const triggerToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleSaveKey = (e) => {
    e.preventDefault();
    const cleanKey = keyInput.trim();
    setAdminKey(cleanKey);
    localStorage.setItem('cy_admin_api_key', cleanKey);
    setShowKeyConfig(false);
    triggerToast('Admin API key updated and saved to localStorage.');
  };

  // 1. Fetch Stats
  const loadStats = useCallback(async () => {
    try {
      const res = await fetchAdminStats(adminKey);
      if (res.success) {
        setStats(res.data);
      }
    } catch (err) {
      if (err.status === 401) {
        setErrorMessage('Authentication failed: Invalid admin API key. Please check your key configuration.');
      } else {
        console.error('Failed to load admin stats:', err.message);
      }
    }
  }, [adminKey]);

  // 2. Fetch Bookings
  const loadBookings = useCallback(async () => {
    try {
      const res = await fetchAdminBookings(filters, adminKey);
      if (res.success) {
        setBookings(res.data.bookings);
        setPagination(res.data.pagination);
        setErrorMessage(null);
      }
    } catch (err) {
      if (err.status === 401) {
        setErrorMessage('Authentication failed: Invalid admin API key. Please click "Admin Key" above to configure.');
      } else {
        setErrorMessage(err.message || 'Failed to fetch bookings from PostgreSQL.');
      }
    }
  }, [filters, adminKey]);

  // 3. Fetch Mentors Overview
  const loadMentorsOverview = useCallback(async () => {
    try {
      const res = await fetchAdminMentors(selectedMentorDate, adminKey);
      if (res.success) {
        setMentorData(res.data);
        setErrorMessage(null);
      }
    } catch (err) {
      if (err.status === 401) {
        setErrorMessage('Authentication failed: Invalid admin API key.');
      } else {
        console.error('Failed to load mentors overview:', err.message);
      }
    }
  }, [selectedMentorDate, adminKey]);

  // 4. Initial load & mentor list
  useEffect(() => {
    fetchActiveMentors()
      .then((res) => {
        if (res.success) setAllMentors(res.data);
      })
      .catch(() => {});
  }, []);

  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([loadStats(), loadBookings(), loadMentorsOverview()]);
    setIsLoading(false);
  }, [loadStats, loadBookings, loadMentorsOverview]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Handle Cancellation
  const handleConfirmCancel = async (idOrRef, reason) => {
    setIsProcessingAction(true);
    try {
      const res = await cancelAdminBooking(idOrRef, reason, adminKey);
      if (res.success) {
        setCancelModalBooking(null);
        triggerToast(`Booking ${res.data.bookingReference} cancelled successfully. Mentor capacity has been released.`);
        await refreshAll();
      }
    } catch (err) {
      alert(`Cancellation failed: ${err.message}`);
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Handle Notification Retry
  const handleRetryNotification = async (bookingId) => {
    setIsProcessingAction(true);
    try {
      const res = await retryAdminNotification(bookingId, adminKey);
      if (res.success) {
        triggerToast('Notification retry dispatched.');
        await refreshAll();
      }
    } catch (err) {
      alert(`Retry failed: ${err.message}`);
    } finally {
      setIsProcessingAction(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] bg-mesh-pattern">
      <Header currentView="admin" onNavigate={(view) => {
        if (view === 'booking' && onNavigateToBooking) onNavigateToBooking();
      }} />


      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Top Operational Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-900 text-xs font-black uppercase tracking-wider mb-1 border border-purple-200">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
              <span>Step 6: Admin Operations Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Trial Operations &amp; Mentor Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Monitor real-time trial bookings, manage daily mentor capacity (max 2/IST day), and inspect notification deliveries.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              onClick={() => setShowKeyConfig(!showKeyConfig)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-2xs transition-all"
              title="Configure Admin API Key"
            >
              <Key className="w-3.5 h-3.5 text-indigo-600" />
              <span>Admin Key</span>
            </button>

            {onNavigateToBooking && (
              <Button
                variant="primary"
                size="sm"
                onClick={onNavigateToBooking}
                className="text-xs shadow-sm bg-indigo-600 hover:bg-indigo-700"
              >
                <CalendarCheck className="w-3.5 h-3.5 mr-1" />
                <span>Parent Booking Page</span>
              </Button>
            )}
          </div>
        </div>

        {/* Admin Key Configuration Drawer / Alert */}
        {showKeyConfig && (
          <div className="mb-6 p-4 bg-white rounded-2xl border border-indigo-100 shadow-md animate-in fade-in duration-150">
            <form onSubmit={handleSaveKey} className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex-1 w-full">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Admin Authorization API Key (configured in backend environment)
                </label>
                <input
                  type="text"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="e.g. codeyoung-admin-secret-dev"
                  className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto pt-4 sm:pt-5">
                <Button type="submit" variant="primary" size="sm" className="text-xs">
                  Save Key
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowKeyConfig(false)}
                  className="text-xs"
                >
                  Close
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Error Alert if any */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Toast Banner */}
        {successToast && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2.5 animate-in fade-in duration-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Summary Metric Cards */}
        <AdminSummaryCards stats={stats} isLoading={isLoading} />

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 mb-6 border-b border-slate-200/80 pb-2">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === 'bookings'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>All Bookings Table</span>
          </button>

          <button
            onClick={() => setActiveTab('mentors')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === 'mentors'
                ? 'bg-purple-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Mentor Daily Capacity &amp; Schedule</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'bookings' ? (
          <AdminBookingsTable
            bookings={bookings}
            pagination={pagination}
            filters={filters}
            onFilterChange={(newFilters) => setFilters((prev) => ({ ...prev, ...newFilters }))}
            onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
            onRefresh={loadBookings}
            onCancelClick={(b) => setCancelModalBooking(b)}
            onRetryNotification={handleRetryNotification}
            mentors={allMentors}
            isLoading={isLoading}
            isProcessingAction={isProcessingAction}
          />
        ) : (
          <AdminMentorsOverview
            mentorData={mentorData}
            selectedDate={selectedMentorDate}
            onDateChange={setSelectedMentorDate}
            isLoading={isLoading}
          />
        )}
      </main>

      {/* Cancellation Modal */}
      <AdminCancelModal
        isOpen={Boolean(cancelModalBooking)}
        onClose={() => setCancelModalBooking(null)}
        booking={cancelModalBooking}
        onConfirmCancel={handleConfirmCancel}
        isProcessing={isProcessingAction}
      />

      <Footer />
    </div>
  );
};

export default AdminPage;
