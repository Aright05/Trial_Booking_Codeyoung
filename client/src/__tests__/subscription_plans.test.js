import { describe, it, expect } from 'vitest';
import { SUBSCRIPTION_PLANS } from '../config/subscriptionPlans.js';
import { fetchSubscriptionPlans, createSubscriptionIntent } from '../services/api.js';

describe('Client Subscription Plans & Pricing Configuration', () => {
  it('defines exactly three subscription plans', () => {
    expect(SUBSCRIPTION_PLANS).toHaveLength(3);
    const planIds = SUBSCRIPTION_PLANS.map((p) => p.id);
    expect(planIds).toEqual(['3_day_pass', 'monthly', 'yearly']);
  });

  it('configures Plan A: 3-Day Pass accurately', () => {
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === '3_day_pass');
    expect(plan.name).toBe('3-Day Pass');
    expect(plan.price).toBe('₹199');
    expect(plan.rawPrice).toBe(199);
    expect(plan.durationDays).toBe(3);
    expect(plan.durationLabel).toBe('/ 3 days');
    expect(plan.features).toContain('Access to available trial/demo learning sessions during the plan period');
    expect(plan.features).toContain('Mentor schedule viewing');
    expect(plan.features).toContain('Booking confirmation and meeting details');
    expect(plan.features).toContain('Email notifications for confirmed bookings');
  });

  it('configures Plan B: Monthly Plan accurately', () => {
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === 'monthly');
    expect(plan.name).toBe('Monthly Plan');
    expect(plan.price).toBe('₹999');
    expect(plan.rawPrice).toBe(999);
    expect(plan.durationDays).toBe(30);
    expect(plan.durationLabel).toBe('/ month');
    expect(plan.features).toContain('Access to eligible learning sessions during the subscription period');
    expect(plan.features).toContain('Mentor schedule viewing');
    expect(plan.features).toContain('Booking management and meeting details');
  });

  it('configures Plan C: Yearly Plan accurately with Best Value badge', () => {
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === 'yearly');
    expect(plan.name).toBe('Yearly Plan');
    expect(plan.price).toBe('₹7,999');
    expect(plan.rawPrice).toBe(7999);
    expect(plan.durationDays).toBe(365);
    expect(plan.durationLabel).toBe('/ year');
    expect(plan.badge).toBe('Best Value');
    expect(plan.isBestValue).toBe(true);
  });

  it('exports API integration methods for subscription plans and checkout', () => {
    expect(typeof fetchSubscriptionPlans).toBe('function');
    expect(typeof createSubscriptionIntent).toBe('function');
  });
});
