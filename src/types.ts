export type DocumentStatus = 'pending' | 'processing' | 'validated' | 'rejected' | 'flagged';

export interface ValidationRule {
  id: string;
  field: string;
  type: 'required' | 'min_length' | 'max_length' | 'regex' | 'numeric_range' | 'custom';
  value?: any;
  message: string;
}

export interface DocumentBlueprint {
  id: string;
  name: string;
  description: string;
  documentType: string;
  fields: {
    name: string;
    type: 'string' | 'number' | 'date' | 'boolean' | 'array';
    description: string;
    required: boolean;
  }[];
  rules: ValidationRule[];
  createdAt: string;
}

export interface ExtractedData {
  documentType?: string;
  confidenceScore?: number;
  fieldConfidence?: Record<string, number>;
  fields: Record<string, any>;
  summary?: string;
  fraudAnalysis?: {
    isSuspicious: boolean;
    reason: string;
    confidence: number;
  };
  piiFields?: string[];
  fieldCoordinates?: Record<string, { top: number; left: number; width: number; height: number }>;
  validationResults?: {
    ruleId: string;
    passed: boolean;
    message: string;
  }[];
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
