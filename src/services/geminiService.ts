import { GoogleGenAI, Type } from "@google/genai";
import { ExtractedData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function parseDocument(base64Data: string, mimeType: string): Promise<ExtractedData> {
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
            text: `Analyze this document and perform the following:
1. Classify the document type (e.g., Invoice, Bill of Lading, Contract, ID, etc.).
2. Extract ALL meaningful data fields found in the document.
3. Provide a brief summary of the document's purpose.
4. Assign a confidence score (0-1) for the extraction.

Return the data in the following JSON structure:
{
  "documentType": "string",
  "confidenceScore": number,
  "summary": "string",
  "fields": {
    "field_name": "value",
    ...
  }
}

Ensure field names are descriptive (use snake_case or camelCase). If a field contains a list of items (like line items), represent it as an array of objects within the 'fields' object.`,
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
      summary: result.summary || "",
      fields: result.fields || {}
    };
  } catch (e) {
    console.error("Failed to parse AI response", e);
    return { fields: {} };
  }
}
