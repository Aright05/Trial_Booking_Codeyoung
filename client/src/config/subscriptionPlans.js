/**
 * Central Subscription Plans Configuration (Client UI)
 * Configurable example prices aligned with server definitions.
 */

export const SUBSCRIPTION_PLANS = [
  {
    id: '3_day_pass',
    name: '3-Day Pass',
    badge: 'Quick Start',
    price: '₹199',
    rawPrice: 199,
    pricePaise: 19900,
    currency: 'INR',
    durationDays: 3,
    durationLabel: '/ 3 days',
    description: 'Perfect short-term access for exploring 1:1 STEM coding sessions.',
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
    price: '₹999',
    rawPrice: 999,
    pricePaise: 99900,
    currency: 'INR',
    durationDays: 30,
    durationLabel: '/ month',
    description: 'Structured monthly progression with dedicated coding mentors.',
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
    price: '₹7,999',
    rawPrice: 7999,
    pricePaise: 799900,
    currency: 'INR',
    durationDays: 365,
    durationLabel: '/ year',
    description: 'Complete year-round STEM curriculum and competition mentorship.',
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
