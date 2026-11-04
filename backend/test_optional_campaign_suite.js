import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import User from "./models/user.model.js";
import CampaignSlide from "./models/campaignSlide.model.js";

const BASE_URL = "http://localhost:5000";

// Sample valid 1x1 PNG base64
const VALID_BASE64_PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
const VALID_DIRECT_IMAGE_URL = "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1920&q=85";

async function runSuite() {
	console.log("======================================================================");
	console.log("   LUXESTORE OPTIONAL CAMPAIGN FIELDS & STOREFRONT VERIFICATION       ");
	console.log("======================================================================\n");

	await mongoose.connect("mongodb://127.0.0.1:27017/ecommerce");

	const adminUser = await User.findOne({ role: "admin" });
	if (!adminUser) throw new Error("Admin user not found in database.");

	const adminToken = jwt.sign({ userId: adminUser._id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
	const adminHeaders = {
		"Content-Type": "application/json",
		Cookie: `accessToken=${adminToken}`,
	};

	let passed = 0;
	let failed = 0;
	const createdSlideIds = [];

	async function testCase(name, fn) {
		try {
			await fn();
			console.log(`[PASS] ${name}`);
			passed++;
		} catch (err) {
			console.error(`[FAIL] ${name}:`, err.message);
			failed++;
		}
	}

	let imageOnlySlideId = null;

	// SCENARIO 1: Create an image-only campaign (all text fields empty)
	await testCase("1. Create an image-only campaign (empty text fields, only image)", async () => {
		const res = await fetch(`${BASE_URL}/api/campaign-slides`, {
			method: "POST",
			headers: adminHeaders,
			body: JSON.stringify({
				badge: "",
				leftHeadline: "",
				leftSubheadline: "",
				rightHeadline: "",
				rightSubheadline: "",
				ctaText: "",
				ctaLink: "",
				image: VALID_BASE64_PNG,
				displayOrder: 20,
				isActive: true,
			}),
		});

		const data = await res.json();
		if (res.status !== 201) throw new Error(`HTTP ${res.status}: ${data.message}`);
		if (!data._id) throw new Error("Slide ID not returned");
		if (data.leftHeadline !== "" || data.rightHeadline !== "" || data.ctaText !== "") {
			throw new Error("Expected text fields to be empty strings");
		}
		if (!data.image) throw new Error("Image was not saved");
		imageOnlySlideId = data._id;
		createdSlideIds.push(data._id);
	});

	// SCENARIO 2: Create a campaign with only a headline
	await testCase("2. Create a campaign with only a headline", async () => {
		const res = await fetch(`${BASE_URL}/api/campaign-slides`, {
			method: "POST",
			headers: adminHeaders,
			body: JSON.stringify({
				leftHeadline: "NEW ARRIVALS",
				leftSubheadline: "",
				rightHeadline: "",
				rightSubheadline: "",
				ctaText: "",
				ctaLink: "",
				image: VALID_BASE64_PNG,
				displayOrder: 21,
				isActive: true,
			}),
		});

		const data = await res.json();
		if (res.status !== 201) throw new Error(`HTTP ${res.status}: ${data.message}`);
		if (data.leftHeadline !== "NEW ARRIVALS") throw new Error("Left headline was not saved");
		if (data.rightHeadline !== "") throw new Error("Expected rightHeadline to be empty");
		createdSlideIds.push(data._id);
	});

	// SCENARIO 3: Create a campaign with headline and subheadline
	await testCase("3. Create a campaign with headline and subheadline", async () => {
		const res = await fetch(`${BASE_URL}/api/campaign-slides`, {
			method: "POST",
			headers: adminHeaders,
			body: JSON.stringify({
				leftHeadline: "AUTUMN / WINTER",
				leftSubheadline: "EDITION 2026",
				rightHeadline: "",
				rightSubheadline: "",
				ctaText: "",
				ctaLink: "",
				image: VALID_BASE64_PNG,
				displayOrder: 22,
				isActive: true,
			}),
		});

		const data = await res.json();
		if (res.status !== 201) throw new Error(`HTTP ${res.status}: ${data.message}`);
		if (data.leftHeadline !== "AUTUMN / WINTER") throw new Error("Left headline was not saved");
		if (data.leftSubheadline !== "EDITION 2026") throw new Error("Left subheadline was not saved");
		createdSlideIds.push(data._id);
	});

	// SCENARIO 4: Create a campaign with a CTA and valid link
	await testCase("4. Create a campaign with a CTA and valid link", async () => {
		const res = await fetch(`${BASE_URL}/api/campaign-slides`, {
			method: "POST",
			headers: adminHeaders,
			body: JSON.stringify({
				leftHeadline: "FORMAL EDIT",
				rightHeadline: "STARTING ₹4,999",
				ctaText: "EXPLORE COLLECTION",
				ctaLink: "/category/suits",
				image: VALID_BASE64_PNG,
				displayOrder: 23,
				isActive: true,
			}),
		});

		const data = await res.json();
		if (res.status !== 201) throw new Error(`HTTP ${res.status}: ${data.message}`);
		if (data.ctaText !== "EXPLORE COLLECTION") throw new Error("CTA text was not saved");
		if (data.ctaLink !== "/category/suits") throw new Error("CTA link was not saved");
		createdSlideIds.push(data._id);
	});

	// SCENARIO 5: Reject a CTA text without a valid destination
	await testCase("5. Reject a CTA text without a valid destination", async () => {
		const res = await fetch(`${BASE_URL}/api/campaign-slides`, {
			method: "POST",
			headers: adminHeaders,
			body: JSON.stringify({
				leftHeadline: "BROKEN CTA CAMPAIGN",
				ctaText: "SHOP NOW",
				ctaLink: "", // Missing link target
				image: VALID_BASE64_PNG,
			}),
		});

		const data = await res.json();
		if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
		if (!data.message || !data.message.includes("CTA Link Target is required")) {
			throw new Error(`Unexpected error message: ${data.message}`);
		}
	});

	// SCENARIO 6: Reject a campaign without any usable image
	await testCase("6. Reject a campaign without any usable image", async () => {
		const res = await fetch(`${BASE_URL}/api/campaign-slides`, {
			method: "POST",
			headers: adminHeaders,
			body: JSON.stringify({
				leftHeadline: "NO IMAGE CAMPAIGN",
				image: "",
				mobileImage: "",
			}),
		});

		const data = await res.json();
		if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
		if (!data.message || !data.message.includes("valid campaign image is required")) {
			throw new Error(`Unexpected error message: ${data.message}`);
		}
	});

	// SCENARIO 7: Edit an image-only campaign
	await testCase("7. Edit an image-only campaign", async () => {
		if (!imageOnlySlideId) throw new Error("Image-only slide ID not available");

		const res = await fetch(`${BASE_URL}/api/campaign-slides/${imageOnlySlideId}`, {
			method: "PUT",
			headers: adminHeaders,
			body: JSON.stringify({
				badge: "EXCLUSIVE DROP",
				ctaLink: "/sales", // Add destination without CTA button
			}),
		});

		const data = await res.json();
		if (res.status !== 200) throw new Error(`HTTP ${res.status}: ${data.message}`);
		if (data.badge !== "EXCLUSIVE DROP") throw new Error("Badge was not updated");
		if (data.ctaLink !== "/sales") throw new Error("CTA link was not updated");
		if (data.ctaText !== "") throw new Error("CTA text should remain empty");
	});

	// SCENARIO 8: Verify all campaign types render correctly from active slides API
	await testCase("8. Verify all campaign types render correctly on active storefront endpoint", async () => {
		const res = await fetch(`${BASE_URL}/api/campaign-slides`);
		const activeSlides = await res.json();

		if (!Array.isArray(activeSlides)) throw new Error("Expected array of active slides");

		// Locate our created image-only slide
		const imageOnlyFound = activeSlides.find((s) => s._id.toString() === imageOnlySlideId.toString());
		if (!imageOnlyFound) throw new Error("Image-only slide not found in active slides");
		if (imageOnlyFound.leftHeadline !== "" || imageOnlyFound.rightHeadline !== "") {
			throw new Error("Image-only slide in storefront API has unexpected text");
		}
		if (!imageOnlyFound.image) throw new Error("Image-only slide missing image");
	});

	console.log("\n======================================================================");
	console.log(`TEST SUMMARY: ${passed} PASSED / ${failed} FAILED`);
	console.log("======================================================================");

	// Cleanup test slides
	for (const id of createdSlideIds) {
		await CampaignSlide.findByIdAndDelete(id);
	}

	await mongoose.disconnect();
	process.exit(failed > 0 ? 1 : 0);
}

runSuite().catch((err) => {
	console.error("FATAL ERROR in test runner:", err);
	process.exit(1);
});

