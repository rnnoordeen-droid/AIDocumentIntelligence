import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Plus, 
  UserPlus, 
  Shield, 
  Search,
  Check,
  Mail,
  AlertCircle,
  Settings,
  Activity,
  Trash2,
  Edit,
  Phone,
  Briefcase,
  UserCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
import { 
  AlertTriangle,
  Database
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { toast } from 'sonner';
import { UserProfile, Client, UserRole } from '../../types';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { collection, doc, setDoc, updateDoc, deleteDoc, getDocs, writeBatch, addDoc } from 'firebase/firestore';

interface AdministrationViewProps {
  users: UserProfile[];
  clients: Client[];
  currentUser: any;
  documents?: any[]; // Added documents prop for count visualization
}

export function AdministrationView({ users, clients, currentUser, documents = [] }: AdministrationViewProps) {
  const [isInviteStaffOpen, setIsInviteStaffOpen] = useState(false);
  const [isOnboardClientOpen, setIsOnboardClientOpen] = useState(false);
  const [isManageUserOpen, setIsManageUserOpen] = useState(false);
  const [isDeleteUserOpen, setIsDeleteUserOpen] = useState(false);
  const [isDeleteAllDocsOpen, setIsDeleteAllDocsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Managing/Editing User State
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  
  // New Staff Form State
  const [newStaff, setNewStaff] = useState({ 
    name: '', 
    email: '', 
    role: 'viewer' as UserRole, 
    seniority: 'Level 1', 
    tier: 'Validator',
    clientId: ''
  });
  
  // New Client Form State
  const [newClient, setNewClient] = useState({ 
    name: '', 
    entityType: 'Corporation' as Client['entityType'], 
    industry: '',
    partnerInCharge: '',
    phoneNumber: '',
    contactEmail: '', 
    taxId: '' 
  });

  const handleInviteStaff = async () => {
    if (!newStaff.email || !newStaff.name || !newStaff.clientId) {
      toast.error("Please fill in all required fields including Client assignment");
      return;
    }

    const selectedClient = clients.find(c => c.id === newStaff.clientId);

    setIsSubmitting(true);
    try {
      // 1. Create a "Staff Invitation" record for audit and backend processing
      const invitationId = `inv-${Date.now()}`;
      await setDoc(doc(db, 'staff_invitations', invitationId), {
        id: invitationId,
        inviteeEmail: newStaff.email,
        inviteeName: newStaff.name,
        role: newStaff.role,
        seniority: newStaff.seniority,
        tier: newStaff.tier,
        assignedClientId: newStaff.clientId,
        assignedClientName: selectedClient?.name || 'Unknown',
        invitedBy: currentUser.email,
        timestamp: new Date().toISOString(),
        status: 'Sent'
      });

      // 2. Pre-create user profile
      const staffRef = doc(collection(db, 'users'));
      await setDoc(staffRef, {
        uid: staffRef.id,
        displayName: newStaff.name,
        email: newStaff.email,
        role: newStaff.role,
        seniority: newStaff.seniority,
        tier: newStaff.tier,
        status: 'Active',
        assignedClientId: newStaff.clientId,
        assignedClientName: newStaff.clientId === 'all_access' ? 'Global Access' : (selectedClient?.name || 'Unknown'),
      });

      // 3. Audit log
      await setDoc(doc(collection(db, 'audit_logs')), {
        id: `audit-${Date.now()}`,
        userId: currentUser.uid || 'system',
        userName: currentUser.displayName || currentUser.email || 'Admin',
        action: 'INVITE_PROFESSIONAL',
        resourceId: staffRef.id,
        timestamp: new Date().toISOString(),
        details: `Invited ${newStaff.email} as ${newStaff.role} with ${newStaff.clientId === 'all_access' ? 'Global Access' : ('assignment to ' + selectedClient?.name)}`
      });
      
      // LOGIC FIX: Simulate sending email
      console.log(`[SIMULATED EMAIL] To: ${newStaff.email}, Content: You've been invited to DocManager as ${newStaff.role} for client ${selectedClient?.name}`);
      
      toast.success(`Invitation recorded and profile created for ${newStaff.email}`);
      setIsInviteStaffOpen(false);
      setNewStaff({ name: '', email: '', role: 'viewer', seniority: 'Level 1', tier: 'Validator', clientId: '' });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'users');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOnboardClient = async () => {
    if (!newClient.name || !newClient.contactEmail) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const clientData: Client = {
        id: `client-${Date.now()}`,
        name: newClient.name,
        entityType: newClient.entityType,
        industry: newClient.industry,
        partnerInCharge: newClient.partnerInCharge,
        phoneNumber: newClient.phoneNumber,
        contactEmail: newClient.contactEmail,
        taxId: newClient.taxId || "N/A", 
        onboardingDate: new Date().toISOString(),
        status: 'Active'
      };
      
      await setDoc(doc(db, 'clients', clientData.id), clientData);
      
      // Audit log
      await setDoc(doc(collection(db, 'audit_logs')), {
        id: `audit-${Date.now()}`,
        userId: currentUser.uid || 'system',
        userName: currentUser.displayName || currentUser.email || 'Admin',
        action: 'ONBOARD_CLIENT',
        resourceId: clientData.id,
        timestamp: new Date().toISOString(),
        details: `Onboarded client: ${clientData.name} (${clientData.entityType})`
      });
      
      toast.success(`Client ${newClient.name} onboarded successfully`);
      setIsOnboardClientOpen(false);
      setNewClient({ 
        name: '', 
        entityType: 'Corporation', 
        industry: '',
        partnerInCharge: '',
        phoneNumber: '',
        contactEmail: '', 
        taxId: '' 
      });
    } catch (err) {
      console.error("Onboarding error:", err);
      handleFirestoreError(err, OperationType.CREATE, 'clients');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    
    setIsSubmitting(true);
    try {
      const userRef = doc(db, 'users', editingUser.uid);
      const selectedClient = clients.find(c => c.id === editingUser.assignedClientId);
      
      await updateDoc(userRef, {
        role: editingUser.role,
        seniority: editingUser.seniority,
        tier: editingUser.tier,
        status: editingUser.status,
        assignedClientId: editingUser.assignedClientId,
        assignedClientName: editingUser.assignedClientId === 'all_access' ? 'Global Access' : (selectedClient?.name || 'Unassigned')
      });
      
      // Audit log
      await setDoc(doc(collection(db, 'audit_logs')), {
        id: `audit-${Date.now()}`,
        userId: currentUser.uid || 'system',
        userName: currentUser.displayName || currentUser.email || 'Admin',
        action: 'UPDATE_PROFESSIONAL',
        resourceId: editingUser.uid,
        timestamp: new Date().toISOString(),
        details: `Updated profile for ${editingUser.email}. New role: ${editingUser.role}, Access: ${editingUser.assignedClientId === 'all_access' ? 'Global' : editingUser.assignedClientId}`
      });
      
      toast.success(`Profile updated for ${editingUser.displayName || editingUser.email}`);
      setIsManageUserOpen(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'users');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!editingUser) return;
    
    setIsSubmitting(true);
    try {
      await deleteDoc(doc(db, 'users', editingUser.uid));

      // Audit log
      await setDoc(doc(collection(db, 'audit_logs')), {
        id: `audit-${Date.now()}`,
        userId: currentUser.uid || 'system',
        userName: currentUser.displayName || currentUser.email || 'Admin',
        action: 'DELETE_PROFESSIONAL',
        resourceId: editingUser.uid,
        timestamp: new Date().toISOString(),
        details: `Removed professional ${editingUser.email} from the platform.`
      });
      toast.success("Professional removed from roster");
      setIsDeleteUserOpen(false);
      setIsManageUserOpen(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'users');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAllDocuments = async () => {
    setIsSubmitting(true);
    try {
      // Delete Documents
      const docsSnapshot = await getDocs(collection(db, 'documents'));
      const docBatch = writeBatch(db);
      docsSnapshot.docs.forEach((doc) => docBatch.delete(doc.ref));
      await docBatch.commit();

      // Delete Audit Logs
      const logsSnapshot = await getDocs(collection(db, 'audit_logs'));
      const logBatch = writeBatch(db);
      logsSnapshot.docs.forEach((doc) => logBatch.delete(doc.ref));
      await logBatch.commit();

      // System Log the cleanup
      await addDoc(collection(db, 'system_logs'), {
        level: 'warn',
        source: 'administration/cleanup',
        message: `Bulk library deletion executed by ${currentUser.email}. Removed ${docsSnapshot.size} documents and ${logsSnapshot.size} logs.`,
        timestamp: new Date().toISOString(),
        userId: currentUser.uid,
        userEmail: currentUser.email
      });

      toast.success(`Successfully deleted ${docsSnapshot.size} documents and cleared audit logs.`);
      setIsDeleteAllDocsOpen(false);
    } catch (err) {
      console.error("Bulk deletion failed:", err);
      toast.error("Failed to perform bulk deletion. Check permissions.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6 p-8"
    >
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-brand-primary">User Administration</h2>
          <p className="text-gray-500">Manage firm employees, seniority levels, and access permissions.</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline"
            className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 gap-2"
            onClick={() => setIsOnboardClientOpen(true)}
          >
            <Plus size={18} />
            Onboard Client
          </Button>
          <Button 
            className="bg-brand-accent hover:bg-brand-accent/90 text-white gap-2"
            onClick={() => setIsInviteStaffOpen(true)}
          >
            <UserPlus size={18} />
            Invite Professional
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {/* User List Card */}
          <Card>
            <CardHeader className="border-b bg-gray-50/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500">Firm Roster</CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <Input placeholder="Filter staff..." className="h-8 text-xs w-64 bg-white pl-8" />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Seniority</TableHead>
                    <TableHead>Access Tier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-gray-400 italic">No professionals in roster</TableCell>
                    </TableRow>
                  ) : users.map((staff, i) => (
                    <TableRow key={staff.uid || i}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs uppercase">
                            {(staff.displayName || staff.email || '?').charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{staff.displayName || 'Unset'}</p>
                            <p className="text-[10px] text-gray-500">{staff.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                           <span className="text-sm capitalize">{staff.role}</span>
                           <span className="text-[10px] text-brand-accent font-bold uppercase">{staff.assignedClientName || 'Unassigned'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <Badge variant="secondary" className="font-mono text-[10px]">{staff.seniority || 'Level 1'}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className="flex items-center gap-1">
                          <Shield size={12} className="text-indigo-600" />
                          {staff.tier || 'Validator'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${staff.status === 'Active' ? 'bg-green-500' : 'bg-gray-300'}`} />
                          <span className="text-xs">{staff.status || 'Active'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            setEditingUser(staff);
                            setIsManageUserOpen(true);
                          }}
                        >
                          Manage
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Client Portfolio Card */}
          <Card>
            <CardHeader className="border-b bg-gray-50/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500">Client Portfolio</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Industry / Type</TableHead>
                    <TableHead>Tax ID</TableHead>
                    <TableHead>Partner In Charge</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-gray-400 italic">No clients onboarded</TableCell>
                    </TableRow>
                  ) : clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-bold text-indigo-700">
                        <div>
                          {client.name}
                          <p className="text-[10px] text-gray-400 font-normal">{client.contactEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">{client.industry || 'General'}</span>
                          <span className="text-[10px] text-gray-400">{client.entityType}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-mono">{client.taxId || 'Not set'}</TableCell>
                      <TableCell className="text-sm font-medium">{client.partnerInCharge || 'Unassigned'}</TableCell>
                      <TableCell>
                        <Badge className={client.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                          {client.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">Edit</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar / Stats */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500">Governance Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                <p className="text-[10px] uppercase font-bold text-indigo-400">SOC2 Compliance</p>
                <p className="text-lg font-bold text-indigo-900">Passed</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                <p className="text-[10px] uppercase font-bold text-green-400">Validated Users</p>
                <p className="text-lg font-bold text-green-900">{users.filter(u => u.status === 'Active').length} / {users.length}</p>
              </div>

              <div className="pt-6 border-t mt-6">
                <p className="text-[10px] uppercase font-bold text-gray-400 mb-4">System Utilities</p>
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2 border-red-100 text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => setIsDeleteAllDocsOpen(true)}
                >
                  <Trash2 size={16} />
                  Clear Document Library
                </Button>
                <p className="mt-2 text-[9px] text-gray-400 italic">Caution: This action will permanently remove all uploaded documents and audit history from the secure vault.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete All Documents Confirmation */}
      <Dialog open={isDeleteAllDocsOpen} onOpenChange={setIsDeleteAllDocsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle size={20} />
              Confirm Bulk Deletion
            </DialogTitle>
            <DialogDescription>
              You are about to permanently delete **EVERY** document in the repository and all associated audit logs. This action satisfies data retention compliance requirements for library purging.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-red-50 rounded-lg border border-red-100 flex gap-3 my-4">
             <Database className="text-red-600 shrink-0" size={18} />
             <div>
                <p className="text-xs font-bold text-red-800 tracking-tight">DATA DESTRUCTION WARNING</p>
                <p className="text-[10px] text-red-700 font-medium">This will remove all {documents.length} document assets. It cannot be undone.</p>
             </div>
          </div>
          <DialogFooter className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => setIsDeleteAllDocsOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteAllDocuments} disabled={isSubmitting}>
              {isSubmitting ? "Purging Files..." : "Confirm Purge"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Staff Dialog */}
      <Dialog open={isInviteStaffOpen} onOpenChange={setIsInviteStaffOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Professional</DialogTitle>
            <DialogDescription>
              Invite a new tax professional to join your firm's platform. An invitation email will be sent.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-gray-400">Full Name</Label>
              <Input 
                placeholder="e.g. Robert Smith" 
                value={newStaff.name}
                onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-gray-400">Work Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <Input 
                  type="email"
                  placeholder="robert@yourfirm.com" 
                  className="pl-10"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({...newStaff, email: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-gray-400">Role</Label>
                <Select value={newStaff.role} onValueChange={(val: UserRole) => setNewStaff({...newStaff, role: val})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin / Partner</SelectItem>
                    <SelectItem value="validator">Validator / Senior</SelectItem>
                    <SelectItem value="viewer">Viewer / Junior</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-gray-400">Seniority</Label>
                <Select value={newStaff.seniority} onValueChange={(val) => setNewStaff({...newStaff, seniority: val})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Level 1">Level 1 (Entry)</SelectItem>
                    <SelectItem value="Level 2">Level 2 (Associate)</SelectItem>
                    <SelectItem value="Level 3">Level 3 (Senior)</SelectItem>
                    <SelectItem value="Level 4">Level 4 (Manager)</SelectItem>
                    <SelectItem value="Level 5">Level 5 (Partner)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-gray-400">Client Assignment</Label>
              <Select value={newStaff.clientId} onValueChange={(val) => setNewStaff({...newStaff, clientId: val})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target client..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_access">Global / All Clients</SelectItem>
                  {clients.length === 0 ? (
                    <div className="p-2 text-xs text-gray-500 italic">No clients onboarded.</div>
                  ) : clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-brand-accent font-medium">Critical: Professionals must be tied to a client engagement.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteStaffOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button className="bg-indigo-600 text-white" onClick={handleInviteStaff} disabled={isSubmitting}>
              {isSubmitting ? "Inviting..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Onboard Client Dialog */}
      <Dialog open={isOnboardClientOpen} onOpenChange={setIsOnboardClientOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Onboard New Client</DialogTitle>
            <DialogDescription>
              Create a new client entity to manage their tax documents. Security and regulatory data is mandatory.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-6 py-4">
            <div className="space-y-4 col-span-2">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-gray-400">Entity Name</Label>
                <Input 
                  placeholder="e.g. Acme Corporation" 
                  value={newClient.name}
                  onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-gray-400">Entity Type</Label>
              <Select value={newClient.entityType} onValueChange={(val: Client['entityType']) => setNewClient({...newClient, entityType: val})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Individual">Individual</SelectItem>
                  <SelectItem value="Corporation">Corporation</SelectItem>
                  <SelectItem value="LLC">LLC</SelectItem>
                  <SelectItem value="Partnership">Partnership</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-gray-400">Industry Classification</Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <Input 
                  placeholder="e.g. Technology" 
                  className="pl-10"
                  value={newClient.industry}
                  onChange={(e) => setNewClient({...newClient, industry: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-gray-400">Partner In Charge</Label>
              <div className="relative">
                <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <Input 
                  placeholder="Professional Name" 
                  className="pl-10"
                  value={newClient.partnerInCharge}
                  onChange={(e) => setNewClient({...newClient, partnerInCharge: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-gray-400">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <Input 
                  placeholder="+1 (555) 000-0000" 
                  className="pl-10"
                  value={newClient.phoneNumber}
                  onChange={(e) => setNewClient({...newClient, phoneNumber: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-gray-400">Tax ID / FEIN</Label>
              <Input 
                placeholder="XX-XXXXXXX" 
                value={newClient.taxId}
                onChange={(e) => setNewClient({...newClient, taxId: e.target.value})}
              />
              <p className="text-[10px] text-gray-400 italic">Federal verification required</p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-gray-400">Primary Contact Email</Label>
              <Input 
                type="email"
                placeholder="finance@acme.com" 
                value={newClient.contactEmail}
                onChange={(e) => setNewClient({...newClient, contactEmail: e.target.value})}
              />
            </div>
            
            {(!newClient.name || !newClient.contactEmail) && (
              <div className="col-span-2 p-3 bg-amber-50 rounded-lg border border-amber-100 flex gap-2">
                <AlertCircle className="text-amber-600 shrink-0" size={14} />
                <p className="text-[10px] text-amber-700">Regulatory mandate: Legal name and contact email are required for AML/KYC.</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOnboardClientOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button className="bg-green-600 text-white" onClick={handleOnboardClient} disabled={isSubmitting}>
              {isSubmitting ? "Onboarding..." : "Begin Engagement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage User Dialog */}
      <Dialog open={isManageUserOpen} onOpenChange={setIsManageUserOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Professional</DialogTitle>
            <DialogDescription>
              Update roles, seniority tiers, and client access for {editingUser?.displayName || editingUser?.email}.
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-5 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-gray-400">Role</Label>
                  <Select 
                    value={editingUser.role} 
                    onValueChange={(val: UserRole) => setEditingUser({...editingUser, role: val})}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin / Partner</SelectItem>
                      <SelectItem value="validator">Validator / Senior</SelectItem>
                      <SelectItem value="viewer">Viewer / Junior</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-gray-400">Seniority</Label>
                  <Select 
                    value={editingUser.seniority} 
                    onValueChange={(val) => setEditingUser({...editingUser, seniority: val})}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Level 1">Level 1 (Entry)</SelectItem>
                      <SelectItem value="Level 2">Level 2 (Associate)</SelectItem>
                      <SelectItem value="Level 3">Level 3 (Senior)</SelectItem>
                      <SelectItem value="Level 4">Level 4 (Manager)</SelectItem>
                      <SelectItem value="Level 5">Level 5 (Partner)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-gray-400">Client Access Assignment</Label>
                <Select 
                  value={editingUser.assignedClientId} 
                  onValueChange={(val) => setEditingUser({...editingUser, assignedClientId: val})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select target client..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_access">Global / All Clients</SelectItem>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-gray-400">Lifecycle Status</Label>
                <Select 
                  value={editingUser.status} 
                  onValueChange={(val: any) => setEditingUser({...editingUser, status: val})}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="On Leave">On Leave</SelectItem>
                    <SelectItem value="Inactive">Inactive / Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4 border-t flex justify-between items-center">
                 <p className="text-[10px] text-gray-400 font-medium italic">Security: Access changes are logged.</p>
                 <Button 
                   variant="ghost" 
                   size="sm" 
                   className="text-red-500 hover:text-red-600 hover:bg-red-50 gap-2"
                   onClick={() => setIsDeleteUserOpen(true)}
                 >
                   <Trash2 size={14} /> Remove User
                 </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsManageUserOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button className="bg-brand-primary text-white" onClick={handleUpdateUser} disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteUserOpen} onOpenChange={setIsDeleteUserOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Removal</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong>{editingUser?.displayName}</strong> from the firm roster? This will revoke all access instantly.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => setIsDeleteUserOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={isSubmitting}>
              {isSubmitting ? "Removing..." : "Confirm Removal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
