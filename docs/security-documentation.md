# LUXESTORE — Security Architecture & Threat Modeling Specification

> **Focus**: Application Security, Cryptography, Identity & Access Management (IAM), and Payment Integrity  
> **Academic Context**: Security Engineering Audit for B.Tech CSE Capstone Project  
> **Repository Audited**: `mern-ecommerce`  
> **Status**: Verified Against Actual Implementation (November 2026)

---

## 1. Security Architecture Overview

The LUXESTORE application adopts a **Defense-in-Depth** security strategy across all architectural tiers:

```
[Threat Boundary: Public Internet]
          │
          ▼
[Network & Transport Security] ────────► HTTPS / TLS Encryption
          │
          ▼
[HTTP Boundary: Express Server] ──────► Helmet Headers + CORS Whitelist + Rate Limiting
          │
          ▼
[Identity & Session Layer] ────────────► Dual JWT in HTTP-Only Cookies (No localStorage)
          │
          ▼
[Authorization Layer] ─────────────────► Role-Based Access Control (protectRoute, adminRoute)
          │
          ▼
[Application Business Logic] ──────────► Cryptographic HMAC-SHA256 Signature Verification
          │
          ▼
[Persistence Layer: MongoDB] ──────────► Parameterized Mongoose ODM, Schema Constraints, Projections
```

---

## 2. Authentication & Password Security

### 2.1 Password Hashing Architecture
- **Algorithm**: `bcryptjs` (Blowfish-based cipher with adaptive work factor).
- **Work Factor (Cost Parameter)**: Salt rounds = `10` ($2^{10} = 1024$ key expansion iterations).
- **Implementation**: Managed via Mongoose pre-save hook on the `User` schema. If the password field is unmodified, hashing is skipped to avoid redundant CPU overhead.
```javascript
// backend/models/user.model.js
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});
```
- **Comparison**: Executed via timing-attack-resistant `bcrypt.compare(candidatePassword, this.password)`.

### 2.2 Secure Link-Based Email Verification
- To prevent bot spam and unauthorized account creation, users cannot authenticate until their email address is confirmed.
- Upon registration, the server generates a 32-byte (64 hex characters) cryptographically secure random token (`crypto.randomBytes(32).toString('hex')`).
- The server stores the **SHA-256 hash** of this token (`verificationTokenHash`) in MongoDB with a 15-minute expiration timestamp (`verificationTokenExpiresAt = Date.now() + 15 * 60 * 1000`). Storing only the cryptographic hash ensures that even in the event of a database dump breach, the plain verification tokens cannot be harvested.
- The plain token is transmitted exclusively within the verification link URL `${CLIENT_URL}/verify-email?token=<rawToken>` to the customer's verified inbox and destroyed immediately upon successful verification.

---

## 3. Session & Token Management (JWT via HTTP-Only Cookies)

### 3.1 Dual Token Lifecycle
The application implements an **Access Token + Refresh Token** lifecycle:

| Token Type | Lifespan | Signing Secret | Delivery Mechanism | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **`accessToken`** | 15 Minutes | `process.env.ACCESS_TOKEN_SECRET` | HTTP-Only Cookie (`SameSite: 'strict'`) | Grants authorization to protected API endpoints without hitting DB session tables. |
| **`refreshToken`** | 7 Days | `process.env.REFRESH_TOKEN_SECRET` | HTTP-Only Cookie (`SameSite: 'strict'`) | Refreshes expired access tokens. Cached in Redis for instant revocation upon logout. |

### 3.2 Mitigation of Cross-Site Scripting (XSS)
- **Zero LocalStorage Policy**: Tokens are never exposed to browser JavaScript or stored in `localStorage` or `sessionStorage`. Malicious third-party scripts injected via XSS cannot access `document.cookie` because the cookie carries the `httpOnly: true` flag.
- **SameSite Strict Configuration**: Mitigates Cross-Site Request Forgery (CSRF) in modern browsers by withholding cookies on cross-origin requests.

---

## 4. Role-Based Access Control (RBAC)

Authorization is enforced deterministically at the route level via chained Express middleware:

1. **`protectRoute`**:
   - Reads `req.cookies.accessToken`.
   - Validates cryptographic signature using `jwt.verify`.
   - Fetches user record from MongoDB while excluding sensitive fields (`.select("-password")`).
   - Injects sanitized user object into `req.user`.
2. **`adminRoute`**:
   - Evaluates `req.user.role === 'admin'`.
   - Rejects unprivileged requests immediately with `403 Forbidden: "Access denied - Admin only"`.
3. **`optionalAuth`**:
   - Attempts non-blocking JWT decoding.
   - Allows guests to access public endpoints while personalizing responses (e.g. wishlist state, browsing history) if a valid session exists.

---

## 5. Network & HTTP Layer Hardening

### 5.1 Security Headers via Helmet
The Express server initializes `helmet` (`backend/server.js`):
- `X-Content-Type-Options: nosniff`: Prevents browsers from MIME-type sniffing away from declared content-types.
- `X-Frame-Options: SAMEORIGIN`: Blocks UI clickjacking attacks.
- `Strict-Transport-Security` (HSTS): Enforces encrypted HTTPS communication.
- `X-XSS-Protection: 0`: Complies with modern browser standards to disable outdated buggy XSS audit heuristics.

### 5.2 Strict CORS Policy
CORS origins are explicitly validated against an authorized origin whitelist:
```javascript
const allowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5000",
    "http://127.0.0.1:5000",
    process.env.CLIENT_URL,
].filter(Boolean);
```
Unregistered external domains are rejected with `Error: "Not allowed by CORS"`.

### 5.3 Multi-Tier Rate Limiting
To defend against automated credential stuffing, brute force, and recovery token exhaustion:
- Applied on: `/api/auth/*`
- Policy:
  - General authentication routes (`signup`, `login`): 100 requests per 15-minute sliding window.
  - Recovery and verification routes (`resend-verification`, `forgot-password`, `reset-password`): 15 requests per 15-minute window.

---

## 6. Financial Integrity: HMAC-SHA256 Payment Verification

To prevent client-side payment tampering (such as forging a successful payment callback without paying), LUXESTORE executes server-side cryptographic signature verification:

1. **Order Initiation**: Server computes total payable amount directly from database product prices and creates the Razorpay Order.
2. **Signature Generation**: Upon checkout completion, Razorpay provides `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature`.
3. **Cryptographic Validation**:
```javascript
// backend/controllers/payment.controller.js
const body = razorpay_order_id + "|" + razorpay_payment_id;
const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ message: "Invalid payment signature" });
}
```
If signatures do not match byte-for-byte, the transaction is rejected, inventory is preserved, and no order record is committed.

---

## 7. Purchase-Verified Review Authorization

Fake review fraud is eliminated by an authorization query in `backend/controllers/review.controller.js`:
- Prior to creating a review, the backend executes an aggregation query on the `Order` collection for `{ user: req.user._id, "products.product": productId }`.
- The order must have `paymentStatus: { $in: ["paid", "captured"] }` and `orderStatus: { $ne: "cancelled" }`.
- Customers cannot review items they have not legitimately purchased and paid for.

---

## 8. Secrets Management & Environmental Hygiene

- **Zero Hardcoded Secrets**: All private API keys, database connection strings, JWT secrets, and SMTP passwords reside exclusively in environment variables loaded by `dotenv`.
- **Git Exclusion**: `.env` and `node_modules` are explicitly excluded via `.gitignore`.
- **PII Scrubbing**: Database queries explicitly project out passwords (`.select("-password")`) before sending user objects to the client.

---

## 9. Security Audit & Future Hardening Roadmap

| Security Surface | Current State in Codebase | Recommended Enterprise Enhancement |
| :--- | :--- | :--- |
| **CSRF Protection** | Relies on `SameSite: 'strict'` cookies | Introduce double-submit CSRF tokens (`csurf` or custom header `X-CSRF-Token`). |
| **Account Lockout** | IP-level rate limiting on auth routes | Introduce consecutive failed attempt counters with temporary 30-minute account locks. |
| **Webhook Validation** | `req.rawBody` parser in place | Enforce Razorpay Webhook IP range whitelisting. |
| **Content Security Policy** | Disabled in Helmet (`contentSecurityPolicy: false`) | Define strict CSP directives for script/image origins to completely eliminate inline scripts. |
