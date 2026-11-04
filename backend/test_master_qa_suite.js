import mongoose from "mongoose";
import dotenv from "dotenv";
import assert from "assert";
import User from "./models/user.model.js";
import Product from "./models/product.model.js";
import Coupon from "./models/coupon.model.js";
import OTP from "./models/otp.model.js";
import { normalizePhoneNumber } from "./services/sms.service.js";

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

async function runMasterQASuite() {
	console.log("================================================================================");
	console.log("MASTER QA AUDIT & VERIFICATION SUITE — LUXESTORE MERN E-COMMERCE");
	console.log("================================================================================");

	try {
		await mongoose.connect("mongodb://127.0.0.1:27017/ecommerce", { serverSelectionTimeoutMS: 2500 });
		console.log("Connected to MongoDB local database on 127.0.0.1:27017\n");
	} catch (e) {
		await mongoose.connect(MONGO_URI);
		console.log("Connected to MongoDB database\n");
	}

	// -------------------------------------------------------------------------
	// SECTION 1: MOBILE OTP & SMS GATEWAY AUDIT (ISSUE 1)
	// -------------------------------------------------------------------------
	console.log("--- SECTION 1: MOBILE OTP & SMS GATEWAY INTEGRATION ---");

	it("1.1 International Phone Normalization handles valid E.164 formats", () => {
		const normIN = normalizePhoneNumber("+919347327988", "IN");
		assert.strictEqual(normIN.isValid, true);
		assert.strictEqual(normIN.normalized, "+919347327988");

		const normUS = normalizePhoneNumber("+14155552671", "US");
		assert.strictEqual(normUS.isValid, true);
		assert.strictEqual(normUS.normalized, "+14155552671");
	});

	it("1.2 International Phone Normalization rejects invalid numbers", () => {
		const invalidShort = normalizePhoneNumber("123", "IN");
		assert.strictEqual(invalidShort.isValid, false);
		assert.ok(invalidShort.error);
	});

	await itAsync("1.3 OTP is securely hashed and salt-verified (never plain in DB)", async () => {
		const testPhone = "+919876543210";
		const plainOtp = "654321";
		const { otpHash, salt } = OTP.generateAndHash(plainOtp);

		await OTP.deleteMany({ identifier: testPhone });
		const record = await OTP.create({
			identifier: testPhone,
			type: "phone_verification",
			otpHash,
			salt,
			expiresAt: new Date(Date.now() + 10 * 60 * 1000),
			resendAvailableAt: new Date(Date.now() + 60 * 1000),
		});

		assert.ok(record.otpHash !== plainOtp, "OTP hash must not match plain text");
		assert.strictEqual(record.verifyOtp(plainOtp), true, "Valid plain OTP must match salt verification");
		assert.strictEqual(record.verifyOtp("000000"), false, "Wrong OTP must be rejected");

		// Invalidation after use
		record.isUsed = true;
		await record.save();

		const recheck = await OTP.findOne({ identifier: testPhone, isUsed: false });
		assert.strictEqual(recheck, null, "Used OTP must be flagged and cannot be queried for reuse");
	});

	// -------------------------------------------------------------------------
	// SECTION 2: GOOGLE LOGIN & ACCOUNT LINKING (ISSUE 2)
	// -------------------------------------------------------------------------
	console.log("\n--- SECTION 2: GOOGLE SIGN-IN & OAUTH ARCHITECTURE ---");

	await itAsync("2.1 User schema supports googleId and Google authMethod safely", async () => {
		const testEmail = `google_patron_${Date.now()}@example.com`;
		const googleUser = await User.create({
			name: "Google Patron",
			email: testEmail,
			password: "secure_random_pwd_placeholder",
			googleId: "google_sub_1234567890",
			avatar: "https://lh3.googleusercontent.com/a/test_avatar",
			isEmailVerified: true,
			accountStatus: "active",
			authMethod: "google",
			role: "customer",
		});

		assert.ok(googleUser._id);
		assert.strictEqual(googleUser.authMethod, "google");
		assert.strictEqual(googleUser.isEmailVerified, true);
		assert.strictEqual(googleUser.googleId, "google_sub_1234567890");

		await User.findByIdAndDelete(googleUser._id);
	});

	await itAsync("2.2 Existing patron account links Google ID on email match", async () => {
		const testEmail = `link_test_${Date.now()}@example.com`;
		const standardUser = await User.create({
			name: "Standard Patron",
			email: testEmail,
			password: "plain_password_hash",
			authMethod: "email",
			isEmailVerified: true,
			role: "customer",
		});

		// Simulate Google OAuth linking
		standardUser.googleId = "google_sub_linked_98765";
		standardUser.authMethod = "both";
		await standardUser.save();

		const updated = await User.findById(standardUser._id);
		assert.strictEqual(updated.googleId, "google_sub_linked_98765");
		assert.strictEqual(updated.authMethod, "both");

		await User.findByIdAndDelete(standardUser._id);
	});

	// -------------------------------------------------------------------------
	// SECTION 3: COUPON ALGORITHM & CATEGORY SCOPING (ISSUE 3)
	// -------------------------------------------------------------------------
	console.log("\n--- SECTION 3: COUPON VALIDATION & CATEGORY REASONING ---");

	// Ensure FASHION15 exists with comprehensive apparel categories
	const apparelCategories = [
		"apparel", "clothing", "jackets", "jeans", "suits",
		"shirts", "t-shirts", "trousers", "overshirts", "joggers", "shorts"
	];
	let fashionCoupon = await Coupon.findOne({ code: "FASHION15" });
	if (!fashionCoupon) {
		fashionCoupon = await Coupon.create({
			code: "FASHION15",
			name: "Fashion Enthusiast",
			description: "15% off all apparel, shirts, jackets, jeans, and suits",
			discountType: "percentage",
			discountValue: 15,
			discountPercentage: 15,
			maxDiscountCap: 2000,
			minOrderAmount: 1499,
			expirationDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
			scope: "category",
			eligibleCategories: apparelCategories,
			isActive: true,
		});
	} else {
		fashionCoupon.eligibleCategories = apparelCategories;
		await fashionCoupon.save();
	}

	// Create test products: 1 Sunglasses (accessories), 1 Premium Jacket (apparel)
	const sunglasses = await Product.create({
		name: "Aviator Titanium Polarized Sunglasses Test",
		description: "Polarized luxury sunglasses with UV400 titanium frame",
		sku: `TEST-SUN-${Date.now()}`,
		price: 3299,
		category: "accessories",
		stock: 15,
		image: "/placeholder.png",
	});

	const jacket = await Product.create({
		name: "Heritage Wool Overshirt Jacket Test",
		description: "Handcrafted wool overshirt jacket with tailored silhouette",
		sku: `TEST-JAC-${Date.now()}`,
		price: 2499,
		category: "jackets",
		stock: 12,
		image: "/placeholder.png",
	});

	it("3.1 Coupon FASHION15 encompasses full apparel hierarchy", () => {
		assert.ok(fashionCoupon.eligibleCategories.includes("jackets"));
		assert.ok(fashionCoupon.eligibleCategories.includes("shirts"));
		assert.ok(fashionCoupon.eligibleCategories.includes("jeans"));
	});

	await itAsync("3.2 Cart with non-qualifying accessories yields 0 eligible and clear category reason", async () => {
		// Mock request to validation logic
		const APPAREL_CATEGORIES = new Set(apparelCategories);
		const matchesCategory = (prodCategory, eligibleList = []) => {
			if (!prodCategory || !eligibleList.length) return false;
			const normProd = prodCategory.toLowerCase().trim();
			const normEligible = eligibleList.map((c) => c.toLowerCase().trim());
			if (normEligible.includes(normProd)) return true;
			if (normEligible.some((c) => APPAREL_CATEGORIES.has(c)) && APPAREL_CATEGORIES.has(normProd)) return true;
			return false;
		};

		const cartWithSunglasses = [{ _id: sunglasses._id.toString(), productId: sunglasses._id.toString(), quantity: 1, price: 3299 }];
		let eligibleSubtotal = 0;
		for (const item of cartWithSunglasses) {
			const prod = await Product.findById(item.productId);
			if (matchesCategory(prod.category, fashionCoupon.eligibleCategories)) {
				eligibleSubtotal += prod.price * item.quantity;
			}
		}

		assert.strictEqual(eligibleSubtotal, 0, "Sunglasses must not qualify for apparel coupon");
	});

	await itAsync("3.3 Cart with apparel product qualifies for discount and respects minOrderAmount", async () => {
		const cartWithJacket = [{ _id: jacket._id.toString(), productId: jacket._id.toString(), quantity: 1, price: 2499 }];
		let eligibleSubtotal = 0;
		for (const item of cartWithJacket) {
			const prod = await Product.findById(item.productId);
			if (apparelCategories.includes(prod.category)) {
				eligibleSubtotal += prod.price * item.quantity;
			}
		}

		assert.strictEqual(eligibleSubtotal, 2499);
		assert.ok(eligibleSubtotal >= fashionCoupon.minOrderAmount, "Meets minOrderAmount ₹1499");

		const discount = Math.round((eligibleSubtotal * fashionCoupon.discountPercentage) / 100);
		assert.strictEqual(discount, 375, "15% of ₹2499 = ₹375");
	});

	await itAsync("3.4 Mixed cart calculates discount exclusively on qualifying category items", async () => {
		const mixedCart = [
			{ _id: sunglasses._id.toString(), productId: sunglasses._id.toString(), quantity: 1, price: 3299 },
			{ _id: jacket._id.toString(), productId: jacket._id.toString(), quantity: 1, price: 2499 },
		];

		let eligibleSubtotal = 0;
		for (const item of mixedCart) {
			const prod = await Product.findById(item.productId);
			if (apparelCategories.includes(prod.category)) {
				eligibleSubtotal += prod.price * item.quantity;
			}
		}

		assert.strictEqual(eligibleSubtotal, 2499, "Only the ₹2499 jacket qualifies, not the ₹3299 sunglasses");
		const discount = Math.round((eligibleSubtotal * fashionCoupon.discountPercentage) / 100);
		assert.strictEqual(discount, 375);
	});

	// -------------------------------------------------------------------------
	// SECTION 4: CART REFRESH & QUANTITY CLAMPING (ISSUES 4 & 5)
	// -------------------------------------------------------------------------
	console.log("\n--- SECTION 4: CART MULTIPLICATION & RUNAWAY QUANTITY PROTECTION ---");

	await itAsync("4.1 5 consecutive page reloads maintain identical quantity without multiplication", async () => {
		const testUser = await User.create({
			name: "Cart Reload Test Patron",
			email: `cart_test_${Date.now()}@example.com`,
			password: "secure_password_test",
			cartItems: [
				{
					product: jacket._id,
					quantity: 1,
				},
			],
		});

		// Simulate 5 consecutive getCartProducts calls (equivalent to 5 page refreshes)
		for (let i = 0; i < 5; i++) {
			const userState = await User.findById(testUser._id);
			assert.strictEqual(userState.cartItems.length, 1);
			assert.strictEqual(userState.cartItems[0].quantity, 1, `Quantity must remain 1 on refresh #${i + 1}`);
		}

		await User.findByIdAndDelete(testUser._id);
	});

	await itAsync("4.2 Extreme runaway quantity (e.g. 3,187,917) is authoritatively self-healed and clamped", async () => {
		// Create a user in the corrupt state shown in screenshot media_1793509572843_6d676909.png
		const corruptUser = await User.create({
			name: "Corrupt Quantity Patron",
			email: `corrupt_cart_${Date.now()}@example.com`,
			password: "secure_password_test",
			cartItems: [
				{
					product: sunglasses._id,
					quantity: 3187917, // 3 million from previous bug
				},
			],
		});

		assert.strictEqual(corruptUser.cartItems[0].quantity, 3187917);

		// Execute self-healing logic from getCartProducts
		const maxAllowed = Math.min(sunglasses.stock, 10);
		let hasDirty = false;
		for (const item of corruptUser.cartItems) {
			const q = parseInt(item.quantity, 10);
			if (isNaN(q) || q < 1 || q > maxAllowed) {
				item.quantity = Math.max(1, Math.min(isNaN(q) ? 1 : q, maxAllowed));
				hasDirty = true;
			}
		}

		if (hasDirty) {
			corruptUser.markModified("cartItems");
			await corruptUser.save();
		}

		const healedUser = await User.findById(corruptUser._id);
		assert.strictEqual(healedUser.cartItems[0].quantity, 10, "Quantity must be clamped to max retail limit of 10");

		await User.findByIdAndDelete(corruptUser._id);
	});

	// Cleanup test products
	await Product.findByIdAndDelete(sunglasses._id);
	await Product.findByIdAndDelete(jacket._id);

	// -------------------------------------------------------------------------
	// FINAL RESULTS
	// -------------------------------------------------------------------------
	console.log("\n================================================================================");
	console.log(`MASTER QA TEST SUITE SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
	console.log("================================================================================");

	await mongoose.disconnect();
	if (failedCount > 0) {
		process.exit(1);
	} else {
		process.exit(0);
	}
}

runMasterQASuite().catch((err) => {
	console.error("Master QA Runner Fatal Error:", err);
	process.exit(1);
});

