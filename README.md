# DocManager: AI-Powered Document Intelligence

DocManager is a production-ready Single Page Application (SPA) designed for automated document classification and data extraction. Built with React, Firebase, and Google's Gemini AI, it provides a seamless Human-in-the-Loop (HITL) workflow for managing corporate documents.

## 🚀 Features

- **Document Blueprints (Schema Builder)**: Define strict schemas for specific document types, ensuring the AI extracts exactly what you need with predictable structure.
- **Automated Logic Checks**: Implement custom validation rules (Required, Min Length, Numeric Range, Regex) that automatically flag documents failing business logic.
- **Dynamic AI Extraction**: Automatically classifies any document type (Invoices, Contracts, IDs, etc.) and extracts all meaningful fields without pre-defined templates.
- **AI Fraud Detection**: Inspects documents for signs of digital tampering, inconsistent fonts, and artifacts using Gemini's vision capabilities.
- **PII Redaction Engine**: Automatically identifies sensitive data (ID Numbers, Account Details) and allows for role-based masking.
- **Integration Hub**: A dedicated sidebar module to configure webhooks and access REST API documentation, enabling seamless data flow to enterprise ERP or custom systems.
- **Usage Tutorial**: Built-in interactive guide to help new users get started with the platform in seconds.
- **Visual Inspection Overlays**: Inspired by Landing AI, the validation view now features visual bounding boxes on document previews, showing exactly where the AI identified key data points.
- **Data-Centric AI Feedback**: Users can provide direct feedback to the model on specific field extractions, creating a continuous improvement loop for AI accuracy.
- **Compliance Dashboard**: Real-time "Compliance Score" tracking based on AI confidence and fraud analysis.
- **Live Document Preview**: High-fidelity preview of PDFs and images directly within the validation interface.
- **HITL Validation**: Intuitive UI for human reviewers to verify and correct AI-extracted data.
- **Comprehensive Audit Trails**: Every action is logged with user details and timestamps for full compliance.
- **Secure RBAC**: Role-Based Access Control (Admin, Validator, Viewer) enforced via Firestore Security Rules.
- **Google Authentication**: Secure corporate login via Firebase Auth.

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Shadcn UI, Framer Motion.
- **Backend**: Firebase (Firestore, Authentication).
- **AI Engine**: Google Gemini 3 Flash (via `@google/genai`).
- **Build Tool**: Vite.

## 📦 Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure Environment Variables:
   Create a `.env` file with:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```
4. Setup Firebase:
   Add your `firebase-applet-config.json` to the root directory.

## 📖 Usage

1. **Document Blueprints**: Go to the "Blueprints" tab to define a schema for your documents. This ensures the AI knows exactly what fields to look for.
2. **Usage Tutorial**: Check the "Usage Tutorial" tab in the sidebar for a simple, step-by-step guide on how to use the system.
3. **Dashboard**: View system-wide metrics and recent activity.
4. **Upload**: Select a blueprint (optional) and upload your document. The AI will enforce your schema and run validation rules.
5. **Validate**: Review the extracted fields and "Automated Logic Checks" side-by-side with the document preview.
6. **Audit**: Track every modification in the Audit Trails tab.

## 📄 License

MIT
