import { useState, useEffect, useMemo, useCallback } from 'react';
import { detectUserTimezone } from '../utils/timezones';
import { fetchAvailableSlots, createTrialBooking, checkTrialEligibility } from '../services/api';
import { DateTime } from 'luxon';

export function useBookingState() {
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [selectedTimezone, setSelectedTimezone] = useState(() => detectUserTimezone());
  
  // Default date to tomorrow in the selected timezone
  const defaultDateStr = useMemo(() => {
    return DateTime.now().setZone(selectedTimezone).plus({ days: 1 }).toISODate();
  }, [selectedTimezone]);

  const [selectedDate, setSelectedDate] = useState(defaultDateStr);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isSlotsLoading, setIsSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState(null);

  // Email eligibility state
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(false);
  const [isTrialClaimed, setIsTrialClaimed] = useState(false);
  const [eligibilityMessage, setEligibilityMessage] = useState(null);
  const [normalizedEmail, setNormalizedEmail] = useState('');
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingConflictError, setBookingConflictError] = useState(null);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);

  // Check email eligibility with debounce
  useEffect(() => {
    const emailToTest = parentEmail.trim();
    if (!emailToTest || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToTest)) {
      setIsTrialClaimed(false);
      setEligibilityMessage(null);
      setNormalizedEmail('');
      return;
    }

    let isMounted = true;
    const timer = setTimeout(async () => {
      setIsCheckingEligibility(true);
      try {
        const res = await checkTrialEligibility(emailToTest);
        if (!isMounted) return;
        if (res?.success && res?.data) {
          const eligible = res.data.eligible;
          setIsTrialClaimed(!eligible);
          setEligibilityMessage(res.data.reason || null);
          setNormalizedEmail(res.data.normalizedEmail || '');
        }
      } catch (err) {
        if (!isMounted) return;
        console.warn('Could not verify trial eligibility:', err.message);
      } finally {
        if (isMounted) setIsCheckingEligibility(false);
      }
    }, 400);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [parentEmail]);

  // Load available slots from API
  const loadSlots = useCallback(async (date, timezone) => {
    if (!date || !timezone) return;
    setIsSlotsLoading(true);
    setSlotsError(null);

    try {
      const response = await fetchAvailableSlots(date, timezone);
      if (response?.success && response?.data) {
        setAvailableSlots(response.data.slots || []);
        // Reset selected slot if it no longer exists in newly fetched slots
        setSelectedSlot((prev) => {
          if (!prev) return null;
          return response.data.slots.find((s) => s.startAt === prev.startAt) || null;
        });
      }
    } catch (err) {
      console.error('Failed to fetch available slots:', err);
      setSlotsError(err.message || 'Could not load slots for this date.');
      setAvailableSlots([]);
      setSelectedSlot(null);
    } finally {
      setIsSlotsLoading(false);
    }
  }, []);

  // Fetch slots whenever selectedDate or selectedTimezone changes
  useEffect(() => {
    loadSlots(selectedDate, selectedTimezone);
  }, [selectedDate, selectedTimezone, loadSlots]);

  const validateForm = () => {
    const errors = {};
    if (!parentName.trim()) {
      errors.parentName = 'Parent or Guardian name is required';
    } else if (parentName.trim().length < 2) {
      errors.parentName = 'Please enter a valid full name (min 2 characters)';
    }

    if (!parentEmail.trim()) {
      errors.parentEmail = 'Email address is required for demo link delivery';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail.trim())) {
      errors.parentEmail = 'Please provide a valid email address';
    } else if (isTrialClaimed) {
      errors.parentEmail = 'Free trial already claimed for this Gmail identity. Please explore our subscription plans.';
    }

    if (!selectedDate) {
      errors.selectedDate = 'Please select a preferred trial class date';
    }

    if (!selectedSlot) {
      errors.selectedSlot = 'Please choose an available time slot';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleTimezoneChange = (newZone) => {
    setSelectedTimezone(newZone);
  };

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    setSelectedSlot(null);
    if (formErrors.selectedDate) {
      setFormErrors((prev) => ({ ...prev, selectedDate: undefined }));
    }
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
    setBookingConflictError(null);
    if (formErrors.selectedSlot) {
      setFormErrors((prev) => ({ ...prev, selectedSlot: undefined }));
    }
  };

  // Submit trial booking to backend API
  const handleSubmitBooking = async () => {
    if (isTrialClaimed) {
      setSubscriptionModalOpen(true);
      return;
    }

    if (!validateForm() || isSubmitting) return;

    setIsSubmitting(true);
    setBookingConflictError(null);

    try {
      const payload = {
        parentName: parentName.trim(),
        parentEmail: parentEmail.trim().toLowerCase(),
        parentTimezone: selectedTimezone,
        startAt: selectedSlot.startAt,
      };

      const res = await createTrialBooking(payload);

      if (res?.success && res?.data) {
        setConfirmedBooking(res.data);
        setSuccessModalOpen(true);
        // Refresh slots in background so capacity updates immediately
        loadSlots(selectedDate, selectedTimezone);
      }
    } catch (err) {
      console.error('Booking submission failed:', err);
      if (err.code === 'FREE_TRIAL_ALREADY_USED' || err.data?.code === 'FREE_TRIAL_ALREADY_USED' || err.status === 409 && err.message?.includes('free trial')) {
        setIsTrialClaimed(true);
        setEligibilityMessage(err.message || 'A free trial has already been used for this email account.');
        setBookingConflictError(err.message || 'A free trial has already been used for this email account.');
      } else if (err.status === 409) {
        setBookingConflictError(
          err.message || 'The selected slot was just reserved or is no longer available. Please select another slot.'
        );
        // Reload fresh slots
        loadSlots(selectedDate, selectedTimezone);
      } else {
        setBookingConflictError(err.message || 'An unexpected error occurred while booking. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    parentName,
    setParentName: (val) => {
      setParentName(val);
      if (formErrors.parentName) setFormErrors((prev) => ({ ...prev, parentName: undefined }));
    },
    parentEmail,
    setParentEmail: (val) => {
      setParentEmail(val);
      if (formErrors.parentEmail) setFormErrors((prev) => ({ ...prev, parentEmail: undefined }));
    },
    selectedTimezone,
    handleTimezoneChange,
    selectedDate,
    handleDateChange,
    selectedSlot,
    handleSlotSelect,
    availableSlots,
    isSlotsLoading,
    slotsError,
    refreshSlots: () => loadSlots(selectedDate, selectedTimezone),
    isCheckingEligibility,
    isTrialClaimed,
    eligibilityMessage,
    normalizedEmail,
    subscriptionModalOpen,
    setSubscriptionModalOpen,
    formErrors,
    isSubmitting,
    bookingConflictError,
    confirmedBooking,
    successModalOpen,
    setSuccessModalOpen,
    handleSubmitBooking,
  };
}

