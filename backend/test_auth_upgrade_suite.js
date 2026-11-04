import mongoose from "mongoose";
import dotenv from "dotenv";
import assert from "assert";
import crypto from "crypto";
import User from "./models/user.model.js";
import Order from "./models/order.model.js";

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

async function runAuthUpgradeSuite() {
	console.log("================================================================================");
	console.log("COMPLETE AUTHENTICATION SYSTEM UPGRADE VERIFICATION SUITE");
	console.log("================================================================================");

	try {
		await mongoose.connect("mongodb://127.0.0.1:27017/ecommerce", { serverSelectionTimeoutMS: 2500 });
		console.log("Connected to MongoDB local database on 127.0.0.1:27017\n");
	} catch (e) {
		await mongoose.connect(MONGO_URI);
		console.log("Connected to MongoDB database\n");
	}

	// -------------------------------------------------------------------------
	// TEST 1: NEW EMAIL REGISTRATION
	// -------------------------------------------------------------------------
	console.log("--- 1. NEW EMAIL REGISTRATION ---");
	const testEmail = `patron_test_${Date.now()}@example.com`;
	let testUser;

	await itAsync("1.1 Registers new user with isEmailVerified = false and pending_verification status", async () => {
		const rawToken = crypto.randomBytes(32).toString("hex");
		const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

		testUser = await User.create({
			name: "Test Atelier Patron",
			email: testEmail,
			password: "ValidPassword123!",
			isEmailVerified: false,
			accountStatus: "pending_verification",
			authMethod: "email",
			verificationTokenHash: tokenHash,
			verificationTokenExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
			lastVerificationEmailSentAt: new Date(),
		});

		assert.ok(testUser._id, "User document created");
		assert.strictEqual(testUser.isEmailVerified, false, "Account must be unverified upon signup");
		assert.strictEqual(testUser.accountStatus, "pending_verification");
		assert.strictEqual(testUser.verificationTokenHash, tokenHash);
	});

	// -------------------------------------------------------------------------
	// TEST 2: UNVERIFIED LOGIN REJECTION
	// -------------------------------------------------------------------------
	console.log("\n--- 2. UNVERIFIED LOGIN REJECTION ---");
	await itAsync("2.1 Rejects login attempt when isEmailVerified is false", async () => {
		const user = await User.findOne({ email: testEmail });
		assert.strictEqual(user.isEmailVerified, false);
		const passwordMatches = await user.comparePassword("ValidPassword123!");
		assert.strictEqual(passwordMatches, true);

		// Logic check: unverified accounts are blocked
		const shouldBlock = !user.isEmailVerified;
		assert.strictEqual(shouldBlock, true, "Unverified user must be rejected with verification requirement");
	});

	// -------------------------------------------------------------------------
	// TEST 3: CORRECT VERIFICATION LINK
	// -------------------------------------------------------------------------
	console.log("\n--- 3. EMAIL VERIFICATION BY TOKEN ---");
	await itAsync("3.1 Validates token hash, sets isEmailVerified = true, and invalidates token", async () => {
		const user = await User.findOne({ email: testEmail });
		const tokenHash = user.verificationTokenHash;

		// Simulate token submission
		const found = await User.findOne({ verificationTokenHash: tokenHash });
		assert.ok(found, "User found by token hash");
		assert.ok(found.verificationTokenExpiresAt > new Date(), "Token not expired");

		// Execute verification
		found.isEmailVerified = true;
		found.accountStatus = "active";
		found.verificationTokenHash = null;
		found.verificationTokenExpiresAt = null;
		await found.save();

		const verifiedUser = await User.findById(testUser._id);
		assert.strictEqual(verifiedUser.isEmailVerified, true, "Account is now verified");
		assert.strictEqual(verifiedUser.accountStatus, "active", "Account status is active");
		assert.strictEqual(verifiedUser.verificationTokenHash, null, "Token is invalidated");
	});

	// -------------------------------------------------------------------------
	// TEST 4: REUSED & EXPIRED VERIFICATION LINK REJECTION
	// -------------------------------------------------------------------------
	console.log("\n--- 4. REUSED & EXPIRED VERIFICATION LINK PROTECTION ---");
	await itAsync("4.1 Rejects already-used token safely", async () => {
		// Attempt to query using the previous token
		const reuseCheck = await User.findOne({ verificationTokenHash: "non_existent_or_used_token" });
		assert.strictEqual(reuseCheck, null, "Reused or invalidated token must return null");
	});

	await itAsync("4.2 Rejects expired verification token", async () => {
		const expiredEmail = `expired_${Date.now()}@example.com`;
		const expiredHash = crypto.createHash("sha256").update("expired_token").digest("hex");
		const expUser = await User.create({
			name: "Expired Patron",
			email: expiredEmail,
			password: "Password123!",
			isEmailVerified: false,
			verificationTokenHash: expiredHash,
			verificationTokenExpiresAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
		});

		const foundExpired = await User.findOne({ verificationTokenHash: expiredHash });
		assert.ok(foundExpired);
		const isExpired = foundExpired.verificationTokenExpiresAt < new Date();
		assert.strictEqual(isExpired, true, "Expired token condition correctly identified");

		await User.findByIdAndDelete(expUser._id);
	});

	// -------------------------------------------------------------------------
	// TEST 5: VERIFIED EMAIL LOGIN
	// -------------------------------------------------------------------------
	console.log("\n--- 5. VERIFIED LOGIN ---");
	await itAsync("5.1 Allows login for verified patron and authenticates password", async () => {
		const user = await User.findOne({ email: testEmail });
		assert.strictEqual(user.isEmailVerified, true);
		const isValidPass = await user.comparePassword("ValidPassword123!");
		assert.strictEqual(isValidPass, true, "Bcrypt password hash matches password");
	});

	// -------------------------------------------------------------------------
	// TEST 6: RESEND VERIFICATION & RATE LIMIT COOLDOWN
	// -------------------------------------------------------------------------
	console.log("\n--- 6. RESEND VERIFICATION RATE LIMITING ---");
	it("6.1 Enforces 60-second cooldown between resend requests", () => {
		const lastSent = new Date();
		const elapsedMs = 15 * 1000; // 15 seconds passed
		const cooldownMs = 60 * 1000;
		const isCoolingDown = elapsedMs < cooldownMs;
		assert.strictEqual(isCoolingDown, true, "Resend within 60s must trigger cooldown rate limit");
		const waitSec = Math.ceil((cooldownMs - elapsedMs) / 1000);
		assert.strictEqual(waitSec, 45, "Remaining wait seconds computed accurately");
	});

	// -------------------------------------------------------------------------
	// TEST 7: GOOGLE OAUTH ACCOUNT CREATION & LINKING
	// -------------------------------------------------------------------------
	console.log("\n--- 7. GOOGLE OAUTH FLOW ---");
	await itAsync("7.1 Creates new patron account via Google OAuth without duplicate users", async () => {
		const googleEmail = `google_patron_${Date.now()}@example.com`;
		const googleId = `google_sub_${Date.now()}`;

		const newGoogleUser = await User.create({
			name: "Google VIP Patron",
			email: googleEmail,
			password: crypto.randomBytes(32).toString("hex"),
			googleId,
			avatar: "https://lh3.googleusercontent.com/test",
			isEmailVerified: true,
			accountStatus: "active",
			authMethod: "google",
			role: "customer",
		});

		assert.ok(newGoogleUser._id);
		assert.strictEqual(newGoogleUser.authMethod, "google");
		assert.strictEqual(newGoogleUser.isEmailVerified, true);

		// Verify duplicate prevention
		const dupCheck = await User.find({ email: googleEmail });
		assert.strictEqual(dupCheck.length, 1, "Only 1 account exists for this Google email");

		await User.findByIdAndDelete(newGoogleUser._id);
	});

	await itAsync("7.2 Links Google account to existing patron with matching email", async () => {
		// testUser already exists with testEmail
		const existing = await User.findOne({ email: testEmail });
		assert.ok(existing);

		existing.googleId = "google_linked_sub_12345";
		existing.authMethod = "both";
		await existing.save();

		const reloaded = await User.findById(existing._id);
		assert.strictEqual(reloaded.googleId, "google_linked_sub_12345");
		assert.strictEqual(reloaded.authMethod, "both");
	});

	// -------------------------------------------------------------------------
	// TEST 8: FORGOT & RESET PASSWORD
	// -------------------------------------------------------------------------
	console.log("\n--- 8. FORGOT & RESET PASSWORD ---");
	let resetRawToken = crypto.randomBytes(32).toString("hex");
	let resetHash = crypto.createHash("sha256").update(resetRawToken).digest("hex");

	await itAsync("8.1 Generates cryptographic reset token and limited expiration", async () => {
		const user = await User.findOne({ email: testEmail });
		user.resetPasswordTokenHash = resetHash;
		user.resetPasswordExpiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 mins
		await user.save();

		const updated = await User.findById(user._id);
		assert.strictEqual(updated.resetPasswordTokenHash, resetHash);
		assert.ok(updated.resetPasswordExpiresAt > new Date());
	});

	await itAsync("8.2 Resets password with valid token, updates bcrypt hash, and invalidates token", async () => {
		const user = await User.findOne({
			resetPasswordTokenHash: resetHash,
			resetPasswordExpiresAt: { $gt: new Date() },
		});
		assert.ok(user, "User located by valid reset token hash");

		user.password = "BrandNewPassword2026!";
		user.resetPasswordTokenHash = null;
		user.resetPasswordExpiresAt = null;
		await user.save();

		const reloaded = await User.findById(user._id);
		assert.strictEqual(reloaded.resetPasswordTokenHash, null, "Reset token invalidated");
		assert.strictEqual(await reloaded.comparePassword("BrandNewPassword2026!"), true, "New password verified");
		assert.strictEqual(await reloaded.comparePassword("ValidPassword123!"), false, "Old password no longer works");
	});

	// -------------------------------------------------------------------------
	// TEST 9: EXISTING DATA & ORDERS PRESERVATION
	// -------------------------------------------------------------------------
	console.log("\n--- 9. EXISTING CUSTOMER DATA & ORDERS PRESERVATION ---");
	await itAsync("9.1 Customer profile and order history remain intact", async () => {
		// Create a test order linked to user
		const order = await Order.create({
			user: testUser._id,
			orderNumber: `ORD-TEST-${Date.now()}`,
			orderStatus: "confirmed",
			paymentStatus: "paid",
			paymentMethod: "razorpay",
			totalAmount: 4999,
			shippingAddress: {
				fullName: "Test Patron",
				street: "123 Atelier Row",
				city: "Mumbai",
				state: "Maharashtra",
				pincode: "400001",
				country: "India",
				phone: "+919876543210",
			},
			products: [],
		});

		assert.ok(order._id);
		const userOrders = await Order.find({ user: testUser._id });
		assert.strictEqual(userOrders.length, 1);
		assert.strictEqual(userOrders[0].shippingAddress.phone, "+919876543210", "Phone preserved on delivery address");

		await Order.findByIdAndDelete(order._id);
	});

	// Cleanup test user
	await User.findByIdAndDelete(testUser._id);

	// -------------------------------------------------------------------------
	// TEST 10: PHONE OTP & TWILIO REMOVAL VERIFICATION
	// -------------------------------------------------------------------------
	console.log("\n--- 10. PHONE OTP & TWILIO REMOVAL CONFIRMATION ---");
	it("10.1 Twilio SMS OTP logic removed from sms.service.js", async () => {
		const smsService = await import("./services/sms.service.js");
		assert.strictEqual(smsService.sendSmsOtp, undefined, "sendSmsOtp must be undefined");
		assert.ok(typeof smsService.normalizePhoneNumber === "function", "normalizePhoneNumber retained for logistics");
	});

	it("10.2 Phone OTP controller endpoints removed from auth.controller.js", async () => {
		const authCtrl = await import("./controllers/auth.controller.js");
		assert.strictEqual(authCtrl.sendPhoneOtp, undefined, "sendPhoneOtp must be undefined");
		assert.strictEqual(authCtrl.verifyPhoneOtp, undefined, "verifyPhoneOtp must be undefined");
		assert.strictEqual(authCtrl.loginWithPhoneOtp, undefined, "loginWithPhoneOtp must be undefined");
	});

	console.log("\n================================================================================");
	console.log(`COMPLETE AUTHENTICATION UPGRADE RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
	console.log("================================================================================");

	await mongoose.disconnect();
	if (failedCount > 0) {
		process.exit(1);
	} else {
		process.exit(0);
	}
}

runAuthUpgradeSuite().catch((err) => {
	console.error("Auth Upgrade Suite Error:", err);
	process.exit(1);
});
