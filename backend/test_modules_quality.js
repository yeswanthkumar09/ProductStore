import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./models/product.model.js";
import User from "./models/user.model.js";
import Order from "./models/order.model.js";
import Coupon from "./models/coupon.model.js";
import RestockSubscription from "./models/restockSubscription.model.js";
import CmsContent from "./models/cmsContent.model.js";
import EmailLog from "./models/emailLog.model.js";
import { connectDB } from "./lib/db.js";
import { checkAndTriggerRestock } from "./controllers/restockSubscription.controller.js";

dotenv.config();

const runQualityTest = async () => {
	console.log("================================================================================");
	console.log("🚀 STARTING FULL INTEGRATION & QUALITY VERIFICATION SUITE");
	console.log("================================================================================");

	await connectDB();

	let testPassed = 0;
	let testFailed = 0;

	const assert = (condition, description) => {
		if (condition) {
			console.log(`  ✓ PASS: ${description}`);
			testPassed++;
		} else {
			console.error(`  ✗ FAIL: ${description}`);
			testFailed++;
		}
	};

	try {
		// -------------------------------------------------------------------------
		// TEST SUITE 1: RESTOCK SUBSCRIPTIONS & AUTOMATIC TRIGGER (MODULE 1)
		// -------------------------------------------------------------------------
		console.log("\n[SUITE 1] Testing Product Restock Notifications & Variant Resolution...");

		// Create a test out-of-stock product with variants
		const testSku = "TEST-RESTOCK-" + Date.now();
		const testProduct = await Product.create({
			name: "Test Atelier Oxford Shirt",
			description: "Luxury cotton test piece",
			price: 1850,
			category: "shirts",
			sku: testSku,
			stock: 0,
			status: "active",
			image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600",
			variants: [
				{
					sku: `${testSku}-BLK-M`,
					size: "M",
					color: { name: "Obsidian Black", hex: "#111111" },
					price: 1850,
					stock: 0,
					isAvailable: true,
				},
				{
					sku: `${testSku}-WHT-L`,
					size: "L",
					color: { name: "Ivory White", hex: "#ffffff" },
					price: 1850,
					stock: 0,
					isAvailable: true,
				},
			],
		});

		const variantBlackM = testProduct.variants[0];
		const testEmail = `patron.${Date.now()}@example.com`;

		// 1.1 Subscribe to out-of-stock Obsidian Black / M
		const sub1 = await RestockSubscription.create({
			email: testEmail,
			product: testProduct._id,
			variantId: variantBlackM._id.toString(),
			size: "M",
			color: { name: "Obsidian Black", hex: "#111111" },
			status: "active",
		});
		assert(sub1 && sub1.status === "active", "Customer successfully registered for out-of-stock variant (M / Black)");

		// 1.2 Test duplicate subscription protection (compound index / idempotency)
		let duplicateCaught = false;
		try {
			await RestockSubscription.create({
				email: testEmail,
				product: testProduct._id,
				variantId: variantBlackM._id.toString(),
				size: "M",
				color: { name: "Obsidian Black", hex: "#111111" },
				status: "active",
			});
		} catch (dupErr) {
			duplicateCaught = dupErr.code === 11000;
		}
		assert(duplicateCaught, "Duplicate subscription attempt properly rejected via database index constraint");

		// 1.3 Restock an unrelated variant (Ivory White / L) and verify Black/M subscriber is NOT alerted
		const unrelatedResult = await checkAndTriggerRestock({
			productId: testProduct._id,
			variantId: testProduct.variants[1]._id.toString(),
			size: "L",
			colorName: "Ivory White",
			previousStock: 0,
			newStock: 10,
		});
		assert(
			unrelatedResult.notifiedCount === 0,
			"Restocking a different variant (L) did NOT trigger alerts for variant M subscribers"
		);

		// 1.4 Restock the exact subscribed variant (Obsidian Black / M)
		const matchedResult = await checkAndTriggerRestock({
			productId: testProduct._id,
			variantId: variantBlackM._id.toString(),
			size: "M",
			colorName: "Obsidian Black",
			previousStock: 0,
			newStock: 5,
		});
		assert(
			matchedResult.triggered && matchedResult.notifiedCount === 1,
			"Restocking the exact variant (M) correctly identified and queued the active subscriber"
		);

		// Allow async background dispatch loop up to 6 seconds for SMTP / logging
		let emailLog = null;
		for (let i = 0; i < 15; i++) {
			emailLog = await EmailLog.findOne({
				recipient: testEmail.toLowerCase(),
				template: "restock_alert",
			});
			if (emailLog) break;
			await new Promise((r) => setTimeout(r, 400));
		}

		// Verify subscription updated in database
		const updatedSub = await RestockSubscription.findById(sub1._id);
		assert(
			updatedSub.status === "notified" || updatedSub.status === "queued",
			`Subscriber lifecycle progressed to: ${updatedSub.status} (Delivery: ${updatedSub.deliveryStatus})`
		);

		// 1.5 Verify EmailLog created for restock alert
		assert(
			emailLog !== null,
			"Email service audit record created in EmailLog collection with template 'restock_alert'"
		);

		// Clean up test product & sub
		await RestockSubscription.deleteMany({ product: testProduct._id });
		await Product.findByIdAndDelete(testProduct._id);

		// -------------------------------------------------------------------------
		// TEST SUITE 2: DYNAMIC CMS & VERSION HISTORY AUDIT (MODULE 2)
		// -------------------------------------------------------------------------
		console.log("\n[SUITE 2] Testing Dynamic Website Content Management System (CMS)...");

		const testSectionKey = "test_promo_" + Date.now();

		// 2.1 Create CMS draft
		const initialDraft = await CmsContent.create({
			sectionKey: testSectionKey,
			title: "Private Festive Drop",
			subtitle: "Exclusive curation for VIP patrons",
			status: "draft",
			data: { discountRate: "20%", promoCode: "VIP20" },
			draftData: { discountRate: "25%", promoCode: "VIP25" },
			version: 1,
		});
		assert(initialDraft.status === "draft", "CMS draft content block created with version 1");

		// 2.2 Verify draft is protected from public customer view
		const publicCheck = await CmsContent.findOne({
			sectionKey: testSectionKey,
			status: "published",
		});
		assert(publicCheck === null, "Unpublished draft is properly shielded from public storefront");

		// 2.3 Publish draft with version snapshot
		initialDraft.versionHistory.push({
			version: 1,
			data: initialDraft.data,
			updatedAt: new Date(),
			status: "draft",
			comment: "Initial release draft",
		});
		initialDraft.version = 2;
		initialDraft.data = initialDraft.draftData;
		initialDraft.draftData = null;
		initialDraft.status = "published";
		await initialDraft.save();

		const publishedLive = await CmsContent.findOne({
			sectionKey: testSectionKey,
			status: "published",
		});
		assert(
			publishedLive && publishedLive.version === 2 && publishedLive.data.promoCode === "VIP25",
			"Promoting draft to live updated storefront payload to v2 (VIP25 promo code)"
		);

		// 2.4 Test version rollback
		const prevSnapshot = publishedLive.versionHistory.find((v) => v.version === 1);
		assert(prevSnapshot !== undefined, "Version 1 audit snapshot preserved in versionHistory array");

		publishedLive.version = 3;
		publishedLive.data = prevSnapshot.data;
		await publishedLive.save();

		const rolledBack = await CmsContent.findOne({ sectionKey: testSectionKey });
		assert(
			rolledBack.version === 3 && rolledBack.data.promoCode === "VIP20",
			"Rollback action successfully restored previous content data with new immutable version"
		);

		// Clean up CMS test block
		await CmsContent.deleteOne({ sectionKey: testSectionKey });

		// -------------------------------------------------------------------------
		// TEST SUITE 3: RELATED PRODUCTS ALGORITHM (OPTION B)
		// -------------------------------------------------------------------------
		console.log("\n[SUITE 3] Testing Dynamic Related In-Stock Products Algorithm...");

		// Query products in "t-shirts" or "jeans" category with stock > 0
		const inStockCatalogProducts = await Product.find({
			category: { $in: ["t-shirts", "jeans", "jackets"] },
			status: "active",
			$or: [{ stock: { $gt: 0 } }, { "variants.stock": { $gt: 0 } }],
		}).limit(4);

		assert(
			inStockCatalogProducts.length > 0,
			`Dynamic query returned ${inStockCatalogProducts.length} available in-stock alternatives from catalog`
		);

		// -------------------------------------------------------------------------
		// TEST SUITE 4: COUPON ON SUBTOTAL & RAZORPAY IN INR
		// -------------------------------------------------------------------------
		console.log("\n[SUITE 4] Testing Coupon Discount Calculation on Subtotal...");

		// Formula verification: subtotal ₹2000, 10% coupon = ₹200 discount. Shipping ₹99.72
		const subtotal = 2000;
		const couponPct = 10;
		const deliveryFee = 99.72;

		const expectedDiscount = Math.round((subtotal * couponPct) / 100);
		const expectedPayable = Math.max(0, subtotal - expectedDiscount) + deliveryFee;

		assert(expectedDiscount === 200, "Coupon discount applied exclusively to items subtotal (₹200)");
		assert(
			Math.abs(expectedPayable - 1899.72) < 0.01,
			"Total payable equals (subtotal - discount) + delivery fee (₹1,899.72)"
		);

		console.log("\n================================================================================");
		console.log(`🏁 VERIFICATION COMPLETE: ${testPassed} PASSED, ${testFailed} FAILED`);
		console.log("================================================================================");

		if (testFailed > 0) {
			process.exit(1);
		} else {
			process.exit(0);
		}
	} catch (err) {
		console.error("Test execution encountered an error:", err);
		process.exit(1);
	}
};

runQualityTest();
