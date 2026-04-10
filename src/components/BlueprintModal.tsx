import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Plus, Trash2, Check, X, AlertCircle } from 'lucide-react';
import { DocumentBlueprint, ValidationRule } from '../types';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface BlueprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (blueprint: Partial<DocumentBlueprint>) => void;
  initialData: DocumentBlueprint | null;
}

export function BlueprintModal({ isOpen, onClose, onSave, initialData }: BlueprintModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [documentType, setDocumentType] = useState('Invoice');
  const [fields, setFields] = useState<{name: string, type: any, description: string, required: boolean}[]>([]);
  const [rules, setRules] = useState<ValidationRule[]>([]);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description);
      setDocumentType(initialData.documentType);
      setFields(initialData.fields);
      setRules(initialData.rules);
    } else {
      setName('');
      setDescription('');
      setDocumentType('Invoice');
      setFields([{ name: 'vendor_name', type: 'string', description: 'Name of the vendor', required: true }]);
      setRules([]);
    }
  }, [initialData, isOpen]);

  const addField = () => {
    setFields([...fields, { name: '', type: 'string', description: '', required: false }]);
  };

  const removeField = (index: number) => {
    const fieldToRemove = fields[index].name;
    setFields(fields.filter((_, i) => i !== index));
    setRules(rules.filter(r => r.field !== fieldToRemove));
  };

  const updateField = (index: number, data: any) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...data };
    setFields(newFields);
  };

  const addRule = () => {
    setRules([...rules, { 
      id: `rule-${Date.now()}`, 
      field: fields[0]?.name || '', 
      type: 'required', 
      message: 'This field is required' 
    }]);
  };

  const removeRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
  };

  const updateRule = (index: number, data: any) => {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], ...data };
    setRules(newRules);
  };

  const handleSave = () => {
    onSave({
      id: initialData?.id,
      name,
      description,
      documentType,
      fields,
      rules,
      createdAt: initialData?.createdAt
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>{initialData ? 'Edit Blueprint' : 'Create Document Blueprint'}</DialogTitle>
          <DialogDescription>
            Define the structure and validation rules for this document type.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-8">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bp-name">Blueprint Name</Label>
                <Input id="bp-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Standard Invoice" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bp-type">Document Type</Label>
                <Select value={documentType} onValueChange={setDocumentType}>
                  <SelectTrigger id="bp-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Invoice">Invoice</SelectItem>
                    <SelectItem value="Bill of Lading">Bill of Lading</SelectItem>
                    <SelectItem value="Contract">Contract</SelectItem>
                    <SelectItem value="ID Document">ID Document</SelectItem>
                    <SelectItem value="Custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="bp-desc">Description</Label>
                <Textarea id="bp-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what this blueprint is for..." className="h-20" />
              </div>
            </div>

            {/* Schema Builder */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Schema Fields</h3>
                <Button variant="outline" size="sm" onClick={addField} className="h-8 gap-1">
                  <Plus size={14} /> Add Field
                </Button>
              </div>
              <div className="space-y-3">
                {fields.map((field, idx) => (
                  <div key={idx} className="flex gap-3 items-start p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex-1 grid grid-cols-3 gap-3">
                      <Input 
                        placeholder="Field Name" 
                        value={field.name} 
                        onChange={(e) => updateField(idx, { name: e.target.value })}
                        className="h-8 text-xs font-mono"
                      />
                      <Select value={field.type} onValueChange={(val) => updateField(idx, { type: val })}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="string">String</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="date">Date</SelectItem>
                          <SelectItem value="boolean">Boolean</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input 
                        placeholder="Description" 
                        value={field.description} 
                        onChange={(e) => updateField(idx, { description: e.target.value })}
                        className="h-8 text-xs"
                      />
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-500" onClick={() => removeField(idx)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Validation Rules */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Validation Rules</h3>
                <Button variant="outline" size="sm" onClick={addRule} className="h-8 gap-1">
                  <Plus size={14} /> Add Rule
                </Button>
              </div>
              <div className="space-y-3">
                {rules.map((rule, idx) => (
                  <div key={rule.id} className="p-4 bg-amber-50/30 rounded-lg border border-amber-100 space-y-3">
                    <div className="flex justify-between items-center">
                      <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">Rule #{idx + 1}</Badge>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-red-500" onClick={() => removeRule(rule.id)}>
                        <Trash2 size={12} />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase text-gray-400">Target Field</Label>
                        <Select value={rule.field} onValueChange={(val) => updateRule(idx, { field: val })}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {fields.map(f => (
                              <SelectItem key={f.name} value={f.name}>{f.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase text-gray-400">Rule Type</Label>
                        <Select value={rule.type} onValueChange={(val) => updateRule(idx, { type: val })}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="required">Required</SelectItem>
                            <SelectItem value="min_length">Min Length</SelectItem>
                            <SelectItem value="numeric_range">Numeric Range</SelectItem>
                            <SelectItem value="regex">Regex Pattern</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2 space-y-1">
                        <Label className="text-[10px] uppercase text-gray-400">Error Message</Label>
                        <Input 
                          value={rule.message} 
                          onChange={(e) => updateRule(idx, { message: e.target.value })}
                          className="h-8 text-xs"
                          placeholder="Message to show if validation fails"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-brand-accent hover:bg-brand-accent/90 text-white" onClick={handleSave}>
            Save Blueprint
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
