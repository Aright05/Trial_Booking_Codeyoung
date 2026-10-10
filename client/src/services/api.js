const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Common API fetch wrapper
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage = data?.message || `HTTP error ${response.status}: ${response.statusText}`;
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    error.code = data?.code;
    throw error;
  }

  return data;
}

/**
 * Check backend health status
 */
export async function checkServerHealth() {
  return apiRequest('/health');
}

/**
 * Fetch available trial slots for a date and timezone
 * GET /api/slots?date=YYYY-MM-DD&timezone=...
 */
export async function fetchAvailableSlots(date, timezone) {
  const params = new URLSearchParams({ date, timezone });
  return apiRequest(`/slots?${params.toString()}`);
}

/**
 * Create a trial class booking
 * POST /api/bookings
 */
export async function createTrialBooking(bookingData) {
  return apiRequest('/bookings', {
    method: 'POST',
    body: JSON.stringify(bookingData),
  });
}

/**
 * Retrieve a booking by ID or reference
 * GET /api/bookings/:id
 */
export async function fetchBookingDetails(idOrReference) {
  return apiRequest(`/bookings/${encodeURIComponent(idOrReference)}`);
}

/**
 * Fetch active mentors list
 * GET /api/mentors
 */
export async function fetchActiveMentors() {
  return apiRequest('/mentors');
}

/**
 * Admin API Functions (Requires Admin API Key header)
 */
export async function fetchAdminStats(adminKey) {
  return apiRequest('/admin/stats', {
    headers: { 'x-admin-key': adminKey },
  });
}

export async function fetchAdminBookings(filters = {}, adminKey) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '' && val !== 'all') {
      params.append(key, val);
    }
  });
  return apiRequest(`/admin/bookings?${params.toString()}`, {
    headers: { 'x-admin-key': adminKey },
  });
}

export async function fetchAdminMentors(date, adminKey) {
  const params = date ? `?date=${encodeURIComponent(date)}` : '';
  return apiRequest(`/admin/mentors${params}`, {
    headers: { 'x-admin-key': adminKey },
  });
}

export async function cancelAdminBooking(idOrReference, reason, adminKey) {
  return apiRequest(`/admin/bookings/${encodeURIComponent(idOrReference)}/cancel`, {
    method: 'POST',
    headers: { 'x-admin-key': adminKey },
    body: JSON.stringify({ reason }),
  });
}

export async function retryAdminNotification(idOrReference, adminKey) {
  return apiRequest(`/admin/bookings/${encodeURIComponent(idOrReference)}/retry-notification`, {
    method: 'POST',
    headers: { 'x-admin-key': adminKey },
  });
}

/**
 * Check free trial eligibility for an email
 * GET /api/trials/eligibility?email=...
 */
export async function checkTrialEligibility(email) {
  const params = new URLSearchParams({ email });
  return apiRequest(`/trials/eligibility?${params.toString()}`);
}

/**
 * Fetch mentor's private schedule
 * GET /api/mentor/me/schedule?from=YYYY-MM-DD&to=YYYY-MM-DD
 */
export async function fetchMentorSchedule(mentorEmail, { from, to } = {}) {
  const params = new URLSearchParams();
  if (from) params.append('from', from);
  if (to) params.append('to', to);

  const queryStr = params.toString() ? `?${params.toString()}` : '';
  return apiRequest(`/mentor/me/schedule${queryStr}`, {
    headers: {
      'x-mentor-email': mentorEmail,
    },
  });
}

/**
 * Fetch subscription plans from backend
 * GET /api/subscriptions/plans
 */
export async function fetchSubscriptionPlans() {
  return apiRequest('/subscriptions/plans');
}

/**
 * Create subscription intent (demo mode)
 * POST /api/subscriptions/intent
 */
export async function createSubscriptionIntent(subscriptionData) {
  return apiRequest('/subscriptions/intent', {
    method: 'POST',
    body: JSON.stringify(subscriptionData),
  });
}



