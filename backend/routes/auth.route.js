import express from "express";
import { rateLimit } from "express-rate-limit";
import {
	login,
	logout,
	signup,
	verifyEmail,
	resendVerification,
	forgotPassword,
	resetPassword,
	refreshToken,
	getProfile,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

const authRateLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 mins
	max: 100,
	standardHeaders: true,
	legacyHeaders: false,
	message: { message: "Too many authentication requests from this IP. Please try again after 15 minutes." },
});

const recoveryRateLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 15,
	standardHeaders: true,
	legacyHeaders: false,
	message: { message: "Too many verification or recovery requests. Please try again later." },
});

// Registration & Email Verification
router.post("/signup", authRateLimiter, signup);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", recoveryRateLimiter, resendVerification);

// Login & Session Management
router.post("/login", authRateLimiter, login);
router.post("/logout", logout);
router.post("/refresh-token", refreshToken);

// Password Recovery
router.post("/forgot-password", recoveryRateLimiter, forgotPassword);
router.post("/reset-password", recoveryRateLimiter, resetPassword);

// Profile
router.get("/profile", protectRoute, getProfile);

export default router;
