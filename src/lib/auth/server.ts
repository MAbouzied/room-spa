import { betterAuth } from 'better-auth';
import {
  BETTER_AUTH_SECRET,
  BETTER_AUTH_URL,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
} from 'astro:env/server';
import { createGoogleProfileAuthorizer, type GoogleUserInfoProfile } from './profile-authorization.ts';
import { getStaffAccessService } from '../staff-access/server.ts';

export type { GoogleUserInfoProfile } from './profile-authorization.ts';

function requireAuthEnv(): {
  secret: string;
  baseURL: string;
  clientId: string;
  clientSecret: string;
} {
  const missing = [
    !BETTER_AUTH_SECRET ? 'BETTER_AUTH_SECRET' : null,
    !BETTER_AUTH_URL ? 'BETTER_AUTH_URL' : null,
    !GOOGLE_CLIENT_ID ? 'GOOGLE_CLIENT_ID' : null,
    !GOOGLE_CLIENT_SECRET ? 'GOOGLE_CLIENT_SECRET' : null,
  ].filter((value): value is string => value !== null);

  if (missing.length > 0) {
    throw new Error(
      `Staff authentication is not configured. Missing: ${missing.join(', ')}.`,
    );
  }

  return {
    secret: BETTER_AUTH_SECRET as string,
    baseURL: BETTER_AUTH_URL as string,
    clientId: GOOGLE_CLIENT_ID as string,
    clientSecret: GOOGLE_CLIENT_SECRET as string,
  };
}

export async function fetchGoogleUserInfo(
  accessToken: string,
): Promise<GoogleUserInfoProfile | null> {
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) return null;
  return (await response.json()) as GoogleUserInfoProfile;
}

function createAuthInstance() {
  const env = requireAuthEnv();
  const staffAccess = getStaffAccessService();
  const authorizeGoogleProfile = createGoogleProfileAuthorizer({
    findApprovedByEmail: staffAccess.findApprovedByEmail,
    syncGoogleProfile: staffAccess.syncGoogleProfile,
  });

  return betterAuth({
    secret: env.secret,
    baseURL: env.baseURL,
    onAPIError: {
      errorURL: `${env.baseURL}/login`,
    },
    // Stateless cookie sessions — no database for this staff-only scope.
    session: {
      expiresIn: 60 * 60 * 8,
      updateAge: 60 * 60,
      cookieCache: {
        enabled: true,
        maxAge: 60 * 60 * 8,
      },
    },
    advanced: {
      useSecureCookies: env.baseURL.startsWith('https://'),
    },
    socialProviders: {
      google: {
        clientId: env.clientId,
        clientSecret: env.clientSecret,
        disableIdTokenSignIn: true,
        scope: ['openid', 'email', 'profile'],
        accessType: 'online',
        prompt: 'select_account',
        async getUserInfo(token) {
          if (!token.accessToken) return null;
          const profile = await fetchGoogleUserInfo(token.accessToken);
          if (!profile) return null;
          const user = await authorizeGoogleProfile(profile);
          if (!user) return null;
          return { user, data: profile };
        },
      },
    },
  });
}

type AuthInstance = ReturnType<typeof createAuthInstance>;

let authInstance: AuthInstance | undefined;

export function getAuth(): AuthInstance {
  if (!authInstance) {
    authInstance = createAuthInstance();
  }
  return authInstance;
}
