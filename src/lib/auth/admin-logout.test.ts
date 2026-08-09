import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  ADMIN_LOGOUT_ERROR_MESSAGE,
  ADMIN_LOGOUT_REDIRECT,
  performAdminSignOut,
  type AdminSignOutClient,
} from './admin-logout.ts';

describe('performAdminSignOut', () => {
  it('signs out through the auth client and redirects to login on success', async () => {
    const redirects: string[] = [];

    const client: AdminSignOutClient = {
      async signOut(options) {
        options?.fetchOptions?.onSuccess?.();
      },
    };

    await performAdminSignOut(client, (url) => {
      redirects.push(url);
    });

    assert.deepEqual(redirects, [ADMIN_LOGOUT_REDIRECT]);
    assert.equal(ADMIN_LOGOUT_REDIRECT, '/login');
  });

  it('still redirects when signOut resolves without calling onSuccess', async () => {
    const redirects: string[] = [];
    const client: AdminSignOutClient = {
      async signOut() {
        return;
      },
    };

    await performAdminSignOut(client, (url) => {
      redirects.push(url);
    });

    assert.deepEqual(redirects, [ADMIN_LOGOUT_REDIRECT]);
  });

  it('propagates sign-out failures so the UI can restore the button', async () => {
    const redirects: string[] = [];
    const client: AdminSignOutClient = {
      async signOut() {
        throw new Error('network');
      },
    };

    await assert.rejects(
      () =>
        performAdminSignOut(client, (url) => {
          redirects.push(url);
        }),
      /network/,
    );
    assert.deepEqual(redirects, []);
    assert.match(ADMIN_LOGOUT_ERROR_MESSAGE, /تسجيل الخروج/);
  });
});
