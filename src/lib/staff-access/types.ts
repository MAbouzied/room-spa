export interface StaffAccessRecord {
  id: string;
  email: string;
  name?: string;
  image?: string;
}

export interface StaffAccessUser extends StaffAccessRecord {
  isCurrent: boolean;
}

export interface StaffGoogleProfile {
  name?: string;
  image?: string;
}

export interface StaffAccessRepository {
  list(): Promise<StaffAccessRecord[]>;
  findById(id: string): Promise<StaffAccessRecord | null>;
  findByEmail(email: string): Promise<StaffAccessRecord | null>;
  create(email: string): Promise<StaffAccessRecord>;
  updateEmail(id: string, email: string): Promise<StaffAccessRecord>;
  delete(id: string): Promise<void>;
  syncGoogleProfile(record: StaffAccessRecord, profile: StaffGoogleProfile): Promise<void>;
}
