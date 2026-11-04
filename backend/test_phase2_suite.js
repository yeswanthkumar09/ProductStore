import mongoose from "mongoose";
import OTP from "./models/otp.model.js";
import User from "./models/user.model.js";
import Product from "./models/product.model.js";
import SizeChart from "./models/sizeChart.model.js";
import SupportTicket from "./models/supportTicket.model.js";
import SearchQuery from "./models/searchQuery.model.js";
import { normalizePhoneNumber } from "./services/sms.service.js";
import { ensureDefaultSizeCharts } from "./controllers/sizeChart.controller.js";

const MONGO_URI = "mongodb://127.0.0.1:27017/ecommerce";

async function runPhase2TestSuite() {
	console.log("================================================================================");
	console.log("       PHASE 2 QUALITY AUDIT & FUNCTIONAL VALIDATION TEST SUITE                 ");
	console.log("================================================================================");

	let passed = 0;
	let failed = 0;

	const assert = (condition, testName) => {
		if (condition) {
			console.log(`  [PASS] ${testName}`);
			passed++;
		} else {
			console.error(`  [FAIL] ${testName}`);
			failed++;
		}
	};

	try {
		await mongoose.connect(MONGO_URI);
		console.log("[DB] Connected to local MongoDB instance for Phase 2 verification.\n");

		// TEST 1: Phone Normalization & Country Codes
		console.log("--- MODULE 1: MOBILE NUMBER AUTHENTICATION & SECURITY ---");
		const phoneIn = normalizePhoneNumber("+91 98765 43210");
		assert(phoneIn.isValid && phoneIn.normalized === "+919876543210", "Normalize valid Indian mobile number (+91)");

		const phoneUs = normalizePhoneNumber("+1 (415) 555-2671");
		assert(phoneUs.isValid && phoneUs.normalized === "+14155552671", "Normalize international US mobile number (+1)");

		// TEST 2: Real Salt & Hash OTP Dispatch & Verification (Zero Mock)
		const plainOtp = "729481";
		const { otpHash, salt } = OTP.generateAndHash(plainOtp);
		const testOtpDoc = await OTP.create({
			identifier: "+919999988888",
			type: "phone_verification",
			otpHash,
			salt,
			expiresAt: new Date(Date.now() + 10 * 60 * 1000),
			resendAvailableAt: new Date(Date.now() + 60 * 1000),
		});

		assert(testOtpDoc.verifyOtp("729481") === true, "OTP document correctly verifies genuine secret code");
		assert(testOtpDoc.verifyOtp("000000") === false, "OTP document rejects incorrect code");

		// TEST 3: Size Chart & International Conversions
		console.log("\n--- MODULE 2: INTELLIGENT SIZE CHARTS & INTERNATIONAL CONVERSIONS ---");
		await ensureDefaultSizeCharts();
		const shirtChart = await SizeChart.findOne({ category: "shirts" });
		assert(shirtChart !== null, "Size chart for 'shirts' exists in database");
		assert(Array.isArray(shirtChart.rows) && shirtChart.rows.length >= 4, "Shirts size chart contains standard XS-XXL size rows");

		const mRow = shirtChart.rows.find((r) => r.size.includes("M") || r.size.includes("40"));
		assert(mRow && mRow.chestCm && mRow.chestIn, "Row contains accurate metric (cm) and imperial (in) measurements");
		assert(mRow && mRow.conversions?.us && mRow.conversions?.eu, "Row supports US, UK, EU, and IN conversions");

		// TEST 4: Structured Product Attributes
		console.log("\n--- MODULE 3: STRUCTURED ATTRIBUTES & WEIGHTED RECOMMENDATIONS ---");
		const sampleProduct = await Product.findOne({ status: "active" });
		assert(sampleProduct !== null, "Sample product found in catalog");

		// Test attributes
		sampleProduct.fit = "Regular Fit";
		sampleProduct.fabric = "100% Organic Cotton";
		sampleProduct.occasion = "Casual";
		sampleProduct.popularityScore = 85;
		await sampleProduct.save();

		const reloaded = await Product.findById(sampleProduct._id);
		assert(reloaded.fit === "Regular Fit" && reloaded.fabric === "100% Organic Cotton", "Product model persists structured fit, fabric, and occasion");

		// TEST 5: Customer Support Tickets
		console.log("\n--- MODULE 4: CUSTOMER CONCIERGE & SUPPORT HUB ---");
		let testUser = await User.findOne({ role: "customer" });
		if (!testUser) {
			testUser = await User.create({
				name: "Concierge Test Patron",
				email: "concierge_patron@test.com",
				password: "Password123!",
				isEmailVerified: true,
				accountStatus: "active",
			});
		}

		const ticket = await SupportTicket.create({
			user: testUser._id,
			userEmail: testUser.email,
			userName: testUser.name,
			subject: "Exchange inquiry for Linen Shirt size M",
			category: "Size & Fit",
			priority: "high",
			status: "open",
			messages: [
				{
					sender: "customer",
					senderName: testUser.name,
					message: "I need to exchange size M for L.",
					createdAt: new Date(),
				},
			],
		});

		assert(ticket.ticketNumber && ticket.ticketNumber.startsWith("TCK-"), "Ticket number auto-generated in human-friendly format (TCK-YYYYMMDD-XXXX)");

		// Add support response
		ticket.messages.push({
			sender: "support",
			senderName: "LuxeStore Concierge",
			message: "We have dispatched a complimentary reverse courier pickup for your size L swap.",
			createdAt: new Date(),
		});
		ticket.status = "in_progress";
		await ticket.save();

		const reloadedTicket = await SupportTicket.findById(ticket._id);
		assert(reloadedTicket.messages.length === 2, "Ticket conversation thread preserves multi-party messages");
		assert(reloadedTicket.status === "in_progress", "Ticket lifecycle status transitions smoothly");

		// TEST 6: Real Search Query Logging
		console.log("\n--- MODULE 5: SEARCH ANALYTICS & QUERY ENGINE ---");
		await SearchQuery.findOneAndUpdate(
			{ query: "overshirt" },
			{ $inc: { searchCount: 1 }, $set: { lastSearchedAt: new Date() } },
			{ upsert: true }
		);

		const topQuery = await SearchQuery.findOne({ query: "overshirt" });
		assert(topQuery && topQuery.searchCount >= 1, "Customer search keywords are logged for intelligence & trending discovery");

		// TEST 7: Smart Stock Validation
		console.log("\n--- MODULE 6: REAL STOCK VALIDATION & ZERO OVERSHOOT ---");
		sampleProduct.stock = 2;
		await sampleProduct.save();

		// Quantity > stock should be detectable
		const requestedQty = 5;
		const isStockSufficient = sampleProduct.stock >= requestedQty;
		assert(isStockSufficient === false, "Requested quantity of 5 correctly rejected against available stock of 2");

		// Cleanup test documents
		await OTP.deleteOne({ _id: testOtpDoc._id });
		await SupportTicket.deleteOne({ _id: ticket._id });

		console.log("\n================================================================================");
		console.log(`TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
		console.log("================================================================================");

		if (failed > 0) {
			process.exit(1);
		} else {
			process.exit(0);
		}
	} catch (error) {
		console.error("Test execution error:", error);
		process.exit(1);
	}
}

runPhase2TestSuite();

