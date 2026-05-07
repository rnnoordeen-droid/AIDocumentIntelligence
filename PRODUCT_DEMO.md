# DocManager: Enterprise Document Intelligence Demo

DocManager is an AI-powered document management and intelligence platform designed for high-integrity supply chain data extraction and validation. This document showcases the core features and technological pillars of the application.

---

## 1. Executive Dashboard
The centralized cockpit for your document operations.

<img width="1877" height="941" alt="image" src="https://github.com/user-attachments/assets/a5c5b00c-4598-4d4c-9add-7360c997a29d" />

*Note: Capture a screenshot of the main Dashboard tab showing the StatCards and 'Recent Documents' table.*

**Key Metrics:**
- **Compliance Score:** Real-time calculation of auto-validated documents vs. manual reviews.
- **AI Accuracy:** Measured performance based on historical human-in-the-loop feedback.
- **Repository Health:** Distribution of pending, validated, and flagged documents.

---

## 2. DocBrain: Library Intelligence
A long-context RAG engine that allows you to query your entire document vault.

<img width="1600" height="892" alt="image" src="https://github.com/user-attachments/assets/a7f03413-1e51-40be-a32c-46ac263d37ad" />
<img width="1002" height="741" alt="image" src="https://github.com/user-attachments/assets/26c85517-53c2-4373-9fdd-4644419b760d" />

*Note: Capture a screenshot of the 'Library Intelligence' tab showing a conversation about spend trends or vendor comparisons.*

**Capabilities:**
- **Cross-Document Reasoning:** Ask questions that span hundreds of PDFs (e.g., "Compare shipping costs between Vendor A and Vendor B over the last quarter").
- **Automated Insights:** AI-generated cards summarizing trends and cost-saving opportunities.
- **Intelligent Suggestions:** One-click queries for the most common supply chain analysis patterns.

---

## 3. High-Integrity Extraction Engine
The core processing layer with advanced grounding and anti-hallucination guards.
<img width="1882" height="898" alt="image" src="https://github.com/user-attachments/assets/c12428ce-2daf-4431-84e5-c3dac0af2c90" />

*Note: Open a document in 'Review' mode and capture the side panel showing confidence scores and red-highlighted high-risk fields.*

**Advanced Security Features:**
- **Cross-Check Logic:** Dual-path extraction (Pattern vs. Semantic) validates every field. Discrepancies are flagged as "Disputed".
- **Grounding Score:** A transparency metric showing exactly how much of a value was "anchored" in source text vs. inferred.
- **Tamper Detection:** AI inspection for digital alteration patterns, inconsistent fonts, or metadata mismatch.
- **High-Risk Highlighting:** Any field with < 85% confidence is automatically highlighted in the UI for manual human-in-the-loop (HITL) review.

---

## 4. Document Blueprints & Validation
Define your own enterprise schemas with strict logical rules.

<img width="1312" height="893" alt="image" src="https://github.com/user-attachments/assets/84b4ba9b-857c-47a5-8862-5eebc4054de9" />

*Note: Capture the 'Blueprints' tab showing the field definitions and custom validation rules (Regex, Numeric Range).*

**Logic Gates:**
- **Schema Enforcement:** Force the AI to follow strict JSON schemas for custom document types.
- **Custom Rules:** Implement business logic (e.g., "Amount must be between 100 and 5000") that runs immediately after AI extraction.

---

## 5. Integration Hub & Audit Trails
Ready for enterprise-grade deployment.

<img width="1611" height="823" alt="image" src="https://github.com/user-attachments/assets/8699b004-8770-4b60-bfe3-f8dcc4853a42" />

*Note: Capture the 'Audit Logs' tab showing the trace of uploads, AI analysis, and human validations.*

**Features:**
- **Webhook Sync:** Automatically push validated data to your ERP or Integration Hub.
- **SOC2 Ready Logs:** Immutable record of every action taken on your sensitive documents.
- **Redaction Mode:** One-click PII (Personally Identifiable Information) masking for safe document sharing.

## 📸 How to Complete This Demo
To finalize this document for sharing:
1. **Open the App Preview**: Navigate to the live preview window. (Link https://aistudio.google.com/apps/ad65dfe9-c37a-4882-9065-b88f26a03dca?showAssistant=true&showPreview=true&fullscreenApplet=true access granted only to specific users)
2. **Capture Key Screens**: Use your OS screenshot tool (Cmd+Shift+4 on Mac, Win+Shift+S on Windows) to capture the sections described above.
3. **Upload & Replace**: Upload the images to your repository and update the image paths in this file (e.g., `![Dashboard](my_dashboard.png)`).
4. **Export**: Export this file as a PDF or share the repo for a professional presentation of your work.
