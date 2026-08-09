import { createClient, type SanityClient } from '@sanity/client';
import {
  SANITY_API_VERSION,
  SANITY_AUTH_DATASET,
  SANITY_AUTH_TOKEN,
  SANITY_PROJECT_ID,
} from 'astro:env/server';
import { StaffAccessError, isStaffAccessError } from './errors.ts';
import { staffAccessDocumentId } from './document-id.ts';
import { createStaffAccessService } from './service.ts';
import type {
  StaffAccessRecord,
  StaffAccessRepository,
  StaffGoogleProfile,
} from './types.ts';
import { normalizeStaffEmail, parseStaffEmail } from './validation.ts';

interface SanityStaffAccessDocument {
  _id?: unknown;
  email?: unknown;
  name?: unknown;
  image?: unknown;
}

interface StaffAccessSanityConfig {
  projectId: string;
  dataset: string;
  apiVersion: string;
  token: string;
}

const STAFF_ACCESS_PROJECTION = '{ _id, email, name, image }';
const LIST_QUERY = `*[_type == "staffAccess" && !(_id in path("drafts.**"))]${STAFF_ACCESS_PROJECTION}`;
const FIND_BY_ID_QUERY = `*[_type == "staffAccess" && _id == $id && !(_id in path("drafts.**"))][0]${STAFF_ACCESS_PROJECTION}`;
const FIND_BY_EMAIL_QUERY = `*[_type == "staffAccess" && lower(email) == $email && !(_id in path("drafts.**"))][0]${STAFF_ACCESS_PROJECTION}`;

function getConfig(): StaffAccessSanityConfig {
  const missing = [
    !SANITY_PROJECT_ID ? 'SANITY_PROJECT_ID' : null,
    !SANITY_AUTH_DATASET ? 'SANITY_AUTH_DATASET' : null,
    !SANITY_API_VERSION ? 'SANITY_API_VERSION' : null,
    !SANITY_AUTH_TOKEN ? 'SANITY_AUTH_TOKEN' : null,
  ].filter((value): value is string => value !== null);

  if (missing.length > 0) {
    throw new StaffAccessError('STAFF_STORE_UNAVAILABLE');
  }

  return {
    projectId: SANITY_PROJECT_ID as string,
    dataset: SANITY_AUTH_DATASET as string,
    apiVersion: SANITY_API_VERSION as string,
    token: SANITY_AUTH_TOKEN as string,
  };
}

function toRecord(document: SanityStaffAccessDocument | null | undefined): StaffAccessRecord | null {
  if (!document || typeof document._id !== 'string') return null;
  const email = parseStaffEmail(document.email);
  if (!email) return null;

  const name = typeof document.name === 'string' && document.name.trim()
    ? document.name.trim()
    : undefined;
  const image = typeof document.image === 'string' && document.image.trim()
    ? document.image.trim()
    : undefined;

  return {
    id: document._id,
    email,
    ...(name ? { name } : {}),
    ...(image ? { image } : {}),
  };
}

function toStoreUnavailable(error: unknown): StaffAccessError {
  if (isStaffAccessError(error)) return error;
  return new StaffAccessError('STAFF_STORE_UNAVAILABLE', error);
}

function isConflict(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const candidate = error as { statusCode?: unknown; status?: unknown };
  return candidate.statusCode === 409 || candidate.status === 409;
}

export function createSanityStaffAccessRepository(client: SanityClient): StaffAccessRepository {
  return {
    async list() {
      try {
        const documents = await client.fetch<SanityStaffAccessDocument[]>(LIST_QUERY);
        return documents
          .map(toRecord)
          .filter((record): record is StaffAccessRecord => record !== null);
      } catch (error) {
        throw toStoreUnavailable(error);
      }
    },

    async findById(id) {
      try {
        return toRecord(await client.fetch<SanityStaffAccessDocument | null>(FIND_BY_ID_QUERY, { id }));
      } catch (error) {
        throw toStoreUnavailable(error);
      }
    },

    async findByEmail(email) {
      try {
        return toRecord(await client.fetch<SanityStaffAccessDocument | null>(FIND_BY_EMAIL_QUERY, {
          email: normalizeStaffEmail(email),
        }));
      } catch (error) {
        throw toStoreUnavailable(error);
      }
    },

    async create(email) {
      try {
        const document = await client.create<SanityStaffAccessDocument>({
          _id: await staffAccessDocumentId(email),
          _type: 'staffAccess',
          email: normalizeStaffEmail(email),
        });
        const record = toRecord(document);
        if (!record) throw new StaffAccessError('STAFF_STORE_UNAVAILABLE');
        return record;
      } catch (error) {
        if (isConflict(error)) throw new StaffAccessError('DUPLICATE_EMAIL');
        throw toStoreUnavailable(error);
      }
    },

    async updateEmail(id, email) {
      const normalizedEmail = normalizeStaffEmail(email);
      const nextId = await staffAccessDocumentId(normalizedEmail);
      try {
        // A staff document ID is derived from its email. Replacing the document
        // rather than patching it releases the old email ID for future reuse and
        // deliberately drops Google-sourced name/image fields.
        if (id === nextId) {
          const document = await client
            .patch(id)
            .set({ email: normalizedEmail })
            .unset(['name', 'image'])
            .commit<SanityStaffAccessDocument>();
          const record = toRecord(document);
          if (!record) throw new StaffAccessError('NOT_FOUND');
          return record;
        }

        await client
          .transaction()
          .create({
            _id: nextId,
            _type: 'staffAccess',
            email: normalizedEmail,
          })
          .delete(id)
          .commit();
        return { id: nextId, email: normalizedEmail };
      } catch (error) {
        if (isConflict(error)) throw new StaffAccessError('DUPLICATE_EMAIL');
        throw toStoreUnavailable(error);
      }
    },

    async delete(id) {
      try {
        await client.delete(id);
      } catch (error) {
        throw toStoreUnavailable(error);
      }
    },

    async syncGoogleProfile(record, profile) {
      const patch: Record<string, string> = {};
      if (profile.name?.trim()) patch.name = profile.name.trim();
      if (profile.image?.trim()) patch.image = profile.image.trim();
      if (Object.keys(patch).length === 0) return;

      try {
        await client.patch(record.id).set(patch).commit();
      } catch {
        // Profile decoration must never prevent an approved staff member from signing in.
      }
    },
  };
}

let staffAccessService: ReturnType<typeof createStaffAccessService> | undefined;

export function getStaffAccessService(): ReturnType<typeof createStaffAccessService> {
  if (!staffAccessService) {
    const config = getConfig();
    const client = createClient({
      projectId: config.projectId,
      dataset: config.dataset,
      apiVersion: config.apiVersion,
      token: config.token,
      useCdn: false,
    });
    staffAccessService = createStaffAccessService(createSanityStaffAccessRepository(client));
  }
  return staffAccessService;
}

export function resetStaffAccessServiceForTests(): void {
  staffAccessService = undefined;
}

export type { StaffAccessRecord, StaffGoogleProfile };
