# DocManager: Product Demo & Technical Showcase

> **Note**: This document serves as a visual walkthrough of the DocManager application. It highlights the core features, AI integration, and architectural decisions.

---

## 1. The Dashboard (Real-Time Overview)
![Dashboard Placeholder](https://picsum.photos/seed/dashboard/800/400)
*   **Key Feature**: Real-time metrics powered by Firestore listeners.
*   **Technical Detail**: Uses `onSnapshot` to ensure that as soon as a document is validated by one team member, the dashboard updates for everyone instantly.

## 2. AI-Powered Upload & Extraction
![Upload Placeholder](https://picsum.photos/seed/upload/800/400)

<img width="378" height="321" alt="image" src="https://github.com/user-attachments/assets/39be3c99-b612-4a17-bf8c-d14994738894" />

*   **The Workflow**: Users drop a PDF or Image.
*   **The AI**: The system sends the base64 data to **Gemini 3 Flash**.
*   **Zero-Shot Learning**: Unlike traditional OCR, DocManager doesn't need templates. It "reads" the document like a human and extracts fields based on context.

## 3. Human-in-the-Loop (HITL) Validation
![Validation Placeholder](https://picsum.photos/seed/validate/800/400)
*   **Side-by-Side Review**: High-fidelity PDF/Image preview on the left, editable AI data on the right.
*   **Confidence Scoring**: Fields with <80% confidence are automatically highlighted in red to prevent human error.
*   **Read-Only Mode**: Once validated, documents switch to a read-only state to maintain data integrity.

## 4. Secure Audit Trails
![Audit Placeholder](https://picsum.photos/seed/audit/800/400)
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
[Your Name] | [Your Email] | [Your LinkedIn]
