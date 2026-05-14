import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { SCFDocument, AuditLog, UserProfile, DocumentBlueprint, Client, SystemLog } from '../types';

export function useAppData(user: any) {
  const [documents, setDocuments] = useState<SCFDocument[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [blueprints, setBlueprints] = useState<DocumentBlueprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [complianceScore, setComplianceScore] = useState(0);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Documents
    const docsQuery = query(collection(db, 'documents'), orderBy('uploadDate', 'desc'));
    const unsubscribeDocs = onSnapshot(docsQuery, (snapshot) => {
      const docsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as SCFDocument[];
      setDocuments(docsData);
      setLoading(false);

      if (docsData.length > 0) {
        const autoPassed = docsData.filter(d => 
          d.status === 'validated' && 
          (d.extractedData?.confidenceScore || 0) > 0.9 &&
          !d.extractedData?.fraudAnalysis?.isSuspicious
        ).length;
        setComplianceScore(Math.round((autoPassed / docsData.length) * 100));
      }
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'documents'));

    // Audit Logs (Renamed to snake_case to match production schema)
    const logsQuery = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'));
    const unsubscribeLogs = onSnapshot(logsQuery, (snapshot) => {
      const logsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as AuditLog[];
      setAuditLogs(logsData);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'audit_logs'));

    // System Logs
    const systemLogsQuery = query(collection(db, 'system_logs'), orderBy('timestamp', 'desc'));
    const unsubscribeSystemLogs = onSnapshot(systemLogsQuery, (snapshot) => {
      const sysData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as SystemLog[];
      setSystemLogs(sysData);
    }, (err) => {
      // System logs are restricted to admins, so we handle silently if not authorized
      console.warn("Restricted diagnostic access");
    });

    // Users
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ ...doc.data() })) as UserProfile[];
      setUsersList(usersData);
    }, (err) => console.warn("Access to users list restricted"));

    // Blueprints
    const bpQuery = query(collection(db, 'blueprints'), orderBy('createdAt', 'desc'));
    const unsubscribeBP = onSnapshot(bpQuery, (snapshot) => {
      const bpData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as DocumentBlueprint[];
      setBlueprints(bpData);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'blueprints'));

    // Clients
    const clientQuery = query(collection(db, 'clients'), orderBy('name', 'asc'));
    const unsubscribeClients = onSnapshot(clientQuery, (snapshot) => {
      const clientData = snapshot.docs.map(doc => ({ ...doc.data() })) as Client[];
      setClients(clientData);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'clients'));

    return () => {
      unsubscribeDocs();
      unsubscribeLogs();
      unsubscribeSystemLogs();
      unsubscribeUsers();
      unsubscribeBP();
      unsubscribeClients();
    };
  }, [user?.uid]);

  return { documents, auditLogs, systemLogs, usersList, clients, blueprints, loading, complianceScore };
}
