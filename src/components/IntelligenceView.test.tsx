import { render, screen, waitFor } from '@testing-library/react';
import { IntelligenceView } from './IntelligenceView';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SCFDocument } from '../types';
import { act } from 'react-dom/test-utils';

// Mock the intelligence service
vi.mock('../services/intelligenceService', () => ({
  queryIntelligence: vi.fn(),
  generateLibraryInsights: vi.fn(() => Promise.resolve([
    { title: 'Tax Risk', value: 'Low', description: 'No major risks detected.', trend: 'down' }
  ])),
}));

const mockDocs: SCFDocument[] = [
  {
    id: 'doc-1',
    fileName: 'test.pdf',
    fileUrl: 'http://test.com',
    fileType: 'Invoice',
    status: 'pending',
    uploadDate: new Date().toISOString(),
    uploadedBy: 'user@test.com',
  }
];

describe('IntelligenceView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders fixed chat widget at the top', async () => {
    render(<IntelligenceView documents={mockDocs} onViewDoc={() => {}} />);
    
    // Check if the title is present
    expect(await screen.findByText('TaxBrain Intelligence')).toBeInTheDocument();
    
    // Check if the chat input is present
    expect(screen.getByPlaceholderText(/Ask about tax/i)).toBeInTheDocument();
  });

  it('renders insights section below the chat', async () => {
    render(<IntelligenceView documents={mockDocs} onViewDoc={() => {}} />);
    
    // Check if the insights heading is present
    expect(await screen.findByText('Automated Intelligence Insights')).toBeInTheDocument();
  });

  it('contains a scrollable container for messages', () => {
    const { container } = render(<IntelligenceView documents={mockDocs} onViewDoc={() => {}} />);
    
    // Check for the custom-scrollbar class we added
    const scrollableDiv = container.querySelector('.custom-scrollbar');
    expect(scrollableDiv).toBeDefined();
    expect(scrollableDiv).toHaveClass('overflow-y-auto');
  });
});
