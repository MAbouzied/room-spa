import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { StaffAccessError } from './errors.ts';
import { staffAccessDocumentId } from './document-id.ts';
import { createStaffAccessService } from './service.ts';
import type { StaffAccessRecord, StaffAccessRepository } from './types.ts';
import { normalizeStaffEmail } from './validation.ts';

function createRepository(seed: StaffAccessRecord[]): StaffAccessRepository & { updates: number; deletes: number } {
  const records = new Map(seed.map((record) => [record.id, { ...record }]));
  let nextId = seed.length + 1;
  return {
    updates: 0,
    deletes: 0,
    async list() { return [...records.values()].map((record) => ({ ...record })); },
    async findById(id) { return records.get(id) ? { ...records.get(id)! } : null; },
    async findByEmail(email) {
      const normalized = normalizeStaffEmail(email);
      return [...records.values()].find((record) => normalizeStaffEmail(record.email) === normalized) ?? null;
    },
    async create(email) {
      const record = { id: `staff-${nextId++}`, email };
      records.set(record.id, record);
      return { ...record };
    },
    async updateEmail(id, email) {
      const record = records.get(id);
      if (!record) throw new StaffAccessError('NOT_FOUND');
      this.updates += 1;
      record.email = email;
      delete record.name;
      delete record.image;
      return { ...record };
    },
    async delete(id) {
      if (!records.delete(id)) throw new StaffAccessError('NOT_FOUND');
      this.deletes += 1;
    },
    async syncGoogleProfile() {},
  };
}

describe('staff access service', () => {
  it('normalizes on create and rejects case-insensitive duplicates', async () => {
    const repository = createRepository([{ id: 'staff-1', email: 'existing@example.com' }]);
    const service = createStaffAccessService(repository);

    const created = await service.create(' New@Example.com ');
    assert.equal(created.email, 'new@example.com');
    await assert.rejects(
      service.create(' EXISTING@example.com '),
      (error: unknown) => error instanceof StaffAccessError && error.code === 'DUPLICATE_EMAIL',
    );
    await assert.rejects(
      service.create('not-an-email'),
      (error: unknown) => error instanceof StaffAccessError && error.code === 'INVALID_EMAIL',
    );
  });

  it('marks the active account and protects it from server-side update and delete', async () => {
    const repository = createRepository([
      { id: 'staff-1', email: 'current@example.com', name: 'Current' },
      { id: 'staff-2', email: 'other@example.com' },
    ]);
    const service = createStaffAccessService(repository);

    const users = await service.list(' CURRENT@example.com ');
    assert.equal(users.find((user) => user.id === 'staff-1')?.isCurrent, true);
    await assert.rejects(
      service.updateEmail('staff-1', 'changed@example.com', 'current@example.com'),
      (error: unknown) => error instanceof StaffAccessError && error.code === 'CURRENT_USER_PROTECTED',
    );
    await assert.rejects(
      service.delete('staff-1', 'current@example.com'),
      (error: unknown) => error instanceof StaffAccessError && error.code === 'CURRENT_USER_PROTECTED',
    );
    assert.equal(repository.updates, 0);
    assert.equal(repository.deletes, 0);
  });

  it('updates another user, clears stale profile fields in the repository, and deletes it', async () => {
    const repository = createRepository([
      { id: 'staff-1', email: 'current@example.com' },
      { id: 'staff-2', email: 'other@example.com', name: 'Old profile', image: 'https://example.com/a.png' },
    ]);
    const service = createStaffAccessService(repository);

    const updated = await service.updateEmail('staff-2', 'changed@example.com', 'current@example.com');
    assert.deepEqual(updated, { id: 'staff-2', email: 'changed@example.com' });
    await service.delete('staff-2', 'current@example.com');
    assert.equal((await service.findApprovedByEmail('changed@example.com')), null);
  });

  it('treats a normalized same-email edit as a no-op that retains profile fields', async () => {
    const repository = createRepository([
      { id: 'staff-1', email: 'current@example.com' },
      { id: 'staff-2', email: 'other@example.com', name: 'Google name', image: 'https://example.com/avatar.png' },
    ]);
    const service = createStaffAccessService(repository);

    const result = await service.updateEmail('staff-2', ' OTHER@EXAMPLE.COM ', 'current@example.com');
    assert.deepEqual(result, {
      id: 'staff-2',
      email: 'other@example.com',
      name: 'Google name',
      image: 'https://example.com/avatar.png',
    });
    assert.equal(repository.updates, 0);
  });

  it('allows an old email to be added again after a deterministic-ID email move', async () => {
    const records = new Map<string, StaffAccessRecord>();
    const repository: StaffAccessRepository = {
      async list() { return [...records.values()]; },
      async findById(id) { return records.get(id) ?? null; },
      async findByEmail(email) {
        const normalized = normalizeStaffEmail(email);
        return [...records.values()].find((record) => record.email === normalized) ?? null;
      },
      async create(email) {
        const id = await staffAccessDocumentId(email);
        if (records.has(id)) throw new StaffAccessError('DUPLICATE_EMAIL');
        const record = { id, email };
        records.set(id, record);
        return record;
      },
      async updateEmail(id, email) {
        const current = records.get(id);
        if (!current) throw new StaffAccessError('NOT_FOUND');
        const nextId = await staffAccessDocumentId(email);
        if (nextId !== id && records.has(nextId)) throw new StaffAccessError('DUPLICATE_EMAIL');
        records.delete(id);
        const replacement = { id: nextId, email };
        records.set(nextId, replacement);
        return replacement;
      },
      async delete(id) { records.delete(id); },
      async syncGoogleProfile() {},
    };
    const service = createStaffAccessService(repository);

    const original = await service.create('old@example.com');
    const moved = await service.updateEmail(original.id, 'new@example.com');
    const restored = await service.create('old@example.com');

    assert.notEqual(moved.id, original.id);
    assert.equal(restored.id, original.id);
    assert.equal((await service.findApprovedByEmail('old@example.com'))?.id, original.id);
  });
});
