import crypto from "crypto";
import { redis } from "../lib/redis.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import jwt from "jsonwebtoken";
import {
	sendEmailVerificationLink,
	sendWelcomeEmail,
	sendPasswordResetEmail,
	sendPasswordChangedEmail,
	sendSignInAlertEmail,
} from "../services/email.service.js";
import { normalizePhoneNumber } from "../services/sms.service.js";

const generateTokens = (userId) => {
	const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
		expiresIn: "15m",
	});

	const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
		expiresIn: "7d",
	});

	return { accessToken, refreshToken };
};

const storeRefreshToken = async (userId, refreshToken) => {
	try {
		await redis.set(`refresh_token:${userId}`, refreshToken, "EX", 7 * 24 * 60 * 60); // 7 days
	} catch (err) {
		console.warn("Redis unavailable for refresh token storage:", err.message);
	}
};

const setCookies = (res, accessToken, refreshToken) => {
	const isProd = process.env.NODE_ENV === "production";
	res.cookie("accessToken", accessToken, {
		httpOnly: true,
		secure: isProd,
		sameSite: isProd ? "none" : "lax",
		maxAge: 15 * 60 * 1000, // 15 mins
	});
	res.cookie("refreshToken", refreshToken, {
		httpOnly: true,
		secure: isProd,
		sameSite: isProd ? "none" : "lax",
		maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
	});
};

const getClientUrl = () => {
	return process.env.CLIENT_URL || "http://localhost:5173";
};

// =========================================================================
// 1. REGISTRATION WITH EMAIL VERIFICATION LINK (PHASE 3)
// =========================================================================
export const signup = async (req, res) => {
	const { email, password, confirmPassword, name, phone } = req.body;

	try {
		if (!email || !password || !name) {
			return res.status(400).json({ message: "Name, email, and password are required." });
		}

		if (confirmPassword !== undefined && password !== confirmPassword) {
			return res.status(400).json({ message: "Passwords do not match." });
		}

		if (password.length < 6) {
			return res.status(400).json({ message: "Password must be at least 6 characters long." });
		}

		const normalizedEmail = email.trim().toLowerCase();
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(normalizedEmail)) {
			return res.status(400).json({ message: "Invalid email format. Please provide a valid email address." });
		}

		// Optional phone normalization for delivery/shipping records
		let normalizedPhoneVal = null;
		if (phone && phone.trim()) {
			const norm = normalizePhoneNumber(phone.trim());
			if (norm.isValid) {
				normalizedPhoneVal = norm.normalized;
			}
		}

		// Check if user already exists
		let user = await User.findOne({ email: normalizedEmail });

		if (user) {
			if (user.isEmailVerified) {
				return res.status(400).json({ message: "An account with this email already exists. Please sign in." });
			}
			// User exists but has not verified email — update details
			user.name = name.trim();
			user.password = password; // Will be hashed by pre-save hook
			if (normalizedPhoneVal) {
				user.phone = phone.trim();
				user.normalizedPhone = normalizedPhoneVal;
			}
		} else {
			// Create new unverified customer account
			user = new User({
				name: name.trim(),
				email: normalizedEmail,
				password,
				phone: phone ? phone.trim() : "",
				normalizedPhone: normalizedPhoneVal,
				isEmailVerified: false,
				accountStatus: "pending_verification",
				authMethod: "email",
				role: "customer",
			});
		}

		// Generate cryptographically secure random verification token (32 bytes)
		const rawToken = crypto.randomBytes(32).toString("hex");
		const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

		user.verificationTokenHash = tokenHash;
		user.verificationTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
		user.lastVerificationEmailSentAt = new Date();
		await user.save();

		// Dispatch verification email
		const verificationUrl = `${getClientUrl()}/verify-email?token=${rawToken}`;
		const emailResult = await sendEmailVerificationLink({
			email: normalizedEmail,
			name: user.name,
			verificationUrl,
		});

		if (!emailResult.success && emailResult.status === "failed") {
			console.error("[SMTP Delivery Error] Failed to send verification link:", emailResult.error);
			return res.status(502).json({
				success: false,
				message: "Account created, but failed to deliver the verification email via SMTP. Please use Resend Verification.",
			});
		}

		res.status(201).json({
			success: true,
			message: "Registration successful! A verification link has been dispatched to your email address.",
			email: normalizedEmail,
			name: user.name,
		});
	} catch (error) {
		console.error("Error in signup controller:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// =========================================================================
// 2. EMAIL VERIFICATION BY TOKEN (PHASE 4)
// =========================================================================
export const verifyEmail = async (req, res) => {
	try {
		const { token } = req.body;
		if (!token || typeof token !== "string") {
			return res.status(400).json({ message: "Verification token is required." });
		}

		const cleanToken = token.trim();
		const tokenHash = crypto.createHash("sha256").update(cleanToken).digest("hex");

		const user = await User.findOne({ verificationTokenHash: tokenHash });

		if (!user) {
			return res.status(400).json({
				message: "Invalid or already-used verification link. Please sign in or request a new verification link.",
			});
		}

		if (user.isEmailVerified) {
			user.verificationTokenHash = null;
			user.verificationTokenExpiresAt = null;
			await user.save();
			return res.json({
				success: true,
				alreadyVerified: true,
				message: "Your account is already verified! You can now sign in.",
			});
		}

		if (user.verificationTokenExpiresAt && new Date(user.verificationTokenExpiresAt) < new Date()) {
			return res.status(400).json({
				expired: true,
				email: user.email,
				message: "This verification link has expired (15-minute window). Please request a fresh verification link.",
			});
		}

		// Mark account as verified and active
		user.isEmailVerified = true;
		user.accountStatus = "active";
		user.verificationTokenHash = null;
		user.verificationTokenExpiresAt = null;
		await user.save();

		// Asynchronously send welcome email
		sendWelcomeEmail({ email: user.email, name: user.name }).catch((err) => {
			console.warn("Welcome email notice:", err.message);
		});

		res.json({
			success: true,
			message: "Email verified successfully! Your account is now active and ready for access.",
			email: user.email,
		});
	} catch (error) {
		console.error("Error in verifyEmail controller:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// =========================================================================
// 3. RESEND VERIFICATION EMAIL (PHASE 4)
// =========================================================================
export const resendVerification = async (req, res) => {
	try {
		const { email } = req.body;
		if (!email) {
			return res.status(400).json({ message: "Email address is required." });
		}

		const normalizedEmail = email.trim().toLowerCase();
		const user = await User.findOne({ email: normalizedEmail });

		// If user doesn't exist, return generic message to protect privacy
		if (!user) {
			return res.json({
				success: true,
				message: "If an unverified account with this email exists, a fresh verification link has been sent.",
			});
		}

		if (user.isEmailVerified) {
			return res.status(400).json({
				message: "This account has already been verified. Please sign in with your password.",
			});
		}

		// Rate limit cooldown (60 seconds between resends)
		if (user.lastVerificationEmailSentAt) {
			const elapsedMs = Date.now() - new Date(user.lastVerificationEmailSentAt).getTime();
			const cooldownMs = 60 * 1000;
			if (elapsedMs < cooldownMs) {
				const waitSec = Math.ceil((cooldownMs - elapsedMs) / 1000);
				return res.status(429).json({
					message: `Please wait ${waitSec} seconds before requesting another verification email.`,
				});
			}
		}

		// Generate fresh token
		const rawToken = crypto.randomBytes(32).toString("hex");
		const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

		user.verificationTokenHash = tokenHash;
		user.verificationTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
		user.lastVerificationEmailSentAt = new Date();
		await user.save();

		const verificationUrl = `${getClientUrl()}/verify-email?token=${rawToken}`;
		const emailResult = await sendEmailVerificationLink({
			email: normalizedEmail,
			name: user.name,
			verificationUrl,
		});

		if (!emailResult.success && emailResult.status === "failed") {
			return res.status(502).json({
				success: false,
				message: "Failed to dispatch verification email. Please check your SMTP configuration.",
			});
		}

		res.json({
			success: true,
			message: "A fresh verification link has been sent to your email address.",
		});
	} catch (error) {
		console.error("Error in resendVerification controller:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// =========================================================================
// 4. SECURE EMAIL & PASSWORD LOGIN (PHASE 5)
// =========================================================================
export const login = async (req, res) => {
	try {
		const { email, password } = req.body;

		if (!email || !password) {
			return res.status(400).json({ message: "Email and password are required." });
		}

		const normalizedEmail = email.trim().toLowerCase();
		const user = await User.findOne({ email: normalizedEmail });

		const isMatch = user ? await user.comparePassword(password) : false;

		if (!user || !isMatch) {
			return res.status(400).json({ message: "Invalid email or password." });
		}

		// Reject unverified accounts
		if (!user.isEmailVerified) {
			return res.status(403).json({
				requiresVerification: true,
				email: normalizedEmail,
				message: "Please verify your email address before signing in. Check your inbox for the verification link.",
			});
		}

		// Check account status
		if (user.accountStatus === "suspended") {
			return res.status(403).json({
				message: "Your account has been suspended. Please contact concierge support.",
			});
		}

		// Update login timestamp
		user.lastLoginAt = new Date();
		await user.save();

		// Record security alert
		try {
			await Notification.create({
				user: user._id,
				type: "login_alert",
				title: "New Sign-in Detected",
				message: `A sign-in to your account was recorded on ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST.`,
				link: "/profile",
			});
		} catch (notifErr) {}

		sendSignInAlertEmail({
			email: user.email,
			name: user.name,
			ipAddress: req.ip || req.headers["x-forwarded-for"] || "Localhost",
			userAgent: req.headers["user-agent"] || "Web Browser",
		}).catch((err) => console.warn("Sign-in alert email notice:", err.message));

		const { accessToken, refreshToken } = generateTokens(user._id);
		await storeRefreshToken(user._id, refreshToken);
		setCookies(res, accessToken, refreshToken);

		res.json({
			_id: user._id,
			name: user.name,
			email: user.email,
			role: user.role,
			phone: user.phone,
			avatar: user.avatar,
			isEmailVerified: user.isEmailVerified,
			authMethod: user.authMethod,
			message: "Signed in successfully!",
		});
	} catch (error) {
		console.error("Error in login controller:", error);
		res.status(500).json({ message: error.message });
	}
};

// =========================================================================
// 5. FORGOT PASSWORD BY EMAIL LINK (PHASE 6)
// =========================================================================
export const forgotPassword = async (req, res) => {
	try {
		const { email } = req.body;
		if (!email) {
			return res.status(400).json({ message: "Email is required." });
		}

		const normalizedEmail = email.trim().toLowerCase();
		const user = await User.findOne({ email: normalizedEmail });

		if (user) {
			// Cooldown rate limiting (60s between password reset requests)
			if (user.lastPasswordResetEmailSentAt) {
				const elapsedMs = Date.now() - new Date(user.lastPasswordResetEmailSentAt).getTime();
				if (elapsedMs < 60000) {
					const waitSec = Math.ceil((60000 - elapsedMs) / 1000);
					return res.status(429).json({
						message: `Please wait ${waitSec} seconds before requesting another password reset email.`,
					});
				}
			}

			// Generate 32-byte cryptographic token
			const rawResetToken = crypto.randomBytes(32).toString("hex");
			const tokenHash = crypto.createHash("sha256").update(rawResetToken).digest("hex");

			user.resetPasswordTokenHash = tokenHash;
			user.resetPasswordExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
			user.lastPasswordResetEmailSentAt = new Date();
			await user.save();

			const resetUrl = `${getClientUrl()}/reset-password?token=${rawResetToken}`;
			const emailResult = await sendPasswordResetEmail({
				email: normalizedEmail,
				name: user.name,
				resetUrl,
			});

			if (!emailResult.success && emailResult.status === "failed") {
				return res.status(502).json({
					success: false,
					message: "Failed to dispatch password recovery email via SMTP. Please try again later.",
				});
			}
		}

		// Always return identical generic message to prevent account enumeration
		res.json({
			success: true,
			message: "If an account matches that email address, password recovery instructions have been dispatched.",
		});
	} catch (error) {
		console.error("Error in forgotPassword:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// =========================================================================
// 6. RESET PASSWORD WITH TOKEN (PHASE 6)
// =========================================================================
export const resetPassword = async (req, res) => {
	try {
		const { token, newPassword, confirmPassword } = req.body;

		if (!token || !newPassword) {
			return res.status(400).json({
				message: "Reset token and new password are required.",
			});
		}

		if (confirmPassword !== undefined && newPassword !== confirmPassword) {
			return res.status(400).json({
				message: "Passwords do not match.",
			});
		}

		if (newPassword.length < 6) {
			return res.status(400).json({
				message: "Password must be at least 6 characters long.",
			});
		}

		const cleanToken = token.trim();
		const tokenHash = crypto.createHash("sha256").update(cleanToken).digest("hex");

		const user = await User.findOne({
			resetPasswordTokenHash: tokenHash,
			resetPasswordExpiresAt: { $gt: new Date() },
		});

		if (!user) {
			return res.status(400).json({
				message: "Password reset link is invalid or has expired. Please request a new link.",
			});
		}

		// Update password (pre-save hook hashes with bcrypt)
		user.password = newPassword;
		user.resetPasswordTokenHash = null;
		user.resetPasswordExpiresAt = null;
		await user.save();

		// Invalidate active session tokens in Redis
		try {
			await redis.del(`refresh_token:${user._id}`);
		} catch (e) {}

		// Send security confirmation email
		sendPasswordChangedEmail({ email: user.email, name: user.name }).catch((e) => {
			console.warn("Password changed email notice:", e.message);
		});

		res.json({
			success: true,
			message: "Password updated successfully! You may now sign in with your new password.",
		});
	} catch (error) {
		console.error("Error in resetPassword controller:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// =========================================================================
// 8. LOGOUT
// =========================================================================
export const logout = async (req, res) => {
	try {
		const refreshToken = req.cookies.refreshToken;
		if (refreshToken) {
			try {
				const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
				await redis.del(`refresh_token:${decoded.userId}`);
			} catch (err) {}
		}

		const isProd = process.env.NODE_ENV === "production";
		const clearOptions = {
			httpOnly: true,
			secure: isProd,
			sameSite: isProd ? "none" : "lax",
		};
		res.clearCookie("accessToken", clearOptions);
		res.clearCookie("refreshToken", clearOptions);
		res.json({ message: "Logged out successfully" });
	} catch (error) {
		console.error("Error in logout controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// =========================================================================
// 9. REFRESH TOKEN
// =========================================================================
export const refreshToken = async (req, res) => {
	try {
		const refreshToken = req.cookies.refreshToken;

		if (!refreshToken) {
			return res.status(401).json({ message: "No refresh token provided" });
		}

		const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
		let storedToken = null;
		try {
			storedToken = await redis.get(`refresh_token:${decoded.userId}`);
		} catch (e) {}

		if (storedToken && storedToken !== refreshToken) {
			return res.status(401).json({ message: "Invalid refresh token" });
		}

		const accessToken = jwt.sign({ userId: decoded.userId }, process.env.ACCESS_TOKEN_SECRET, {
			expiresIn: "15m",
		});

		const isProd = process.env.NODE_ENV === "production";
		res.cookie("accessToken", accessToken, {
			httpOnly: true,
			secure: isProd,
			sameSite: isProd ? "none" : "lax",
			maxAge: 15 * 60 * 1000,
		});

		res.json({ message: "Token refreshed successfully" });
	} catch (error) {
		console.error("Error in refreshToken controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// =========================================================================
// 10. PROFILE
// =========================================================================
export const getProfile = async (req, res) => {
	try {
		res.json(req.user);
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};
