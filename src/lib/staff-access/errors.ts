export const staffAccessErrorCodes = [
  'INVALID_EMAIL',
  'DUPLICATE_EMAIL',
  'CURRENT_USER_PROTECTED',
  'NOT_FOUND',
  'STAFF_STORE_UNAVAILABLE',
] as const;

export type StaffAccessErrorCode = (typeof staffAccessErrorCodes)[number];

const messages: Record<StaffAccessErrorCode, string> = {
  INVALID_EMAIL: 'Enter a valid email address.',
  DUPLICATE_EMAIL: 'This email already has staff access.',
  CURRENT_USER_PROTECTED: 'You cannot change or remove your own staff access.',
  NOT_FOUND: 'The staff access record was not found.',
  STAFF_STORE_UNAVAILABLE: 'Staff access is temporarily unavailable. Please try again later.',
};

export class StaffAccessError extends Error {
  readonly code: StaffAccessErrorCode;

  constructor(code: StaffAccessErrorCode, cause?: unknown) {
    super(messages[code]);
    this.name = 'StaffAccessError';
    this.code = code;
    if (cause !== undefined) {
      Object.defineProperty(this, 'cause', { value: cause, enumerable: false });
    }
  }
}

export function isStaffAccessError(error: unknown): error is StaffAccessError {
  return error instanceof StaffAccessError;
}

export function staffAccessErrorMessage(code: StaffAccessErrorCode): string {
  return messages[code];
}
