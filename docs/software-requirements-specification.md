# LUXESTORE — Software Requirements Specification (SRS)

> **Standard Compliance**: Inspired by ISO/IEC/IEEE 29148:2018 Systems and Software Engineering — Life cycle processes — Requirements engineering  
> **Project**: LUXESTORE Luxury Fashion E-Commerce Platform  
> **Academic Level**: Final Year B.Tech Computer Science & Engineering Project  
> **Audit Status**: Verified Against Repository Source Code (November 2026)

---

## 1. Introduction

### 1.1 Purpose
This document provides the formal Software Requirements Specification (SRS) for the **LUXESTORE** fashion e-commerce web platform. It defines the functional, non-functional, external interface, and architectural requirements verified from the codebase.

### 1.2 Scope
LUXESTORE is an enterprise-grade MERN stack application providing an end-to-end digital retail experience for high-fashion garments and accessories. The system manages customer acquisition, pure email authentication, catalog discovery, variant-level stock allocation, promo code discount calculation, logistics serviceability verification, Razorpay payments, transactional email notifications, order lifecycle management, and administrative business intelligence.

### 1.3 Definitions, Acronyms & Abbreviations
- **AWB**: Air Waybill (Logistics parcel identification code).
- **BCrypt**: Adaptive cryptographic password hash function.
- **CDN**: Content Delivery Network (Cloudinary edge network).
- **CORS**: Cross-Origin Resource Sharing.
- **DFD**: Data Flow Diagram.
- **HMAC**: Hash-based Message Authentication Code (SHA-256).
- **JWT**: JSON Web Token.
- **MERN**: MongoDB, Express.js, React, Node.js.
- **ODM**: Object Data Modeling (Mongoose).
- **PII**: Personally Identifiable Information.
- **RBAC**: Role-Based Access Control.
- **SKU**: Stock Keeping Unit.
- **SPA**: Single Page Application.
- **SRS**: Software Requirements Specification.

### 1.4 References
1. ISO/IEC/IEEE 29148:2018: Software and Systems Engineering — Requirements Engineering.
2. OWASP Top 10 Web Application Security Risks (2021).
3. React 18 & Vite Official Documentation.
4. Express.js API Reference (v4.19).
5. MongoDB Documentation (v7.0/8.0).

---

## 2. Overall Description

### 2.1 Product Perspective
LUXESTORE operates as a distributed web platform where a React Single Page Application communicates via secure HTTPS JSON APIs with an Express.js backend. The backend interfaces with MongoDB for persistence, Redis for caching, Razorpay for payments, Shiprocket for logistics, and Gmail SMTP for notifications.

### 2.2 User Classes & Characteristics
1. **Guest Shopper**: Anonymous browser browsing products, categories, size charts, and checking postal code serviceability.
2. **Authenticated Customer**: Verified user with active email who manages shopping bags, wishlists, saved addresses, orders, and reviews.
3. **Store Administrator**: Privileged internal staff possessing `role: "admin"` with access to catalog CRUD, sales analytics, coupon creation, and order management.

### 2.3 Operating Environment
- **Server OS**: Linux / Windows / macOS with Node.js v18.x to v24.x runtime.
- **Client OS & Browsers**: Modern evergreen browsers (Google Chrome 100+, Mozilla Firefox 100+, Safari 15+, Microsoft Edge 100+).
- **Database**: MongoDB 6.0+ cluster / Community Edition (locally tested on v8.2.2.0) and Redis 6.0+.

---

## 3. Functional Requirements

### 3.1 Customer & Authentication Module

#### [FR-AUTH-001] Customer Registration & Verification Token Generation
- **Description**: The system shall register new customers using a full name, valid email address, and password, and dispatch a secure verification URL link.
- **Actor**: Guest Shopper.
- **Preconditions**: Email address must not already exist in the database with `isEmailVerified: true`.
- **Main Workflow**:
  1. Shopper submits name, email, and password on `/signup`.
  2. Server normalizes email to lowercase, validates email syntax, and checks password strength ($\ge$ 6 characters).
  3. Server hashes password with `bcryptjs` (salt rounds: 10).
  4. Server creates user document with `isEmailVerified: false` and generates a 32-byte (64 hex characters) cryptographically secure verification token.
  5. Server computes SHA-256 hash of the token (`verificationTokenHash`), sets `verificationTokenExpiresAt = Date.now() + 15 * 60 * 1000` (15-minute window), and saves user.
  6. Server dispatches email containing verification URL `${CLIENT_URL}/verify-email?token=${rawToken}` and returns HTTP 201.
- **Alternative Workflow**: If email exists and is verified, server returns HTTP 400 with "An account with this email already exists. Please sign in."
- **Expected Outcome**: User record saved; verification email dispatched; user directed to check their inbox.
- **Priority**: High | **Status**: Implemented.

#### [FR-AUTH-002] Real Email URL Link Verification
- **Description**: The system shall verify the customer's email address when the customer navigates to the verification link with the valid 32-byte cryptographic token.
- **Actor**: Guest Shopper / Registered User.
- **Preconditions**: Registration initiated; token link accessed within 15 minutes.
- **Main Workflow**:
  1. Customer clicks email verification link opening `/verify-email?token=<rawToken>`.
  2. Client component `VerifyEmailPage.jsx` extracts `token` from URL search parameters and posts `{ token }` to `POST /api/auth/verify-email`.
  3. Server hashes token using SHA-256 and matches against `verificationTokenHash` in database.
  4. Server validates expiration timestamp (`verificationTokenExpiresAt > Date.now()`).
  5. Server updates `isEmailVerified: true`, `accountStatus: "active"`, and clears `verificationTokenHash`.
  6. Server asynchronously dispatches welcome email and returns HTTP 200.
  7. Client renders success confirmation and redirects customer to `/login`.
- **Alternative Workflow**:
  - If token is missing, client renders invalid state.
  - If token expired, server returns HTTP 400 with `{ expired: true }`, allowing customer to submit resend verification.
  - If token is invalid or already used, server returns HTTP 400.
- **Priority**: High | **Status**: Implemented.

#### [FR-AUTH-003] Email & Password Login
- **Description**: The system shall authenticate registered customers via email and password.
- **Actor**: Customer.
- **Preconditions**: User must have `isEmailVerified: true`.
- **Main Workflow**:
  1. Customer submits credentials on `/login`.
  2. Server verifies email exists, compares password hash via `bcrypt.compare`.
  3. Server verifies `isEmailVerified === true`.
  4. Server generates dual JWT tokens (`accessToken`: 15m; `refreshToken`: 7d) and returns HTTP-only cookies.
- **Alternative Workflow**: If unverified, returns HTTP 403 directing customer to verify email.
- **Priority**: High | **Status**: Implemented.

#### [FR-AUTH-004] Resend Verification Email Link
- **Description**: The system shall allow unverified customers to request a fresh verification link.
- **Actor**: Unverified Customer.
- **Preconditions**: User exists with `isEmailVerified: false`. Rate limited to 15 recovery requests per 15 minutes.
- **Priority**: Medium | **Status**: Implemented.

#### [FR-AUTH-005] Forgot & Reset Password via Email Link
- **Description**: The system shall allow customers to reset forgotten passwords via a 15-minute token link dispatched by email.
- **Actor**: Customer.
- **Preconditions**: Registered user email.
- **Main Workflow**:
  1. Customer enters email on `/forgot-password`.
  2. Server generates secure random crypto token with 15-minute expiry.
  3. Server dispatches email with password reset URL containing token.
  4. Customer enters new password on `/reset-password` posting `{ token, password }` to `POST /api/auth/reset-password`.
  5. Server hashes new password and invalidates token.
- **Priority**: High | **Status**: Implemented.

#### [FR-AUTH-006] Secure Logout & State Cleansing
- **Description**: The system shall clear HTTP-only cookies and flush local/Zustand client session state upon logout.
- **Actor**: Authenticated Customer.
- **Expected Outcome**: `accessToken` and `refreshToken` cookies cleared; Wishlist, Cart, and Address stores reset to defaults.
- **Priority**: High | **Status**: Implemented.

---

### 3.2 Catalog & Product Discovery Module

#### [FR-PROD-001] Hierarchical Product Browsing
- **Description**: The system shall allow customers to browse apparel products categorized by departments (Jeans, T-Shirts, Shoes, Glasses, Jackets, Suits, Bags).
- **Actor**: Guest / Customer.
- **Priority**: High | **Status**: Implemented.

#### [FR-PROD-002] Multi-Dimensional Variant Selection
- **Description**: The system shall present product color swatches and size options with real-time stock availability per variant SKU.
- **Actor**: Guest / Customer.
- **Priority**: High | **Status**: Implemented.

#### [FR-PROD-003] Live Search & Multi-Parametric Filtering
- **Description**: The system shall allow customers to search products by text query, category, price range, and sort by price, popularity, or newest arrivals.
- **Actor**: Guest / Customer.
- **Priority**: High | **Status**: Implemented.

#### [FR-PROD-004] Interactive Physical Store Locator
- **Description**: The system shall display physical atelier store locations on an interactive Leaflet/OpenStreetMap map.
- **Actor**: Guest / Customer.
- **Priority**: Medium | **Status**: Implemented.

---

### 3.3 Cart, Wishlist & Engagement Module

#### [FR-CART-001] Synchronized Shopping Bag
- **Description**: The system shall maintain an authenticated customer's shopping bag in the database and allow quantity increments, decrements, and removals.
- **Actor**: Customer.
- **Priority**: High | **Status**: Implemented.

#### [FR-CART-002] Dynamic Wishlist Management
- **Description**: The system shall allow authenticated customers to save items to their private wishlist and reset the wishlist upon logout.
- **Actor**: Customer.
- **Priority**: High | **Status**: Implemented.

#### [FR-ENG-001] Deduplicated Recently Viewed Products
- **Description**: The system shall record customer product views in the `BrowsingHistory` collection, deduplicating repetitive views and presenting a dedicated history page.
- **Actor**: Customer.
- **Priority**: Medium | **Status**: Implemented.

#### [FR-ENG-002] Newsletter / Community Subscription
- **Description**: The system shall validate email syntax and subscribe customers to the Atelier Newsletter, persisting records in the `Newsletter` collection.
- **Actor**: Guest / Customer.
- **Priority**: Medium | **Status**: Implemented.

---

### 3.4 Logistics & Shipping Verification Module

#### [FR-SHIP-001] PIN Code Courier Serviceability Verification
- **Description**: The system shall query the Shiprocket API with the customer's delivery postal code to verify courier coverage and estimate delivery dates.
- **Actor**: Guest / Customer.
- **Priority**: High | **Status**: Implemented.

#### [FR-SHIP-002] Free Delivery Threshold Enforcement
- **Description**: The system shall automatically waive the delivery fee (setting it to ₹0 FREE) whenever the cart subtotal is greater than or equal to ₹1,999. Orders below ₹1,999 carry the configured logistics rate (e.g. ₹93.72).
- **Actor**: Customer.
- **Priority**: High | **Status**: Implemented.

---

### 3.5 Checkout, Coupon & Payment Module

#### [FR-PAY-001] Strict Coupon & Voucher Validation
- **Description**: The system shall validate promotional vouchers against expiration dates, active status, category eligibility, minimum purchase amounts, and maximum discount caps:
  - **`WELCOME10`**: Storewide scope, 10% discount, minimum order requirement ₹999, maximum discount cap ₹1,500.
  - **`FASHION15`**: Category-restricted scope (apparel, clothing, suits, jackets, jeans, shirts, trousers, etc.), 15% discount, minimum order requirement ₹1,499, maximum discount cap ₹2,000. Rejects non-apparel items (e.g. sunglasses).
- **Actor**: Customer.
- **Priority**: High | **Status**: Implemented.

#### [FR-PAY-002] Razorpay Order Generation
- **Description**: The system shall generate a secure Razorpay payment order in INR currency with amount computed in paise on the server (`Math.round(totalAmount * 100)`).
- **Actor**: Customer.
- **Priority**: High | **Status**: Implemented.

#### [FR-PAY-003] Server-Side HMAC-SHA256 Payment Verification
- **Description**: The system shall verify the authenticity of Razorpay payment responses using an HMAC-SHA256 signature check prior to order creation.
- **Actor**: System / Payment Gateway.
- **Priority**: High | **Status**: Implemented.

#### [FR-ORD-001] Order Cancellation & Stock Reversal
- **Description**: The system shall permit customers to cancel unfulfilled orders, automatically restoring variant inventory stock and updating the order status to `cancelled`.
- **Actor**: Customer.
- **Priority**: High | **Status**: Implemented.

#### [FR-REV-001] Purchase-Verified Reviews
- **Description**: The system shall restrict product review submissions strictly to customers who have an order with `paymentStatus: "paid"` or `"captured"` containing that product.
- **Actor**: Customer.
- **Priority**: High | **Status**: Implemented.

---

### 3.6 Administrator Module

#### [FR-ADM-001] Real-Time Business Analytics Dashboard
- **Description**: The system shall aggregate total revenue, completed orders, registered users, and category sales charts (`recharts`).
- **Actor**: Store Administrator.
- **Priority**: High | **Status**: Implemented.

#### [FR-ADM-002] Catalog & Variant Stock Management
- **Description**: The system shall allow administrators to create, edit, delete, and restock products, variants, and categories.
- **Actor**: Store Administrator.
- **Priority**: High | **Status**: Implemented.

#### [FR-ADM-003] Marketing Promotions & CMS Control
- **Description**: The system shall allow administrators to configure coupons, flash sales, hero campaign slides, announcement banners, and size chart measurement matrices.
- **Actor**: Store Administrator.
- **Priority**: High | **Status**: Implemented.

#### [FR-ADM-004] Multi-Vendor Seller Marketplace
- **Description**: Dedicated portal for third-party merchant onboarding, independent inventory management, and automated split disbursements via Razorpay Route.
- **Actor**: Third-Party Vendor.
- **Priority**: Low | **Status**: **Unimplemented / Planned Future Scope** (Current release operates under unified Store Administrator).

---

## 4. Non-Functional Requirements (NFR)

| ID | Category | Requirement Specification | Realization in Codebase |
| :--- | :--- | :--- | :--- |
| **NFR-SEC-001** | Password Security | Passwords hashed using bcrypt with salt rounds $\ge$ 10. | `bcryptjs.hash(password, 10)` in `user.model.js`. |
| **NFR-SEC-002** | Session Protection | Tokens delivered exclusively via HTTP-only, SameSite cookies. | `res.cookie('accessToken', ..., { httpOnly: true, sameSite: 'strict' })`. |
| **NFR-SEC-003** | API Rate Limiting | Auth endpoints throttled to 100 general / 15 recovery requests per 15 minutes. | `express-rate-limit` configured on `/api/auth`. |
| **NFR-SEC-004** | Header Hardening | Defense against XSS, clickjacking, and MIME sniffing. | `helmet({ contentSecurityPolicy: false })`. |
| **NFR-PERF-001**| Database Latency | Indexed queries resolve in < 50ms under normal load. | Compound and unique indexes on email, slug, category, code. |
| **NFR-PERF-002**| Caching Throughput | High-traffic catalog queries cached in in-memory Redis. | Redis caching in `lib/redis.js` with direct DB fallback. |
| **NFR-REL-001** | Fault Tolerance | Server remains operational if Redis or SMTP is unreachable. | Non-blocking try-catch wrappers and local DB fallbacks. |
| **NFR-COMP-001**| Responsiveness | UI adapts seamlessly across Mobile (360px) to Desktop (4K). | Tailwind CSS responsive utility classes (`sm:`, `md:`, `lg:`, `xl:`). |

---

## 5. Traceability Matrix

| Requirement ID | Module Name | Primary API Endpoint | Database Collection | Verification Test File | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **FR-AUTH-001** | Authentication | `POST /api/auth/signup` | `users` | `test_auth_simplification_suite.js` | Implemented |
| **FR-AUTH-002** | Authentication | `POST /api/auth/verify-email` | `users` | `test_auth_simplification_suite.js` | Implemented |
| **FR-AUTH-003** | Authentication | `POST /api/auth/login` | `users` | `test_auth_simplification_suite.js` | Implemented |
| **FR-AUTH-005** | Authentication | `POST /api/auth/forgot-password` | `users`, `emaillogs` | `test_complete_bugfix_suite.js` | Implemented |
| **FR-PROD-001** | Product Catalog | `GET /api/products` | `products` | `test_complete_bugfix_suite.js` | Implemented |
| **FR-PROD-002** | Product Catalog | `GET /api/products/:id` | `products` | `test_complete_bugfix_suite.js` | Implemented |
| **FR-CART-001** | Cart | `POST /api/cart` | `users` | `test_complete_bugfix_suite.js` | Implemented |
| **FR-CART-002** | Wishlist | `POST /api/users/wishlist/toggle` | `users` | `test_complete_bugfix_suite.js` | Implemented |
| **FR-SHIP-001** | Logistics | `POST /api/serviceability/check` | `serviceablelocations` | `shiprocket.test.js` | Implemented |
| **FR-SHIP-002** | Logistics | `GET /api/addresses` | `addresses` | `test_live_api_checkout.js` | Implemented |
| **FR-PAY-001** | Coupons | `POST /api/coupons/validate` | `coupons` | `test_live_api_checkout.js` | Implemented |
| **FR-PAY-002** | Checkout | `POST /api/payments/razorpay-order`| `orders` | `test_live_api_checkout.js` | Implemented |
| **FR-PAY-003** | Checkout | `POST /api/payments/verify-razorpay`| `orders`, `products` | `razorpay.test.js` | Implemented |
| **FR-ORD-001** | Orders | `POST /api/orders/:id/cancel` | `orders`, `products` | `order_cancellation_razorpay.test.js`| Implemented |
| **FR-REV-001** | Reviews | `POST /api/reviews` | `reviews`, `orders` | `test_complete_bugfix_suite.js` | Implemented |
| **FR-ADM-001** | Admin Analytics| `GET /api/analytics` | `orders`, `users` | `test_complete_bugfix_suite.js` | Implemented |
| **FR-ADM-004** | Seller Module | N/A (Vendor Portal) | N/A | N/A | **Unimplemented / Planned** |
