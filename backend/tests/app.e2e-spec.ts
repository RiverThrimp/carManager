import request from 'supertest';
import { createApp } from '../src/app';

describe('App bootstrap', () => {
  it('responds to health check', async () => {
    const app = createApp();
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
  });
});
