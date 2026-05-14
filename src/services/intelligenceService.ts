import { GoogleGenAI } from "@google/genai";
import { SCFDocument, ChatMessage, IntelligenceInsight } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

/**
 * Ask the "TaxBrain" a question across multiple documents.
 * Implements a Long-Context RAG strategy using Gemini 1.5.
 */
export async function queryIntelligence(
  userQuery: string, 
  documents: SCFDocument[],
  history: ChatMessage[] = []
): Promise<{ text: string; sources: { id: string; fileName: string }[]; chartData?: any }> {
  
  // 1. Prepare Document Context
  const documentContext = documents.map(doc => {
    return {
      id: doc.id,
      fileName: doc.fileName,
      type: doc.extractedData?.documentType || doc.fileType,
      status: doc.status,
      uploadDate: doc.uploadDate,
      summary: doc.extractedData?.summary,
      fields: doc.extractedData?.fields
    };
  }).slice(0, 50); // Reduced for better context window management

  // 2. Prepare History Context
  const historyContext = history.map(h => ({
    role: h.role,
    content: h.content
  })).slice(-5);

  // 3. System Instruction for RAG + Tax Advisory
  const prompt = `You are "TaxBrain", leading tax intelligence expert.
    
CONTEXT DATA:
${JSON.stringify(documentContext)}

CHAT HISTORY:
${JSON.stringify(historyContext)}

USER QUERY: ${userQuery}

INSTRUCTIONS:
1. Ground answers ONLY in context.
2. Use markdown for formatting.
3. Cite document IDs [doc-id].
4. Return JSON response.
5. Tone: Professional and analytical.

{
  "text": "Your answer...",
  "sources": [{"id": "doc-id", "fileName": "file.name"}],
  "chartData": { ... }
}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = (response.text || "{}").replace(/```json\s?|```/g, "").trim();
    const data = JSON.parse(text);
    
    return {
      text: data.text || "I processed your request but no textual response was generated.",
      sources: data.sources || [],
      chartData: data.chartData
    };
  } catch (err) {
    console.error("Intelligence Query Error:", err);
    return { 
      text: "System error during intelligence processing. Please verify document status.", 
      sources: [] 
    };
  }
}

/**
 * Generate automated insights for the dashboard.
 */
export async function generateLibraryInsights(documents: SCFDocument[]): Promise<IntelligenceInsight[]> {
  const summary = documents.map(d => ({
    type: d.extractedData?.documentType || d.fileType,
    status: d.status,
    amount: d.extractedData?.fields?.amount || d.extractedData?.fields?.total_amount || 0,
    date: d.uploadDate
  }));

  const prompt = `Analyze this tax document library and provide 3 key business insights.
    
Data: ${JSON.stringify(summary)}

Return JSON:
{
  "insights": [
    {
      "title": "string",
      "value": "string",
      "change": number,
      "trend": "up" | "down" | "neutral",
      "description": "string"
    }
  ]
}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = (response.text || "{}").replace(/```json\s?|```/g, "").trim();
    const data = JSON.parse(text);
    return data.insights || [];
  } catch (e) {
    console.error("Failed to generate AI insights:", e);
    return [];
  }
}
