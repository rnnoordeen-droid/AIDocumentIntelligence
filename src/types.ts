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
  groundingScore?: number;
  hallucinationRisk?: number;
  fieldMetrics?: Record<string, {
    confidence: number;
    grounding: number;
    isTampered: boolean;
    crossCheckResult: 'match' | 'mismatch' | 'inconclusive';
  }>;
  fields: Record<string, any>;
  summary?: string;
  fraudAnalysis?: {
    isSuspicious: boolean;
    reason: string;
    tamperConfidence: number;
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

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: { id: string; fileName: string }[];
  chartData?: {
    type: 'bar' | 'line' | 'pie';
    data: any[];
    title: string;
    xAxisKey: string;
    dataKeys: string[];
  };
}

export interface IntelligenceInsight {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  description: string;
}
