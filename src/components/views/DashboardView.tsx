import { motion } from 'motion/react';
import { 
  FileText, 
  Clock, 
  ShieldCheck, 
  Zap, 
  Search,
  Sparkles,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { SCFDocument, AuditLog, DocumentStatus } from '../../types';

interface DashboardViewProps {
  user: any;
  documents: SCFDocument[];
  auditLogs: AuditLog[];
  complianceScore: number;
  onViewDoc: (doc: SCFDocument) => void;
  onSwitchTab: (tab: string) => void;
  searchQuery: string;
  onClearSearch: () => void;
}

export function DashboardView({ 
  user, 
  documents, 
  auditLogs, 
  complianceScore, 
  onViewDoc,
  onSwitchTab,
  searchQuery,
  onClearSearch
}: DashboardViewProps) {
  
  const filteredDocs = documents.filter(doc => 
    doc.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case 'validated':
        return <Badge className="bg-green-100 text-green-700 border-green-200">Partner Validated</Badge>;
      case 'reviewing':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Senior Review</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 border-red-200">Audit Rejected</Badge>;
      case 'flagged':
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Compliance Risk</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-700 border-slate-200">Draft / Pending</Badge>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 p-8"
    >
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-brand-primary">Welcome back, {user.displayName?.split(' ')[0] || 'User'}</h2>
          <p className="text-gray-500">Here's what's happening with your documents today.</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">System Status</p>
          <div className="flex items-center gap-2 text-green-600 font-medium">
            <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
            AI Engine Online
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Documents" value={documents.length.toString()} icon={<FileText className="text-blue-600" />} change="+12% from last month" />
        <StatCard title="Pending Validation" value={documents.filter(d => d.status === 'pending').length.toString()} icon={<Clock className="text-amber-600" />} change="Requires attention" />
        <StatCard title="Compliance Score" value={`${complianceScore}%`} icon={<ShieldCheck className="text-green-600" />} change="Auto-pass rate" />
        <StatCard title="AI Accuracy" value="98.4%" icon={<Zap className="text-indigo-600" />} change="Last 500 docs" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Documents</CardTitle>
            <CardDescription>Latest uploads in the repository.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <FileText size={32} className="opacity-20" />
                        <p>No documents found matching "{searchQuery}"</p>
                        <Button variant="link" onClick={onClearSearch} className="text-brand-accent">Clear search</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDocs.slice(0, 5).map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">{doc.fileName}</TableCell>
                      <TableCell>{doc.extractedData?.documentType || doc.fileType}</TableCell>
                      <TableCell>{getStatusBadge(doc.status)}</TableCell>
                      <TableCell>{new Date(doc.uploadDate).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => onViewDoc(doc)}>View</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audit Activity</CardTitle>
            <CardDescription>Recent system and user actions.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {auditLogs.slice(0, 4).map((log) => (
                <div key={log.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <User size={14} className="text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-brand-primary">
                      <span className="font-bold">{log.userName}</span> {log.details.toLowerCase()}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">{new Date(log.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-6 text-xs" onClick={() => onSwitchTab('audit')}>View Full Audit Trail</Button>
          </CardContent>
        </Card>
      </div>

      {/* Library Intelligence Feature Card */}
      <Card className="bg-brand-primary text-white overflow-hidden border-none shadow-xl relative mt-8">
        <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 scale-150">
          <Sparkles size={120} />
        </div>
        <CardContent className="p-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <Badge className="bg-brand-accent text-white border-none mb-4 px-3 py-1">New Feature</Badge>
              <h3 className="text-3xl font-bold mb-3">Ask your Resident Tax Expert</h3>
              <p className="text-white/70 text-lg">Our new TaxBrain intelligence engine can now reason across all client documents simultaneously. Identitfy tax savings, detect audit risks, and generate compliance reports in seconds.</p>
            </div>
            <Button 
              onClick={() => onSwitchTab('intelligence')}
              className="bg-white text-indigo-900 hover:bg-white/90 px-8 h-12 text-lg font-bold shrink-0 shadow-lg"
            >
              Try TaxBrain now
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function StatCard({ title, value, icon, change }: { title: string, value: string, icon: React.ReactNode, change: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="p-2 bg-gray-50 rounded-lg">
            {icon}
          </div>
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
            change.includes('+') ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
          }`}>
            {change}
          </span>
        </div>
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <p className="text-2xl font-bold text-brand-primary mt-1">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
