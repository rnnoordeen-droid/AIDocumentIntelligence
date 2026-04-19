import { GoogleGenAI, Type } from "@google/genai";
import { SCFDocument, ChatMessage, IntelligenceInsight } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

/**
 * Ask the "DocBrain" a question across multiple documents.
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
  }).slice(0, 100); // Limit to 100 docs for stability in this demo

  // 2. Prepare History Context
  const historyContext = history.map(h => ({
    role: h.role,
    content: h.content
  })).slice(-5); // Last 5 messages for context

  // 3. System Instruction for RAG + Reporting
  const systemInstruction = `You are "DocBrain", the core intelligence engine for DocManager.
Your goal is to provide accurate, grounded insights across a library of Supply Chain documents.

DOCUMENT CONTEXT:
${JSON.stringify(documentContext, null, 2)}

OPERATING RULES:
1. GROUNDEDNESS: Only answer based on the provided document context. If you don't know, say so.
2. CITATIONS: When mentioning specific document data, refer to the document by its ID in square brackets, e.g., [doc-123].
3. SOURCE IDENTIFICATION: Always return a "sources" array containing the IDs and fileNames of documents you referenced.
4. REPORT GENERATION: If the user asks for trends, comparisons, or summaries that can be visualized (spending over time, document status distribution, vendor comparison), include a "chartData" object.
   - chartData.type: "bar", "line", or "pie"
   - chartData.data: An array of objects for the chart
   - chartData.title: Descriptive title
   - chartData.xAxisKey: The key for the X-axis
   - chartData.dataKeys: An array of keys for the values to plot
5. TONE: Professional, analytical, and helpful.

RESPONSE FORMAT:
You MUST return your response as a JSON object:
{
  "text": "Your markdown-formatted answer here with citations [id].",
  "sources": [{"id": "doc-id", "fileName": "file.pdf"}],
  "chartData": { ... optional ... }
}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [{ text: `User Query: ${userQuery}\n\nChat History:\n${JSON.stringify(historyContext)}` }]
        }
      ],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json"
      }
    });

    try {
      const result = JSON.parse(response.text || "{}");
      return {
        text: result.text || "I was able to process your request, but I don't have a specific text response for you.",
        sources: result.sources || [],
        chartData: result.chartData
      };
    } catch (parseError) {
      console.error("JSON Parse Error in Intelligence:", parseError, response.text);
      return {
        text: response.text || "I processed your request but the response format was unexpected.",
        sources: []
      };
    }
  } catch (err) {
    console.error("Intelligence Query Error:", err);
    return { 
      text: "I encountered an error while processing your library data. Please try again.", 
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

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze this document library summary and provide 3 high-level business insights.
    
    Data: ${JSON.stringify(summary)}

    Return as JSON:
    {
      "insights": [
        {
          "title": "Insight Title",
          "value": "Key Metric Value",
          "change": number (optional % change),
          "trend": "up" | "down" | "neutral",
          "description": "Short explanation"
        }
      ]
    }`,
    config: {
      responseMimeType: "application/json"
    }
  });

  try {
    const result = JSON.parse(response.text || "{}");
    return result.insights || [];
  } catch (e) {
    return [];
  }
}
