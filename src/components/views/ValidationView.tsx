import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ChevronLeft, 
  ShieldCheck, 
  ShieldAlert, 
  Zap, 
  Lock, 
  Unlock, 
  MessageSquare, 
  Check, 
  FileText,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  CheckCircle2,
  Circle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { SCFDocument, AuditLog } from '../../types';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db, handleFirestoreError, auth, OperationType } from '../../firebase';
import { ScrollArea } from '@/components/ui/scroll-area';
import { parseDocument } from '../../services/geminiService';

interface ValidationViewProps {
  document: SCFDocument;
  onClose: () => void;
}

export function ValidationView({ document: docObj, onClose }: ValidationViewProps) {
  const [activeField, setActiveField] = useState<string | null>(null);
  const [isRedactionEnabled, setIsRedactionEnabled] = useState(true);
  const [isParsing, setIsParsing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [verifiedFields, setVerifiedFields] = useState<Record<string, boolean>>({});
  
  // Local state for edits
  const [editedFields, setEditedFields] = useState<Record<string, any>>(docObj.extractedData?.fields || {});

  useEffect(() => {
    if (docObj?.extractedData?.fields) {
      setEditedFields(docObj.extractedData.fields);
    }
  }, [docObj]);

  useEffect(() => {
    if (docObj?.base64Content) {
      try {
        const base64Parts = docObj.base64Content.split(',');
        if (base64Parts.length < 2) return;
        const contentType = base64Parts[0].match(/:(.*?);/)?.[1] || '';
        const base64Data = base64Parts[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: contentType });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
      } catch (e) {
        console.error("Failed to create preview URL", e);
      }
    }
  }, [docObj]);

  const handleUpdate = async (status: 'validated' | 'reviewing' | 'rejected', action: string, details: string) => {
    if (!auth.currentUser) return;
    try {
      const docRef = doc(db, 'documents', docObj.id);
      await updateDoc(docRef, {
        status,
        ...(status === 'validated' ? { validatedBy: auth.currentUser.email, validationDate: new Date().toISOString() } : {}),
        'extractedData.fields': editedFields
      });

      await addDoc(collection(db, 'audit_logs'), {
        id: `log-${Date.now()}`,
        documentId: docObj.id,
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || auth.currentUser.email || 'User',
        action,
        timestamp: new Date().toISOString(),
        details,
        resourceId: docObj.id
      });

      toast.success(details);
      onClose();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `documents/${docObj.id}`);
    }
  };

  const handleReAnalyze = async () => {
    if (!docObj.base64Content) return;
    setIsParsing(true);
    try {
      const base64Parts = docObj.base64Content.split(',');
      if (base64Parts.length < 2) throw new Error("Invalid base64 content");
      
      const contentType = base64Parts[0].match(/:(.*?);/)?.[1] || 'application/pdf';
      const base64Data = base64Parts[1];
      
      const extractedData = await parseDocument(base64Data, contentType);
      
      const docRef = doc(db, 'documents', docObj.id);
      await updateDoc(docRef, { extractedData });
      setEditedFields(extractedData.fields);
      toast.success("AI Re-analysis complete!");
    } catch (err) {
      console.error("Re-analysis failed:", err);
      toast.error("Failed to re-analyze.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleToggleVerify = (key: string) => {
    setVerifiedFields(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const isFullyVerified = Object.keys(editedFields).length > 0 && 
    Object.keys(editedFields).every(key => verifiedFields[key]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="h-full flex flex-col p-8 space-y-6 overflow-hidden"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <ChevronLeft size={24} />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-brand-primary">Review & Validation</h2>
            <p className="text-gray-500 text-sm">{docObj.fileName} • Status: {docObj.status}</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" className="text-red-600 border-red-200" onClick={() => handleUpdate('rejected', 'REJECT', 'Document rejected by professional')}>Reject</Button>
          <Button className="bg-indigo-600 text-white" onClick={() => handleUpdate('reviewing', 'SUBMIT_FOR_REVIEW', 'Submitted for partner review')}>Submit for Peer Review</Button>
          <Button className="bg-green-600 text-white" onClick={() => handleUpdate('validated', 'VALIDATE', 'Final professional validation completed')}>Approve & Validated</Button>
        </div>
      </div>

      <div className="flex-1 flex gap-8 min-h-0">
        {/* Left: Preview */}
        <div className="flex-1 bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center text-[10px] font-bold uppercase text-gray-400">
            <div className="flex items-center gap-4">
              <span>Visual Inspection Engine</span>
              <div className="flex items-center bg-white border rounded shadow-sm">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}>
                  <ZoomOut size={12} />
                </Button>
                <span className="px-2 border-x text-[9px] min-w-[40px] text-center">{Math.round(zoom * 100)}%</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setZoom(Math.min(3, zoom + 0.25))}>
                  <ZoomIn size={12} />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setZoom(1)}>
                  <Maximize2 size={12} />
                </Button>
              </div>
            </div>
            <Badge variant="outline">{docObj.fileType}</Badge>
          </div>
          <div className="flex-1 bg-gray-100 relative overflow-auto scrollbar-hide">
            {previewUrl ? (
              <div 
                className="relative min-w-full min-h-full flex justify-center transition-transform duration-200 ease-out origin-top"
                style={{ transform: `scale(${zoom})` }}
              >
                {docObj.base64Content?.includes('application/pdf') ? (
                  <iframe src={previewUrl} className="w-full h-full border-none" />
                ) : (
                  <img src={previewUrl} className="max-w-full h-auto object-contain" referrerPolicy="no-referrer" />
                )}
                {/* Boundary Box & Redaction Overlays */}
                <div className="absolute inset-0 pointer-events-none">
                  {Object.entries(docObj.extractedData?.fieldCoordinates || {}).map(([key, coords]) => {
                    if (!coords) return null;
                    const isPII = docObj.extractedData?.piiFields?.includes(key);
                    return (
                      <div 
                        key={key}
                        className={`absolute border-2 rounded transition-all ${
                          activeField === key 
                            ? 'border-brand-accent bg-brand-accent/20 z-10 opacity-100' 
                            : isRedactionEnabled && isPII
                              ? 'bg-black border-black z-20 opacity-100' 
                              : 'border-indigo-400/30 opacity-30'
                        }`}
                        style={{ 
                          top: `${coords.top}%`, 
                          left: `${coords.left}%`, 
                          width: `${coords.width}%`, 
                          height: `${coords.height}%`,
                          backdropFilter: isRedactionEnabled && isPII ? 'blur(8px)' : 'none'
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            ) : <div className="p-12 text-center text-gray-400 italic">Preview not available</div>}
          </div>
        </div>

        {/* Right: Data */}
        <div className="w-[500px] bg-white rounded-xl border shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Extracted Schema</span>
            <Button 
              variant="ghost" 
              size="sm" 
              className={`h-7 px-2 gap-2 ${isRedactionEnabled ? 'bg-brand-accent/10 text-brand-accent' : 'text-gray-400'}`}
              onClick={() => setIsRedactionEnabled(!isRedactionEnabled)}
            >
              {isRedactionEnabled ? <Lock size={12} /> : <Unlock size={12} />}
              {isRedactionEnabled ? 'PII Masking ON' : 'PII Masking OFF'}
            </Button>
          </div>
          
          <ScrollArea className="flex-1 h-full">
            <div className="p-6 space-y-8">
              {/* Grounding Info */}
              {docObj.extractedData?.groundingScore && (
                <div className={`p-4 rounded-lg border flex gap-3 ${docObj.extractedData.groundingScore > 0.9 ? 'bg-green-50 border-green-100 text-green-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
                  <ShieldCheck size={20} />
                  <div>
                    <h5 className="text-sm font-bold">AI Grounding Score: {Math.round(docObj.extractedData.groundingScore * 100)}%</h5>
                    <p className="text-[11px] mt-1 opacity-80">This extraction has high confidence and literal grounding in the source document text.</p>
                  </div>
                </div>
              )}

              {/* Fraud Warning */}
              {docObj.extractedData?.fraudAnalysis?.isSuspicious && (
                <div className="p-4 bg-red-50 rounded-lg border border-red-100 flex gap-3 text-red-700">
                  <ShieldAlert size={20} className="shrink-0" />
                  <div>
                    <h5 className="text-sm font-bold uppercase">Potential Modification Detected</h5>
                    <p className="text-[11px] mt-1">{docObj.extractedData.fraudAnalysis.reason}</p>
                  </div>
                </div>
              )}

              {/* Data Fields */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-bold uppercase text-gray-400">Structured Extraction</h3>
                {Object.keys(editedFields).length === 0 ? (
                  <div className="p-12 text-center border-2 border-dashed rounded-xl bg-gray-50/50">
                    <FileText className="mx-auto text-gray-300 mb-2" size={32} />
                    <p className="text-sm text-gray-500">No schema fields extracted.</p>
                    {docObj.extractedData?.summary && (
                      <p className="text-[11px] text-gray-400 mt-2 italic px-4">AI Note: {docObj.extractedData.summary}</p>
                    )}
                    <Button 
                      variant="link" 
                      className="text-brand-accent mt-2 p-0 h-auto text-xs"
                      onClick={handleReAnalyze}
                    >
                      Try re-analyzing with a blueprint?
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {Object.entries(editedFields).map(([key, value]) => {
                      const isPII = docObj.extractedData?.piiFields?.includes(key);
                      const fieldMetric = docObj.extractedData?.fieldMetrics?.[key];
                      const confidence = fieldMetric?.confidence ?? (docObj.extractedData?.confidenceScore || 0.85);
                      const isLowConfidence = confidence < 0.95;
                      const isVerified = verifiedFields[key];
                      
                      let displayValue = '';
                      if (isRedactionEnabled && isPII) {
                        displayValue = '••••••••••••';
                      } else if (typeof value === 'object' && value !== null) {
                        displayValue = JSON.stringify(value);
                      } else {
                        displayValue = String(value ?? '');
                      }
                      
                      return (
                        <div 
                          key={key} 
                          className={`space-y-1.5 p-3 rounded-lg border transition-all ${
                            activeField === key ? 'border-brand-accent bg-brand-accent/5 ring-1 ring-brand-accent' : 'border-transparent'
                          } ${isLowConfidence && !isVerified ? 'bg-red-50/30' : ''}`}
                          onMouseEnter={() => setActiveField(key)}
                          onMouseLeave={() => setActiveField(null)}
                        >
                          <div className="flex items-center justify-between">
                            <Label className="text-[11px] font-bold text-gray-500 capitalize flex items-center gap-1">
                              {key.replace(/_/g, ' ')}
                              {isPII && <Lock size={10} className="text-amber-500" />}
                              <span className={`ml-2 text-[9px] px-1 rounded ${isLowConfidence ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                {Math.round(confidence * 100)}% Match
                              </span>
                            </Label>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className={`h-5 w-5 rounded-full ${isVerified ? 'text-green-600' : 'text-gray-300'}`}
                              onClick={() => handleToggleVerify(key)}
                            >
                              {isVerified ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                            </Button>
                          </div>
                          {typeof value === 'object' && value !== null && !Array.isArray(value) ? (
                            <div className="p-2 bg-gray-50 rounded border text-[10px] font-mono whitespace-pre-wrap">
                              {JSON.stringify(value, null, 2)}
                            </div>
                          ) : (
                            <Input 
                              value={displayValue}
                              readOnly={isRedactionEnabled && isPII}
                              onFocus={() => {
                                setActiveField(key);
                                setZoom(1.5);
                              }}
                              onChange={(e) => setEditedFields({...editedFields, [key]: e.target.value})}
                              className={`text-sm h-10 ${isRedactionEnabled && isPII ? 'bg-gray-50 cursor-not-allowed' : 'focus-visible:ring-brand-accent'} ${isLowConfidence && !isVerified ? 'border-red-300 bg-red-50/50' : ''}`}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* AI Controls */}
              <div className="pt-6 border-t flex flex-col gap-3">
                <Button 
                  variant="outline" 
                  className="w-full gap-2 text-brand-accent border-brand-accent hover:bg-brand-accent/5"
                  onClick={handleReAnalyze}
                  disabled={isParsing}
                >
                  <Zap size={16} />
                  {isParsing ? "AI processing..." : "Trigger AI Re-analysis"}
                </Button>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 flex gap-2">
                  <AlertCircle size={14} className="text-blue-500 shrink-0" />
                  <p className="text-[10px] text-blue-700">Edits made here update the AI model training loop via reinforced learning.</p>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    </motion.div>
  );
}
