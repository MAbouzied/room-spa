import type { StaffAccessRecord, StaffGoogleProfile } from '../staff-access/types.ts';
import { parseStaffEmail } from '../staff-access/validation.ts';
import { isGoogleEmailVerified } from './authorization.ts';

export interface GoogleUserInfoProfile {
  sub?: string;
  name?: string;
  email?: string;
  picture?: string;
  email_verified?: boolean | string;
  verified_email?: boolean | string;
}

export interface ApprovedGoogleProfileLookup {
  findApprovedByEmail(email: string): Promise<StaffAccessRecord | null>;
  syncGoogleProfile(record: StaffAccessRecord, profile: StaffGoogleProfile): Promise<void>;
}

export interface AuthorizedGoogleUser {
  id: string;
  name: string;
  email: string;
  image?: string;
  emailVerified: true;
}

/**
 * Converts a verified Google profile into a Better Auth user only after the
 * private staff directory confirms the normalized email is approved.
 */
export function createGoogleProfileAuthorizer(directory: ApprovedGoogleProfileLookup) {
  return async (profile: GoogleUserInfoProfile): Promise<AuthorizedGoogleUser | null> => {
    const email = parseStaffEmail(profile.email);
    if (!email || !profile.sub || !isGoogleEmailVerified(profile)) return null;

    const approvedRecord = await directory.findApprovedByEmail(email);
    if (!approvedRecord) return null;

    try {
      await directory.syncGoogleProfile(approvedRecord, {
        ...(profile.name?.trim() ? { name: profile.name.trim() } : {}),
        ...(profile.picture?.trim() ? { image: profile.picture.trim() } : {}),
      });
    } catch {
      // Approval is authoritative; profile decoration is optional.
    }

    return {
      id: profile.sub,
      name: profile.name?.trim() || email,
      email,
      ...(profile.picture?.trim() ? { image: profile.picture.trim() } : {}),
      emailVerified: true,
    };
  };
}
