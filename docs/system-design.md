# LUXESTORE — System Design Document (SDD)

> **Document Class**: Architectural & Detailed System Design Specification  
> **Target Audience**: Academic Defense Panel, Software Architects, Full-Stack Engineers  
> **Application**: LUXESTORE Haute Atelier E-Commerce Web Application  
> **Status**: Verified Against Live Implementation (November 2026)

---

## 3.1 System Overview

### 3.1.1 Introduction & Problem Context
LUXESTORE is an enterprise-grade luxury e-commerce web platform engineered using the MERN stack. High-end apparel retail demands exacting standards: high-resolution editorial photography, complex multi-dimensional inventory (variants defined by size, color, SKU, and physical dimensions), reliable checkout verification, transparent purchase-verified ratings, and real-time courier serviceability checks.

### 3.1.2 Major Capabilities
- **Curated Storefront**: Dynamic editorial hero carousel, campaign slides, category collections, and sales showcases.
- **Intelligent Product Catalog**: Multi-variant SKU management, stock tracking, color swatches, dynamic size guides, and visual location mapping.
- **Deterministic Delivery**: Live courier serviceability engine with postal code checks, estimated delivery windows, and automated free delivery for orders $\ge$ ₹1,999.
- **Enterprise Checkout & Payments**: Razorpay INR payment order generation with server-side HMAC-SHA256 signature verification.
- **Hardened Email Authentication**: 32-byte cryptographically secure verification URL links, dual JWT HTTP-only cookies (`accessToken` 15m / `refreshToken` 7d), and 15-minute password reset links via Gmail SMTP.
- **Purchase-Verified Feedback**: Reviews can only be submitted by customers with verified, completed, and non-cancelled orders for that specific item.

---

## 3.2 High-Level Architecture (3-Tier MERN Architecture)

```mermaid
graph TD
    subgraph ClientTier ["Presentation Tier (Browser Client)"]
        UI["React 18 SPA (Vite Bundler)"]
        State["Zustand Micro-Stores (Cart, Auth, Address, UI)"]
        Axios["Axios HTTP Client (withCredentials: true)"]
        UI --> State
        State --> Axios
    end

    subgraph APITier ["Application / API Tier (Express.js on Node.js)"]
        Server["Express.js Server (Port 5000)"]
        SecMiddleware["Security Layer (Helmet, CORS Whitelist, Auth Rate-Limiter)"]
        AuthMiddleware["JWT Middleware (protectRoute, adminRoute, optionalAuth)"]
        Router["22 Route Modules (/api/*)"]
        Controllers["24 Business Logic Controllers"]
        Services["Core Services (Email, Shiprocket Logistics, SMS Normalizer)"]

        Server --> SecMiddleware
        SecMiddleware --> Router
        Router --> AuthMiddleware
        AuthMiddleware --> Controllers
        Controllers --> Services
    end

    subgraph DataTier ["Data & Caching Tier"]
        Redis["Redis Cache (Featured Products & Refresh Tokens)"]
        Mongo["MongoDB Database (23 Mongoose Models)"]
        LocalMongoFallback["Local MongoDB Fallback (127.0.0.1:27017)"]

        Controllers -->|Cache Read/Write| Redis
        Controllers -->|ODM Queries| Mongo
        Mongo -.->|Network Fallback| LocalMongoFallback
    end

    subgraph ExternalTier ["External Integration Services"]
        Razorpay["Razorpay Payment Gateway (Order & Signature Verification)"]
        Shiprocket["Shiprocket Logistics API (Serviceability & Courier Routing)"]
        SMTP["Gmail SMTP Transporter (Transactional Emails)"]
        Cloudinary["Cloudinary Media CDN (Image Storage & Optimization)"]

        Controllers -->|HMAC-SHA256| Razorpay
        Services -->|REST API v2| Shiprocket
        Services -->|TLS Nodemailer| SMTP
        Controllers -->|Image Upload| Cloudinary
    end

    Axios <==>|HTTPS / JSON REST API| Server
```

---

## 3.3 Low-Level Design (LLD)

### 3.3.1 Architectural Pattern: Controller-Service-Model
The application enforces strict separation of concerns:
1. **Routes (`/backend/routes/`)**: Map URI patterns and HTTP verbs to middleware pipelines and controller actions.
2. **Middleware (`/backend/middleware/`)**: Perform request interception:
   - `protectRoute`: Extracts `req.cookies.accessToken`, decodes userId, validates against database, and injects `req.user`.
   - `adminRoute`: Checks `req.user.role === 'admin'`.
   - `optionalAuth`: Gracefully populates `req.user` without rejecting unauthenticated guests.
3. **Controllers (`/backend/controllers/`)**: Parse request parameters/body, execute business validation, perform calculations, and return standard JSON responses `{ success, data, message }`.
4. **Services (`/backend/services/`)**: Encapsulate complex integrations (e.g., Shiprocket token management, Nodemailer templates, phone number normalization).
5. **Models (`/backend/models/`)**: Define Mongoose schemas with type safety, validations, default values, and indexes.

### 3.3.2 API Request Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Client as React Client (Zustand)
    participant Server as Express Server
    participant RateLimit as express-rate-limit
    participant HelmetCors as Helmet & CORS
    participant Router as API Router
    participant Auth as protectRoute Middleware
    participant Controller as Business Controller
    participant DB as MongoDB / Mongoose

    Client->>Server: HTTP Request with Cookies
    Server->>HelmetCors: Apply Security Headers & Origin Check
    HelmetCors->>RateLimit: Check Rate Limit Bucket
    RateLimit->>Router: Match Route Path (/api/orders)
    Router->>Auth: Verify JWT accessToken from Cookie
    Auth->>DB: Query User by Decoded userId
    DB-->>Auth: User Record Found
    Auth->>Controller: req.user attached, invoke handler
    Controller->>DB: Perform Atomic Query / Mutation
    DB-->>Controller: Return Model Documents
    Controller-->>Client: HTTP 200 JSON Response
```

---

## 3.4 Data Flow Diagrams (DFDs)

### Level 0 DFD: Context-Level Diagram

```mermaid
graph TD
    User(["Customer / Guest"])
    Admin(["Store Administrator"])
    System[["LUXESTORE E-Commerce System"]]
    PaymentGW(["Razorpay Payment Gateway"])
    Logistics(["Shiprocket Courier Partner"])
    MailServer(["Gmail SMTP Server"])

    User -->|Credentials, Orders, Cart, Reviews| System
    System -->|Product Catalog, Invoices, Delivery Status| User

    Admin -->|Product CRUD, Category, Coupon Rules, CMS| System
    System -->|Sales Analytics, Customer Records, Reports| Admin

    System -->|Order Amount, Currency, Receipts| PaymentGW
    PaymentGW -->|Payment ID, Signature, Verification| System

    System -->|Delivery Pincodes, Order Dimensions| Logistics
    Logistics -->|Serviceability, Courier ETA, Tracking ID| System

    System -->|Verification Links, Reset Links, Invoices| MailServer
    MailServer -->|Dispatch Status, Message ID| System
```

### Level 1 DFD: Subsystem Decomposition

```mermaid
graph TD
    Customer(["Customer"])
    P1["1.0 Authentication & Session Management"]
    P2["2.0 Catalog & Search Engine"]
    P3["3.0 Cart & Wishlist Processor"]
    P4["4.0 Coupon & Discount Evaluator"]
    P5["5.0 Checkout & Payment Engine"]
    P6["6.0 Logistics & Delivery Verifier"]

    D1[("Users Store")]
    D2[("Products Store")]
    D3[("Coupons Store")]
    D4[("Orders Store")]
    D5[("Addresses Store")]

    Customer -->|Login / Signup / Reset| P1
    P1 <-->|Read / Write Credentials| D1

    Customer -->|Search / Filter Categories| P2
    P2 <-->|Read Catalog & Variants| D2

    Customer -->|Add to Cart / Save Item| P3
    P3 <-->|Sync User Cart| D1

    Customer -->|Apply Promo Code| P4
    P4 <-->|Validate Rules & Min Order| D3

    Customer -->|Submit Order| P5
    P5 <-->|Calculate Subtotal & Taxes| D2
    P5 <-->|Save Final Order| D4

    Customer -->|Select Delivery Pincode| P6
    P6 <-->|Fetch Saved Pincodes| D5
```

### Level 2 DFD: Coupon Validation & Checkout Flow

```mermaid
graph TD
    CartData["Cart Items, Quantities & Product Categories"]
    InputCode["Entered Coupon Code (e.g. WELCOME10 or FASHION15)"]
    ValidateCode{"Is Code Active & Not Expired?"}
    CheckMinOrder{"Subtotal >= minOrderAmount? (e.g. ₹999 or ₹1,499)"}
    CheckCategory{"Matches Eligible Categories? (Storewide vs Apparel)"}
    CalcDiscount["Calculate Percentage Discount (Apply maxDiscountCap)"]
    Reject["Return Rejection Reason & Eligible Shortfall"]
    Apply["Return New Subtotal & Discount Amount"]

    InputCode --> ValidateCode
    ValidateCode -->|No| Reject
    ValidateCode -->|Yes| CheckMinOrder
    CartData --> CheckMinOrder
    CheckMinOrder -->|No| Reject
    CheckMinOrder -->|Yes| CheckCategory
    CartData --> CheckCategory
    CheckCategory -->|No| Reject
    CheckCategory -->|Yes| CalcDiscount
    CalcDiscount --> Apply
```

---

## 3.5 UML Diagrams

### 3.5.1 Use Case Diagram

```mermaid
graph LR
    actorCustomer((Customer))
    actorAdmin((Administrator))

    subgraph StorefrontBoundary ["LUXESTORE System"]
        UC1["Register & Click Verification Link"]
        UC2["Log In & Manage Profile"]
        UC3["Browse Products with Color & Size Filters"]
        UC4["Verify Delivery Serviceability via Pincode"]
        UC5["Manage Cart & Wishlist"]
        UC6["Apply Coupon Codes (WELCOME10, FASHION15)"]
        UC7["Pay with Razorpay Standard Gateway"]
        UC8["Track Order Status & Shipments"]
        UC9["Submit Purchase-Verified Review"]
        UC10["Manage Products & Inventory SKUs"]
        UC11["Create Flash Sales & Promo Coupons"]
        UC12["Publish Editorial Slides & Announcements"]
        UC13["View Real-Time Sales Analytics"]
    end

    actorCustomer --> UC1
    actorCustomer --> UC2
    actorCustomer --> UC3
    actorCustomer --> UC4
    actorCustomer --> UC5
    actorCustomer --> UC6
    actorCustomer --> UC7
    actorCustomer --> UC8
    actorCustomer --> UC9

    actorAdmin --> UC10
    actorAdmin --> UC11
    actorAdmin --> UC12
    actorAdmin --> UC13
    actorAdmin --> UC2
```

### 3.5.2 Domain Class Diagram

```mermaid
classDiagram
    class User {
        +ObjectId _id
        +String name
        +String email
        +String password
        +String role
        +Boolean isEmailVerified
        +String verificationTokenHash
        +Date verificationTokenExpiresAt
        +String resetPasswordToken
        +Date resetPasswordExpires
        +Array cartItems
        +comparePassword(candidate) Boolean
    }

    class Product {
        +ObjectId _id
        +String name
        +String description
        +Number price
        +Number originalPrice
        +String category
        +Array images
        +Array variants
        +Array colors
        +Number averageRating
        +Number totalReviews
        +Boolean isFeatured
    }

    class Variant {
        +ObjectId _id
        +String sku
        +String size
        +String color
        +Number stock
        +Number price
    }

    class Order {
        +ObjectId _id
        +ObjectId user
        +Array products
        +Number totalAmount
        +Number subtotal
        +Number discountAmount
        +Number deliveryFee
        +String orderStatus
        +String paymentStatus
        +String razorpayOrderId
        +String razorpayPaymentId
        +Object shippingAddress
        +Object trackingDetails
    }

    class Coupon {
        +ObjectId _id
        +String code
        +String discountType
        +Number discountPercentage
        +Number discountValue
        +Number maxDiscountCap
        +Number minOrderAmount
        +String scope
        +Array eligibleCategories
        +Date expirationDate
        +Boolean isActive
    }

    class Review {
        +ObjectId _id
        +ObjectId product
        +ObjectId user
        +Number rating
        +String comment
        +String title
        +Array images
        +Boolean isVerifiedPurchase
    }

    User "1" --> "*" Order : places
    User "1" --> "*" Review : writes
    Product "1" *-- "*" Variant : contains
    Order "*" --> "*" Product : contains
    Product "1" <-- "*" Review : evaluates
    Order "*" --> "0..1" Coupon : applies
```

### 3.5.3 Sequence Diagram: User Registration & Real Email Link Verification

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Shopper
    participant UI as React UI (SignUpPage)
    participant AuthAPI as /api/auth/signup
    participant UserDB as User Collection
    participant EmailSvc as email.service.js
    participant VerifyPage as VerifyEmailPage.jsx
    participant VerifyAPI as /api/auth/verify-email

    Customer->>UI: Enter Name, Email, Password
    UI->>AuthAPI: POST { name, email, password }
    AuthAPI->>UserDB: Check Existing Email
    UserDB-->>AuthAPI: Null (Email Free)
    AuthAPI->>AuthAPI: Generate 32-byte crypto token & SHA-256 hash
    AuthAPI->>UserDB: Save User { isEmailVerified: false, verificationTokenHash, expiresAt: +15m }
    AuthAPI->>EmailSvc: sendEmailVerificationLink(email, name, verificationUrl)
    EmailSvc-->>Customer: Deliver Email with URL link (.../verify-email?token=rawToken)
    AuthAPI-->>UI: HTTP 201 Created { message: "Verification link dispatched" }
    UI-->>Customer: Display "Check your inbox for the verification link"

    Customer->>Customer: Clicks verification link in Email
    Customer->>VerifyPage: Browser opens /verify-email?token=rawToken
    VerifyPage->>VerifyPage: Extract 'token' from URL query params
    VerifyPage->>VerifyAPI: POST { token: rawToken }
    VerifyAPI->>VerifyAPI: tokenHash = sha256(rawToken)
    VerifyAPI->>UserDB: findOne({ verificationTokenHash: tokenHash })
    UserDB-->>VerifyAPI: User Record Found & Not Expired
    VerifyAPI->>UserDB: Update { isEmailVerified: true, accountStatus: "active", verificationTokenHash: null }
    VerifyAPI-->>VerifyPage: HTTP 200 { success: true, message: "Email verified successfully" }
    VerifyPage-->>Customer: Render Success Screen & Redirect to /login
```

### 3.5.4 Sequence Diagram: Login & Cookie Session Generation

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Shopper
    participant UI as React UI (LoginPage)
    participant LoginAPI as /api/auth/login
    participant UserDB as User Collection
    participant Redis as Redis Cache

    Customer->>UI: Submit Email & Password
    UI->>LoginAPI: POST { email, password }
    LoginAPI->>UserDB: Query User by Normalized Email
    UserDB-->>LoginAPI: User Found
    LoginAPI->>LoginAPI: bcrypt.compare(password, user.password)
    alt Password Invalid
        LoginAPI-->>UI: HTTP 400 "Invalid email or password"
    else Password Valid but Not Verified
        LoginAPI-->>UI: HTTP 403 "Please verify your email"
    else Verification Valid
        LoginAPI->>LoginAPI: Sign JWT accessToken (15m) & refreshToken (7d)
        LoginAPI->>Redis: Cache refreshToken (7 Days TTL)
        LoginAPI-->>UI: HTTP 200 { user } + Set-Cookie HTTP-only
        UI-->>Customer: Authenticated Session Established
    end
```

### 3.5.5 Sequence Diagram: Live Coupon Validation Flow (WELCOME10 & FASHION15)

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Shopper
    participant UI as CartPage (OrderSummary)
    participant CouponAPI as /api/coupons/validate
    participant CouponDB as Coupon Collection
    participant ProdDB as Product Collection

    Customer->>UI: Enter Coupon Code (e.g., WELCOME10 or FASHION15) & Click APPLY
    UI->>CouponAPI: POST { code, cartItems: [...] }
    CouponAPI->>CouponDB: Find Coupon (Case-Insensitive Regex)
    alt Coupon Not Found or Inactive
        CouponDB-->>CouponAPI: Null or isActive: false
        CouponAPI-->>UI: HTTP 404 "Invalid coupon code"
    else Coupon Expired
        CouponAPI-->>UI: HTTP 400 "This coupon has expired"
    else Active Coupon Found
        CouponAPI->>ProdDB: Fetch real products & variants by IDs
        alt Coupon Scope == "category" (e.g., FASHION15)
            CouponAPI->>CouponAPI: Filter items matching eligibleCategories (apparel/suits/jeans)
            alt No qualifying category items found (e.g. Sunglasses)
                CouponAPI-->>UI: HTTP 400 "Coupon applies exclusively to apparel. Your cart does not contain qualifying items."
            end
        end
        CouponAPI->>CouponAPI: Sum eligible subtotal
        alt Eligible Subtotal < minOrderAmount (e.g. < ₹999 for WELCOME10 or < ₹1,499 for FASHION15)
            CouponAPI-->>UI: HTTP 400 "Minimum eligible purchase required"
        else Threshold Met
            CouponAPI->>CouponAPI: discount = Math.min((eligibleSubtotal * pct) / 100, maxDiscountCap)
            CouponAPI-->>UI: HTTP 200 { isValid: true, discountAmount, eligibleSubtotal }
            UI-->>Customer: Update Order Summary with Applied Discount
        end
    end
```

### 3.5.6 Sequence Diagram: Checkout & Razorpay Payment Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Shopper
    participant UI as CartPage / Checkout
    participant PayAPI as /api/payments/razorpay-order
    participant RazorpaySDK as Razorpay Server Gateway
    participant CheckoutJS as Razorpay Checkout Modal (Client)
    participant VerifyAPI as /api/payments/verify-razorpay
    participant DB as MongoDB Orders & Inventory
    participant EmailSvc as email.service.js

    Customer->>UI: Click "PAY WITH RAZORPAY"
    UI->>PayAPI: POST { items, addressId, couponCode }
    PayAPI->>PayAPI: Calculate Server Subtotal, Delivery Fee & Discount
    PayAPI->>RazorpaySDK: orders.create({ amount: totalPaise, currency: "INR" })
    RazorpaySDK-->>PayAPI: Return { id: "order_xyz123", amount, currency }
    PayAPI-->>UI: Return Razorpay Order Details
    UI->>CheckoutJS: Open Razorpay Payment Sheet
    Customer->>CheckoutJS: Complete Payment (UPI / Card / NetBanking)
    CheckoutJS-->>UI: Return { razorpay_order_id, razorpay_payment_id, razorpay_signature }

    UI->>VerifyAPI: POST Payment Verification Payload
    VerifyAPI->>VerifyAPI: Compute HMAC-SHA256(order_id + "|" + payment_id, SECRET)
    alt Signature Matches
        VerifyAPI->>DB: Create Order Record (orderStatus: "processing", paymentStatus: "paid")
        VerifyAPI->>DB: Atomically Decrement Product Variant Stock
        VerifyAPI->>DB: Clear User Cart
        VerifyAPI->>EmailSvc: sendPaymentSuccessEmail & sendOrderConfirmationEmail
        VerifyAPI-->>UI: HTTP 200 { success: true, orderId }
        UI-->>Customer: Redirect to /purchase-success with Confetti
    else Signature Mismatch
        VerifyAPI-->>UI: HTTP 400 "Payment verification failed: Invalid signature"
    end
```

### 3.5.7 Sequence Diagram: Order Cancellation

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Shopper
    participant UI as OrderDetailPage
    participant OrderAPI as /api/orders/:id/cancel
    participant DB as MongoDB Order & Product
    participant EmailSvc as email.service.js

    Customer->>UI: Click "Cancel Order" & Provide Reason
    UI->>OrderAPI: POST /api/orders/:id/cancel { reason }
    OrderAPI->>DB: Query Order by ID and Verify Ownership (req.user._id)
    alt Order Already Dispatched / Delivered
        OrderAPI-->>UI: HTTP 400 "Order cannot be cancelled after dispatch"
    else Order Eligible for Cancellation
        OrderAPI->>DB: Update orderStatus = "cancelled"
        OrderAPI->>DB: Restore Product Variant Stock Quantities
        OrderAPI->>EmailSvc: sendOrderCancellationEmail(user.email, order)
        OrderAPI-->>UI: HTTP 200 { success: true, message: "Order cancelled" }
        UI-->>Customer: Display Cancellation Confirmation
    end
```

### 3.5.8 Activity Diagram: End-to-End Customer Purchase Workflow

```mermaid
graph TD
    Start([Customer Visits Storefront]) --> Browse[Browse Collections & Categories]
    Browse --> SelectProduct[Select Product & Open Detail Page]
    SelectProduct --> SelectVariant[Choose Color & Size Variant]
    SelectVariant --> CheckPincode{Verify Pincode Serviceability?}
    CheckPincode -->|Entered| QueryShiprocket[Query Shiprocket Serviceability API]
    QueryShiprocket --> ShowETA[Display Delivery Window & Partner]
    CheckPincode -->|Skipped| AddToCart[Add to Shopping Bag]
    ShowETA --> AddToCart

    AddToCart --> ViewCart[Navigate to Cart Page]
    ViewCart --> ApplyCoupon{Apply Promo Voucher?}
    ApplyCoupon -->|Yes| ValidateCoupon[Validate Minimum Order & Categories]
    ValidateCoupon --> ApplyDiscount[Recalculate Payable Total]
    ApplyCoupon -->|No| SelectAddress[Select / Create Shipping Address]
    ApplyDiscount --> SelectAddress

    SelectAddress --> CheckSubtotal{Is Subtotal >= ₹1,999?}
    CheckSubtotal -->|Yes| FreeDelivery[Delivery Fee = ₹0 FREE]
    CheckSubtotal -->|No| AddDeliveryFee[Add Delivery Fee e.g. ₹93.72]
    FreeDelivery --> InitiatePayment[Click Pay With Razorpay]
    AddDeliveryFee --> InitiatePayment

    InitiatePayment --> RzpModal[Open Razorpay Checkout Sheet]
    RzpModal --> CompletePayment{Transaction Successful?}
    CompletePayment -->|No| ShowFail[Show Payment Error Toast]
    ShowFail --> ViewCart
    CompletePayment -->|Yes| VerifySignature[Backend HMAC-SHA256 Signature Verification]
    VerifySignature --> CreateOrder[Persist Order, Decrement Stock & Clear Cart]
    CreateOrder --> SendEmail[Send Order Confirmation & Payment Invoice via SMTP]
    SendEmail --> SuccessPage([Display Purchase Success Page])
```

### 3.5.9 State Diagram: Order Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Pending: Customer Initiates Checkout
    Pending --> Processing: Payment Captured via Razorpay (Paid)
    Pending --> Failed: Payment Authorization Failed / Cancelled

    Processing --> Confirmed: Warehouse Admin Accepts Order
    Processing --> Cancelled: Customer Cancels (Stock Restored)

    Confirmed --> Shipped: Shiprocket Courier Dispatched (AWB Generated)
    Confirmed --> Cancelled: Pre-Dispatch Cancellation

    Shipped --> OutForDelivery: Local Hub Dispatches to Courier Rider
    OutForDelivery --> Delivered: Customer Receives Goods (OTP / Signature)
    OutForDelivery --> RTO: Delivery Failed (Return to Origin)

    Delivered --> ReturnRequested: Customer Initiates 7-Day Return
    ReturnRequested --> Returned: Goods Inspected & Restocked

    Cancelled --> [*]
    Failed --> [*]
    Returned --> [*]
    Delivered --> [*]
```

---

## 3.6 Architectural Design Decisions & Trade-offs

| Design Decision | Technology / Choice | Academic Justification & Trade-off Evaluation |
| :--- | :--- | :--- |
| **Full-Stack JavaScript (MERN)** | Node.js + Express + React | Eliminates context switching between client and server. Enables shared data contracts (JSON) across the entire application stack. |
| **Document Database** | MongoDB + Mongoose | Apparel products exhibit polymorphic attributes (e.g., shoe dimensions vs. coat chest measurements). MongoDB embedded arrays (`variants`, `colors`) enable subdocument querying without multi-table SQL joins. |
| **Client State Management** | Zustand | Avoids the heavy boilerplate of Redux and the unnecessary re-render penalties of React Context. Zustand micro-stores allow direct outside-React access. |
| **Session Security** | HTTP-Only Cookies (Dual JWT) | Mitigates Cross-Site Scripting (XSS) attacks by preventing JavaScript `document.cookie` reads. Short-lived 15m `accessToken` paired with 7-day `refreshToken`. |
| **Caching Layer** | Redis with Graceful Fallback | In-memory key-value caching prevents database spikes on popular categories while the try-catch wrapper guarantees zero downtime if Redis is unreachable. |
| **Media Delivery** | Cloudinary CDN | High-resolution editorial photography is hosted and dynamically transformed on an external edge CDN, preventing web server storage exhaustion. |
| **Seller Marketplace Architecture** | *Unimplemented / Planned* | Single-tenant store administration in current release; multi-vendor marketplace with automated split payouts is formally scheduled for future milestones. |
