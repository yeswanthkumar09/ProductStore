# LUXESTORE — Project Limitations & Future Scope

> **Academic Rigor**: Factual separation of verified current-state boundaries from proposed architectural enhancements.  
> **Source Verification**: Codebase audit of `mern-ecommerce`.

---

## 1. Verified Current Architectural Limitations

The following limitations have been verified through complete inspection of the application source code and runtime testing:

### 1.1 Single-Tenant Administrative Paradigm (Unified Admin)
- **Current State**: The codebase enforces a two-tier RBAC system (`"customer"` and `"admin"`). While schema models contain hooks for merchant data, there is no standalone multi-vendor seller portal. All catalog ingestion, coupon creation, inventory restocking, and order dispatches are conducted through the unified store administrator dashboard.
- **Impact**: Independent external third-party merchants cannot register, maintain their own private inventory, or manage their own order disbursements without administrative intervention.

### 1.2 Frontend Chunk Size & Code Splitting Optimization
- **Current State**: Vite compiles the frontend client into a single primary vendor bundle (`dist/assets/index-DJ1aBAYC.js` at 1,517 kB uncompressed; 393 kB gzip).
- **Impact**: While Vite HMR provides instant local development updates, mobile clients on low-bandwidth cellular connections download the entire UI library upfront rather than loading pages on-demand.

### 1.3 Permissive Content Security Policy (CSP)
- **Current State**: In `backend/server.js`, Helmet is initialized with `app.use(helmet({ contentSecurityPolicy: false }))`.
- **Impact**: CSP is disabled to allow Leaflet OpenStreetMap tiles, Cloudinary media assets, and external Razorpay checkout scripts to render without header conflicts. A fine-tuned CSP whitelist would provide superior defense against hypothetical cross-site injection attacks.

### 1.4 Single-Node Caching Architecture
- **Current State**: Redis caching (`lib/redis.js`) utilizes `ioredis` against a single Redis endpoint (`UPSTASH_REDIS_URL`).
- **Impact**: If Redis is offline, the system gracefully degrades to querying MongoDB directly. However, it lacks a multi-node cluster or an automated Pub/Sub cache invalidation bus when multiple Express server instances are load-balanced.

### 1.5 Synchronous In-Process Transactional Email Dispatch
- **Current State**: Nodemailer executes email transfers synchronously or near-synchronously within the request-response thread or unmanaged promises.
- **Impact**: While audit records are logged to `EmailLog`, high-volume email dispatches during flash sale spikes could introduce slight latency without a dedicated message queue (e.g., BullMQ or RabbitMQ).

---

## 2. Proposed Future Enhancements (Academic Roadmap)

The following roadmap outlines the strategic evolutionary milestones for transitioning LUXESTORE into an enterprise multi-region platform:

### 2.1 Multi-Vendor Marketplace Architecture
- **Objective**: Introduce a third distinct actor (`role: "seller"`).
- **Architecture**:
  - Independent Seller Portal (`/seller-dashboard`) for product catalog submissions.
  - Automated payout splitting via Razorpay Route API (allocating merchant sales revenue while retaining platform commissions).
  - Multi-warehouse pickup support allowing different origin postal codes for Shiprocket courier dispatch.

### 2.2 Route-Level Code Splitting & Progressive Web App (PWA)
- **Objective**: Reduce initial bundle weight to < 150 kB and enable offline browsing.
- **Architecture**:
  - Replace static page imports in `App.jsx` with `React.lazy()` and React `<Suspense>` boundaries.
  - Integrate `vite-plugin-pwa` with a Service Worker caching static assets and catalog previews via CacheStorage API.
  - Implement Web Push API for out-of-stock restock alerts and flash sale notifications.

### 2.3 AI-Powered Hyper-Personalized Recommendation Engine
- **Objective**: Move beyond categorical recommendations to deep neural collaborative filtering.
- **Architecture**:
  - Ingest customer browsing histories, wishlist entries, and purchase patterns into a vector embedding database (e.g., Pinecone or MongoDB Atlas Vector Search).
  - Deploy a lightweight Python FastAPI microservice utilizing cosine similarity to recommend bespoke couture ensembles ("Complete the Look").

### 2.4 Asynchronous Message Queue for Transactional Tasks
- **Objective**: Decouple email dispatch, image processing, and invoice generation from HTTP threads.
- **Architecture**:
  - Integrate **BullMQ** backed by Redis.
  - Workers process email jobs, retry failed SMTP handshakes exponentially, and upload image transformations in background queues.

### 2.5 Cross-Platform Mobile Application (React Native)
- **Objective**: Deliver native iOS and Android experiences.
- **Architecture**:
  - Build a React Native client reusing the existing 15 Zustand stores and Axios API contracts without altering the Express backend.

