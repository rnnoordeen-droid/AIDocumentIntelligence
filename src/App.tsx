import { useState, useRef, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  History, 
  Settings, 
  Upload, 
  Search, 
  Bell, 
  LogOut,
  Sparkles,
  FileCode,
  Globe,
  HelpCircle,
  Terminal,
  MessageSquare,
  Loader2,
  RefreshCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

// Hooks
import { useAuth } from './hooks/useAuth';
import { useAppData } from './hooks/useAppData';

// Components
import { DashboardView } from './components/views/DashboardView';
import { DocumentsView } from './components/views/DocumentsView';
import { AdministrationView } from './components/views/AdministrationView';
import { AuditLogsView } from './components/views/AuditLogsView';
import { SystemLogsView } from './components/views/SystemLogsView';
import { BlueprintsView } from './components/views/BlueprintsView';
import { IntelligenceView } from './components/IntelligenceView';
import { BlueprintModal } from './components/BlueprintModal';
import { ValidationView } from './components/views/ValidationView';

// Services & Firebase
import { signInWithGoogle, logout, db, handleFirestoreError, OperationType } from './firebase';
import { parseDocument } from './services/geminiService';
import { doc, setDoc, addDoc, collection } from 'firebase/firestore';
import { SCFDocument, DocumentStatus, AuditLog } from './types';

export default function App() {
  const { user, profile, isAuthReady, loading: authLoading } = useAuth();
  const { 
    documents, 
    auditLogs, 
    systemLogs,
    usersList, 
    clients, 
    blueprints, 
    loading: dataLoading, 
    complianceScore 
  } = useAppData(user);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isValidatingView, setIsValidatingView] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<SCFDocument | null>(null);
  
  // Upload States
  const [targetClient, setTargetClient] = useState('');
  const [uploadBlueprintId, setUploadBlueprintId] = useState('none');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isLoading = authLoading || (isAuthReady && user && dataLoading);

  const filteredDocs = documents.filter(doc => 
    doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.clientName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !user) return;

    const fileList = Array.from(files);
    
    // Validate file sizes first
    for (const file of fileList) {
      if (file.size > 2 * 1024 * 1024) { // Increased to 2MB as 750KB is very tight for PDFs
        toast.error(`${file.name} is too large. Max 2MB allowed.`);
        return;
      }
    }

    setIsParsing(true);
    setIsUploadOpen(false);
    toast.info(`AI Ingesting ${fileList.length} document(s)...`);

    try {
      let successCount = 0;
      let failCount = 0;

      for (const file of fileList) {
        const reader = new FileReader();
        
        const success = await new Promise((resolve) => {
          reader.readAsDataURL(file);
          reader.onload = async () => {
            try {
              const fullBase64 = reader.result as string;
              if (!fullBase64 || !fullBase64.includes(',')) {
                throw new Error("Invalid file data format");
              }
              
              const base64Data = fullBase64.split(',')[1];
              
              // Prevent Firestore 1MB document limit issues
              if (fullBase64.length > 1000000) { 
                throw new Error("File content too large for direct processing (max ~700KB for base64 storage)");
              }
              
              const blueprint = uploadBlueprintId !== 'none' ? blueprints.find(b => b.id === uploadBlueprintId) : undefined;
              const selectedClient = clients.find(c => c.id === targetClient);

              const schema = blueprint ? {
                documentType: blueprint.documentType,
                fields: blueprint.fields.reduce((acc, f) => ({ ...acc, [f.name]: f.type }), {})
              } : undefined;

              // AI Extraction
              const extractedData = await parseDocument(base64Data, file.type, schema);
              
              const docId = `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              const newDoc: Omit<SCFDocument, 'auditTrail'> = {
                id: docId,
                clientId: targetClient,
                clientName: selectedClient?.name || 'Unassigned',
                fileName: file.name,
                fileUrl: '',
                base64Content: fullBase64,
                fileType: extractedData.documentType || (file.type.includes('pdf') ? 'PDF' : 'Image'),
                status: 'pending',
                extractedData,
                uploadDate: new Date().toISOString(),
                uploadedBy: user.email || 'unknown',
                piiMasked: false
              };

              const auditLog: AuditLog = {
                id: `log-${Date.now()}`,
                documentId: docId,
                userId: user.uid,
                userName: user.displayName || user.email || 'User',
                action: 'UPLOAD_EXTRACT',
                timestamp: new Date().toISOString(),
                details: `Document ${file.name} uploaded for client ${selectedClient?.name || targetClient}. AI classified as ${newDoc.fileType} with ${extractedData.confidenceScore * 100}% confidence.`
              };

              await setDoc(doc(db, 'documents', docId), newDoc);
              await addDoc(collection(db, 'audit_logs'), auditLog);
              
              successCount++;
              resolve(true);
            } catch (err) {
              console.error(`Failed to process ${file.name}:`, err);
              failCount++;
              toast.error(`${file.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
              resolve(false);
            }
          };
          reader.onerror = () => {
            failCount++;
            resolve(false);
          };
        });
      }
      
      setIsParsing(false);
      if (successCount > 0) {
        toast.success(`Successfully processed ${successCount} document(s)${failCount > 0 ? `, but ${failCount} failed.` : '.'}`);
      } else if (failCount > 0) {
        toast.error(`Failed to process all ${failCount} document(s).`);
      }
    } catch (error) {
      console.error(error);
      toast.error("Batch processing encountered a system error.");
      setIsParsing(false);
    }
  };

  if (!isAuthReady || isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-brand-surface gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-brand-accent" />
        <p className="text-brand-primary font-medium">Initializing Secure Environment...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-brand-surface p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
           <div className="w-16 h-16 bg-brand-accent rounded-2xl flex items-center justify-center font-bold text-3xl text-white mx-auto shadow-lg shadow-brand-accent/20">D</div>
           <div>
              <h1 className="text-2xl font-bold text-brand-primary">DocManager</h1>
              <p className="text-gray-500">Corporate Document Intelligence</p>
           </div>
           <Button 
              className="w-full bg-brand-accent hover:bg-brand-accent/90 text-white h-12"
              onClick={signInWithGoogle}
            >
              Sign in with Google
            </Button>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Secure Access • Audit Logging Enabled</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-brand-surface font-sans overflow-hidden">
      <Toaster position="top-right" richColors />
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-brand-primary text-white flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-white/10 shrink-0">
          <div className="w-10 h-10 bg-brand-accent rounded-lg flex items-center justify-center font-bold text-xl">D</div>
          <div>
            <h1 className="font-bold text-sm leading-tight">DocManager</h1>
            <p className="text-[10px] text-white/50 uppercase tracking-widest">Enterprise AI</p>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavItem icon={<LayoutDashboard size={18} />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => {setActiveTab('dashboard'); setIsValidatingView(false);}} />
          <NavItem icon={<Sparkles size={18} />} label="Tax Brain" active={activeTab === 'intelligence'} onClick={() => {setActiveTab('intelligence'); setIsValidatingView(false);}} />
          <NavItem icon={<FileText size={18} />} label="Documents" active={activeTab === 'documents'} onClick={() => {setActiveTab('documents'); setIsValidatingView(false);}} />
          <NavItem icon={<Settings size={18} />} label="Administration" active={activeTab === 'admin'} onClick={() => {setActiveTab('admin'); setIsValidatingView(false);}} />
          <NavItem icon={<History size={18} />} label="Audit Logs" active={activeTab === 'audit'} onClick={() => {setActiveTab('audit'); setIsValidatingView(false);}} />
          {profile?.role === 'admin' && (
            <NavItem icon={<Terminal size={18} />} label="System Logs" active={activeTab === 'syslogs'} onClick={() => {setActiveTab('syslogs'); setIsValidatingView(false);}} />
          )}
          <div className="my-4 border-t border-white/10 pt-4 opacity-50 px-4 text-[10px] uppercase font-bold tracking-widest text-white/40">Tools</div>
          <NavItem icon={<FileCode size={18} />} label="Blueprints" active={activeTab === 'blueprints'} onClick={() => {setActiveTab('blueprints'); setIsValidatingView(false);}} />
          <NavItem icon={<Globe size={18} />} label="Integrations" active={activeTab === 'integrations'} onClick={() => {setActiveTab('integrations'); setIsValidatingView(false);}} />
          <NavItem icon={<HelpCircle size={18} />} label="Training" active={activeTab === 'tutorial'} onClick={() => {setActiveTab('tutorial'); setIsValidatingView(false);}} />
        </nav>
        
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5">
            <div className="w-8 h-8 bg-brand-accent rounded-full flex items-center justify-center text-white font-bold text-xs uppercase">
              {profile?.displayName?.charAt(0) || user.email?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{user.email}</p>
              <p className="text-[10px] text-white/50 capitalize">{profile?.role || 'User'}</p>
            </div>
            <Button variant="ghost" size="icon" className="text-white/50 hover:text-white h-8 w-8" onClick={logout}>
              <LogOut size={14} />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b flex items-center justify-between px-8 shrink-0">
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <Input 
              placeholder="Search across all client documents..." 
              className="pl-10 bg-gray-50 border-none focus-visible:ring-brand-accent w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative h-10 w-10">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-brand-accent rounded-full border-2 border-white"></span>
            </Button>
            <Button 
              className="bg-brand-accent hover:bg-brand-accent/90 text-white gap-2"
              onClick={() => setIsUploadOpen(true)}
              disabled={isParsing}
            >
              {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload size={18} />}
              {isParsing ? 'Extracting...' : 'Upload Doc'}
            </Button>
          </div>
        </header>

        <section className="flex-1 overflow-hidden relative">
          {isValidatingView && selectedDoc ? (
            <ValidationView 
              document={selectedDoc} 
              onClose={() => {setIsValidatingView(false); setSelectedDoc(null);}}
            />
          ) : (
            <ScrollArea className="h-full">
              {activeTab === 'dashboard' && (
                <DashboardView 
                  user={user}
                  documents={documents}
                  auditLogs={auditLogs}
                  complianceScore={complianceScore}
                  onViewDoc={(doc) => {setSelectedDoc(doc); setIsValidatingView(true);}}
                  onSwitchTab={setActiveTab}
                  searchQuery={searchQuery}
                  onClearSearch={() => setSearchQuery('')}
                />
              )}
              {activeTab === 'documents' && (
                <DocumentsView 
                  documents={documents}
                  onViewDoc={(doc) => {setSelectedDoc(doc); setIsValidatingView(true);}}
                  searchQuery={searchQuery}
                />
              )}
              {activeTab === 'admin' && (
                <AdministrationView 
                  users={usersList}
                  clients={clients}
                  currentUser={user}
                  documents={documents}
                />
              )}
              {activeTab === 'audit' && (
                <AuditLogsView logs={auditLogs} />
              )}
              {activeTab === 'syslogs' && profile?.role === 'admin' && (
                <SystemLogsView logs={systemLogs} />
              )}
              {activeTab === 'intelligence' && (
                <IntelligenceView 
                  documents={documents} 
                  onViewDoc={(doc) => {setSelectedDoc(doc); setIsValidatingView(true);}} 
                />
              )}
              {activeTab === 'blueprints' && (
                <BlueprintsView blueprints={blueprints} />
              )}
              {/* Fallback for other tabs */}
              {!['dashboard', 'documents', 'admin', 'audit', 'intelligence', 'blueprints'].includes(activeTab) && (
                <div className="p-12 text-center text-gray-500">
                  <h2 className="text-xl font-bold">Module Under Maintenance</h2>
                  <p>The {activeTab} module is being refactored for production performance.</p>
                </div>
              )}
            </ScrollArea>
          )}
        </section>
      </main>

      {/* Shared Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ingest Document</DialogTitle>
            <DialogDescription>
              Select client and optional blueprint for AI-schema enforcement.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
             <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-gray-400">Target Client</Label>
                <Select value={targetClient} onValueChange={setTargetClient}>
                  <SelectTrigger className="bg-gray-50 border-none">
                    <SelectValue placeholder="Select Client (Required)" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
             </div>
             <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-gray-400">Extraction Blueprint</Label>
                <Select value={uploadBlueprintId} onValueChange={setUploadBlueprintId}>
                  <SelectTrigger className="bg-gray-50 border-none">
                    <SelectValue placeholder="Dynamic Extraction" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Dynamic (AI-only)</SelectItem>
                    {blueprints.map(bp => <SelectItem key={bp.id} value={bp.id}>{bp.name}</SelectItem>)}
                  </SelectContent>
                </Select>
             </div>
             <div 
                className="border-2 border-dashed border-gray-200 rounded-xl p-12 flex flex-col items-center justify-center gap-4 hover:border-brand-accent hover:bg-brand-accent/5 transition-all cursor-pointer"
                onClick={() => {
                  if (!targetClient) {
                    toast.error("Please select a client first");
                    return;
                  }
                  fileInputRef.current?.click();
                }}
              >
                <Upload className="text-gray-400" />
                <p className="text-sm font-medium">Click to upload doc</p>
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept=".pdf,.png,.jpg,.jpeg" multiple />
             </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsUploadOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
        active 
          ? 'bg-brand-accent text-white shadow-md' 
          : 'text-white/60 hover:text-white hover:bg-white/5'
      }`}
    >
      {icon}
      <span className="font-medium text-sm">{label}</span>
    </button>
  );
}
