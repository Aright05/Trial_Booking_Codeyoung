import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('Health & Diagnostic Endpoints', () => {
  it('GET /api/health returns 200 OK with operational payload', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('healthy');
    expect(res.body.data.service).toBe('Codeyoung Trial Class Booking API');
    expect(res.body.data.database).toBeDefined();
    expect(res.body.data.indiaTime).toBeDefined();
  });

  it('GET /api/non-existent-route returns 404 Not Found', async () => {
    const res = await request(app).get('/api/non-existent-route');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe('Mentors Endpoint (GET /api/mentors)', () => {
  it('GET /api/mentors handles query cleanly (503 when disconnected or 200 when connected)', async () => {
    const res = await request(app).get('/api/mentors');

    // If MongoDB is running, status is 200; if offline in test runner without active mongod, status is 503
    expect([200, 503]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.mentors)).toBe(true);
    } else {
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Database is currently unavailable');
    }
  });
});
