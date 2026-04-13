# DocManager: Product Demo & Technical Showcase

This document serves as a visual walkthrough of the DocManager application. It highlights the core features, AI integration, and architectural decisions. For a deep-dive into the code and system design, please see our **[Technical Documentation](TECHNICAL_DOC.md)**.

---

## 🎥 Product Walkthrough Video
[![Watch the Demo](https://img.youtube.com/vi/PLACEHOLDER_ID/0.jpg)](https://www.loom.com/share/YOUR_VIDEO_ID)
> *Tip: Record a 60-second walkthrough showing the AI extraction and visual overlays in action!*

---

## 🚀 Production-Ready Document Intelligence
DocManager is now fully optimized for production environments, featuring robust error handling, secure RBAC, and a scalable architecture designed to handle high-volume document processing.

## 1. The Dashboard (Real-Time Overview)
<img width="1120" height="525" alt="image" src="https://github.com/user-attachments/assets/7dcdc527-ebab-480d-b366-5676caba5211" />

*   **Key Feature**: Real-time metrics powered by Firestore listeners.
*   **Technical Detail**: Uses `onSnapshot` to ensure that as soon as a document is validated by one team member, the dashboard updates for everyone instantly.

## 2. AI-Powered Upload & Extraction
Upload Document :
<img width="327" height="342" alt="image" src="https://github.com/user-attachments/assets/a3d68f38-26ee-4f8c-b480-660210a897e1" />

Uploaded Document displayed in the dashboard for the next steps:
<img width="1131" height="401" alt="image" src="https://github.com/user-attachments/assets/d9b8193b-2345-4f32-bc61-d33d00caa088" />

*   **The Workflow**: Users drop a PDF or Image.
*   **The AI**: The system sends the base64 data to **Gemini 1.5 Flash**.
*   **Zero-Shot Learning**: Unlike traditional OCR, DocManager doesn't need templates. It "reads" the document like a human and extracts fields based on context.

## 3. Human-in-the-Loop (HITL) Validation
<img width="1130" height="544" alt="image" src="https://github.com/user-attachments/assets/f36cee30-d75e-410c-b11e-ee4121ad6423" />

*   **Side-by-Side Review**: High-fidelity PDF/Image preview on the left, editable AI data on the right. 
*   **Redaction (Privacy)**: Sensitive fields (PII fields) are masked on the right, with toggle button with role based access.
*   **Confidence Scoring**: Fields with <80% confidence are automatically highlighted in red to prevent human error.

## 4. Visual Inspection & Data-Centric AI (Landing AI Inspired)
<img width="943" height="356" alt="image" src="https://github.com/user-attachments/assets/68a54ebf-24ac-4076-afa7-544e49f6e58e" />

*   **Detection Overlays**: Visual bounding boxes highlight exactly where the AI "looked" to find the Vendor Name, Date, and Amount.
*   **Feedback Loop**: Users can click the "Zap" icon next to any field to provide feedback, ensuring the model learns from human expertise over time.

## 5. Document Blueprints & Automated Validation
<img width="480" height="531" alt="image" src="https://github.com/user-attachments/assets/06abf635-638b-4c5b-b87f-56a4b0598f1b" />

*   **Schema Builder**: Define strict extraction schemas for different document types (Invoices, Contracts, IDs).
*   **Automated Logic Checks**: Set custom validation rules (Regex, Numeric Range, Required) that automatically flag documents failing your business logic.

## 8. Usage Tutorial (Onboarding)
<img width="1130" height="493" alt="image" src="https://github.com/user-attachments/assets/9a1c76e0-726a-47c1-bbe7-803132a293e6" />

*   **Simplified Onboarding**: A dedicated sidebar module that explains the app's features in simple, non-technical language.
*   **Step-by-Step Guide**: Helps users understand the Upload -> AI Magic -> Validate workflow in seconds.

## 8. Secure Audit Trails
<img width="1136" height="311" alt="image" src="https://github.com/user-attachments/assets/2e861104-1419-4d92-ac09-aab7f1678653" />

*   **Compliance**: Every action (Upload, Validate, Reject) is logged.
*   **Security**: Firestore Security Rules ensure that only authorized users can modify documents or view logs.

## 5. Technical Architecture
```mermaid
graph TD
    A[User] -->|Upload| B[React Frontend]
    B -->|Base64| C[Gemini AI]
    C -->|JSON Data| B
    B -->|Store| D[Firestore]
    D -->|Real-time Sync| E[Team Dashboard]
    F[Firebase Auth] -->|Secure Access| B
```

---

## 🚀 Why This Project?
DocManager solves a real-world business problem: **Data Accuracy at Scale**. It demonstrates proficiency in:
1.  **Generative AI Integration** (Prompt engineering, JSON response parsing).
2.  **Real-time Cloud Databases** (Firestore).
3.  **Enterprise UI/UX** (HITL patterns, accessibility, responsive design).
4.  **Security & Compliance** (Audit logs, RBAC).

---
**Contact Information:**
Roxy Noordeen | rn.noordeen@gmail.com | [[Your LinkedIn]](https://www.linkedin.com/in/roxynoordeen/)
