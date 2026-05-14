import { motion } from 'motion/react';
import { 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  Terminal,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { SystemLog } from '../../types';

interface SystemLogsViewProps {
  logs: SystemLog[];
}

export function SystemLogsView({ logs }: SystemLogsViewProps) {
  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'error': return <Badge variant="destructive" className="gap-1"><AlertCircle size={10} /> ERROR</Badge>;
      case 'warn': return <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 gap-1"><AlertTriangle size={10} /> WARN</Badge>;
      default: return <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 gap-1"><Info size={10} /> INFO</Badge>;
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
          <h2 className="text-2xl font-bold text-brand-primary flex items-center gap-2">
            <Terminal size={24} /> System Logs
          </h2>
          <p className="text-gray-500">Infrastructure diagnostics, application errors, and security events.</p>
        </div>
      </div>

      <div className="bg-brand-primary/5 rounded-xl border border-brand-primary/10 p-4 flex gap-4 items-center">
        <ShieldAlert className="text-brand-primary opacity-50" size={32} />
        <div>
          <h4 className="text-sm font-bold text-brand-primary">Automated Sentinel Diagnostics</h4>
          <p className="text-xs text-brand-primary/70">Real-time monitoring of application health. All errors are automatically routed to the engineering team.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="w-[100px]">Severity</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Diagnostic Message</TableHead>
              <TableHead>User Context</TableHead>
              <TableHead>Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20 text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <Terminal size={40} className="opacity-10" />
                    <p>No system diagnostic events recorded.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : [...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((log) => (
              <TableRow key={log.id} className="font-mono text-[11px]">
                <TableCell>
                  {getLevelBadge(log.level)}
                </TableCell>
                <TableCell className="font-bold text-brand-primary">
                  {log.source}
                </TableCell>
                <TableCell className="max-w-md truncate">
                  <span className={log.level === 'error' ? 'text-red-600' : ''}>
                    {log.message}
                  </span>
                  {log.stack && <p className="text-[9px] text-gray-400 mt-0.5 mt-1 overflow-hidden h-4 opacity-50">Stack Trace available</p>}
                </TableCell>
                <TableCell>
                  {log.userEmail ? (
                    <div className="flex flex-col">
                      <span>{log.userEmail}</span>
                      <span className="text-[9px] text-gray-400">{log.userId}</span>
                    </div>
                  ) : <span className="text-gray-400 italic">Anonymous</span>}
                </TableCell>
                <TableCell className="text-gray-500 flex items-center gap-1.5 pt-4">
                  <Clock size={10} />
                  {new Date(log.timestamp).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
}
