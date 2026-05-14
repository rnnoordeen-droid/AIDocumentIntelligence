import { motion } from 'motion/react';
import { 
  FileJson, 
  Plus, 
  Settings, 
  Activity,
  ChevronRight,
  Database,
  Code
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DocumentBlueprint } from '../../types';

interface BlueprintsViewProps {
  blueprints: DocumentBlueprint[];
}

export function BlueprintsView({ blueprints }: BlueprintsViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 space-y-8"
    >
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-brand-primary tracking-tight">Extraction Blueprints</h2>
          <p className="text-gray-500 font-medium">Schema definitions for AI-driven data extraction and validation.</p>
        </div>
        <Button className="bg-brand-accent hover:bg-brand-accent/90 gap-2 rounded-xl">
          <Plus size={18} /> Define Schema
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {blueprints.length === 0 ? (
          <Card className="col-span-full py-20 border-dashed border-2 bg-gray-50/50 flex flex-col items-center justify-center text-gray-400">
             <FileJson size={48} className="opacity-20 mb-4" />
             <p className="font-bold">No blueprints defined yet.</p>
             <p className="text-xs">Create a blueprint to start automated structured extraction.</p>
          </Card>
        ) : blueprints.map((bp) => (
          <Card key={bp.id} className="group hover:shadow-xl transition-all border-gray-100 rounded-[2rem] overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-indigo-50 rounded-2xl text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors">
                  <Database size={24} />
                </div>
                <Badge variant="outline" className="bg-white border-brand-accent/20 text-brand-accent font-bold px-3 py-1">
                  Active
                </Badge>
              </div>
              <CardTitle className="text-xl font-bold mb-1">{bp.name}</CardTitle>
              <CardDescription className="text-xs line-clamp-2 min-h-[32px]">{bp.description}</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              <div className="flex items-center gap-4 py-4 border-y border-gray-50">
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Target Type</p>
                  <p className="text-xs font-bold text-gray-700">{bp.documentType}</p>
                </div>
                <div className="flex-1 text-right">
                  <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Fields</p>
                  <p className="text-xs font-bold text-gray-700">{bp.fields.length} schemas</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="text-xs gap-2 rounded-xl h-10 border-gray-100">
                  <Code size={14} /> View JSON
                </Button>
                <Button variant="outline" className="text-xs gap-2 rounded-xl h-10 border-gray-100">
                  <Settings size={14} /> Configure
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="bg-brand-primary rounded-[2.5rem] p-12 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
             <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
               <Activity size={28} className="text-brand-accent" />
             </div>
             <h3 className="text-3xl font-black leading-tight italic">AI Schema Reasoning</h3>
             <p className="text-white/60 leading-relaxed font-medium">
               TaxBrain doesn't just extract data; it reasons about the semantic meaning of fields. 
               Define your business rules once, and our engine will adapt to any document layout.
             </p>
             <div className="flex gap-4">
               <Button className="bg-brand-accent hover:bg-brand-accent/90 text-white rounded-xl px-8 h-12 font-bold shadow-lg shadow-brand-accent/20">
                 Train New Model
               </Button>
               <Button variant="link" className="text-white underline-offset-8">
                 Read Documentation <ChevronRight size={16} />
               </Button>
             </div>
          </div>
          <div className="hidden md:block">
             <div className="bg-white/5 border border-white/10 p-6 rounded-3xl font-mono text-[11px] text-brand-accent h-[250px] overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full p-2 bg-white/5 border-b border-white/10 flex gap-2">
                   <div className="w-2 h-2 rounded-full bg-red-400" />
                   <div className="w-2 h-2 rounded-full bg-amber-400" />
                   <div className="w-2 h-2 rounded-full bg-green-400" />
                </div>
                <div className="mt-8 space-y-1">
                  <p>{"{"}</p>
                  <p className="pl-4">"schema": "tax_form_1040",</p>
                  <p className="pl-4">"version": "2024.1",</p>
                  <p className="pl-4">"fields": [</p>
                  <p className="pl-8">{"{ \"id\": \"gross_income\", \"type\": \"currency\" },"}</p>
                  <p className="pl-8">{"{ \"id\": \"tax_credits\", \"type\": \"array\" }"}</p>
                  <p className="pl-4">],</p>
                  <p className="pl-4">"validation": "cross_reference_w2"</p>
                  <p>{"}"}</p>
                  <div className="pt-2 animate-pulse">_</div>
                </div>
             </div>
          </div>
        </div>
        <div className="absolute top-[-50px] right-[-50px] w-96 h-96 bg-white/5 rounded-full blur-[100px]" />
      </section>
    </motion.div>
  );
}
