import { render, screen } from '@testing-library/react';
import { IntelligenceView } from './IntelligenceView';
import { describe, it, expect, vi } from 'vitest';
import { SCFDocument } from '../types';

// Mock the intelligence service
vi.mock('../services/intelligenceService', () => ({
  queryIntelligence: vi.fn(),
  generateLibraryInsights: vi.fn(() => Promise.resolve([])),
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
  it('renders fixed chat widget at the top', () => {
    render(<IntelligenceView documents={mockDocs} onViewDoc={() => {}} />);
    
    // Check if the title is present
    expect(screen.getByText('DocBrain Intelligence')).toBeInTheDocument();
    
    // Check if the chat input is present
    expect(screen.getByPlaceholderText(/Ask about vendors/i)).toBeInTheDocument();
  });

  it('renders insights section below the chat', () => {
    render(<IntelligenceView documents={mockDocs} onViewDoc={() => {}} />);
    
    // Check if the insights heading is present
    expect(screen.getByText('Automated Intelligence Insights')).toBeInTheDocument();
  });

  it('contains a scrollable container for messages', () => {
    const { container } = render(<IntelligenceView documents={mockDocs} onViewDoc={() => {}} />);
    
    // Check for the custom-scrollbar class we added
    const scrollableDiv = container.querySelector('.custom-scrollbar');
    expect(scrollableDiv).toBeDefined();
    expect(scrollableDiv).toHaveClass('overflow-y-auto');
  });
});
