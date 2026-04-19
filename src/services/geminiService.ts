import { GoogleGenAI, Type } from "@google/genai";
import { ExtractedData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function parseDocument(base64Data: string, mimeType: string, schema?: any): Promise<ExtractedData> {
  const schemaInstruction = schema 
    ? `\nSTRICT SCHEMA ENFORCEMENT: You MUST extract the following fields as defined:
${JSON.stringify(schema, null, 2)}
Only extract these fields. If a field is not found, return null for it.`
    : "";

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: `Analyze this document and perform a HIGH-INTEGRITY extraction.
            
EXTRACTOR INSTRUCTIONS:
1. CROSS-CHECK LOGIC: 
   - First, perform a literal pattern-based extraction (Regex-style) for identifiers, amounts, and dates.
   - Second, perform a semantic contextual extraction for the same fields.
   - If the results disagree, flag the field as "disputed" and provide both values in the reasoning.
2. GROUNDING (HALLUCINATION PREVENTION):
   - For every field extracted, assign a "grounding_score" (0-1). 
   - 1.0 means the value is explicitly visible in the text. 
   - Lower scores mean the value was inferred or generated based on context.
3. TAMPER DETECTION: Inspect fonts, alignments, and metadata markers for signs of digital alteration.
4. CONFIDENCE SCORE: Assign a confidence score (0-1) for EACH extracted field. Fields with confidence < 0.85 will be highlighted for manual review.

Return the data in this JSON structure:
{
  "documentType": "string",
  "confidenceScore": number (overall),
  "groundingScore": number (0-1, overall groundedness),
  "hallucinationRisk": number (0-1, 1 minus grounding),
  "fieldMetrics": {
    "field_name": {
      "confidence": number,
      "grounding": number,
      "isTampered": boolean,
      "crossCheckResult": "match" | "mismatch" | "inconclusive"
    },
    ...
  },
  "fieldCoordinates": {
    "field_name": { "top": number, "left": number, "width": number, "height": number },
    ...
  },
  "summary": "string",
  "fraudAnalysis": {
    "isSuspicious": boolean,
    "reason": "string",
    "tamperConfidence": number
  },
  "piiFields": ["field_name", ...],
  "fields": {
    "field_name": "value",
    ...
  }
}${schemaInstruction}

Ensure field names are descriptive. If a field contains line items, represent it as an array of objects.`,
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
    },
  });

  try {
    const result = JSON.parse(response.text || "{}");
    return {
      documentType: result.documentType || "Unknown",
      confidenceScore: result.confidenceScore || 0,
      groundingScore: result.groundingScore || 0,
      hallucinationRisk: result.hallucinationRisk || 0,
      fieldMetrics: result.fieldMetrics || {},
      fieldCoordinates: result.fieldCoordinates || {},
      summary: result.summary || "",
      fraudAnalysis: result.fraudAnalysis || { isSuspicious: false, reason: "", tamperConfidence: 1 },
      piiFields: result.piiFields || [],
      fields: result.fields || {}
    };
  } catch (e) {
    console.error("Failed to parse AI response", e);
    return { fields: {} };
  }
}
