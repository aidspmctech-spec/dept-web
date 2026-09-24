# AIDS Portal Security Model

## 1. The Zero-Trust Architecture
The system is designed on the principle that the **Frontend is Untrusted**. No security decisions are made in JavaScript.

### Trust Boundary
`User Browser` $\rightarrow$ `GAS API (Trust Boundary)` $\rightarrow$ `Private Spreadsheet`

## 2. Authentication Layer
- **Handshake**: Users authenticate via `RegisterNo` + `SecretKey`.
- **One-Way Hashing**: Secret keys are never stored in plaintext. We use SHA-256 hashing with a server-side salt.
- **Session Management**: 
    - Successful login generates a UUID `SessionToken`.
    - Tokens are stored in the `Sessions` sheet with an `ExpiresAt` timestamp.
    - Every API request must provide this token.
    - Tokens expire after 24 hours.

## 3. Authorization (RBAC)
- **Role-Based Access**: Roles (`STUDENT`, `STAFF`) are assigned in the `AccessKeys` sheet.
- **Server-Side Enforcement**: 
    - `Auth.authorize()` is called at the start of every request.
    - Students are strictly limited to rows where `RegisterNo == authenticatedUser.RegisterNo`.
    - Staff can only access specific verification and management functions.
    - Staff has global read/write access.

## 4. Data Integrity & Validation
- **Input Sanitization**: All inputs are treated as untrusted.
- **Type Validation**: Numeric fields (Fees, SGPA) are coerced and validated before being written to the Spreadsheet.
- **Duplicate Prevention**: Unique IDs (e.g., `ACH-0001`) are generated server-side to prevent duplicate record injection.

## 5. Audit & Accountability
- **Immutable Log**: Every sensitive operation (Login, Verification, Fee Update) is recorded in the `AuditLog` sheet.
- **Traceability**: Logs include the UserID, Role, Timestamp, and the specific change made.
- **Audit Review**: Staff can filter and review logs to detect suspicious patterns.

## 6. Infrastructure Security
- **Private Database**: The Google Spreadsheet is not shared with anyone. It is accessed only via the GAS service account.
- **No Secret Leaks**: API keys, Spreadsheet IDs, and Salts are stored in `Config.gs` on the server, never in the frontend.
- **CORS/Origin**: The GAS Web App is deployed to "Execute as Me" to maintain strict access control.
