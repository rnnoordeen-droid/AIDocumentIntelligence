import { motion } from 'motion/react';
import { 
  FileText, 
  Filter, 
  Search, 
  Download,
  Eye,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { SCFDocument, DocumentStatus } from '../../types';

interface DocumentsViewProps {
  documents: SCFDocument[];
  onViewDoc: (doc: SCFDocument) => void;
  searchQuery: string;
}

export function DocumentsView({ documents, onViewDoc, searchQuery }: DocumentsViewProps) {
  const filtered = documents.filter(doc => 
    doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.clientName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case 'validated': return <Badge className="bg-green-100 text-green-700 border-green-200">Validated</Badge>;
      case 'reviewing': return <Badge className="bg-blue-100 text-blue-700 border-blue-200">In Review</Badge>;
      case 'rejected': return <Badge className="bg-red-100 text-red-700 border-red-200">Rejected</Badge>;
      case 'flagged': return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Flagged</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-700 border-gray-200">Pending</Badge>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-8 space-y-6"
    >
      <div className="flex justify-between items-center text-brand-primary">
        <div>
          <h2 className="text-2xl font-bold">Document Repository</h2>
          <p className="text-gray-500">Search and manage all client document assets.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2"><Download size={16} /> Export Batch</Button>
          <Button variant="outline" className="gap-2"><Filter size={16} /> Advanced Filter</Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden min-h-[400px]">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead>File Name</TableHead>
              <TableHead>Client Engagement</TableHead>
              <TableHead>Classification</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Upload Date</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-20 text-gray-400 font-medium italic">
                  No documents match your lifecycle or repository filter.
                </TableCell>
              </TableRow>
            ) : filtered.map((doc) => (
              <TableRow key={doc.id} className="group hover:bg-gray-50/50 transition-colors">
                <TableCell className="font-bold flex items-center gap-3">
                  <div className="w-8 h-10 bg-indigo-50 rounded flex items-center justify-center text-indigo-400 group-hover:text-indigo-600 transition-colors">
                    <FileText size={18} />
                  </div>
                  {doc.fileName}
                </TableCell>
                <TableCell className="text-brand-accent font-semibold">{doc.clientName || 'N/A'}</TableCell>
                <TableCell className="text-sm">{doc.extractedData?.documentType || doc.fileType}</TableCell>
                <TableCell>{getStatusBadge(doc.status)}</TableCell>
                <TableCell className="text-xs text-gray-500">{new Date(doc.uploadDate).toLocaleDateString()}</TableCell>
                <TableCell>
                  {doc.extractedData?.confidenceScore && (
                    <div className="flex items-center gap-2">
                       <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${doc.extractedData.confidenceScore > 0.9 ? 'bg-green-500' : 'bg-amber-500'}`} style={{ width: `${doc.extractedData.confidenceScore * 100}%` }} />
                       </div>
                       <span className="text-[10px] font-bold text-gray-400">{Math.round(doc.extractedData.confidenceScore * 100)}%</span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => onViewDoc(doc)}><Eye size={16} /></Button>
                    <Button variant="ghost" size="icon" className="text-gray-300 hover:text-red-500"><Trash2 size={16} /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
}
