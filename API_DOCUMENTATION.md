# DocIntel API Documentation

DocIntel provides a robust API for automated document classification and data extraction.

## Base URL
`https://<your-app-url>.run.app/api`

## Authentication
All API requests require a Bearer Token in the `Authorization` header.
`Authorization: Bearer <YOUR_API_KEY>`

---

## Endpoints

### 1. Upload & Parse Document
`POST /documents/upload`

Uploads a document for AI-powered classification and field extraction.

**Request Body (Multipart Form Data):**
- `file`: The document file (PDF, PNG, JPG)

**Response:**
```json
{
  "id": "doc-123456789",
  "fileName": "invoice_001.pdf",
  "status": "pending",
  "extractedData": {
    "documentType": "Invoice",
    "confidenceScore": 0.98,
    "summary": "Invoice from Acme Corp for office supplies.",
    "fields": {
      "invoice_number": "INV-2024-001",
      "date": "2024-04-09",
      "total_amount": 1250.50,
      "vendor": "Acme Corp",
      "line_items": [
        { "description": "Laptops", "qty": 2, "price": 600 },
        { "description": "Mouse", "qty": 1, "price": 50.50 }
      ]
    }
  }
}
```

### 2. Get Document Status
`GET /documents/:id`

Retrieves the current status and extracted data for a specific document.

### 3. Validate Document
`POST /documents/:id/validate`

Manually confirms the extracted data and marks the document as 'validated'.

---

## Usage Guide

1. **Integration**: Connect DocIntel to your ERP or financial system by listening to the `VALIDATE` event in the audit logs.
2. **HITL Workflow**: Use the DocIntel dashboard to review documents with low confidence scores.
3. **Security**: Ensure all API keys are stored securely and rotated regularly.
