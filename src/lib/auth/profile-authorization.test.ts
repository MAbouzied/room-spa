import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { StaffAccessError } from '../staff-access/errors.ts';
import type { ApprovedGoogleProfileLookup } from './profile-authorization.ts';
import { createGoogleProfileAuthorizer } from './profile-authorization.ts';

const approvedRecord = { id: 'staff-1', email: 'staff@example.com' };

function directory(overrides: Partial<ApprovedGoogleProfileLookup> = {}): ApprovedGoogleProfileLookup {
  return {
    findApprovedByEmail: async (email) => email === approvedRecord.email ? approvedRecord : null,
    syncGoogleProfile: async () => {},
    ...overrides,
  };
}

describe('Google staff profile authorization', () => {
  it('authorizes an approved, verified Google email and syncs optional profile fields', async () => {
    const synced: unknown[] = [];
    const authorize = createGoogleProfileAuthorizer(directory({
      syncGoogleProfile: async (record, profile) => { synced.push({ record, profile }); },
    }));

    const user = await authorize({
      sub: 'google-subject',
      email: ' Staff@Example.com ',
      email_verified: true,
      name: ' Staff Member ',
      picture: 'https://lh3.googleusercontent.com/a/profile',
    });

    assert.deepEqual(user, {
      id: 'google-subject',
      email: 'staff@example.com',
      name: 'Staff Member',
      image: 'https://lh3.googleusercontent.com/a/profile',
      emailVerified: true,
    });
    assert.deepEqual(synced, [{
      record: approvedRecord,
      profile: {
        name: 'Staff Member',
        image: 'https://lh3.googleusercontent.com/a/profile',
      },
    }]);
  });

  it('rejects unapproved or unverified profiles without syncing them', async () => {
    let syncCount = 0;
    const authorize = createGoogleProfileAuthorizer(directory({
      syncGoogleProfile: async () => { syncCount += 1; },
    }));

    assert.equal(await authorize({
      sub: 'other', email: 'other@example.com', email_verified: true,
    }), null);
    assert.equal(await authorize({
      sub: 'unverified', email: 'staff@example.com', email_verified: false,
    }), null);
    assert.equal(syncCount, 0);
  });

  it('does not make optional profile synchronization a login requirement', async () => {
    const authorize = createGoogleProfileAuthorizer(directory({
      syncGoogleProfile: async () => { throw new Error('profile write unavailable'); },
    }));

    assert.equal((await authorize({
      sub: 'google-subject', email: 'staff@example.com', email_verified: true,
    }))?.email, 'staff@example.com');
  });

  it('fails closed when the private directory is unavailable', async () => {
    const authorize = createGoogleProfileAuthorizer(directory({
      findApprovedByEmail: async () => { throw new StaffAccessError('STAFF_STORE_UNAVAILABLE'); },
    }));

    await assert.rejects(
      authorize({ sub: 'google-subject', email: 'staff@example.com', email_verified: true }),
      (error: unknown) => error instanceof StaffAccessError && error.code === 'STAFF_STORE_UNAVAILABLE',
    );
  });
});
