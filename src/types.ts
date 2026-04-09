export type DocumentStatus = 'pending' | 'processing' | 'validated' | 'rejected';

export interface ExtractedData {
  documentType?: string;
  confidenceScore?: number;
  fields: Record<string, any>;
  summary?: string;
}

export interface SCFDocument {
  id: string;
  fileName: string;
  fileUrl: string;
  base64Content?: string;
  fileType: string;
  status: DocumentStatus;
  extractedData?: ExtractedData;
  uploadDate: string;
  uploadedBy: string;
  validatedBy?: string;
  validationDate?: string;
  auditTrail?: AuditLog[];
}

export interface AuditLog {
  id: string;
  documentId: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: string;
  details: string;
}

export type UserRole = 'admin' | 'validator' | 'viewer';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
}
