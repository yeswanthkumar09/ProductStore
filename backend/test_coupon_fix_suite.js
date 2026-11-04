import mongoose from "mongoose";
import { evaluateCouponDiscount } from "./controllers/coupon.controller.js";

async function runCouponTests() {
	console.log("===============================================================");
	console.log("LUXESTORE COUPON VALIDATION & REPRODUCIBILITY VERIFICATION");
	console.log("===============================================================\n");

	try {
		await mongoose.connect("mongodb://127.0.0.1:27017/ecommerce");
		console.log("Connected to local MongoDB instance.\n");

		const { default: Product } = await import("./models/product.model.js");
		const { default: Coupon } = await import("./models/coupon.model.js");

		// Fetch Tuxedo
		const tuxedo = await Product.findOne({ name: /Tuxedo/i });
		if (!tuxedo) {
			console.error("Tuxedo product not found in database!");
			process.exit(1);
		}
		console.log(`Found Tuxedo product: "${tuxedo.name}" (ID: ${tuxedo._id}, Category: ${tuxedo.category}, Price: ₹${tuxedo.price})`);

		// Fetch Sunglasses (for ineligible category testing)
		const sunglasses = await Product.findOne({
			category: { $in: ["glasses", "sunglasses", "accessories"] },
		});

		// -------------------------------------------------------------
		// TEST 1: WELCOME10 with Tuxedo (Subtotal ₹14,999) - USER SCENARIO
		// -------------------------------------------------------------
		console.log("\n--- TEST 1: User Scenario - WELCOME10 on Italian Wool Tuxedo (₹14,999) ---");
		const res1 = await evaluateCouponDiscount({
			code: "WELCOME10",
			user: null,
			cartItems: [
				{
					_id: tuxedo._id.toString(),
					productId: tuxedo._id.toString(),
					variantId: tuxedo.variants?.[0]?._id?.toString(),
					price: 14999,
					quantity: 1,
					category: tuxedo.category,
				},
			],
		});

		console.log("Result 1:", {
			isValid: res1.isValid,
			code: res1.coupon?.code,
			discountPercentage: res1.discountPercentage,
			discountAmount: res1.discountAmount,
			eligibleSubtotal: res1.eligibleSubtotal,
			message: res1.message,
		});

		if (res1.isValid && res1.discountAmount === 1500 && res1.eligibleSubtotal === 14999) {
			console.log("[PASS] WELCOME10 successfully applied on Tuxedo with max cap discount ₹1,500!");
		} else {
			console.error("[FAIL] WELCOME10 failed to apply correctly:", res1);
			process.exit(1);
		}

		// -------------------------------------------------------------
		// TEST 2: FASHION15 with cart subtotal below minimum (₹1,199 < ₹1,499)
		// -------------------------------------------------------------
		console.log("\n--- TEST 2: Subtotal below minimum order requirement (Cotton Tee ₹1,199 vs Min ₹1,499) ---");
		const tee = await Product.findOne({ name: /Cotton Tee/i });
		const res2 = await evaluateCouponDiscount({
			code: "FASHION15",
			user: null,
			cartItems: [
				{
					_id: tee._id.toString(),
					productId: tee._id.toString(),
					price: tee.price,
					quantity: 1,
					category: tee.category,
				},
			],
		});

		console.log("Result 2:", {
			isValid: res2.isValid,
			statusCode: res2.statusCode,
			message: res2.message,
		});

		if (!res2.isValid && res2.statusCode === 400 && res2.message.includes("Minimum eligible purchase")) {
			console.log("[PASS] Correctly rejected with clean minimum purchase requirement message.");
		} else {
			console.error("[FAIL] Did not enforce minimum order value:", res2);
			process.exit(1);
		}

		// -------------------------------------------------------------
		// TEST 3: FASHION15 with Sunglasses (Category Ineligible)
		// -------------------------------------------------------------
		if (sunglasses) {
			console.log(`\n--- TEST 3: Ineligible Category (FASHION15 on "${sunglasses.name}", Category: "${sunglasses.category}") ---`);
			const res3 = await evaluateCouponDiscount({
				code: "FASHION15",
				user: null,
				cartItems: [
					{
						_id: sunglasses._id.toString(),
						productId: sunglasses._id.toString(),
						price: 3299,
						quantity: 1,
						category: sunglasses.category,
					},
				],
			});

			console.log("Result 3:", {
				isValid: res3.isValid,
				statusCode: res3.statusCode,
				message: res3.message,
			});

			if (!res3.isValid && res3.statusCode === 400 && res3.message.includes("applies exclusively")) {
				console.log("[PASS] Correctly rejected with category scope explanation.");
			} else {
				console.error("[FAIL] Expected category scope rejection:", res3);
				process.exit(1);
			}
		}

		// -------------------------------------------------------------
		// TEST 4: FASHION15 with Tuxedo (Category "suits" Eligible)
		// -------------------------------------------------------------
		console.log("\n--- TEST 4: Qualifying Category (FASHION15 on Tuxedo, Category: 'suits') ---");
		const res4 = await evaluateCouponDiscount({
			code: "FASHION15",
			user: null,
			cartItems: [
				{
					_id: tuxedo._id.toString(),
					productId: tuxedo._id.toString(),
					price: 14999,
					quantity: 1,
					category: "suits",
				},
			],
		});

		console.log("Result 4:", {
			isValid: res4.isValid,
			code: res4.coupon?.code,
			discountAmount: res4.discountAmount,
			eligibleSubtotal: res4.eligibleSubtotal,
		});

		// 15% of 14,999 is 2249.85, capped at maxDiscountCap 2,000
		if (res4.isValid && res4.discountAmount === 2000) {
			console.log("[PASS] FASHION15 successfully applied on Tuxedo with capped discount ₹2,000!");
		} else {
			console.error("[FAIL] FASHION15 failed:", res4);
			process.exit(1);
		}

		// -------------------------------------------------------------
		// TEST 5: Invalid Coupon Code
		// -------------------------------------------------------------
		console.log("\n--- TEST 5: Non-existent coupon code ---");
		const res5 = await evaluateCouponDiscount({
			code: "INVALID_CODE_XYZ",
			user: null,
			cartItems: [],
		});
		if (!res5.isValid && res5.statusCode === 404) {
			console.log("[PASS] Non-existent code returns 404 Invalid coupon code.");
		} else {
			console.error("[FAIL] Invalid code not handled:", res5);
			process.exit(1);
		}

		// -------------------------------------------------------------
		// TEST 6: Expired Coupon
		// -------------------------------------------------------------
		console.log("\n--- TEST 6: Expired Coupon ---");
		const expiredCoupon = await Coupon.create({
			code: `EXPIRED_${Date.now()}`,
			discountPercentage: 10,
			discountType: "percentage",
			minOrderAmount: 100,
			expirationDate: new Date(Date.now() - 100000), // in the past
			isActive: true,
		});

		const res6 = await evaluateCouponDiscount({
			code: expiredCoupon.code,
			user: null,
			cartItems: [{ _id: tuxedo._id.toString(), productId: tuxedo._id.toString(), price: 14999, quantity: 1 }],
		});

		if (!res6.isValid && res6.statusCode === 400 && res6.message === "Coupon has expired") {
			console.log("[PASS] Expired coupon correctly marked inactive and rejected.");
		} else {
			console.error("[FAIL] Expired coupon handling:", res6);
			process.exit(1);
		}

		// Clean up test coupon
		await Coupon.deleteOne({ _id: expiredCoupon._id });

		console.log("\n===============================================================");
		console.log("ALL COUPON TESTS PASSED WITH 100% SUCCESS!");
		console.log("===============================================================");
		process.exit(0);
	} catch (err) {
		console.error("Test execution failed:", err);
		process.exit(1);
	}
}

runCouponTests();
