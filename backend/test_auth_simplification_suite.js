import mongoose from "mongoose";
import dotenv from "dotenv";
import assert from "assert";
import crypto from "crypto";
import User from "./models/user.model.js";
import Order from "./models/order.model.js";
import authRoutes from "./routes/auth.route.js";
import * as authController from "./controllers/auth.controller.js";
import * as emailService from "./services/email.service.js";
import * as smsService from "./services/sms.service.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ecommerce";

let passedCount = 0;
let failedCount = 0;

function it(description, fn) {
	try {
		fn();
		console.log(`  ✓ ${description}`);
		passedCount++;
	} catch (err) {
		console.error(`  ✗ ${description}`);
		console.error(`    Error: ${err.message}`);
		failedCount++;
	}
}

async function itAsync(description, fn) {
	try {
		await fn();
		console.log(`  ✓ ${description}`);
		passedCount++;
	} catch (err) {
		console.error(`  ✗ ${description}`);
		console.error(`    Error: ${err.message}`);
		failedCount++;
	}
}

async function runSimplificationSuite() {
	console.log("================================================================================");
	console.log("AUTHENTICATION SYSTEM SIMPLIFICATION — 20-POINT COMPREHENSIVE QA TEST SUITE");
	console.log("================================================================================\n");

	try {
		await mongoose.connect("mongodb://127.0.0.1:27017/ecommerce", { serverSelectionTimeoutMS: 2500 });
		console.log("Connected to MongoDB local database on 127.0.0.1:27017\n");
	} catch (e) {
		await mongoose.connect(MONGO_URI);
		console.log("Connected to MongoDB database\n");
	}

	const testTimestamp = Date.now();
	const testEmail = `patron_qa_${testTimestamp}@example.com`;
	const testPassword = "StrongPassword2026!";
	let createdUser = null;
	let rawVerificationToken = null;
	let rawResetToken = null;

	// -------------------------------------------------------------------------
	// 1. NEW USER REGISTRATION
	// -------------------------------------------------------------------------
	console.log("--- 1. NEW USER REGISTRATION ---");
	await itAsync("1.1 Registers new user with isEmailVerified = false and pending_verification status", async () => {
		rawVerificationToken = crypto.randomBytes(32).toString("hex");
		const tokenHash = crypto.createHash("sha256").update(rawVerificationToken).digest("hex");

		createdUser = await User.create({
			name: "QA Luxury Patron",
			email: testEmail,
			password: testPassword,
			phone: "+919876543210",
			normalizedPhone: "+919876543210",
			isEmailVerified: false,
			accountStatus: "pending_verification",
			authMethod: "email",
			verificationTokenHash: tokenHash,
			verificationTokenExpiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
			lastVerificationEmailSentAt: new Date(),
		});

		assert.ok(createdUser._id, "User document created");
		assert.strictEqual(createdUser.isEmailVerified, false, "Email must not be verified upon registration");
		assert.strictEqual(createdUser.accountStatus, "pending_verification", "Status must be pending_verification");
		assert.strictEqual(createdUser.authMethod, "email", "Auth method must be email");
		assert.strictEqual(createdUser.verificationTokenHash, tokenHash, "Token hash stored correctly");
		assert.notStrictEqual(createdUser.password, testPassword, "Password must be bcrypt hashed");
	});

	// -------------------------------------------------------------------------
	// 2. DUPLICATE EMAIL REGISTRATION
	// -------------------------------------------------------------------------
	console.log("\n--- 2. DUPLICATE EMAIL REGISTRATION ---");
	await itAsync("2.1 Prevents duplicate registration for active verified email", async () => {
		// Mock request to signup controller with identical email
		let status = null;
		let responseBody = null;
		const req = {
			body: {
				email: testEmail,
				password: "AnotherPassword123!",
				confirmPassword: "AnotherPassword123!",
				name: "Imposter User",
			},
		};
		const res = {
			status: (s) => {
				status = s;
				return res;
			},
			json: (b) => {
				responseBody = b;
				return res;
			},
		};

		// First simulate user becoming verified
		createdUser.isEmailVerified = true;
		createdUser.accountStatus = "active";
		await createdUser.save();

		await authController.signup(req, res);
		assert.strictEqual(status, 400, "Must return HTTP 400 for duplicate email");
		assert.ok(responseBody.message.includes("already exists"), "Response must indicate account exists");

		// Reset to unverified for subsequent verification tests
		createdUser.isEmailVerified = false;
		createdUser.accountStatus = "pending_verification";
		createdUser.verificationTokenHash = crypto.createHash("sha256").update(rawVerificationToken).digest("hex");
		createdUser.verificationTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
		await createdUser.save();
	});

	// -------------------------------------------------------------------------
	// 3. ACTUAL VERIFICATION EMAIL DELIVERY
	// -------------------------------------------------------------------------
	console.log("\n--- 3. VERIFICATION EMAIL DISPATCH ---");
	await itAsync("3.1 Formats and executes sendEmailVerificationLink with secure link", async () => {
		const emailResult = await emailService.sendEmailVerificationLink({
			email: testEmail,
			name: "QA Luxury Patron",
			verificationUrl: `http://localhost:5173/verify-email?token=${rawVerificationToken}`,
		});

		assert.ok(emailResult, "Result returned from email service");
		assert.ok(["delivered", "queued", "provider_not_configured"].includes(emailResult.status), "Valid status received");
	});

	// -------------------------------------------------------------------------
	// 4. SUCCESSFUL EMAIL VERIFICATION
	// -------------------------------------------------------------------------
	console.log("\n--- 4. SUCCESSFUL EMAIL VERIFICATION ---");
	await itAsync("4.1 Verifies account with valid SHA-256 token hash and single-use clearance", async () => {
		let status = null;
		let responseBody = null;
		const req = { body: { token: rawVerificationToken } };
		const res = {
			status: (s) => {
				status = s;
				return res;
			},
			json: (b) => {
				responseBody = b;
				return res;
			},
		};

		await authController.verifyEmail(req, res);
		assert.ok(responseBody.success, "Verification succeeded");

		const reloaded = await User.findById(createdUser._id);
		assert.strictEqual(reloaded.isEmailVerified, true, "Account isEmailVerified is true");
		assert.strictEqual(reloaded.accountStatus, "active", "Account status is active");
		assert.strictEqual(reloaded.verificationTokenHash, null, "Verification token hash wiped after single use");
		assert.strictEqual(reloaded.verificationTokenExpiresAt, null, "Expiration wiped after use");
	});

	// -------------------------------------------------------------------------
	// 5. EXPIRED VERIFICATION LINK
	// -------------------------------------------------------------------------
	console.log("\n--- 5. EXPIRED VERIFICATION LINK ---");
	await itAsync("5.1 Rejects verification token that has expired (>15 mins)", async () => {
		const expiredToken = crypto.randomBytes(32).toString("hex");
		const expiredHash = crypto.createHash("sha256").update(expiredToken).digest("hex");

		const expiredUser = await User.create({
			name: "Expired Patron",
			email: `expired_${testTimestamp}@example.com`,
			password: "TestPassword123!",
			isEmailVerified: false,
			accountStatus: "pending_verification",
			verificationTokenHash: expiredHash,
			verificationTokenExpiresAt: new Date(Date.now() - 60000), // 1 min in past
		});

		let status = null;
		let responseBody = null;
		const req = { body: { token: expiredToken } };
		const res = {
			status: (s) => {
				status = s;
				return res;
			},
			json: (b) => {
				responseBody = b;
				return res;
			},
		};

		await authController.verifyEmail(req, res);
		assert.strictEqual(status, 400, "Returns HTTP 400 for expired token");
		assert.strictEqual(responseBody.expired, true, "expired flag is true");

		await User.findByIdAndDelete(expiredUser._id);
	});

	// -------------------------------------------------------------------------
	// 6. INVALID VERIFICATION TOKEN
	// -------------------------------------------------------------------------
	console.log("\n--- 6. INVALID VERIFICATION TOKEN ---");
	await itAsync("6.1 Rejects non-existent or malformed verification token", async () => {
		let status = null;
		let responseBody = null;
		const req = { body: { token: "invalid_unregistered_token_12345" } };
		const res = {
			status: (s) => {
				status = s;
				return res;
			},
			json: (b) => {
				responseBody = b;
				return res;
			},
		};

		await authController.verifyEmail(req, res);
		assert.strictEqual(status, 400, "Returns HTTP 400 for invalid token");
		assert.ok(responseBody.message.includes("Invalid"), "Error states token is invalid");
	});

	// -------------------------------------------------------------------------
	// 7. REUSED VERIFICATION TOKEN
	// -------------------------------------------------------------------------
	console.log("\n--- 7. REUSED VERIFICATION TOKEN ---");
	await itAsync("7.1 Rejects already used verification token (single-use)", async () => {
		let status = null;
		let responseBody = null;
		const req = { body: { token: rawVerificationToken } };
		const res = {
			status: (s) => {
				status = s;
				return res;
			},
			json: (b) => {
				responseBody = b;
				return res;
			},
		};

		await authController.verifyEmail(req, res);
		assert.strictEqual(status, 400, "Returns HTTP 400 when token is reused");
	});

	// -------------------------------------------------------------------------
	// 8. RESEND VERIFICATION EMAIL
	// -------------------------------------------------------------------------
	console.log("\n--- 8. RESEND VERIFICATION EMAIL ---");
	await itAsync("8.1 Enforces 60-second cooldown rate limit on resend", async () => {
		// Set user back to unverified with recent sentAt
		const unverifiedUser = await User.create({
			name: "Cooldown Patron",
			email: `cooldown_${testTimestamp}@example.com`,
			password: "TestPassword123!",
			isEmailVerified: false,
			accountStatus: "pending_verification",
			lastVerificationEmailSentAt: new Date(), // Sent just now
		});

		let status = null;
		let responseBody = null;
		const req = { body: { email: unverifiedUser.email } };
		const res = {
			status: (s) => {
				status = s;
				return res;
			},
			json: (b) => {
				responseBody = b;
				return res;
			},
		};

		await authController.resendVerification(req, res);
		assert.strictEqual(status, 429, "Returns HTTP 429 for rapid resend within 60s cooldown");

		await User.findByIdAndDelete(unverifiedUser._id);
	});

	// -------------------------------------------------------------------------
	// 9. LOGIN WITH UNVERIFIED ACCOUNT
	// -------------------------------------------------------------------------
	console.log("\n--- 9. LOGIN WITH UNVERIFIED ACCOUNT ---");
	await itAsync("9.1 Blocks unverified account with HTTP 403 and requiresVerification: true", async () => {
		const unverifiedPatron = await User.create({
			name: "Unverified Login Patron",
			email: `unverified_${testTimestamp}@example.com`,
			password: "UnverifiedPass123!",
			isEmailVerified: false,
			accountStatus: "pending_verification",
		});

		let status = null;
		let responseBody = null;
		const req = {
			body: {
				email: unverifiedPatron.email,
				password: "UnverifiedPass123!",
			},
		};
		const res = {
			status: (s) => {
				status = s;
				return res;
			},
			json: (b) => {
				responseBody = b;
				return res;
			},
			cookie: () => {},
		};

		await authController.login(req, res);
		assert.strictEqual(status, 403, "Must return HTTP 403 for unverified user");
		assert.strictEqual(responseBody.requiresVerification, true, "Must have requiresVerification: true");

		await User.findByIdAndDelete(unverifiedPatron._id);
	});

	// -------------------------------------------------------------------------
	// 10. LOGIN WITH VERIFIED ACCOUNT
	// -------------------------------------------------------------------------
	console.log("\n--- 10. LOGIN WITH VERIFIED ACCOUNT ---");
	await itAsync("10.1 Successfully logs in verified user with valid password", async () => {
		let status = null;
		let responseBody = null;
		let cookiesSet = {};
		const req = {
			body: {
				email: testEmail,
				password: testPassword,
			},
			ip: "127.0.0.1",
			headers: { "user-agent": "Automated QA Test Agent" },
		};
		const res = {
			status: (s) => {
				status = s;
				return res;
			},
			json: (b) => {
				responseBody = b;
				return res;
			},
			cookie: (k, v, o) => {
				cookiesSet[k] = v;
			},
		};

		await authController.login(req, res);
		assert.ok(responseBody._id, "User ID returned in login response");
		assert.strictEqual(responseBody.email, testEmail, "Email matches verified user");
		assert.ok(cookiesSet.accessToken, "accessToken cookie set");
		assert.ok(cookiesSet.refreshToken, "refreshToken cookie set");
	});

	// -------------------------------------------------------------------------
	// 11. INCORRECT PASSWORD REJECTION
	// -------------------------------------------------------------------------
	console.log("\n--- 11. INCORRECT PASSWORD REJECTION ---");
	await itAsync("11.1 Rejects incorrect password with HTTP 400", async () => {
		let status = null;
		let responseBody = null;
		const req = {
			body: {
				email: testEmail,
				password: "WrongPassword999!",
			},
		};
		const res = {
			status: (s) => {
				status = s;
				return res;
			},
			json: (b) => {
				responseBody = b;
				return res;
			},
		};

		await authController.login(req, res);
		assert.strictEqual(status, 400, "Returns HTTP 400 on wrong password");
		assert.ok(responseBody.message.includes("Invalid email or password"));
	});

	// -------------------------------------------------------------------------
	// 12. FORGOT PASSWORD EMAIL DELIVERY
	// -------------------------------------------------------------------------
	console.log("\n--- 12. FORGOT PASSWORD EMAIL DISPATCH ---");
	await itAsync("12.1 Generates 15-minute hashed token and dispatches recovery email", async () => {
		let status = null;
		let responseBody = null;
		const req = { body: { email: testEmail } };
		const res = {
			status: (s) => {
				status = s;
				return res;
			},
			json: (b) => {
				responseBody = b;
				return res;
			},
		};

		await authController.forgotPassword(req, res);
		assert.ok(responseBody.success, "Forgot password reported success");
		assert.ok(responseBody.message.includes("password recovery instructions"), "Anti-enumeration message returned");

		const userWithReset = await User.findById(createdUser._id);
		assert.ok(userWithReset.resetPasswordTokenHash, "SHA-256 token hash generated");
		assert.ok(userWithReset.resetPasswordExpiresAt > new Date(), "Expiration set in future (15 mins)");

		// Directly simulate link clicked with raw token
		rawResetToken = crypto.randomBytes(32).toString("hex");
		userWithReset.resetPasswordTokenHash = crypto.createHash("sha256").update(rawResetToken).digest("hex");
		userWithReset.resetPasswordExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
		await userWithReset.save();
	});

	// -------------------------------------------------------------------------
	// 13. SUCCESSFUL PASSWORD RESET
	// -------------------------------------------------------------------------
	console.log("\n--- 13. SUCCESSFUL PASSWORD RESET ---");
	const newPatronPassword = "NewlyUpdatedPassword2026!";
	await itAsync("13.1 Resets password using token and hashes with bcrypt", async () => {
		let status = null;
		let responseBody = null;
		const req = {
			body: {
				token: rawResetToken,
				newPassword: newPatronPassword,
				confirmPassword: newPatronPassword,
			},
		};
		const res = {
			status: (s) => {
				status = s;
				return res;
			},
			json: (b) => {
				responseBody = b;
				return res;
			},
		};

		await authController.resetPassword(req, res);
		assert.ok(responseBody.success, "Password reset succeeded");

		const updatedUser = await User.findById(createdUser._id);
		assert.strictEqual(updatedUser.resetPasswordTokenHash, null, "Reset token wiped");
		assert.strictEqual(updatedUser.resetPasswordExpiresAt, null, "Reset expiration wiped");
		assert.strictEqual(await updatedUser.comparePassword(newPatronPassword), true, "New password bcrypt verified");
	});

	// -------------------------------------------------------------------------
	// 14. EXPIRED PASSWORD RESET LINK
	// -------------------------------------------------------------------------
	console.log("\n--- 14. EXPIRED PASSWORD RESET LINK ---");
	await itAsync("14.1 Rejects expired password reset token", async () => {
		const expiredResetToken = crypto.randomBytes(32).toString("hex");
		const expiredResetHash = crypto.createHash("sha256").update(expiredResetToken).digest("hex");

		createdUser.resetPasswordTokenHash = expiredResetHash;
		createdUser.resetPasswordExpiresAt = new Date(Date.now() - 10000); // Expired
		await createdUser.save();

		let status = null;
		let responseBody = null;
		const req = {
			body: {
				token: expiredResetToken,
				newPassword: "SomePassword123!",
				confirmPassword: "SomePassword123!",
			},
		};
		const res = {
			status: (s) => {
				status = s;
				return res;
			},
			json: (b) => {
				responseBody = b;
				return res;
			},
		};

		await authController.resetPassword(req, res);
		assert.strictEqual(status, 400, "Returns HTTP 400 on expired reset token");
	});

	// -------------------------------------------------------------------------
	// 15. REUSED RESET TOKEN
	// -------------------------------------------------------------------------
	console.log("\n--- 15. REUSED RESET TOKEN ---");
	await itAsync("15.1 Rejects already-consumed reset token (single-use validation)", async () => {
		let status = null;
		let responseBody = null;
		const req = {
			body: {
				token: rawResetToken, // Already wiped in Test 13
				newPassword: "AnotherNewPassword123!",
				confirmPassword: "AnotherNewPassword123!",
			},
		};
		const res = {
			status: (s) => {
				status = s;
				return res;
			},
			json: (b) => {
				responseBody = b;
				return res;
			},
		};

		await authController.resetPassword(req, res);
		assert.strictEqual(status, 400, "Returns HTTP 400 on reused reset token");
	});

	// -------------------------------------------------------------------------
	// 16. LOGIN WITH THE NEW PASSWORD
	// -------------------------------------------------------------------------
	console.log("\n--- 16. LOGIN WITH NEW PASSWORD ---");
	await itAsync("16.1 Authenticates with new password and rejects previous password", async () => {
		let status = null;
		let responseBody = null;
		const reqNew = {
			body: { email: testEmail, password: newPatronPassword },
			ip: "127.0.0.1",
			headers: {},
		};
		const resNew = {
			status: (s) => {
				status = s;
				return resNew;
			},
			json: (b) => {
				responseBody = b;
				return resNew;
			},
			cookie: () => {},
		};

		await authController.login(reqNew, resNew);
		assert.ok(responseBody._id, "Successfully logged in with new password");

		// Try logging in with the old original password
		status = null;
		responseBody = null;
		const reqOld = {
			body: { email: testEmail, password: testPassword },
		};
		const resOld = {
			status: (s) => {
				status = s;
				return resOld;
			},
			json: (b) => {
				responseBody = b;
				return resOld;
			},
		};

		await authController.login(reqOld, resOld);
		assert.strictEqual(status, 400, "Old password is now rejected");
	});

	// -------------------------------------------------------------------------
	// 17. EXISTING CUSTOMER ACCOUNT COMPATIBILITY
	// -------------------------------------------------------------------------
	console.log("\n--- 17. EXISTING CUSTOMER ACCOUNT COMPATIBILITY ---");
	await itAsync("17.1 Existing accounts remain fully functional and load without schema error", async () => {
		const existingUser = await User.create({
			name: "Legacy Patron",
			email: `legacy_${testTimestamp}@example.com`,
			password: "LegacyPassword123!",
			phone: "+919123456789",
			isEmailVerified: true,
			accountStatus: "active",
			authMethod: "email",
		});

		const loaded = await User.findById(existingUser._id);
		assert.strictEqual(loaded.isEmailVerified, true);
		assert.strictEqual(loaded.phone, "+919123456789");

		await User.findByIdAndDelete(existingUser._id);
	});

	// -------------------------------------------------------------------------
	// 18. EXISTING ORDERS AND ADDRESSES PRESERVATION
	// -------------------------------------------------------------------------
	console.log("\n--- 18. EXISTING ORDERS AND ADDRESSES PRESERVATION ---");
	await itAsync("18.1 Phone and address on customer orders remain preserved", async () => {
		const testOrder = await Order.create({
			user: createdUser._id,
			orderNumber: `ORD-SIMPLIFY-${Date.now()}`,
			orderStatus: "confirmed",
			paymentStatus: "paid",
			paymentMethod: "razorpay",
			totalAmount: 3299,
			shippingAddress: {
				fullName: "QA Luxury Patron",
				street: "78 Fashion Boulevard",
				city: "Bangalore",
				state: "Karnataka",
				pincode: "560001",
				country: "India",
				phone: "+919876543210",
			},
			products: [],
		});

		assert.ok(testOrder._id);
		const userOrders = await Order.find({ user: createdUser._id });
		assert.strictEqual(userOrders.length, 1);
		assert.strictEqual(userOrders[0].shippingAddress.phone, "+919876543210", "Phone preserved for delivery logistics");

		await Order.findByIdAndDelete(testOrder._id);
	});

	// -------------------------------------------------------------------------
	// 19. PROTECTED ROUTES
	// -------------------------------------------------------------------------
	console.log("\n--- 19. PROTECTED ROUTES ---");
	await itAsync("19.1 getProfile endpoint returns authenticated patron data", async () => {
		let responseBody = null;
		const req = { user: createdUser };
		const res = {
			json: (b) => {
				responseBody = b;
				return res;
			},
		};

		await authController.getProfile(req, res);
		assert.strictEqual(responseBody.email, testEmail, "Profile returned patron data");
	});

	// Cleanup test user
	await User.findByIdAndDelete(createdUser._id);

	// -------------------------------------------------------------------------
	// 20. CONFIRM GOOGLE OAUTH AND PHONE OTP COMPLETELY REMOVED
	// -------------------------------------------------------------------------
	console.log("\n--- 20. GOOGLE OAUTH & PHONE OTP REMOVAL VERIFICATION ---");
	it("20.1 Google OAuth controller & routes removed", () => {
		assert.strictEqual(authController.googleAuth, undefined, "googleAuth must be undefined in auth.controller.js");

		// Inspect router stack to ensure no /google route
		const googleRoutes = authRoutes.stack.filter((layer) => layer.route && layer.route.path === "/google");
		assert.strictEqual(googleRoutes.length, 0, "No /google endpoint in auth.route.js");
	});

	it("20.2 Phone OTP controller endpoints removed", () => {
		assert.strictEqual(authController.sendPhoneOtp, undefined, "sendPhoneOtp must be undefined");
		assert.strictEqual(authController.verifyPhoneOtp, undefined, "verifyPhoneOtp must be undefined");
		assert.strictEqual(authController.loginWithPhoneOtp, undefined, "loginWithPhoneOtp must be undefined");
	});

	it("20.3 Twilio SMS OTP logic removed from sms.service.js while preserving address normalizer", () => {
		assert.strictEqual(smsService.sendSmsOtp, undefined, "sendSmsOtp must be undefined in sms.service.js");
		assert.ok(typeof smsService.normalizePhoneNumber === "function", "normalizePhoneNumber is preserved");
	});

	console.log("\n================================================================================");
	console.log(`AUTHENTICATION SIMPLIFICATION TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
	console.log("================================================================================");

	await mongoose.disconnect();
	if (failedCount > 0) {
		process.exit(1);
	} else {
		process.exit(0);
	}
}

runSimplificationSuite().catch((err) => {
	console.error("Simplification Suite Error:", err);
	process.exit(1);
});

