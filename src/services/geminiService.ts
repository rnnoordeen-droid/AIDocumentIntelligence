import { GoogleGenAI } from "@google/genai";
import { ExtractedData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function parseDocument(base64Data: string, mimeType: string, schema?: any): Promise<ExtractedData> {
  const schemaInstruction = schema 
    ? `\nSTRICT SCHEMA ENFORCEMENT: You MUST extract the following fields exactly:
${JSON.stringify(schema, null, 2)}
Return individual field values as strings or numbers. Do not nested them unless they are part of the target schema.`
    : "";

  const prompt = `Analyze this tax document and perform a HIGH-ACCURACY extraction.
            
EXTRACTOR INSTRUCTIONS:
1. TAX DOMAIN: Identify if this is a Form 1040, 1099, W-2, K-1, or other tax document.
2. FIELDS: Extract all relevant fields such as Names, IDs, Dates, and all Financial Amounts.
3. STRUCTURE: Return individual field values as strings or numbers. 
4. COORDINATES: For each field, estimate its relative position (0-100) on the page.

Return the data in this JSON structure:
{
  "documentType": "string (e.g., Form 1040)",
  "confidenceScore": number (0-1),
  "groundingScore": number (0-1),
  "fields": {
    "field_name": "value"
  },
  "summary": "2-3 sentence overview of the document",
  "piiFields": ["list of field names containing sensitive info"],
  "fraudAnalysis": {
    "isSuspicious": boolean,
    "reason": "string (empty if not suspicious)",
    "tamperConfidence": number (0-1)
  },
  "fieldCoordinates": {
    "field_name": { "top": number, "left": number, "width": number, "height": number }
  }
}${schemaInstruction}

CRITICAL: You MUST return a valid JSON object. If you cannot find any fields, return an empty fields object but still provide a summary and documentType.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: [
        {
          parts: [
            { inlineData: { mimeType, data: base64Data } },
            { text: prompt }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "{}";
    // Robust parsing: strip potential markdown blocks
    const cleanJson = text.replace(/```json\s?|```/g, "").trim();
    const data = JSON.parse(cleanJson);
    
    console.log("AI Extraction Complete for:", data.documentType);

    return {
      documentType: data.documentType || "Unknown",
      confidenceScore: data.confidenceScore || 0,
      groundingScore: data.groundingScore || 0.5,
      hallucinationRisk: data.hallucinationRisk || 0,
      fields: data.fields || {},
      fieldMetrics: data.fieldMetrics || {},
      summary: data.summary || "",
      piiFields: data.piiFields || [],
      fraudAnalysis: data.fraudAnalysis || { isSuspicious: false, reason: "", tamperConfidence: 1 },
      fieldCoordinates: data.fieldCoordinates || {}
    };
  } catch (e) {
    console.error("AI Extraction Error:", e);
    return { 
      documentType: "Unclassified",
      confidenceScore: 0,
      fields: {},
      summary: e instanceof Error ? `Extraction Failed: ${e.message}` : "Extraction failed due to AI response error."
    };
  }
}
