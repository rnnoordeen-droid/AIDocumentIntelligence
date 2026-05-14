# Security Specification: DocManager

## 1. Data Invariants
- A **Document** (`SCFDocument`) must belong to an existing **Client**.
- **Audit Logs** are immutable once created.
- **System Logs** are only readable by admins.
- A **User Profile** cannot have its `role` changed by the user themselves.
- **Documents** in a terminal state (`validated`, `rejected`) cannot be modified except for status reversal by an admin.
- **Client Tenant Isolation**: Users (Staff Auditors/Clients) can only access documents belonging to their `assignedClientId`.

## 2. The "Dirty Dozen" Payloads

1. **Identity Spoofing** (SCFDocument):
   Payload: `{ id: "doc123", uploadedBy: "malicious@attacker.com", fileName: "tax.pdf", status: "pending", uploadDate: "2024-01-01T00:00:00Z" }`
   Expected: `PERMISSION_DENIED` (uploadedBy must match auth.email)

2. **Shadow Update** (SCFDocument):
   Payload: `{ status: "validated", isVerified: true }`
   Expected: `PERMISSION_DENIED` (isVerified is a ghost field)

3. **State Shortcutting** (SCFDocument):
   Payload: `{ status: "validated" }`
   Expected: `PERMISSION_DENIED` (if sender is not a validator/admin)

4. **Resource Poisoning** (Document ID):
   Path: `/documents/` + "A".repeat(1500)
   Expected: `PERMISSION_DENIED` (ID too long)

5. **PII Blanket Read** (UserProfile):
   Action: `list /users`
   Expected: `PERMISSION_DENIED` (Only admins can list users)

6. **Immutable Field Break** (SCFDocument):
   Payload: `{ uploadDate: "2025-01-01T00:00:00Z" }`
   Expected: `PERMISSION_DENIED` (uploadDate is immutable)

7. **Unauthorized RBAC modification** (UserProfile):
   Action: `update /users/{myUid}` with `{ role: "admin" }`
   Expected: `PERMISSION_DENIED` (role is protected)

8. **Orphaned Record** (SCFDocument):
   Payload: `{ clientId: "non-existent-client-id" }`
   Expected: `PERMISSION_DENIED` (clientId must exist)

9. **Terminal State Update** (SCFDocument):
   Existing: `{ status: "validated" }`
   Action: `update`
   Expected: `PERMISSION_DENIED` (status locked)

10. **Query Scraping** (SCFDocument):
    Action: `list /documents` (no filter)
    Expected: `PERMISSION_DENIED` (Rules must enforce query boundaries)

11. **Email Spoofing** (Admin action):
    Auth: `{ email: "rn.noordeen@gmail.com", email_verified: false }`
    Expected: `PERMISSION_DENIED` (email_verified must be true)

12. **Type Poisoning** (SCFDocument):
    Payload: `{ extractedData: { amount: "ONE MILLION" } }`
    Expected: `PERMISSION_DENIED` (amount must be number)
