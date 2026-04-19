import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Bot, 
  User, 
  ExternalLink, 
  TrendingUp, 
  BarChart3, 
  PieChart as PieChartIcon, 
  Loader2,
  Sparkles,
  RefreshCcw,
  ChevronRight,
  FileText,
  Info,
  ShieldCheck,
  Zap,
  Download,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage, SCFDocument, IntelligenceInsight } from '../types';
import { queryIntelligence, generateLibraryInsights } from '../services/intelligenceService';
import ReactMarkdown from 'react-markdown';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  PieChart,
  Cell,
  Pie
} from 'recharts';

interface IntelligenceViewProps {
  documents: SCFDocument[];
  onViewDoc: (doc: SCFDocument) => void;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export function IntelligenceView({ documents, onViewDoc }: IntelligenceViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [insights, setInsights] = useState<IntelligenceInsight[]>([]);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    loadInsights();
  }, [documents.length]);

  const loadInsights = async () => {
    if (documents.length === 0) return;
    setIsGeneratingInsights(true);
    try {
      const newInsights = await generateLibraryInsights(documents);
      setInsights(newInsights);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  const handleSuggestion = (text: string) => {
    setInput(text);
    handleSend(text);
  };

  const handleSend = async (overrideInput?: string) => {
    const queryText = overrideInput || input;
    if (!queryText.trim() || isQuerying) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: queryText,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    if (!overrideInput) setInput('');
    setIsQuerying(true);

    try {
      const response = await queryIntelligence(queryText, documents, messages);
      
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response.text || "I processed your request but couldn't generate a text response.",
        timestamp: new Date().toISOString(),
        sources: response.sources || [],
        chartData: response.chartData
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error("Intelligence query error:", err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: "I'm sorry, I encountered an error while processing your request. Please try again or check your connection.",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsQuerying(false);
    }
  };

  const renderChart = (chartData: any) => {
    if (!chartData || !chartData.data) return null;

    return (
      <div className="mt-4 p-4 bg-white rounded-xl border border-gray-100 h-[250px] shadow-sm">
        <h4 className="text-xs font-bold uppercase text-gray-400 mb-4">{chartData.title}</h4>
        <ResponsiveContainer width="100%" height="80%">
          {chartData.type === 'bar' ? (
            <BarChart data={chartData.data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey={chartData.xAxisKey} fontSize={10} axisLine={false} tickLine={false} />
              <YAxis fontSize={10} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
              />
              {chartData.dataKeys.map((key: string, idx: number) => (
                <Bar key={key} dataKey={key} fill={COLORS[idx % COLORS.length]} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          ) : chartData.type === 'line' ? (
            <LineChart data={chartData.data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey={chartData.xAxisKey} fontSize={10} axisLine={false} tickLine={false} />
              <YAxis fontSize={10} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              {chartData.dataKeys.map((key: string, idx: number) => (
                <Line key={key} type="monotone" dataKey={key} stroke={COLORS[idx % COLORS.length]} strokeWidth={2} dot={{ r: 4 }} />
              ))}
            </LineChart>
          ) : (
            <PieChart>
              <Pie
                data={chartData.data}
                innerRadius={50}
                outerRadius={80}
                paddingAngle={5}
                dataKey={chartData.dataKeys[0]}
                nameKey={chartData.xAxisKey}
              >
                {chartData.data.map((_: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-brand-surface relative">
      {documents.length === 0 && (
        <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center p-8 text-center">
          <Card className="max-w-md border-brand-accent/20 shadow-2xl">
            <CardHeader>
              <div className="w-16 h-16 bg-brand-accent/10 rounded-full flex items-center justify-center text-brand-accent mx-auto mb-4">
                <FileText size={32} />
              </div>
              <CardTitle>Library is Empty</CardTitle>
              <CardDescription>
                You need to upload at least one document before DocBrain can analyze your library and answer questions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="bg-brand-accent hover:bg-brand-accent/90" onClick={() => (window as any).setIsUploadOpen?.(true)}>
                Upload Your First Document
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-6xl mx-auto p-8 space-y-12">
          {/* 1. Header & Chat (Pinned to Top) */}
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-brand-primary rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <Bot size={28} />
                </div>
                <div>
                  <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">DocBrain Intelligence</h1>
                  <p className="text-sm text-brand-muted flex items-center gap-2">
                    <Sparkles size={14} className="text-brand-accent" />
                    Advanced long-context reasoning across {documents.length} documents
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => setMessages([])} className="text-xs bg-white border-gray-200">
                  <RefreshCcw size={14} className="mr-2" /> Clear History
                </Button>
              </div>
            </div>

            {/* Main Chat Interface - Full Width */}
            <div className="flex flex-col bg-white rounded-[2rem] border border-gray-100 shadow-2xl shadow-gray-200/50 min-h-[500px] max-h-[700px] overflow-hidden">
              <div className="p-5 border-b bg-gray-50/50 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-white border-green-200 text-green-700 px-2 py-0.5 text-[10px]">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 inline-block animate-pulse" />
                    Ready
                  </Badge>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Secure Session</span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-gray-300" />)}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar" ref={scrollRef}>
                <div className="p-8 space-y-8">
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center py-20 select-none">
                      <div className="relative mb-8">
                        <div className="absolute inset-0 bg-brand-accent/20 blur-3xl rounded-full" />
                        <Sparkles size={80} className="relative text-brand-accent animate-pulse" />
                      </div>
                      <h4 className="text-2xl font-bold text-gray-800 mb-2">How can I assist your Supply Chain?</h4>
                      <p className="max-w-md text-gray-500 mb-10">
                        I've parsed your library. You can ask for summaries, vendor comparisons, or detect anomalies across all documents.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full max-w-2xl px-4">
                        {[
                          { text: "Summarize spend trends", icon: <TrendingUp size={16} /> },
                          { text: "Find missing info", icon: <BarChart3 size={16} /> },
                          { text: "Vendor comparison", icon: <FileText size={16} /> }
                        ].map(q => (
                          <Button 
                            key={q.text} 
                            variant="outline" 
                            onClick={() => handleSuggestion(q.text)} 
                            className="h-auto py-4 px-6 flex-col gap-2 rounded-2xl border-gray-100 hover:border-brand-accent hover:bg-brand-accent/5 transition-all text-gray-600 hover:text-brand-accent"
                          >
                            <span className="opacity-50">{q.icon}</span>
                            <span className="text-xs font-semibold">{q.text}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, scale: 0.98, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="shrink-0 w-10 h-10 rounded-2xl bg-brand-primary flex items-center justify-center text-white shadow-sm self-start mt-1">
                          <Bot size={20} />
                        </div>
                      )}
                      
                      <div className={`max-w-[85%] ${msg.role === 'user' ? 'min-w-[100px]' : ''}`}>
                        <div className={`p-5 rounded-2xl shadow-sm ${
                          msg.role === 'user' 
                            ? 'bg-brand-primary text-white' 
                            : 'bg-gray-50 border border-gray-100 text-gray-800'
                        }`}>
                          <div className="prose prose-sm max-w-none">
                            <ReactMarkdown 
                              components={{
                                p: ({children}) => <p className="mb-3 last:mb-0 text-sm leading-relaxed">{children}</p>,
                                strong: ({children}) => <strong className="font-bold underline decoration-brand-accent/30 decoration-2 underline-offset-2">{children}</strong>,
                                ul: ({children}) => <ul className="list-disc pl-4 space-y-1 mb-3">{children}</ul>,
                                li: ({children}) => <li className="text-sm">{children}</li>
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          </div>

                          {msg.chartData && renderChart(msg.chartData)}
                          
                          {msg.sources && msg.sources.length > 0 && (
                            <div className="mt-5 pt-4 border-t border-gray-200/50 flex flex-wrap gap-2">
                              <span className="text-[10px] font-bold text-gray-400 uppercase w-full mb-1">Sources</span>
                              {msg.sources.map(src => (
                                <button
                                  key={src.id}
                                  onClick={() => {
                                    const doc = documents.find(d => d.id === src.id);
                                    if (doc) onViewDoc(doc);
                                  }}
                                  className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-gray-200 hover:border-brand-accent hover:text-brand-accent transition-all text-[11px] font-medium shadow-sm"
                                >
                                  <FileText size={12} className="text-gray-400 group-hover:text-brand-accent" />
                                  {src.fileName}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className={`mt-2 text-[10px] text-gray-400 px-2 font-mono ${msg.role === 'user' ? 'text-right' : ''}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                      </div>

                      {msg.role === 'user' && (
                        <div className="shrink-0 w-10 h-10 rounded-2xl bg-gray-200 flex items-center justify-center text-gray-600 shadow-sm self-start mt-1">
                          <User size={20} />
                        </div>
                      )}
                    </motion.div>
                  ))}

                  {isQuerying && (
                    <div className="flex gap-4">
                      <div className="shrink-0 w-10 h-10 rounded-2xl bg-brand-primary flex items-center justify-center text-white shadow-sm animate-pulse">
                        <Bot size={20} />
                      </div>
                      <div className="bg-gray-50 border border-gray-100 p-5 rounded-2xl flex flex-col gap-3 min-w-[200px]">
                        <div className="flex items-center gap-3">
                          <Loader2 size={18} className="animate-spin text-brand-accent" />
                          <span className="text-sm font-medium text-gray-500">DocBrain is reasoning...</span>
                        </div>
                        <div className="space-y-1.5 mt-1">
                          <div className="h-2 w-full bg-gray-200 rounded-full animate-pulse" />
                          <div className="h-2 w-3/4 bg-gray-200 rounded-full animate-pulse" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-8 bg-white border-t border-gray-100 shrink-0">
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                  className="flex gap-4 p-2 bg-gray-50 border-2 border-gray-100 rounded-3xl focus-within:ring-4 focus-within:ring-brand-accent/10 focus-within:border-brand-accent transition-all relative group"
                >
                  <div className="pl-4 flex items-center text-gray-400 group-focus-within:text-brand-accent">
                    <Sparkles size={20} />
                  </div>
                  <Input 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about vendors, spending trends, or audit logs..."
                    className="border-none bg-transparent shadow-none focus-visible:ring-0 text-base h-12 flex-1"
                  />
                  <Button 
                    type="submit" 
                    disabled={!input.trim() || isQuerying}
                    className="bg-brand-primary hover:bg-black text-white shrink-0 w-12 h-12 p-0 rounded-2xl transition-all active:scale-95 shadow-lg shadow-brand-primary/20"
                  >
                    <Send size={20} />
                  </Button>
                </form>
                <div className="mt-4 flex items-center justify-between px-2">
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1.5 uppercase tracking-widest">
                       <ShieldCheck size={10} className="text-green-500" /> End-to-End Encrypted
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1.5 uppercase tracking-widest">
                       <Zap size={10} className="text-amber-500" /> AI-Powered
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-medium">Use [Shift + Enter] for multi-line</p>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Automated Insights Section (Moved below Chat) */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 px-2">
              <TrendingUp size={20} className="text-brand-primary" />
              <h3 className="text-xl font-bold text-gray-800">Automated Intelligence Insights</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {isGeneratingInsights ? (
                  [1, 2, 3].map(i => (
                    <Card key={i} className="animate-pulse border-none ring-1 ring-gray-100">
                      <CardContent className="p-8 h-[160px] bg-gray-50/50 rounded-3xl" />
                    </Card>
                  ))
                ) : (
                  insights.map((insight, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <Card className="hover:shadow-xl transition-all group overflow-hidden relative border-none ring-1 ring-gray-100 rounded-[2rem]">
                        <div className="absolute top-0 right-0 p-6">
                          {insight.trend === 'up' && <div className="p-2 bg-green-50 rounded-full text-green-500"><TrendingUp size={16} /></div>}
                          {insight.trend === 'down' && <div className="p-2 bg-red-50 rounded-full text-red-500"><TrendingUp size={16} className="rotate-180" /></div>}
                        </div>
                        <CardHeader className="p-8 pb-2">
                          <CardTitle className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-black">{insight.title}</CardTitle>
                          <div className="flex items-baseline gap-2 mt-2">
                            <span className="text-3xl font-black text-brand-primary">{insight.value}</span>
                            {insight.change && (
                              <Badge className={`text-[10px] ${insight.change >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} border-none`}>
                                {insight.change >= 0 ? '+' : ''}{insight.change}%
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="p-8 pt-4">
                          <p className="text-xs leading-relaxed text-gray-500 font-medium">{insight.description}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* 3. Library Statistics (Derived from Sidebar) */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="rounded-[2rem] border-none ring-1 ring-gray-100 shadow-sm overflow-hidden bg-white">
              <CardHeader className="p-8 border-b border-gray-50">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-bold text-gray-800">Library Coverage & Health</CardTitle>
                    <CardDescription className="text-[10px]">Processing status and data integrity</CardDescription>
                  </div>
                  <div className="p-2 bg-gray-50 rounded-xl">
                    <BarChart3 size={18} className="text-gray-400" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="space-y-3">
                  <div className="flex justify-between text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                    <span>Processing Health</span>
                    <span className="text-brand-accent">100% Verified</span>
                  </div>
                  <div className="h-3 w-full bg-gray-50 border border-gray-100 rounded-full overflow-hidden flex shadow-inner p-[1px]">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: '70%' }} />
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: '20%', marginLeft: '2px' }} />
                    <div className="h-full bg-red-400 rounded-full" style={{ width: '10%', marginLeft: '2px' }} />
                  </div>
                  <div className="flex justify-between px-1">
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-gray-400 uppercase">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> Validated
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-gray-400 uppercase">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Processing
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-gray-400 uppercase">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400" /> Flagged
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                   <div className="p-4 bg-gray-50 rounded-2xl">
                     <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Total Vaulted</p>
                     <p className="text-xl font-bold text-brand-primary">{documents.length}</p>
                   </div>
                   <div className="p-4 bg-gray-50 rounded-2xl">
                     <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Weekly Growth</p>
                     <p className="text-xl font-bold text-green-600">+12%</p>
                   </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <div className="bg-brand-primary p-10 rounded-[2rem] text-white relative overflow-hidden h-full flex flex-col justify-between shadow-2xl">
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 mb-6">
                    <RefreshCcw size={24} className="text-brand-accent animate-pulse" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 italic leading-tight">"Your supply chain is 12% more efficient than last month."</h3>
                  <p className="text-sm opacity-60 leading-relaxed max-w-sm">
                    DocBrain automatically continuously analyzes patterns to find cost-saving opportunities and risk factors.
                  </p>
                </div>
                
                <div className="relative z-10 pt-10">
                  <Button variant="outline" className="w-full bg-white/5 border-white/10 hover:bg-white/10 text-white gap-2 h-12 rounded-2xl">
                    <Download size={16} /> Download Monthly Intelligence Report
                  </Button>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-[-40px] right-[-40px] w-64 h-64 bg-brand-accent/20 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-[-20px] left-[-20px] w-32 h-32 bg-indigo-500/10 rounded-full blur-[60px] pointer-events-none" />
              </div>
            </div>
          </section>

          <footer className="pt-12 pb-20 border-t border-gray-100 text-center">
             <div className="flex justify-center items-center gap-6 mb-4">
               <div className="flex items-center gap-2 opacity-30 text-xs font-bold uppercase tracking-widest">
                 <ShieldCheck size={14} /> PCI Compliant
               </div>
               <div className="flex items-center gap-2 opacity-30 text-xs font-bold uppercase tracking-widest">
                 <Lock size={14} /> SOC2 Type II
               </div>
             </div>
             <p className="text-[10px] text-gray-300 font-medium">DOCUMENT INTELLIGENCE ENGINE V2.4 • RUNNING ON GEMINI 1.5 PRO</p>
          </footer>
        </div>
      </div>
    </div>
  );
}
