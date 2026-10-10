import React from 'react';
import {
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  Ban,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Mail,
  Video,
} from 'lucide-react';
import Button from '../common/Button';

export const AdminBookingsTable = ({
  bookings,
  pagination,
  filters,
  onFilterChange,
  onPageChange,
  onRefresh,
  onCancelClick,
  onRetryNotification,
  mentors,
  isLoading,
  isProcessingAction,
}) => {
  const getStatusBadge = (status) => {
    if (status === 'confirmed') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>Confirmed</span>
        </span>
      );
    }
    if (status === 'cancelled') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
          <XCircle className="w-3 h-3 text-red-600" />
          <span>Cancelled</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full">
        {status}
      </span>
    );
  };

  const getNotificationBadge = (notif) => {
    const status = notif?.status || 'pending';
    if (status === 'sent') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
          <CheckCircle2 className="w-3 h-3 text-teal-600" />
          <span>Sent</span>
        </span>
      );
    }
    if (status === 'failed' || status === 'partial') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
          <span>Failed / Delayed</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
        <span>Pending</span>
      </span>
    );
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Table Toolbar & Filters */}
      <div className="p-4 sm:p-6 border-b border-slate-200/80 bg-slate-50/50 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              Live Trial Bookings Registry
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Showing real-time records from PostgreSQL database
            </p>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              isLoading={isLoading}
              className="text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search parent, ref, mentor..."
              value={filters.search || ''}
              onChange={(e) => onFilterChange({ search: e.target.value, page: 1 })}
              className="w-full text-xs pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filters.status || 'all'}
              onChange={(e) => onFilterChange({ status: e.target.value, page: 1 })}
              className="w-full text-xs px-3 py-2 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-slate-700"
            >
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed Only</option>
              <option value="cancelled">Cancelled Only</option>
            </select>
          </div>

          {/* Mentor Filter */}
          <div>
            <select
              value={filters.mentorId || 'all'}
              onChange={(e) => onFilterChange({ mentorId: e.target.value, page: 1 })}
              className="w-full text-xs px-3 py-2 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-slate-700"
            >
              <option value="all">All Mentors (10)</option>
              {mentors?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <input
              type="date"
              value={filters.date || ''}
              onChange={(e) => onFilterChange({ date: e.target.value, page: 1 })}
              className="w-full text-xs px-3 py-2 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-slate-700"
            />
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/70 border-b border-slate-200/80 text-slate-600 font-black uppercase text-[10px] tracking-wider">
              <th className="py-3.5 px-4">Booking Ref</th>
              <th className="py-3.5 px-4">Parent / Student</th>
              <th className="py-3.5 px-4">Assigned Mentor</th>
              <th className="py-3.5 px-4">Parent Local Time</th>
              <th className="py-3.5 px-4">Mentor Time (IST)</th>
              <th className="py-3.5 px-4 text-center">Status</th>
              <th className="py-3.5 px-4 text-center">Notification</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                  <span>Loading live records from PostgreSQL...</span>
                </td>
              </tr>
            ) : bookings?.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-slate-600">No bookings match the selected filters.</p>
                  <p className="text-xs text-slate-400 mt-1">Try resetting the search keyword or date filters.</p>
                </td>
              </tr>
            ) : (
              bookings?.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Reference */}
                  <td className="py-3.5 px-4 font-mono font-bold text-indigo-950 whitespace-nowrap">
                    {b.bookingReference}
                  </td>

                  {/* Parent */}
                  <td className="py-3.5 px-4">
                    <p className="font-extrabold text-slate-900">{b.parentName}</p>
                    <p className="text-[11px] text-slate-500 truncate max-w-[150px]">{b.parentEmail}</p>
                  </td>

                  {/* Mentor */}
                  <td className="py-3.5 px-4">
                    <span className="font-extrabold text-purple-950 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                      {b.mentor?.name}
                    </span>
                  </td>

                  {/* Parent Local Time */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-bold text-indigo-700 bg-indigo-50/70 px-2 py-0.5 rounded">
                      {b.parentLocalTime}
                    </span>
                  </td>

                  {/* Mentor Time */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-semibold text-slate-700">
                      {b.mentorLocalTime}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    {getStatusBadge(b.status)}
                    {b.cancellationReason && (
                      <span className="block text-[10px] text-slate-400 truncate max-w-[120px] mt-0.5" title={b.cancellationReason}>
                        {b.cancellationReason}
                      </span>
                    )}
                  </td>

                  {/* Notification */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <div className="flex flex-col items-center gap-1">
                      {getNotificationBadge(b.notification)}
                      {b.notification?.parent?.previewUrl && (
                        <a
                          href={b.notification.parent.previewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-indigo-600 hover:underline flex items-center gap-0.5 font-bold"
                        >
                          <span>Preview</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5">
                      {b.demoClassLink && (
                        <a
                          href={b.demoClassLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open Demo Classroom"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                        >
                          <Video className="w-4 h-4" />
                        </a>
                      )}

                      {b.status === 'confirmed' && (
                        <button
                          type="button"
                          onClick={() => onCancelClick(b)}
                          title="Cancel Booking & Release Mentor Capacity"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      )}

                      {b.status === 'confirmed' && b.notification?.status !== 'sent' && (
                        <button
                          type="button"
                          onClick={() => onRetryNotification(b.id)}
                          title="Retry Email Notification"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && pagination.totalPages > 1 && (
        <div className="p-4 border-t border-slate-200/80 bg-slate-50/50 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">
            Showing Page <strong className="text-slate-800">{pagination.page}</strong> of{' '}
            <strong className="text-slate-800">{pagination.totalPages}</strong> ({pagination.total} total bookings)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={!pagination.hasPrevPage}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none shadow-2xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>

            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={!pagination.hasNextPage}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none shadow-2xs"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBookingsTable;
