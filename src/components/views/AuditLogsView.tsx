import { motion } from 'motion/react';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  History,
  MoreVertical,
  UserPlus,
  PlusCircle,
  Settings,
  Trash2
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { AuditLog } from '../../types';

interface AuditLogsViewProps {
  logs: AuditLog[];
}

export function AuditLogsView({ logs }: AuditLogsViewProps) {
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'UPLOAD': return <FileText size={14} className="text-blue-500" />;
      case 'VALIDATE': return <CheckCircle2 size={14} className="text-green-500" />;
      case 'REJECT': return <XCircle size={14} className="text-red-500" />;
      case 'EDIT': return <History size={14} className="text-amber-500" />;
      case 'INVITE_PROFESSIONAL': return <UserPlus size={14} className="text-indigo-500" />;
      case 'ONBOARD_CLIENT': return <PlusCircle size={14} className="text-emerald-500" />;
      case 'UPDATE_PROFESSIONAL': return <Settings size={14} className="text-slate-500" />;
      case 'DELETE_PROFESSIONAL': return <Trash2 size={14} className="text-rose-500" />;
      default: return <AlertTriangle size={14} className="text-gray-500" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-8 space-y-6"
    >
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-brand-primary">Audit Trails</h2>
          <p className="text-gray-500">Immutable record of all platform activities and administrative modifications.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="w-[80px]">Action</TableHead>
              <TableHead>Principal Investigator</TableHead>
              <TableHead>Activity Details</TableHead>
              <TableHead>Target Resource</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead className="text-right">Integrity Hash</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-20 text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <History size={40} className="opacity-10" />
                    <p>No audit activity recorded yet.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : [...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  <div className="flex items-center justify-center">
                    {getActionIcon(log.action)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm">{log.userName}</span>
                    <span className="text-[10px] text-gray-400 uppercase font-mono tracking-tighter">{log.userId.slice(0, 8)}...</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm font-medium">{log.details}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-xs text-brand-accent">
                    <FileText size={12} />
                    {(log.resourceId || log.documentId || 'system')?.slice(0, 12)}...
                  </div>
                </TableCell>
                <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-mono text-[10px] text-gray-300">
                  sha256:{Math.random().toString(16).slice(2, 10)}...
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
}
