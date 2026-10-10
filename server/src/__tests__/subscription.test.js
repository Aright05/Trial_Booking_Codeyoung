import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { connectPostgres, query, pool } from '../config/postgres.js';
import { initPostgresSchema } from '../config/initPostgresSchema.js';

describe('Subscription Plans & Pricing Integration Tests', () => {
  beforeAll(async () => {
    await connectPostgres();
    await initPostgresSchema();
    await query("DELETE FROM subscriptions WHERE parent_email LIKE '%testsub%'").catch(() => {});
  });

  afterAll(async () => {
    await query("DELETE FROM subscriptions WHERE parent_email LIKE '%testsub%'").catch(() => {});
    if (pool?.end) await pool.end().catch(() => {});
  });

  describe('1. GET /api/subscriptions/plans', () => {
    it('returns all 3 configured subscription plans with accurate details and pricing', async () => {
      const res = await request(app).get('/api/subscriptions/plans');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toHaveLength(3);

      const planIds = res.body.data.map((p) => p.id);
      expect(planIds).toContain('3_day_pass');
      expect(planIds).toContain('monthly');
      expect(planIds).toContain('yearly');

      // Plan A: 3-Day Pass
      const plan3Day = res.body.data.find((p) => p.id === '3_day_pass');
      expect(plan3Day.name).toBe('3-Day Pass');
      expect(plan3Day.priceFormatted).toBe('₹199');
      expect(plan3Day.pricePaise).toBe(19900);
      expect(plan3Day.durationDays).toBe(3);
      expect(plan3Day.durationLabel).toBe('/ 3 days');
      expect(plan3Day.features.length).toBeGreaterThanOrEqual(4);

      // Plan B: Monthly Plan
      const planMonthly = res.body.data.find((p) => p.id === 'monthly');
      expect(planMonthly.name).toBe('Monthly Plan');
      expect(planMonthly.priceFormatted).toBe('₹999');
      expect(planMonthly.pricePaise).toBe(99900);
      expect(planMonthly.durationDays).toBe(30);
      expect(planMonthly.durationLabel).toBe('/ month');

      // Plan C: Yearly Plan
      const planYearly = res.body.data.find((p) => p.id === 'yearly');
      expect(planYearly.name).toBe('Yearly Plan');
      expect(planYearly.priceFormatted).toBe('₹7,999');
      expect(planYearly.pricePaise).toBe(799900);
      expect(planYearly.durationDays).toBe(365);
      expect(planYearly.durationLabel).toBe('/ year');
      expect(planYearly.isBestValue).toBe(true);
    });
  });

  describe('2. POST /api/subscriptions/intent (Demo Checkout Intent Creation)', () => {
    it('rejects subscription intent with invalid plan ID', async () => {
      const res = await request(app)
        .post('/api/subscriptions/intent')
        .send({
          parentName: 'Test Parent',
          parentEmail: 'testsub.parent@gmail.com',
          planId: 'fake-invalid-plan',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error?.code || res.body.code).toBe('INVALID_PLAN_ID');
    });

    it('rejects subscription intent with missing or invalid parent name', async () => {
      const res = await request(app)
        .post('/api/subscriptions/intent')
        .send({
          parentName: '',
          parentEmail: 'testsub.parent@gmail.com',
          planId: 'monthly',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects subscription intent with invalid email', async () => {
      const res = await request(app)
        .post('/api/subscriptions/intent')
        .send({
          parentName: 'Valid Parent',
          parentEmail: 'invalid-email-string',
          planId: 'monthly',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('creates a demo subscription intent in pending_payment state with server-validated pricing', async () => {
      const res = await request(app)
        .post('/api/subscriptions/intent')
        .send({
          parentName: 'Sarah Jenkins',
          parentEmail: 'sarah.testsub+tag@gmail.com',
          planId: 'yearly',
          phone: '+91 98765 43210',
          notes: 'Interested in Python for Grade 6 student',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('subscriptionId');
      expect(res.body.data.subscriptionId).toMatch(/^SUB-\d+-[A-F0-9]+/);
      expect(res.body.data.planId).toBe('yearly');
      expect(res.body.data.planName).toBe('Yearly Plan');
      expect(res.body.data.pricePaise).toBe(799900);
      expect(res.body.data.priceFormatted).toBe('₹7,999');
      expect(res.body.data.status).toBe('pending_payment');
      expect(res.body.data.paymentStatus).toBe('demo_pending');
      expect(res.body.data.isDemoMode).toBe(true);
      expect(res.body.data.normalizedEmail).toBe('sarahtestsub@gmail.com');

      // Verify in PostgreSQL table
      const dbRes = await query('SELECT * FROM subscriptions WHERE id = $1', [res.body.data.subscriptionId]);
      expect(dbRes.rows).toHaveLength(1);
      const row = dbRes.rows[0];
      expect(row.plan_id).toBe('yearly');
      expect(row.price_paise).toBe(799900);
      expect(row.status).toBe('pending_payment');
      expect(row.payment_status).toBe('demo_pending');
      expect(row.normalized_parent_email).toBe('sarahtestsub@gmail.com');
    });
  });
});
