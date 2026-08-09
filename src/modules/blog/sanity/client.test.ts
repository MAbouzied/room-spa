import assert from 'node:assert/strict';
import test from 'node:test';
import { createSanityClient } from './client.ts';

test('public Sanity reads keep the API CDN enabled when a read token is configured', () => {
  const client = createSanityClient({
    projectId: 'test-project',
    dataset: 'production',
    apiVersion: '2026-08-03',
    token: 'read-token',
  });

  assert.equal(client.config().useCdn, true);
  assert.equal(client.config().perspective, 'published');
});
