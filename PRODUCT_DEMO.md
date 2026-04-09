# DocManager: Product Demo & Technical Showcase

> **Note**: This document serves as a visual walkthrough of the DocManager application. It highlights the core features, AI integration, and architectural decisions.

---

## 1. The Dashboard (Real-Time Overview)
<img width="1046" height="501" alt="image" src="https://github.com/user-attachments/assets/ae9c3abd-4a4c-4d15-90cd-5f6e60ee9831" />

*   **Key Feature**: Real-time metrics powered by Firestore listeners.
*   **Technical Detail**: Uses `onSnapshot` to ensure that as soon as a document is validated by one team member, the dashboard updates for everyone instantly.

## 2. AI-Powered Upload & Extraction

<img width="378" height="321" alt="image" src="https://github.com/user-attachments/assets/39be3c99-b612-4a17-bf8c-d14994738894" />

<img width="1048" height="452" alt="image" src="https://github.com/user-attachments/assets/f86f6be2-2e7c-4de9-b58e-72534be1e11e" />

*   **The Workflow**: Users drop a PDF or Image.
*   **The AI**: The system sends the base64 data to **Gemini 3 Flash**.
*   **Zero-Shot Learning**: Unlike traditional OCR, DocManager doesn't need templates. It "reads" the document like a human and extracts fields based on context.

## 3. Human-in-the-Loop (HITL) Validation
<img width="1055" height="475" alt="image" src="https://github.com/user-attachments/assets/1d203168-c49d-4d97-ab3f-0df67713684b" />

*   **Side-by-Side Review**: High-fidelity PDF/Image preview on the left, editable AI data on the right.
*   **Confidence Scoring**: Fields with <80% confidence are automatically highlighted in red to prevent human error.
*   **Read-Only Mode**: Once validated, documents switch to a read-only state to maintain data integrity.

## 4. Secure Audit Trails
<img width="936" height="471" alt="image" src="https://github.com/user-attachments/assets/da3be67a-7241-499f-b417-dc684e221c49" />

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
