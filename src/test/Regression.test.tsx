import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';
import * as geminiService from '../services/geminiService';
import * as firebaseFirestore from 'firebase/firestore';

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  setDoc: vi.fn(() => Promise.resolve()),
  addDoc: vi.fn(() => Promise.resolve()),
  query: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: vi.fn((q, cb) => {
    // Return empty array for tests
    cb({ docs: [] });
    return vi.fn();
  }),
  getFirestore: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({
    currentUser: { uid: 'test-user', email: 'test@example.com', displayName: 'Test User' },
    onAuthStateChanged: vi.fn((cb) => {
        cb({ uid: 'test-user', email: 'test@example.com', displayName: 'Test User' });
        return vi.fn();
    }),
  })),
  onAuthStateChanged: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
}));

// Mock Gemini Service
vi.mock('../services/geminiService', () => ({
  parseDocument: vi.fn(),
}));

describe('Regression: Document Upload Pipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles single document upload and AI extraction successfully', async () => {
    const mockExtractedData = {
      documentType: 'Tax Form 1040',
      confidenceScore: 0.95,
      groundingScore: 0.9,
      hallucinationRisk: 0.1,
      fields: { name: 'John Doe', tax_year: '2023' },
      fieldCoordinates: {},
      piiFields: [],
      summary: 'Processed successfully'
    };
    
    (geminiService.parseDocument as any).mockResolvedValue(mockExtractedData);

    render(<App />);

    // Open upload dialog
    const uploadTrigger = await screen.findByText(/Upload/i);
    fireEvent.click(uploadTrigger);

    // Find file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['dummy content'], 'test-doc.pdf', { type: 'application/pdf' });

    // Mock FileReader behavior
    const readAsDataURLSpy = vi.spyOn(FileReader.prototype, 'readAsDataURL').mockImplementation(function(this: FileReader) {
      Object.defineProperty(this, 'result', { value: 'data:application/pdf;base64,dGVzdA==' });
      if (this.onload) this.onload({ target: this } as any);
    });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(geminiService.parseDocument).toHaveBeenCalled();
      expect(firebaseFirestore.setDoc).toHaveBeenCalled();
    }, { timeout: 5000 });

    expect(screen.getByText(/Processed: test-doc.pdf/i)).toBeInTheDocument();
  });

  it('handles multiple document uploads sequentially', async () => {
    const mockExtractedData = {
      documentType: 'Invoice',
      confidenceScore: 0.8,
      fields: {},
      summary: 'Success'
    };
    
    (geminiService.parseDocument as any).mockResolvedValue(mockExtractedData);

    render(<App />);

    const uploadTrigger = await screen.findByText(/Upload/i);
    fireEvent.click(uploadTrigger);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file1 = new File(['1'], 'doc1.pdf', { type: 'application/pdf' });
    const file2 = new File(['2'], 'doc2.pdf', { type: 'application/pdf' });

    // Mock FileReader
    vi.spyOn(FileReader.prototype, 'readAsDataURL').mockImplementation(function(this: FileReader) {
      Object.defineProperty(this, 'result', { value: 'data:application/pdf;base64,dGVzdA==' });
      if (this.onload) this.onload({ target: this } as any);
    });

    fireEvent.change(fileInput, { target: { files: [file1, file2] } });

    await waitFor(() => {
      expect(geminiService.parseDocument).toHaveBeenCalledTimes(2);
    }, { timeout: 5000 });

    expect(screen.getByText(/Processed: doc1.pdf/i)).toBeInTheDocument();
    expect(screen.getByText(/Processed: doc2.pdf/i)).toBeInTheDocument();
    expect(screen.getByText(/All documents processed successfully!/i)).toBeInTheDocument();
  });

  it('captures and reports errors during document processing without breaking the batch', async () => {
    (geminiService.parseDocument as any)
      .mockRejectedValueOnce(new Error('AI Service Offline'))
      .mockResolvedValueOnce({ documentType: 'Success', fields: {} });

    render(<App />);

    const uploadTrigger = await screen.findByText(/Upload/i);
    fireEvent.click(uploadTrigger);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file1 = new File(['1'], 'fail.pdf', { type: 'application/pdf' });
    const file2 = new File(['2'], 'success.pdf', { type: 'application/pdf' });

    vi.spyOn(FileReader.prototype, 'readAsDataURL').mockImplementation(function(this: FileReader) {
      Object.defineProperty(this, 'result', { value: 'data:application/pdf;base64,dGVzdA==' });
      if (this.onload) this.onload({ target: this } as any);
    });

    fireEvent.change(fileInput, { target: { files: [file1, file2] } });

    await waitFor(() => {
      expect(screen.getByText(/Failed to process fail.pdf/i)).toBeInTheDocument();
      expect(screen.getByText(/Processed: success.pdf/i)).toBeInTheDocument();
    }, { timeout: 5000 });
  });
});
