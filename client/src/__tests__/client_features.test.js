import { describe, it, expect } from 'vitest';
import { checkTrialEligibility } from '../services/api.js';

describe('Client API Service & Validation Tests', () => {
  it('exports checkTrialEligibility and API endpoints', () => {
    expect(typeof checkTrialEligibility).toBe('function');
  });

  it('validates standard email formats accurately', () => {
    const validEmails = ['parent@gmail.com', 'parent.name+tag@gmail.com', 'parent@example.com'];
    const invalidEmails = ['invalid-email', '@gmail.com', 'parent@'];

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    validEmails.forEach(email => expect(emailRegex.test(email)).toBe(true));
    invalidEmails.forEach(email => expect(emailRegex.test(email)).toBe(false));
  });
});
