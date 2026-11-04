import express from "express";
import { rateLimit } from "express-rate-limit";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
	checkoutSuccess,
	createCheckoutSession,
	createRazorpayOrder,
	verifyRazorpayPayment,
	handleRazorpayWebhook,
	getRazorpayConfig,
} from "../controllers/payment.controller.js";

const router = express.Router();

// Rate limiter for payment creation & verification attempts
const paymentRateLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100,
	message: { error: "Too many payment requests from this IP, please try again later." },
	standardHeaders: true,
	legacyHeaders: false,
});

// Razorpay Standard Checkout Routes
router.get("/config", getRazorpayConfig);
router.get("/razorpay-key", getRazorpayConfig);
router.post("/create-order", protectRoute, paymentRateLimiter, createRazorpayOrder);
router.post("/verify", protectRoute, paymentRateLimiter, verifyRazorpayPayment);
router.post("/webhook", handleRazorpayWebhook);

// Stripe Checkout Routes (Preserved for backwards compatibility)
router.post("/create-checkout-session", protectRoute, createCheckoutSession);
router.post("/checkout-success", protectRoute, checkoutSuccess);

export default router;
