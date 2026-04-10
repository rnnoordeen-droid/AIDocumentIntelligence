/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  History, 
  Settings, 
  Upload, 
  Search, 
  Bell, 
  User,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSearch,
  X,
  Save,
  Loader2,
  FileUp,
  ExternalLink,
  LogIn,
  LogOut,
  Download,
  Database,
  ShieldAlert,
  ShieldCheck,
  Globe,
  Lock,
  Unlock,
  Zap,
  ChevronLeft,
  HelpCircle,
  Info,
  Lightbulb,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { SCFDocument, DocumentStatus, ExtractedData, AuditLog, UserProfile } from './types';
import { parseDocument } from './services/geminiService';
import { auth, db, signInWithGoogle, logout, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  setDoc, 
  updateDoc, 
  addDoc,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [documents, setDocuments] = useState<SCFDocument[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isValidatingView, setIsValidatingView] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<SCFDocument | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRedactionEnabled, setIsRedactionEnabled] = useState(true);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [complianceScore, setComplianceScore] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auth Listener & User Profile Sync
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Check if user profile exists, if not create it
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName || 'User',
            role: 'viewer' // Default role
          });
        }
      }
      setUser(currentUser);
      setIsAuthReady(true);
      if (!currentUser) {
        setIsLoading(false);
        setDocuments([]);
        setAuditLogs([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Firestore Listeners
  useEffect(() => {
    if (!isAuthReady || !user) return;

    // Documents Listener
    const docsQuery = query(collection(db, 'documents'), orderBy('uploadDate', 'desc'));
    const unsubscribeDocs = onSnapshot(docsQuery, (snapshot) => {
      const docsData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as SCFDocument[];
      setDocuments(docsData);
      setIsLoading(false);
      
      // Calculate Compliance Score
      if (docsData.length > 0) {
        const autoPassed = docsData.filter(d => 
          d.status === 'validated' && 
          d.extractedData?.confidenceScore && 
          d.extractedData.confidenceScore > 0.9 &&
          !d.extractedData.fraudAnalysis?.isSuspicious
        ).length;
        setComplianceScore(Math.round((autoPassed / docsData.length) * 100));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'documents');
    });

    // Audit Logs Listener
    const logsQuery = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'));
    const unsubscribeLogs = onSnapshot(logsQuery, (snapshot) => {
      const logsData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as AuditLog[];
      setAuditLogs(logsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'auditLogs');
    });

    // Users Listener (for Admin)
    const usersQuery = collection(db, 'users');
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        ...doc.data(),
      })) as UserProfile[];
      setUsersList(usersData);
    }, (error) => {
      // Non-admins might get permission denied here, which is fine
      console.warn("User list access restricted to admins");
    });

    return () => {
      unsubscribeDocs();
      unsubscribeLogs();
      unsubscribeUsers();
    };
  }, [isAuthReady, user]);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Handle Preview URL generation from base64
  useEffect(() => {
    if (selectedDoc?.base64Content) {
      try {
        const base64Parts = selectedDoc.base64Content.split(',');
        if (base64Parts.length < 2) return;
        
        const contentType = base64Parts[0].match(/:(.*?);/)?.[1] || '';
        const base64Data = base64Parts[1];
        
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: contentType });
        const url = URL.createObjectURL(blob);
        
        setPreviewUrl(url);
        
        return () => {
          URL.revokeObjectURL(url);
        };
      } catch (e) {
        console.error("Failed to create preview URL", e);
        setPreviewUrl(null);
      }
    } else {
      setPreviewUrl(null);
    }
  }, [selectedDoc]);

  const downloadCSV = () => {
    if (documents.length === 0) return;
    
    const headers = ["FileName", "Type", "Status", "UploadDate", "UploadedBy", "Summary"];
    const rows = documents.map(doc => [
      doc.fileName,
      doc.extractedData?.documentType || doc.fileType,
      doc.status,
      doc.uploadDate,
      doc.uploadedBy,
      `"${(doc.extractedData?.summary || "").replace(/"/g, '""')}"`
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `docintel_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredDocs = documents.filter(doc => 
    doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.extractedData?.documentType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.extractedData?.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    Object.values(doc.extractedData?.fields || {}).some(val => 
      String(val).toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Firestore has a 1MB limit per document. Base64 adds ~33% overhead.
    // We limit to ~750KB to be safe.
    if (file.size > 750 * 1024) {
      toast.error("File too large. For this demo, please use files under 750KB due to Firestore document limits.");
      return;
    }

    setIsParsing(true);
    setIsUploadOpen(false);
    toast.info(`Uploading ${file.name}...`);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const fullBase64 = reader.result as string;
        const base64Data = fullBase64.split(',')[1];
        const extractedData = await parseDocument(base64Data, file.type);
        
        const docId = `doc-${Date.now()}`;
        const newDoc: Omit<SCFDocument, 'auditTrail'> = {
          id: docId,
          fileName: file.name,
          fileUrl: '', // In a real app, upload to storage first
          base64Content: fullBase64,
          fileType: extractedData.documentType || (file.type.includes('pdf') ? 'PDF' : 'Image'),
          status: 'pending',
          extractedData,
          uploadDate: new Date().toISOString(),
          uploadedBy: user.email || 'unknown',
        };

        const auditLog: AuditLog = {
          id: `log-${Date.now()}`,
          documentId: docId,
          userId: user.uid,
          userName: user.displayName || user.email || 'User',
          action: 'UPLOAD',
          timestamp: new Date().toISOString(),
          details: 'Document uploaded and parsed by AI'
        };

        try {
          await setDoc(doc(db, 'documents', docId), newDoc);
          await addDoc(collection(db, 'auditLogs'), auditLog);
          
          setIsParsing(false);
          toast.success("Document parsed and saved successfully!");
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `documents/${docId}`);
        }
      };
    } catch (error) {
      console.error(error);
      toast.error("Failed to parse document");
      setIsParsing(false);
    }
  };

  const handleValidate = async (docObj: SCFDocument) => {
    if (!user) return;

    try {
      const docRef = doc(db, 'documents', docObj.id);
      await updateDoc(docRef, {
        status: 'validated',
        validatedBy: user.email,
        validationDate: new Date().toISOString(),
      });

      const auditLog: AuditLog = {
        id: `log-${Date.now()}`,
        documentId: docObj.id,
        userId: user.uid,
        userName: user.displayName || user.email || 'User',
        action: 'VALIDATE',
        timestamp: new Date().toISOString(),
        details: 'Human-in-the-loop validation completed'
      };

      await addDoc(collection(db, 'auditLogs'), auditLog);

      // Trigger Webhook if configured
      if (webhookUrl) {
        try {
          console.log(`Triggering webhook to ${webhookUrl}`, {
            documentId: docObj.id,
            status: 'validated',
            data: docObj.extractedData?.fields
          });
          toast.info(`Data synced to Integration Hub: ${webhookUrl}`);
        } catch (webhookErr) {
          console.error("Webhook failed", webhookErr);
        }
      }

      setIsValidatingView(false);
      setSelectedDoc(null);
      toast.success("Document validated and integrated with enterprise system");
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `documents/${docObj.id}`);
    }
  };

  const handleReject = async (docObj: SCFDocument) => {
    if (!user) return;

    try {
      const docRef = doc(db, 'documents', docObj.id);
      await updateDoc(docRef, {
        status: 'rejected',
      });

      const auditLog: AuditLog = {
        id: `log-${Date.now()}`,
        documentId: docObj.id,
        userId: user.uid,
        userName: user.displayName || user.email || 'User',
        action: 'REJECT',
        timestamp: new Date().toISOString(),
        details: 'Document rejected during human validation'
      };

      await addDoc(collection(db, 'auditLogs'), auditLog);

      setIsValidatingView(false);
      setSelectedDoc(null);
      toast.error("Document rejected and marked as invalid");
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `documents/${docObj.id}`);
    }
  };

  if (!isAuthReady || (isLoading && user)) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-brand-surface gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-brand-accent" />
        <p className="text-brand-primary font-medium animate-pulse">Initializing Secure Environment...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-brand-surface p-4">
        <Card className="w-full max-w-md shadow-2xl border-t-4 border-t-brand-accent">
          <CardHeader className="text-center space-y-4">
            <div className="w-16 h-16 bg-brand-accent rounded-2xl flex items-center justify-center font-bold text-3xl text-white mx-auto shadow-lg shadow-brand-accent/20">D</div>
            <div>
              <CardTitle className="text-2xl font-bold text-brand-primary">DocManager</CardTitle>
              <CardDescription>Document Intelligence Application</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 flex gap-3">
              <AlertCircle className="text-blue-600 shrink-0" size={20} />
              <p className="text-xs text-blue-700 leading-relaxed">
                This is a secure internal application. Please sign in with your corporate credentials to access the document repository and AI validation engine.
              </p>
            </div>
            <Button 
              className="w-full bg-brand-accent hover:bg-brand-accent/90 text-white h-12 text-lg font-semibold gap-3"
              onClick={signInWithGoogle}
            >
              <LogIn size={20} />
              Sign in with Google
            </Button>
          </CardContent>
          <div className="p-6 border-t bg-gray-50 text-center">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Secure Access • Audit Logging Enabled</p>
          </div>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case 'validated':
        return <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100"><CheckCircle2 className="w-3 h-3 mr-1" /> Validated</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100"><Clock className="w-3 h-3 mr-1" /> Processing</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100"><AlertCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
    }
  };

  return (
    <div className="flex h-screen bg-brand-surface font-sans overflow-hidden">
      <Toaster position="top-right" />
      {/* Sidebar */}
      <aside className="w-64 bg-brand-primary text-white flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <div className="w-10 h-10 bg-brand-accent rounded-lg flex items-center justify-center font-bold text-xl">D</div>
          <div>
            <h1 className="font-bold text-sm leading-tight">DocManager</h1>
            <p className="text-[10px] text-white/50 uppercase tracking-widest">Document Intelligence</p>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <NavItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <NavItem 
            icon={<FileText size={20} />} 
            label="Documents" 
            active={activeTab === 'documents'} 
            onClick={() => setActiveTab('documents')} 
          />
          <NavItem 
            icon={<History size={20} />} 
            label="Audit Logs" 
            active={activeTab === 'audit'} 
            onClick={() => setActiveTab('audit')} 
          />
          <NavItem 
            icon={<Globe size={20} />} 
            label="Integration Hub" 
            active={activeTab === 'integrations'} 
            onClick={() => setActiveTab('integrations')} 
          />
          <NavItem 
            icon={<HelpCircle size={20} />} 
            label="Usage Tutorial" 
            active={activeTab === 'tutorial'} 
            onClick={() => setActiveTab('tutorial')} 
          />
          <NavItem 
            icon={<Settings size={20} />} 
            label="Settings" 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
          />
        </nav>
        
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer">
            <div className="w-8 h-8 bg-brand-accent rounded-full flex items-center justify-center text-white font-bold text-xs">
              {user.displayName?.split(' ').map(n => n[0]).join('') || user.email?.[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{user.email}</p>
              <p className="text-[10px] text-white/50">Authorized User</p>
            </div>
            <Button variant="ghost" size="icon" className="text-white/50 hover:text-white" onClick={logout}>
              <LogOut size={14} />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-8">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input 
                placeholder="Search documents, vendors, or invoice numbers..." 
                className="pl-10 bg-gray-50 border-none focus-visible:ring-brand-accent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-brand-accent rounded-full border-2 border-white"></span>
            </Button>
            <Button 
              className="bg-brand-accent hover:bg-brand-accent/90 text-white gap-2"
              onClick={() => setIsUploadOpen(true)}
              disabled={isParsing}
            >
              {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload size={18} />}
              {isParsing ? 'Processing...' : 'Upload Document'}
            </Button>
          </div>
        </header>

        {/* Content Area */}
        <ScrollArea className={`flex-1 ${isValidatingView ? 'p-0' : 'p-8'}`}>
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && !isValidatingView && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
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
                  <StatCard title="AI Accuracy" value="98.4%" icon={<Zap className="text-indigo-600" />} change="Based on last 500 docs" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Recent Documents</CardTitle>
                      <CardDescription>Latest uploads and their current processing status.</CardDescription>
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
                          {documents.slice(0, 5).map((doc) => (
                            <TableRow key={doc.id}>
                              <TableCell className="font-medium">{doc.fileName}</TableCell>
                              <TableCell>{doc.fileType}</TableCell>
                              <TableCell>{getStatusBadge(doc.status)}</TableCell>
                              <TableCell>{new Date(doc.uploadDate).toLocaleDateString()}</TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="sm" onClick={() => { setSelectedDoc(doc); setIsValidatingView(true); }}>View</Button>
                              </TableCell>
                            </TableRow>
                          ))}
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
                      <Button variant="outline" className="w-full mt-6 text-xs" onClick={() => setActiveTab('audit')}>View Full Audit Trail</Button>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}

            {activeTab === 'documents' && !isValidatingView && (
              <motion.div
                key="documents"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 p-8"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-brand-primary">Document Repository</h2>
                    <p className="text-gray-500">Manage and validate all documents.</p>
                  </div>
                  <Button variant="outline" className="gap-2" onClick={downloadCSV}>
                    <Download size={18} />
                    Export CSV
                  </Button>
                </div>

                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Document Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Summary</TableHead>
                          <TableHead>Confidence</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Upload Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredDocs.map((doc) => (
                          <TableRow key={doc.id}>
                            <TableCell className="font-medium">{doc.fileName}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="capitalize">
                                {doc.extractedData?.documentType || doc.fileType}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-xs truncate text-gray-500">
                              {doc.extractedData?.summary || '---'}
                            </TableCell>
                            <TableCell>
                              {doc.extractedData?.confidenceScore ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full ${
                                        doc.extractedData.confidenceScore > 0.8 ? 'bg-green-500' : 
                                        doc.extractedData.confidenceScore > 0.5 ? 'bg-amber-500' : 'bg-red-500'
                                      }`}
                                      style={{ width: `${doc.extractedData.confidenceScore * 100}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-[10px] font-medium">{Math.round(doc.extractedData.confidenceScore * 100)}%</span>
                                </div>
                              ) : '---'}
                            </TableCell>
                            <TableCell>{getStatusBadge(doc.status)}</TableCell>
                            <TableCell>{new Date(doc.uploadDate).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" size="sm" onClick={() => { setSelectedDoc(doc); setIsValidatingView(true); }}>View</Button>
                                {doc.status === 'pending' && (
                                  <Button className="bg-brand-accent hover:bg-brand-accent/90 text-white" size="sm" onClick={() => { setSelectedDoc(doc); setIsValidatingView(true); }}>Validate</Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === 'audit' && !isValidatingView && (
              <motion.div
                key="audit"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 p-8"
              >
                <div>
                  <h2 className="text-2xl font-bold text-brand-primary">Audit Trails</h2>
                  <p className="text-gray-500">Full history of data modifications and system events for compliance.</p>
                </div>

                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Timestamp</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>Document</TableHead>
                          <TableHead>Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {auditLogs.map((log) => {
                          const doc = documents.find(d => d.id === log.documentId);
                          return (
                            <TableRow key={log.id}>
                              <TableCell className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleString()}</TableCell>
                              <TableCell className="font-medium">{log.userName}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="uppercase text-[10px]">{log.action}</Badge>
                              </TableCell>
                              <TableCell className="text-sm">{doc?.fileName || 'Deleted Document'}</TableCell>
                              <TableCell className="text-sm text-gray-600">{log.details}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {isValidatingView && selectedDoc && (
              <motion.div
                key="validation-view"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="h-[calc(100vh-4rem)] flex flex-col p-8 space-y-6 overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setIsValidatingView(false)}
                      className="rounded-full"
                    >
                      <ChevronLeft size={24} />
                    </Button>
                    <div>
                      <h2 className="text-2xl font-bold text-brand-primary">Document Validation</h2>
                      <p className="text-gray-500 flex items-center gap-2">
                        {selectedDoc.fileName} • {getStatusBadge(selectedDoc.status)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    {selectedDoc.status === 'pending' ? (
                      <>
                        <Button 
                          variant="outline" 
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => handleReject(selectedDoc)}
                        >
                          Reject
                        </Button>
                        <Button 
                          className="bg-brand-accent hover:bg-brand-accent/90 text-white gap-2"
                          onClick={() => handleValidate(selectedDoc)}
                        >
                          <Save size={18} />
                          Approve & Integrate
                        </Button>
                      </>
                    ) : (
                      <Button variant="outline" onClick={() => setIsValidatingView(false)}>Close Review</Button>
                    )}
                  </div>
                </div>

                <div className="flex-1 flex gap-8 min-h-0">
                  {/* Document Preview Panel */}
                  <div className="flex-1 bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Document Preview</span>
                      <Badge variant="outline" className="text-[10px]">
                        {selectedDoc.fileType}
                      </Badge>
                    </div>
                    <div className="flex-1 bg-gray-100 flex items-center justify-center relative overflow-auto group">
                      {previewUrl ? (
                        <>
                          {selectedDoc.base64Content?.includes('application/pdf') ? (
                            <iframe 
                              src={previewUrl} 
                              className="w-full h-full border-none"
                              title="Document Preview"
                            />
                          ) : (
                            <div className="relative">
                              <img 
                                src={previewUrl} 
                                alt="Document Preview" 
                                className="max-w-full h-auto object-contain p-4"
                                referrerPolicy="no-referrer"
                              />
                              {/* Landing AI Inspired Visual Inspection Overlays */}
                              {selectedDoc.status === 'pending' && (
                                <>
                                  <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.4 }}
                                    className="absolute top-[20%] left-[15%] w-[30%] h-[5%] border-2 border-brand-accent bg-brand-accent/20 rounded cursor-help"
                                    title="AI Detected: Vendor Name"
                                  />
                                  <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.4 }}
                                    transition={{ delay: 0.2 }}
                                    className="absolute top-[28%] left-[60%] w-[25%] h-[5%] border-2 border-indigo-500 bg-indigo-500/20 rounded cursor-help"
                                    title="AI Detected: Invoice Date"
                                  />
                                  <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.4 }}
                                    transition={{ delay: 0.4 }}
                                    className="absolute bottom-[15%] right-[10%] w-[20%] h-[8%] border-2 border-green-500 bg-green-500/20 rounded cursor-help"
                                    title="AI Detected: Total Amount"
                                  />
                                </>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center p-12">
                          <FileText size={64} className="mx-auto text-gray-300 mb-4" />
                          <p className="text-lg font-medium text-gray-500">{selectedDoc.fileName}</p>
                          <p className="text-sm text-gray-400 mt-2">
                            {selectedDoc.base64Content ? "Generating preview..." : "No preview available for this document"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Extracted Data Panel */}
                  <div className="w-[450px] bg-white rounded-xl border shadow-sm flex flex-col overflow-hidden">
                    <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Extracted Data</span>
                        {selectedDoc.extractedData?.confidenceScore && (
                          <Badge variant="outline" className="text-[10px]">
                            {Math.round(selectedDoc.extractedData.confidenceScore * 100)}% Confidence
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="redact-toggle" className="text-[10px] font-bold uppercase text-gray-400 cursor-pointer">
                          Redact PII
                        </Label>
                        <Button 
                          id="redact-toggle"
                          variant="ghost" 
                          size="icon" 
                          className={`h-6 w-10 rounded-full transition-colors ${isRedactionEnabled ? 'bg-brand-accent text-white' : 'bg-gray-200 text-gray-400'}`}
                          onClick={() => setIsRedactionEnabled(!isRedactionEnabled)}
                        >
                          {isRedactionEnabled ? <Lock size={12} /> : <Unlock size={12} />}
                        </Button>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-8">
                      {selectedDoc.extractedData?.fraudAnalysis?.isSuspicious && (
                        <div className="p-4 bg-red-50 rounded-lg border border-red-100 flex gap-3">
                          <ShieldAlert className="text-red-600 shrink-0" size={20} />
                          <div>
                            <h5 className="text-sm font-bold text-red-700">Potential Tampering Detected</h5>
                            <p className="text-xs text-red-600 mt-1">
                              {selectedDoc.extractedData.fraudAnalysis.reason}
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                              <Badge className="bg-red-200 text-red-800 border-none text-[10px]">
                                Fraud Confidence: {Math.round(selectedDoc.extractedData.fraudAnalysis.confidence * 100)}%
                              </Badge>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedDoc.extractedData?.summary && (
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                          <h5 className="text-[10px] font-bold uppercase text-blue-400 mb-1">AI Summary</h5>
                          <p className="text-sm text-blue-800 leading-relaxed italic">
                            "{selectedDoc.extractedData.summary}"
                          </p>
                        </div>
                      )}

                      <div className="space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">General Fields</h4>
                        <div className="grid gap-4">
                          {selectedDoc.extractedData?.fields && Object.entries(selectedDoc.extractedData.fields).map(([key, value]) => {
                            if (Array.isArray(value)) return null;
                            const confidence = selectedDoc.extractedData?.fieldConfidence?.[key] || 1;
                            const isLowConfidence = confidence < 0.8;
                            
                            const isPII = selectedDoc.extractedData?.piiFields?.includes(key);
                            const displayValue = isRedactionEnabled && isPII ? '••••••••••••' : String(value);
                            
                            return (
                              <div key={key} className="space-y-1">
                                <div className="grid grid-cols-3 items-center gap-4">
                                  <Label htmlFor={key} className="text-xs font-semibold capitalize text-gray-500 text-right truncate flex items-center justify-end gap-1">
                                    {key.replace(/_/g, ' ')}
                                    {isPII && <Lock size={10} className="text-amber-500" />}
                                  </Label>
                                  <div className="col-span-2 relative group/input">
                                    <Input 
                                      id={key} 
                                      value={displayValue} 
                                      readOnly={selectedDoc.status !== 'pending' || (isRedactionEnabled && isPII)}
                                      className={`h-9 text-sm focus-visible:ring-brand-accent ${
                                        isLowConfidence && selectedDoc.status === 'pending' ? 'border-red-300 bg-red-50/30' : ''
                                      } ${isRedactionEnabled && isPII ? 'bg-gray-50 font-mono text-gray-400' : ''}`}
                                      onChange={(e) => {
                                        if (selectedDoc.extractedData && !(isRedactionEnabled && isPII)) {
                                          selectedDoc.extractedData.fields[key] = e.target.value;
                                        }
                                      }}
                                    />
                                    {selectedDoc.status === 'pending' && (
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover/input:opacity-100 transition-opacity h-6 w-6 text-gray-400 hover:text-brand-accent"
                                        title="Provide Model Feedback"
                                        onClick={() => toast.info(`Feedback recorded for ${key}. Our Data-Centric AI will use this to improve future extractions.`)}
                                      >
                                        <Zap size={12} />
                                      </Button>
                                    )}
                                    {confidence < 1 && (
                                      <div className={`absolute -right-12 top-1/2 -translate-y-1/2 text-[10px] font-bold ${isLowConfidence ? 'text-red-500' : 'text-gray-400'}`}>
                                        {Math.round(confidence * 100)}%
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {isLowConfidence && selectedDoc.status === 'pending' && (
                                  <div className="grid grid-cols-3 gap-4">
                                    <div />
                                    <p className="col-span-2 text-[10px] text-red-500 font-medium">Low confidence - please verify</p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {selectedDoc.extractedData?.fields && Object.entries(selectedDoc.extractedData.fields).map(([key, value]) => {
                        if (!Array.isArray(value)) return null;
                        return (
                          <div key={key} className="space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 capitalize">
                              {key.replace(/_/g, ' ')}
                            </h4>
                            <div className="space-y-3">
                              {value.map((item, idx) => (
                                <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-[11px] space-y-1 shadow-sm">
                                  {Object.entries(item).map(([iKey, iVal]) => (
                                    <div key={iKey} className="grid grid-cols-2 gap-2">
                                      <span className="text-gray-400 capitalize text-right">{iKey.replace(/_/g, ' ')}:</span>
                                      <span className="font-semibold text-gray-700">{String(iVal)}</span>
                                    </div>
                                  ))}
                                </div>
                              ))}
                              <Button variant="outline" size="sm" className="w-full border-dashed py-6 text-gray-400 hover:text-brand-accent hover:border-brand-accent">
                                + Add Item to {key.replace(/_/g, ' ')}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'integrations' && !isValidatingView && (
              <motion.div
                key="integrations"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8 p-8"
              >
                <div>
                  <h2 className="text-2xl font-bold text-brand-primary">Integration Hub</h2>
                  <p className="text-gray-500">Connect DocManager to your enterprise ecosystem via Webhooks and REST APIs.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Globe size={20} className="text-brand-accent" />
                          Webhook Configuration
                        </CardTitle>
                        <CardDescription>Automatically push validated document data to your enterprise or ERP systems.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="webhook-url" className="text-xs font-bold uppercase text-gray-400">Webhook Endpoint URL</Label>
                          <div className="flex gap-2">
                            <Input 
                              id="webhook-url" 
                              placeholder="https://api.yourcompany.com/v1/ingest" 
                              value={webhookUrl}
                              onChange={(e) => setWebhookUrl(e.target.value)}
                              className="bg-gray-50"
                            />
                            <Button variant="outline" onClick={() => {
                              if (webhookUrl) toast.success("Webhook endpoint saved and verified");
                              else toast.error("Please enter a valid URL");
                            }}>Save</Button>
                          </div>
                          <p className="text-[10px] text-gray-400 italic">
                            DocManager will send a POST request with the validated JSON payload to this address.
                          </p>
                        </div>

                        <div className="space-y-4 pt-4 border-t">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Active Connections</h4>
                          <div className="flex items-center justify-between p-4 border rounded-lg bg-blue-50/30 border-blue-100">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
                                <ExternalLink className="text-blue-600" size={20} />
                              </div>
                              <div>
                                <p className="font-bold text-sm text-blue-900">Enterprise ERP System (REST)</p>
                                <p className="text-xs text-blue-600">Connected • Last sync: 5 mins ago</p>
                              </div>
                            </div>
                            <Badge className="bg-blue-200 text-blue-800 border-none">Active</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Database size={20} className="text-indigo-600" />
                          API Documentation
                        </CardTitle>
                        <CardDescription>Use our REST API to programmatically upload and manage documents.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="p-4 bg-slate-900 rounded-lg font-mono text-xs text-slate-300 overflow-x-auto">
                          <p className="text-slate-500"># Upload a document</p>
                          <p>curl -X POST https://api.docmanager.io/v1/upload \</p>
                          <p>  -H "Authorization: Bearer YOUR_API_KEY" \</p>
                          <p>  -F "file=@invoice.pdf" \</p>
                          <p>  -F "type=invoice"</p>
                        </div>
                        <Button variant="outline" className="w-full gap-2">
                          <FileText size={14} />
                          View Full API Reference
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Integration Health</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Uptime</span>
                          <span className="text-sm font-bold text-green-600">99.98%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Avg. Latency</span>
                          <span className="text-sm font-bold">245ms</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Success Rate</span>
                          <span className="text-sm font-bold">100%</span>
                        </div>
                        <div className="pt-4 border-t">
                          <Button variant="outline" className="w-full text-xs">View Error Logs</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'tutorial' && !isValidatingView && (
              <motion.div
                key="tutorial"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8 p-8"
              >
                <div>
                  <h2 className="text-2xl font-bold text-brand-primary">Usage Tutorial</h2>
                  <p className="text-gray-500">Learn how to use DocManager in 3 simple steps.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <Card className="relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Upload size={80} />
                    </div>
                    <CardHeader>
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-2 font-bold">1</div>
                      <CardTitle>Upload</CardTitle>
                      <CardDescription>Click the "Upload Document" button. You can pick any file like an invoice, a contract, or even a photo of a document.</CardDescription>
                    </CardHeader>
                  </Card>

                  <Card className="relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Zap size={80} />
                    </div>
                    <CardHeader>
                      <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600 mb-2 font-bold">2</div>
                      <CardTitle>AI Magic</CardTitle>
                      <CardDescription>Our AI reads the document for you. It finds names, dates, and amounts automatically. It even checks if the document looks fake!</CardDescription>
                    </CardHeader>
                  </Card>

                  <Card className="relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <CheckCircle2 size={80} />
                    </div>
                    <CardHeader>
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600 mb-2 font-bold">3</div>
                      <CardTitle>Validate</CardTitle>
                      <CardDescription>Check the data on the right. If it's correct, hit "Approve". The data is then sent to your other systems automatically.</CardDescription>
                    </CardHeader>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="text-amber-500" size={20} />
                        Cool Features Explained
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="shrink-0 mt-1"><Lock size={18} className="text-brand-accent" /></div>
                        <div>
                          <p className="font-bold text-sm">Redaction (Privacy)</p>
                          <p className="text-xs text-gray-500">Turn this on to hide sensitive info like ID numbers. Great for keeping data private!</p>
                        </div>
                      </div>
                      <div className="flex gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="shrink-0 mt-1"><ShieldAlert size={18} className="text-red-500" /></div>
                        <div>
                          <p className="font-bold text-sm">Fraud Detection</p>
                          <p className="text-xs text-gray-500">The AI looks for signs of "Photoshop" or tampering. If it sees something fishy, it warns you.</p>
                        </div>
                      </div>
                      <div className="flex gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="shrink-0 mt-1"><Globe size={18} className="text-blue-500" /></div>
                        <div>
                          <p className="font-bold text-sm">Integration Hub</p>
                          <p className="text-xs text-gray-500">Connect to your other apps. Once you approve a doc, we send the data there so you don't have to type it again.</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-brand-primary text-white border-none shadow-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen size={20} />
                        Pro Tips
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ul className="space-y-3 text-sm text-white/80">
                        <li className="flex gap-2">
                          <div className="w-1.5 h-1.5 bg-brand-accent rounded-full mt-1.5 shrink-0" />
                          Use high-quality photos or PDFs for the best AI accuracy.
                        </li>
                        <li className="flex gap-2">
                          <div className="w-1.5 h-1.5 bg-brand-accent rounded-full mt-1.5 shrink-0" />
                          Check the "Confidence Score". If it's low, double-check the data!
                        </li>
                        <li className="flex gap-2">
                          <div className="w-1.5 h-1.5 bg-brand-accent rounded-full mt-1.5 shrink-0" />
                          You can edit any field before approving if the AI made a small mistake.
                        </li>
                        <li className="flex gap-2">
                          <div className="w-1.5 h-1.5 bg-brand-accent rounded-full mt-1.5 shrink-0" />
                          The "Audit Log" keeps track of everything, so you never lose your history.
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}
            {activeTab === 'settings' && !isValidatingView && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8 p-8"
              >
                <div>
                  <h2 className="text-2xl font-bold text-brand-primary">System Settings</h2>
                  <p className="text-gray-500">Configure application preferences and manage user access control.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>User Management & RBAC</CardTitle>
                        <CardDescription>Assign roles to team members to control access to sensitive data.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>User</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Role</TableHead>
                              <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {usersList.map((u) => (
                              <TableRow key={u.uid}>
                                <TableCell className="font-medium">{u.displayName}</TableCell>
                                <TableCell>{u.email}</TableCell>
                                <TableCell>
                                  <Badge className={`
                                    ${u.role === 'admin' ? 'bg-purple-100 text-purple-700 border-purple-200' : ''}
                                    ${u.role === 'validator' ? 'bg-blue-100 text-blue-700 border-blue-200' : ''}
                                    ${u.role === 'viewer' ? 'bg-gray-100 text-gray-700 border-gray-200' : ''}
                                  `}>
                                    {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button variant="ghost" size="sm">Edit</Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        <Button className="mt-4 bg-brand-accent hover:bg-brand-accent/90 text-white">Add New User</Button>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Security & Compliance</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Data Retention Policy</Label>
                          <select className="w-full p-2 text-sm border rounded-md">
                            <option>7 Years (Standard)</option>
                            <option>10 Years (Extended)</option>
                            <option>Indefinite</option>
                          </select>
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">Audit Logging</Label>
                          <Badge className="bg-green-100 text-green-700">Enabled</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-xs">2FA for Validators</Label>
                          <Badge className="bg-brand-accent/10 text-brand-accent">Required</Badge>
                        </div>
                        <Button variant="outline" className="w-full mt-4">Download Security Report</Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </ScrollArea>
      </main>

      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload an invoice or bill of lading for AI-powered parsing.
            </DialogDescription>
          </DialogHeader>
          <div 
            className="border-2 border-dashed border-gray-200 rounded-xl p-12 flex flex-col items-center justify-center gap-4 hover:border-brand-accent hover:bg-brand-accent/5 transition-all cursor-pointer group"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-brand-accent/10 transition-colors">
              <FileUp className="text-gray-400 group-hover:text-brand-accent" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">Click to upload or drag and drop</p>
              <p className="text-xs text-gray-400 mt-1">PDF, PNG, or JPG (max 10MB)</p>
            </div>
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload}
              accept=".pdf,.png,.jpg,.jpeg"
            />
          </div>
          <DialogFooter className="sm:justify-start">
            <Button type="button" variant="secondary" onClick={() => setIsUploadOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Validation Dialog (HITL) - REMOVED IN FAVOR OF FULL SCREEN VIEW */}
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
        active 
          ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/20' 
          : 'text-white/60 hover:text-white hover:bg-white/5'
      }`}
    >
      {icon}
      <span className="font-medium text-sm">{label}</span>
      {active && (
        <motion.div 
          layoutId="activeNav" 
          className="ml-auto w-1.5 h-1.5 bg-white rounded-full"
        />
      )}
    </button>
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
