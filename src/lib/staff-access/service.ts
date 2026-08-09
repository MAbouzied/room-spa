import { StaffAccessError } from './errors.ts';
import type {
  StaffAccessRecord,
  StaffAccessRepository,
  StaffGoogleProfile,
  StaffAccessUser,
} from './types.ts';
import { normalizeStaffEmail, parseStaffEmail } from './validation.ts';

function requireEmail(value: unknown): string {
  const email = parseStaffEmail(value);
  if (!email) throw new StaffAccessError('INVALID_EMAIL');
  return email;
}

function requireTargetId(id: unknown): string {
  if (typeof id !== 'string' || !id.trim() || id.length > 256 || id.startsWith('drafts.')) {
    throw new StaffAccessError('NOT_FOUND');
  }
  return id;
}

function assertNotCurrent(record: StaffAccessRecord, currentEmail: string | undefined): void {
  if (currentEmail && normalizeStaffEmail(record.email) === currentEmail) {
    throw new StaffAccessError('CURRENT_USER_PROTECTED');
  }
}

export function createStaffAccessService(repository: StaffAccessRepository) {
  return {
    async list(currentEmail?: string | null): Promise<StaffAccessUser[]> {
      const normalizedCurrent = parseStaffEmail(currentEmail);
      const records = await repository.list();
      return records
        .map((record) => ({
          ...record,
          isCurrent: normalizedCurrent === normalizeStaffEmail(record.email),
        }))
        .sort((left, right) => left.email.localeCompare(right.email));
    },

    async findApprovedByEmail(email: unknown): Promise<StaffAccessRecord | null> {
      const normalized = parseStaffEmail(email);
      if (!normalized) return null;
      return repository.findByEmail(normalized);
    },

    async syncGoogleProfile(
      record: StaffAccessRecord,
      profile: StaffGoogleProfile,
    ): Promise<void> {
      await repository.syncGoogleProfile(record, profile);
    },

    async create(email: unknown): Promise<StaffAccessRecord> {
      const normalized = requireEmail(email);
      if (await repository.findByEmail(normalized)) {
        throw new StaffAccessError('DUPLICATE_EMAIL');
      }
      return repository.create(normalized);
    },

    async updateEmail(
      id: unknown,
      email: unknown,
      currentEmail?: string | null,
    ): Promise<StaffAccessRecord> {
      const targetId = requireTargetId(id);
      const target = await repository.findById(targetId);
      if (!target) throw new StaffAccessError('NOT_FOUND');

      const normalizedCurrent = parseStaffEmail(currentEmail);
      assertNotCurrent(target, normalizedCurrent ?? undefined);

      const normalizedEmail = requireEmail(email);
      if (normalizeStaffEmail(target.email) === normalizedEmail) {
        return target;
      }

      const existing = await repository.findByEmail(normalizedEmail);
      if (existing && existing.id !== target.id) {
        throw new StaffAccessError('DUPLICATE_EMAIL');
      }

      return repository.updateEmail(target.id, normalizedEmail);
    },

    async delete(id: unknown, currentEmail?: string | null): Promise<void> {
      const targetId = requireTargetId(id);
      const target = await repository.findById(targetId);
      if (!target) throw new StaffAccessError('NOT_FOUND');

      const normalizedCurrent = parseStaffEmail(currentEmail);
      assertNotCurrent(target, normalizedCurrent ?? undefined);
      await repository.delete(target.id);
    },
  };
}
