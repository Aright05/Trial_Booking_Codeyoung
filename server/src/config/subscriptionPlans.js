/**
 * Central Subscription Plans Configuration (Server Source of Truth)
 * Prices are stored in the smallest currency unit (paise for INR).
 * Example prices are for demonstration and recruitment evaluation purposes.
 */

export const SUBSCRIPTION_PLANS = [
  {
    id: '3_day_pass',
    name: '3-Day Pass',
    badge: 'Quick Start',
    pricePaise: 19900,
    priceFormatted: '₹199',
    currency: 'INR',
    durationDays: 3,
    durationLabel: '/ 3 days',
    description: 'Short-term pass for testing interactive 1:1 STEM and coding sessions.',
    isBestValue: false,
    features: [
      'Access to available trial/demo learning sessions during the plan period',
      'Mentor schedule viewing',
      'Booking confirmation and meeting details',
      'Email notifications for confirmed bookings',
    ],
  },
  {
    id: 'monthly',
    name: 'Monthly Plan',
    badge: 'Popular',
    pricePaise: 99900,
    priceFormatted: '₹999',
    currency: 'INR',
    durationDays: 30,
    durationLabel: '/ month',
    description: 'Comprehensive monthly 1:1 mentorship and live coding curriculum.',
    isBestValue: false,
    features: [
      'Access to eligible learning sessions during the subscription period',
      'Mentor schedule viewing',
      'Booking management and meeting details',
      'Email notifications and booking confirmations',
      'Priority booking, only if supported by the existing system',
    ],
  },
  {
    id: 'yearly',
    name: 'Yearly Plan',
    badge: 'Best Value',
    pricePaise: 799900,
    priceFormatted: '₹7,999',
    currency: 'INR',
    durationDays: 365,
    durationLabel: '/ year',
    description: 'Full academic year immersive coding journey with dedicated mentors.',
    isBestValue: true,
    features: [
      'Access to eligible learning sessions during the subscription period',
      'Mentor schedule viewing',
      'Booking management and meeting details',
      'Email notifications and booking confirmations',
      'Priority booking, only if supported by the existing system',
    ],
  },
];

/**
 * Helper to fetch a plan by ID
 */
export const getPlanById = (planId) => {
  return SUBSCRIPTION_PLANS.find((plan) => plan.id === planId) || null;
};
