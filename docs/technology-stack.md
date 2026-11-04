# LUXESTORE — Master Technology Stack Report

> **Audited Repository**: `mern-ecommerce`  
> **Audit Date**: November 2026 (Final Accuracy Verification)  
> **Source Verification**: `package.json`, `package-lock.json`, `frontend/package.json`, `frontend/package-lock.json`, and runtime environment.

---

## 1. Runtime Environment & Core Engines

| Component | Declared Version / Range | Actual Installed / Active Version | Verification Method | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Node.js Runtime** | *Not declared* (`engines` field missing in `package.json`) | `v24.11.1` (Active Host) | `node --version` CLI | Active Host Engine (Recommended: Node 18.x to 24.x) |
| **npm Package Manager** | `^10.x` compatible | `10.8.2` | `npm --version` CLI | Verified Active Package Manager |
| **Module System** | `"type": "module"` | ES Modules (Native ESM) | `package.json` inspection | Verified native JavaScript modules |
| **ECMAScript Standard** | ES2022+ | ES2022 / modern V8 engine | Node 24 V8 runtime | Verified |

---

## 2. Frontend Technology Stack

The frontend is a decoupled Single Page Application (SPA) built on React 18, bundled by Vite, styled via utility-first Tailwind CSS, and powered by reactive micro-stores (Zustand).

### Frontend Dependencies

| Package Name | Declared Version | Installed Version | Architectural Role | Where Used | Why Selected & Component Dependency |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`react`** | `^18.3.1` | `18.3.1` | View Engine & Virtual DOM | Entire UI (`frontend/src/`) | Declarative UI, Concurrent rendering, fiber reconciler. Core dependency of all components. |
| **`react-dom`** | `^18.3.1` | `18.3.1` | DOM Renderer | `main.jsx` | Mounts the React component tree to `#root` in `index.html`. |
| **`react-router-dom`** | `^6.26.1` | `6.26.1` | Client-Side Routing | `App.jsx`, Navigation components | Declarative SPA routing, protected route guards, navigation hooks (`useNavigate`, `useParams`). |
| **`zustand`** | `^4.5.5` | `4.5.5` | Reactive State Management | `frontend/src/stores/*` (15 store files) | Lightweight (<2KB) flux-like store without boilerplate or provider wrappers. Manages cart, auth, addresses, theme. |
| **`axios`** | `^1.7.5` | `1.7.5` | HTTP Client | `frontend/src/lib/axios.js` | Promise-based REST client configured with `withCredentials: true` for HTTP-only cookies and baseURL `/api`. |
| **`tailwindcss`** | `^3.4.10` | `3.4.10` | CSS Utility Framework | `tailwind.config.js`, `index.css` | Utility-first styling, responsive breakpoints, class-based dark mode (`darkMode: 'class'`). |
| **`framer-motion`** | `^11.3.30` | `11.3.30` | Animation Engine | Hero carousels, page transitions | Smooth layout transitions, slide-over drawers, modal animations. |
| **`lucide-react`** | `^0.435.0` | `0.435.0` | Iconography | Entire UI | SVG tree-shakeable icons for shopping bag, search, user avatar, chevron, filters. |
| **`react-hot-toast`** | `^2.4.1` | `2.4.1` | Notification Toasts | Auth, cart, checkout, admin | Non-blocking alert notifications for coupon application, errors, and success feedback. |
| **`recharts`** | `^2.12.7` | `2.12.7` | Analytics Charting | `AnalyticsTab.jsx` in Admin | SVG charting library for rendering admin sales, revenue over time, and category breakdowns. |
| **`leaflet`** | `^1.9.4` | `1.9.4` | Interactive Maps | `ProductLocationMap.jsx` | Mobile-friendly interactive mapping engine for physical store locator and distribution nodes. |
| **`react-leaflet`** | `^4.2.1` | `4.2.1` | React Leaflet Wrapper | `ProductLocationMap.jsx` | React bindings for Leaflet map layers, markers, and popups. |
| **`react-confetti`** | `^6.1.0` | `6.1.0` | Celebration Canvas | `PurchaseSuccessPage.jsx` | Particle explosion animation on completed order checkout. |
| **`@stripe/stripe-js`** | `^4.3.0` | `4.3.0` | Stripe Client SDK | Legacy / Alternative checkout | Stripe elements integration library (secondary to primary Razorpay flow). |

### Frontend Build & Tooling (devDependencies)

| Package Name | Declared Version | Installed Version | Architectural Role | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **`vite`** | `^5.4.1` | `5.4.2` | Build Tool & Dev Server | Fast ES-module HMR (Hot Module Replacement) and Rollup production bundler. |
| **`@vitejs/plugin-react`** | `^4.3.1` | `4.3.1` | Vite React Plugin | Babel/Fast Refresh integration for React JSX. |
| **`postcss`** | `^8.4.41` | `8.4.41` | CSS Post-processor | Compiles Tailwind CSS utilities and vendor prefixes. |
| **`autoprefixer`** | `^10.4.20` | `10.4.20` | CSS Vendor Prefixing | Parses CSS and adds vendor prefixes using Can I Use data. |
| **`eslint`** | `^9.9.0` | `9.9.1` | Static Code Analysis | Linting and syntax verification. |
| **`eslint-plugin-react`** | `^7.35.0` | `7.35.0` | React Lint Rules | Ensures React hooks and JSX best practices. |

---

## 3. Backend Technology Stack

The backend is built as an Express.js REST application in Node.js (ES Module format), applying the Controller-Service-Route design pattern.

### Backend Dependencies

| Package Name | Declared Version | Installed Version | Architectural Role | Where Used | Why Selected & Component Dependency |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`express`** | `^4.19.2` | `4.19.2` | Web API Framework | `backend/server.js`, all routes | Lightweight HTTP server, robust routing, middleware chaining pipeline. |
| **`mongoose`** | `^8.5.3` | `8.5.3` | MongoDB Object Data Modeling (ODM) | `backend/models/*`, controllers | Schema enforcement, document validation, middleware hooks, query builder. |
| **`jsonwebtoken`** | `^9.0.2` | `9.0.2` | JWT Token Generation & Verification | `auth.controller.js`, `auth.middleware.js` | Stateless authentication tokens (`accessToken`: 15m, `refreshToken`: 7d) signed with HMAC-SHA256. |
| **`bcryptjs`** | `^2.4.3` | `2.4.3` | Password Hashing | `user.model.js`, `auth.controller.js` | Pure JavaScript implementation of bcrypt with 10 salt rounds for secure password storage. |
| **`cookie-parser`** | `^1.4.6` | `1.4.6` | HTTP Cookie Parser | `server.js`, `auth.middleware.js` | Parses cookies from `req.headers.cookie` to read `accessToken` and `refreshToken`. |
| **`dotenv`** | `^16.4.5` | `16.4.5` | Environment Configuration | `server.js`, configuration files | Loads process environment variables from `.env` into `process.env`. |
| **`cors`** | `^2.8.6` | `2.8.6` | Cross-Origin Resource Sharing | `server.js` | Configures origin whitelisting (`localhost:5173`, `localhost:5000`) and credentials allowance. |
| **`helmet`** | `^8.3.0` | `8.3.0` | HTTP Header Security | `server.js` | Hardens server against common web vulnerabilities (X-Frame-Options, DNS prefetch, HSTS). |
| **`express-rate-limit`** | `^8.7.1` | `8.7.1` | Rate Limiting Middleware | `server.js`, `auth.route.js` | Mitigates brute-force credential stuffing (100 general / 15 recovery requests per 15 mins). |
| **`nodemailer`** | `^10.2.1` | `10.2.1` | SMTP Email Transport | `services/email.service.js` | Dispatches transactional verification links, password resets, and order confirmations via Gmail/custom SMTP. |
| **`razorpay`** | `^2.9.8` | `2.9.8` | Official Razorpay Node SDK | `lib/razorpay.js`, `payment.controller.js` | Generates Razorpay payment orders in INR currency (amount in paise) and handles payment lifecycle. |
| **`stripe`** | `^16.8.0` | `16.8.0` | Stripe Node SDK | `lib/stripe.js`, `payment.controller.js` | Alternative credit card / international payment gateway checkout session creation. |
| **`ioredis`** | `^5.4.1` | `5.4.1` | High-Performance Redis Client | `lib/redis.js` | Connects to Redis cluster/standalone for caching featured products and session refresh tokens with graceful fallback. |
| **`cloudinary`** | `^2.4.0` | `2.4.0` | Cloud Media Storage SDK | `lib/cloudinary.js`, product/review controllers | Uploads, transforms, and optimizes product images and user-uploaded review photographs. |
| **`multer`** | `^2.5.0` | `2.5.0` | Multipart Form-Data Parser | File upload routes | Memory storage buffering for multi-image uploads before Cloudinary dispatch. |
| **`libphonenumber-js`** | `^1.13.15` | `1.13.15` | International Phone Formatting | `services/sms.service.js`, addresses | Validates and normalizes customer telephone numbers into international E.164 standard (+91...). |

### Backend Development Tooling (devDependencies)

| Package Name | Declared Version | Installed Version | Architectural Role | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **`nodemon`** | `^3.1.4` | `3.1.4` | Process Monitor | Watches backend file changes and automatically restarts the Node.js process during development. |

---

## 4. Database, Cache & External Infrastructure

| Service / Infrastructure Component | Configured Provider / Technology | Target / Verified Version | Verification Method | Operational Fallback Implemented |
| :--- | :--- | :--- | :--- | :--- |
| **Local Database Engine** | MongoDB Community Server | `v8.2.2.0` | `C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe` | Verified locally installed executable |
| **Remote Database Cluster**| MongoDB Atlas (Cloud) | *Cloud Managed Cluster* (Atlas v7/v8) | `MONGO_URI` in `.env` | Automatic fallback to local instance `mongodb://127.0.0.1:27017/ecommerce` if Atlas IP is restricted |
| **In-Memory Cache** | Upstash Redis (Cloud) | *Not verifiable from source code (Cloud Managed Service)* | `UPSTASH_REDIS_URL` in `.env` | Graceful degradation: logs error and falls back to direct MongoDB queries if Redis is offline |
| **Media & Asset CDN** | Cloudinary v2 | Cloudinary REST API | API configured via `CLOUDINARY_API_KEY` | Direct HTTPS CDN image rendering with default fallback placeholders |
| **Primary Payment Gateway** | Razorpay Standard Checkout | REST API v1 | Key ID / Key Secret verified in `payment.controller.js` | HMAC-SHA256 signature verification; mock test validation modes available |
| **Secondary Payment Gateway** | Stripe Checkout | Stripe API 2024-06-20 | Key configured in `lib/stripe.js` | Optional secondary checkout route |
| **Logistics & Courier Service** | Shiprocket Fulfillment API | Shiprocket REST API v2 | API credentials in `shiprocket.service.js` | Algorithmic PIN code distance check and automated free delivery for orders $\ge$ ₹1,999 |
| **Transactional Email Provider** | Gmail SMTP (Nodemailer) | TLS / Port 465 or 587 | Configured in `email.service.js` | Detailed audit record persisted to `EmailLog` collection even if SMTP fails |

---

## 5. Architectural Clarifications & Status Boundaries

1. **Authentication Boundary**: Fully verified as pure email/password with email verification links. Google OAuth and Phone OTP SMS aggregators are completely removed from active dependencies.
2. **Seller / Multi-Vendor Boundary**: The repository contains **no seller models, no seller routes, and no seller controllers**. Seller marketplace functionality is formally categorized as an unbuilt, planned future enhancement.
3. **Chunk Splitting Optimization**: Vite production builds compile the client into a single bundle exceeding 500 kB (1,517 kB uncompressed; 393 kB gzip). Dynamic imports (`React.lazy`) are recommended for future optimization.
