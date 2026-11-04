# LUXESTORE — Complete REST API Reference Manual

> **Base URL**: `http://localhost:5000/api` (Development) / `/api` (Production Reverse Proxy)  
> **Content-Type**: `application/json`  
> **Session Authentication**: Dual JSON Web Tokens (`accessToken` and `refreshToken`) stored in HTTP-Only Cookies.  
> **CORS Origin Whitelist**: `http://localhost:5173`, `http://localhost:5000`, `http://127.0.0.1:5173`, `http://127.0.0.1:5000`.

---

## 1. Authentication & Security Endpoints (`/api/auth`)

Rate limited via `express-rate-limit`: 100 general requests / 15 recovery requests per 15 minutes window in production.

### 1.1 Customer Registration
- **HTTP Method**: `POST`
- **Route**: `/api/auth/signup`
- **Access Level**: Public (Rate Limited)
- **Purpose**: Registers a new customer and dispatches a secure verification URL link containing a 32-byte cryptographic token.
- **Request Body**:
```json
{
  "name": "Alexandre Dumas",
  "email": "alexandre@example.com",
  "password": "SecretPassword123",
  "confirmPassword": "SecretPassword123",
  "phone": "+919876543210"
}
```
- **Success Response (201 Created)**:
```json
{
  "success": true,
  "message": "Registration successful! A verification link has been dispatched to your email address.",
  "email": "alexandre@example.com",
  "name": "Alexandre Dumas"
}
```
- **Error Responses**:
  - `400 Bad Request`: "Name, email, and password are required."
  - `400 Bad Request`: "Passwords do not match."
  - `400 Bad Request`: "Password must be at least 6 characters long."
  - `400 Bad Request`: "An account with this email already exists. Please sign in."
  - `502 Bad Gateway`: "Account created, but failed to deliver the verification email via SMTP. Please use Resend Verification."
- **Related Model**: `User`, `EmailLog`.

---

### 1.2 Verify Email Token Link
- **HTTP Method**: `POST`
- **Route**: `/api/auth/verify-email`
- **Access Level**: Public
- **Purpose**: Validates the 32-byte cryptographic token from the email URL link and activates the customer account.
- **Request Body**:
```json
{
  "token": "4f9d8a3e7b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e"
}
```
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Email verified successfully! Your account is now active and ready for access.",
  "email": "alexandre@example.com"
}
```
- **Error Responses**:
  - `400 Bad Request`: "Verification token is required."
  - `400 Bad Request`: "Invalid or already-used verification link. Please sign in or request a new verification link."
  - `400 Bad Request`: `{ "expired": true, "email": "...", "message": "This verification link has expired (15-minute window). Please request a fresh verification link." }`
- **Related Model**: `User`.

---

### 1.3 Resend Verification Email Link
- **HTTP Method**: `POST`
- **Route**: `/api/auth/resend-verification`
- **Access Level**: Public (Rate limited: 15 per 15 mins)
- **Request Body**:
```json
{
  "email": "alexandre@example.com"
}
```
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "A fresh verification link has been dispatched to your email address."
}
```

---

### 1.4 Customer Login
- **HTTP Method**: `POST`
- **Route**: `/api/auth/login`
- **Access Level**: Public (Rate limited: 100 per 15 mins)
- **Purpose**: Authenticates customer credentials and issues dual HTTP-only JWT cookies.
- **Request Body**:
```json
{
  "email": "alexandre@example.com",
  "password": "SecretPassword123"
}
```
- **Success Response (200 OK)**:
  - *Cookies Set*: `accessToken` (Max-Age: 15m), `refreshToken` (Max-Age: 7d).
```json
{
  "_id": "6724a1b2c3d4e5f6a7b8c9d0",
  "name": "Alexandre Dumas",
  "email": "alexandre@example.com",
  "role": "customer",
  "isEmailVerified": true
}
```
- **Error Responses**:
  - `400 Bad Request`: "Invalid email or password."
  - `403 Forbidden`: "Please verify your email address to log in."
- **Related Model**: `User`.

---

### 1.5 Customer Logout
- **HTTP Method**: `POST`
- **Route**: `/api/auth/logout`
- **Access Level**: Public / Authenticated
- **Purpose**: Clears `accessToken` and `refreshToken` cookies and purges the Redis session entry.
- **Success Response (200 OK)**:
```json
{
  "message": "Logged out successfully"
}
```

---

### 1.6 Request Password Reset Link
- **HTTP Method**: `POST`
- **Route**: `/api/auth/forgot-password`
- **Access Level**: Public (Rate limited: 15 per 15 mins)
- **Purpose**: Generates a 15-minute cryptographically secure reset token and emails a link.
- **Request Body**:
```json
{
  "email": "alexandre@example.com"
}
```
- **Success Response (200 OK)**:
```json
{
  "message": "Password reset link sent to your email"
}
```
- **Related Model**: `User`, `EmailLog`.

---

### 1.7 Complete Password Reset
- **HTTP Method**: `POST`
- **Route**: `/api/auth/reset-password`
- **Access Level**: Public (Rate limited: 15 per 15 mins)
- **Purpose**: Verifies reset token and updates password hash.
- **Request Body**:
```json
{
  "token": "4f9d8a3e7b1c...",
  "password": "NewStrongPassword2026"
}
```
- **Success Response (200 OK)**:
```json
{
  "message": "Password reset successfully"
}
```
- **Related Model**: `User`.

---

## 2. Product Catalog Endpoints (`/api/products`)

### 2.1 Get All Products with Filters
- **HTTP Method**: `GET`
- **Route**: `/api/products`
- **Access Level**: Public
- **Query Parameters**: `category`, `sort` (`price_asc`, `price_desc`, `newest`, `rating`), `minPrice`, `maxPrice`.
- **Success Response (200 OK)**: `{ "products": [ ... ] }`
- **Related Model**: `Product`.

### 2.2 Create Product (Admin Only)
- **HTTP Method**: `POST`
- **Route**: `/api/products`
- **Access Level**: Protected (`protectRoute`, `adminRoute`)
- **Success Response (201 Created)**: Returns created product document with Cloudinary image URLs.
- **Related Model**: `Product`.

### 2.3 Delete Product
- **HTTP Method**: `DELETE`
- **Route**: `/api/products/:id`
- **Access Level**: Protected (`protectRoute`, `adminRoute`)
- **Success Response (200 OK)**: `{ "message": "Product deleted successfully" }`

---

## 3. Cart & Bag Management Endpoints (`/api/cart`)

### 3.1 Get Current User Cart
- **HTTP Method**: `GET`
- **Route**: `/api/cart`
- **Access Level**: Protected (`protectRoute`)
- **Success Response (200 OK)**: Array of populated product items with chosen variants and quantities.

### 3.2 Add Item to Cart
- **HTTP Method**: `POST`
- **Route**: `/api/cart`
- **Access Level**: Protected (`protectRoute`)
- **Request Body**:
```json
{
  "productId": "6ae191b0a4519a125c6435cc",
  "variantId": "6ae191b0a4519a125c6435cd",
  "quantity": 1
}
```
- **Success Response (200 OK)**: Updated cart array.

---

## 4. Coupon & Voucher Endpoints (`/api/coupons`)

### 4.1 Validate Coupon Code
- **HTTP Method**: `POST`
- **Route**: `/api/coupons/validate`
- **Access Level**: Public / Authenticated (`optionalAuth`)
- **Purpose**: Strictly checks promo voucher against validity, category eligibility, and minimum purchase thresholds.
- **Live Tested Examples**:
  - `WELCOME10`: 10% off storewide, min order ₹999, max discount cap ₹1,500.
  - `FASHION15`: 15% off apparel categories, min order ₹1,499, max discount cap ₹2,000.
- **Request Body**:
```json
{
  "code": "WELCOME10",
  "cartItems": [
    {
      "productId": "6ae191b0a4519a125c6435cc",
      "price": 14999,
      "quantity": 1,
      "category": "suits"
    }
  ]
}
```
- **Success Response (200 OK)**:
```json
{
  "message": "Coupon \"WELCOME10\" applied successfully!",
  "code": "WELCOME10",
  "name": "Welcome Discount",
  "discountType": "percentage",
  "discountValue": 10,
  "discountPercentage": 10,
  "discountAmount": 1500,
  "maxDiscountCap": 1500,
  "eligibleSubtotal": 14999
}
```
- **Error Responses**:
  - `400 Bad Request`: "Coupon code is required"
  - `404 Not Found`: "Invalid coupon code"
  - `400 Bad Request`: "Coupon \"FASHION15\" applies exclusively to apparel... Your cart does not contain qualifying items."
  - `400 Bad Request`: "Minimum eligible purchase of ₹1,499 in qualifying items required for this coupon..."
- **Related Model**: `Coupon`, `Product`.

---

## 5. Checkout & Payment Endpoints (`/api/payments`)

### 5.1 Create Razorpay Standard Payment Order
- **HTTP Method**: `POST`
- **Route**: `/api/payments/razorpay-order`
- **Access Level**: Protected (`protectRoute`)
- **Purpose**: Calculates server-side subtotal, delivery fee (FREE if subtotal $\ge$ ₹1,999), and discount, and generates a Razorpay Order in paise.
- **Request Body**:
```json
{
  "products": [
    { "productId": "6ae191b0a4519a125c6435cc", "quantity": 1, "variantId": "6ae191b0a4519a125c6435cd" }
  ],
  "couponCode": "WELCOME10",
  "addressId": "6ae191b0a4519a125c6435ef"
}
```
- **Success Response (200 OK)**:
```json
{
  "id": "order_OkW1vJ2x9zL8mK",
  "amount": 1349900,
  "currency": "INR",
  "subtotal": 14999,
  "discountAmount": 1500,
  "deliveryFee": 0,
  "totalAmount": 13499
}
```
- **Related Model**: `Order`, `Product`, `Coupon`, `Address`.

---

### 5.2 Verify Razorpay Signature & Finalize Order
- **HTTP Method**: `POST`
- **Route**: `/api/payments/verify-razorpay`
- **Access Level**: Protected (`protectRoute`)
- **Purpose**: Computes HMAC-SHA256 signature to verify transaction authenticity, creates the confirmed order document, decrements variant inventory, and triggers email notifications.
- **Request Body**:
```json
{
  "razorpay_order_id": "order_OkW1vJ2x9zL8mK",
  "razorpay_payment_id": "pay_OkW2xY3z4a5b6c",
  "razorpay_signature": "a8f5c3b2e1d0f9a8b7c6d5e4f3a2b1...",
  "orderDetails": {
    "products": [...],
    "addressId": "6ae191b0a4519a125c6435ef",
    "couponCode": "WELCOME10"
  }
}
```
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Payment verified and order created successfully.",
  "orderId": "6ae191b0a4519a125c643600"
}
```
- **Error Responses**:
  - `400 Bad Request`: "Payment verification failed: Invalid cryptographic signature."
- **Related Model**: `Order`, `Product`, `User`, `EmailLog`.

---

## 6. Logistics & Serviceability Endpoints (`/api/serviceability`)

### 6.1 Check Postal Code Serviceability
- **HTTP Method**: `POST`
- **Route**: `/api/serviceability/check`
- **Access Level**: Public
- **Request Body**: `{ "deliveryPincode": "144411", "weightKg": 1.5 }`
- **Success Response (200 OK)**:
```json
{
  "serviceable": true,
  "pincode": "144411",
  "courierPartner": "Blue Dart Air",
  "estimatedDeliveryDays": 3,
  "estimatedDeliveryDate": "2026-11-06",
  "codAvailable": true,
  "source": "shiprocket"
}
```
- **Related Model**: `ServiceableLocation`, `WarehouseSetting`.

---

## 7. Purchase-Verified Review Endpoints (`/api/reviews`)

### 7.1 Submit Review
- **HTTP Method**: `POST`
- **Route**: `/api/reviews`
- **Access Level**: Protected (`protectRoute`)
- **Purpose**: Allows review submission only if the customer has purchased and paid for the item in an order marked `paid` or `captured`.
- **Request Body**:
```json
{
  "productId": "6ae191b0a4519a125c6435cc",
  "rating": 5,
  "title": "Impeccable Sartorial Craftsmanship",
  "comment": "The virgin wool drape and satin lapel finish rival Savile Row bespoke suits.",
  "images": ["https://res.cloudinary.com/.../customer_tuxedo.jpg"]
}
```
- **Success Response (201 Created)**: `{ "success": true, "review": { ... } }`
- **Error Response**: `403 Forbidden`: "You can only review products from paid and verified purchases."
- **Related Model**: `Review`, `Order`, `Product`.

---

## 8. Summary of All Mounted Route Groups (22 Groups)

| Route Group | Base URI | Router File | Primary Controller | Primary Responsibility |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `/api/auth` | `auth.route.js` | `auth.controller.js` | User onboarding, token verification links, session cookies |
| **Products** | `/api/products` | `product.route.js` | `product.controller.js` | Product catalog retrieval, search, variant stock |
| **Reviews** | `/api/reviews` | `review.route.js` | `review.controller.js` | Purchase-verified ratings and comments |
| **Categories** | `/api/categories` | `category.route.js` | `category.controller.js` | Apparel taxonomy management |
| **Cart** | `/api/cart` | `cart.route.js` | `cart.controller.js` | Server-synced shopping cart |
| **Coupons** | `/api/coupons` | `coupon.route.js` | `coupon.controller.js` | Promotional voucher validation |
| **Payments** | `/api/payments` | `payment.route.js` | `payment.controller.js` | Razorpay order generation & signature check |
| **Analytics** | `/api/analytics` | `analytics.route.js` | `analytics.controller.js` | Revenue, order counts, sales charts |
| **Users** | `/api/users` | `user.route.js` | `user.controller.js` | Customer profile, address book, wishlist |
| **Notifications**| `/api/notifications` | `notification.route.js` | `notification.controller.js`| Real-time alerts and stock updates |
| **Recommendations**|`/api/recommendations`|`recommendation.route.js`|`recommendation.controller.js`| Browsing history deduplication & related items |
| **Sales** | `/api/sales` | `sale.route.js` | `sale.controller.js` | Flash sale event scheduling |
| **Serviceability**| `/api/serviceability`| `serviceability.route.js`| `serviceability.controller.js`| PIN code courier check via Shiprocket |
| **Addresses** | `/api/addresses` | `address.route.js` | `address.controller.js` | Saved shipping addresses and free threshold check |
| **Admin Customers**|`/api/admin/customers`|`customer.route.js` | `customer.controller.js` | Admin customer CRM |
| **Shipping** | `/api/shipping` | `shipping.route.js` | `shipping.controller.js` | Shipment creation, courier assignment |
| **Orders** | `/api/orders` | `order.route.js` | `order.controller.js` | Order creation, tracking, cancellation |
| **Campaign Slides**|`/api/campaign-slides`|`campaignSlide.route.js`|`campaignSlide.controller.js`| Editorial hero carousel slides |
| **Announcements**| `/api/announcements` | `announcement.route.js` | `announcement.controller.js`| Marquee announcement banners |
| **Restock** | `/api/restock-subscriptions`|`restockSubscription.route.js`|`restockSubscription.controller.js`| Back-in-stock notification signups |
| **CMS** | `/api/cms` | `cms.route.js` | `cms.controller.js` | Brand editorial copy and policies |
| **Size Charts** | `/api/size-charts` | `sizeChart.route.js` | `sizeChart.controller.js` | Dynamic measurement sizing charts |
| **Support Tickets**|`/api/support-tickets`|`supportTicket.route.js`|`supportTicket.controller.js`| Customer care communication threads |
| **Newsletter** | `/api/newsletter` | `newsletter.route.js` | `newsletter.controller.js` | Email newsletter subscription |
