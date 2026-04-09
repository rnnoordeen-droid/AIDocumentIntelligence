# DocManager: AI-Powered Document Intelligence

DocManager is a production-ready Single Page Application (SPA) designed for automated document classification and data extraction. Built with React, Firebase, and Google's Gemini AI, it provides a seamless Human-in-the-Loop (HITL) workflow for managing corporate documents.

## 🚀 Features

- **Dynamic AI Extraction**: Automatically classifies any document type (Invoices, Contracts, IDs, etc.) and extracts all meaningful fields without pre-defined templates.
- **Real-Time Synchronization**: Powered by Firestore for instant updates across all connected clients.
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

1. **Dashboard**: View system-wide metrics and recent activity.
2. **Upload**: Drag and drop any document. The AI will classify it and extract data in seconds.
3. **Validate**: Review the extracted fields side-by-side with the document preview.
4. **Audit**: Track every modification in the Audit Trails tab.

## 📄 License

MIT
