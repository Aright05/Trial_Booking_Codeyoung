import crypto from 'crypto';
import { query } from '../config/postgres.js';
import { SUBSCRIPTION_PLANS, getPlanById } from '../config/subscriptionPlans.js';
import { normalizeEmail } from '../utils/emailNormalizer.js';

/**
 * Fetch all configured subscription plans
 */
export const getSubscriptionPlans = () => {
  return SUBSCRIPTION_PLANS;
};

/**
 * Create a pending subscription intent in PostgreSQL
 * Validates plan on the server and applies server-configured pricing in paise.
 */
export const createSubscriptionIntent = async ({
  parentName,
  parentEmail,
  planId,
  phone = '',
  notes = '',
}) => {
  if (!parentName || parentName.trim().length < 2) {
    const err = new Error('Parent name is required (at least 2 characters).');
    err.statusCode = 400;
    err.code = 'INVALID_PARENT_NAME';
    throw err;
  }

  if (!parentEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail.trim())) {
    const err = new Error('A valid email address is required.');
    err.statusCode = 400;
    err.code = 'INVALID_EMAIL';
    throw err;
  }

  const plan = getPlanById(planId);
  if (!plan) {
    const err = new Error(`Invalid plan ID "${planId}". Available plans: ${SUBSCRIPTION_PLANS.map((p) => p.id).join(', ')}`);
    err.statusCode = 400;
    err.code = 'INVALID_PLAN_ID';
    throw err;
  }

  const { normalizedEmail } = normalizeEmail(parentEmail);
  const subscriptionId = `SUB-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

  const startsAt = new Date();
  const expiresAt = new Date(startsAt.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

  const metadata = {
    phone: phone.trim() || null,
    notes: notes.trim() || null,
    isDemo: true,
    paymentProvider: 'DEMO_GATEWAY_PLACEHOLDER',
  };

  const insertQuery = `
    INSERT INTO subscriptions (
      id,
      parent_name,
      parent_email,
      normalized_parent_email,
      plan_id,
      plan_name,
      price_paise,
      currency,
      status,
      payment_status,
      duration_days,
      starts_at,
      expires_at,
      metadata,
      created_at,
      updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
    RETURNING *;
  `;

  const values = [
    subscriptionId,
    parentName.trim(),
    parentEmail.trim(),
    normalizedEmail,
    plan.id,
    plan.name,
    plan.pricePaise, // Trusted server-side price in paise
    plan.currency,
    'pending_payment', // Never activate paid status without real payment verification
    'demo_pending',
    plan.durationDays,
    startsAt.toISOString(),
    expiresAt.toISOString(),
    JSON.stringify(metadata),
  ];

  const result = await query(insertQuery, values);
  const row = result.rows[0];

  return {
    subscriptionId: row.id,
    planId: row.plan_id,
    planName: row.plan_name,
    priceFormatted: plan.priceFormatted,
    pricePaise: row.price_paise,
    currency: row.currency,
    durationDays: row.duration_days,
    status: row.status,
    paymentStatus: row.payment_status,
    parentName: row.parent_name,
    parentEmail: row.parent_email,
    normalizedEmail: row.normalized_parent_email,
    startsAt: row.starts_at,
    expiresAt: row.expires_at,
    isDemoMode: true,
    message: 'Subscription intent created in demo mode. No payment has been processed.',
  };
};
