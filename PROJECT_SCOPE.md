# DocManager Enterprise: Feature & Governance Roadmap

## Current System Scope
| Feature | Description | Status |
|---------|-------------|--------|
| **AI Extraction Engine** | Multi-modal extraction with confidence scoring and grounding validation. | Production |
| **TaxBrain Intelligence** | Long-context RAG for searching and querying document libraries. | Production |
| **Blueprint Management** | User-defined schemas for different document types (Invoices, Tax Forms). | Production |
| **Google Authentication** | Basic secure login via Google Identity. | Production |
| **Audit Logs** | Technical logging of document actions and status changes. | Production |

## Proposed Enterprise Roadmap (Tax Consulting Focus)
| Feature | Category | Priority | Description |
|---------|----------|----------|-------------|
| **Client Tenant Isolation** | Data Privacy | P0 | Group documents and insights by 'Client Entities' to prevent data leakage between taxpayers. |
| **Advanced RBAC** | Governance | P0 | Granular roles: Managing Partner (Admin), Staff Auditor (Validator), Client (Viewer). |
| **Multi-Stage Approval** | Workflow | P1 | Workflow to move documents from Associate Review to Partner Approval before finalization. |
| **PII Redaction UI** | Compliance | P1 | One-click masking of SSNs, Account Numbers, and addresses for safe multi-firm collaboration. |
| **Tax Code Rule-Engine** | Intelligence | P2 | Validation rules mapped to specific tax codes (e.g., Section 179 validation) during extraction. |
| **IRS/HMRC Audit Export** | Compliance | P2 | Generate immutable, timestamped reports of all data extractions for external auditors. |
| **CRM Integration** | Scalability | P3 | Sync client lists and document metadata with external tools like Salesforce or Hubspot. |
| **Electronic Signature** | Execution | P3 | Integration with DocuSign/HelloSign for finalizing extracted and validated tax returns. |
