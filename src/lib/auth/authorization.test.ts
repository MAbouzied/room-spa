import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  assertStaffAccess,
  isGoogleEmailVerified,
  loginErrorMessage,
  normalizeEmail,
  sanitizeReturnUrl,
} from './authorization.ts';
import { isValidStaffEmail, parseStaffEmail } from '../staff-access/validation.ts';

describe('authorization', () => {
  it('normalizes and validates staff emails', () => {
    assert.equal(normalizeEmail('  Staff@Example.com '), 'staff@example.com');
    assert.equal(parseStaffEmail('  Staff@Example.com '), 'staff@example.com');
    assert.equal(parseStaffEmail('not-an-email'), null);
    assert.equal(isValidStaffEmail('staff@example.com'), true);
    assert.equal(isValidStaffEmail('staff@example'), false);
  });

  it('requires Google verified email claims', () => {
    assert.equal(isGoogleEmailVerified({ email_verified: true }), true);
    assert.equal(isGoogleEmailVerified({ verified_email: 'true' }), true);
    assert.equal(isGoogleEmailVerified({ email_verified: false }), false);
    assert.equal(isGoogleEmailVerified({}), false);
  });

  it('sanitizes return URLs to same-origin relative paths', () => {
    assert.equal(sanitizeReturnUrl('/admin'), '/admin');
    assert.equal(sanitizeReturnUrl('/blogs/hello'), '/blogs/hello');
    assert.equal(sanitizeReturnUrl('https://evil.example/phish'), '/admin');
    assert.equal(sanitizeReturnUrl('//evil.example'), '/admin');
    assert.equal(sanitizeReturnUrl('/login'), '/admin');
    assert.equal(sanitizeReturnUrl('/api/auth/callback/google'), '/admin');
    assert.equal(sanitizeReturnUrl('../admin'), '/admin');
  });

  it('requires a verified identity and a private-directory approval', () => {
    assert.equal(assertStaffAccess({ email: null }).ok, false);
    assert.equal(assertStaffAccess({ email: 'a@x.com', emailVerified: false }).ok, false);
    assert.equal(assertStaffAccess({ email: 'a@x.com', emailVerified: null }).ok, false);
    assert.equal(
      assertStaffAccess({
        email: 'a@x.com',
        emailVerified: true,
        approved: false,
        requireApproved: true,
      }).ok,
      false,
    );
    assert.equal(
      assertStaffAccess({
        email: 'a@x.com',
        emailVerified: true,
        approved: true,
        requireApproved: true,
      }).ok,
      true,
    );
  });

  it('maps the Better Auth profile rejection to the required permission message', () => {
    assert.equal(
      loginErrorMessage('unable_to_get_user_info'),
      'You don’t have permission to access the admin dashboard.',
    );
    assert.notEqual(loginErrorMessage('staff_store_unavailable'), loginErrorMessage('unable_to_get_user_info'));
  });
});
