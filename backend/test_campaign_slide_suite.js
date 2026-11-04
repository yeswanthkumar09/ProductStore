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
const INVALID_UNSPLASH_WEBPAGE = "https://unsplash.com/photos/stylish-man-in-suit-xyz123";
const INVALID_MIME_BASE64 = "data:application/pdf;base64,JVBERi0xLjQKJcOkw7zDtsOf";

async function runTests() {
	console.log("======================================================================");
	console.log("   LUXESTORE HOMEPAGE CAMPAIGN SLIDE & IMAGE UPLOAD TEST SUITE        ");
	console.log("======================================================================\n");

	await mongoose.connect("mongodb://127.0.0.1:27017/ecommerce");

	// 1. Setup Admin & Customer tokens
	const adminUser = await User.findOne({ role: "admin" });
	if (!adminUser) throw new Error("Admin user not found in database.");

	let customerUser = await User.findOne({ role: "customer" });
	if (!customerUser) {
		customerUser = await User.findOne({ role: { $ne: "admin" } });
	}

	const adminToken = jwt.sign({ userId: adminUser._id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
	const customerToken = customerUser
		? jwt.sign({ userId: customerUser._id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" })
		: null;

	const adminHeaders = {
		"Content-Type": "application/json",
		Cookie: `accessToken=${adminToken}`,
	};

	let passedCount = 0;
	let failedCount = 0;

	async function assertTest(name, fn) {
		try {
			await fn();
			console.log(`[PASS] ${name}`);
			passedCount++;
		} catch (err) {
			console.error(`[FAIL] ${name}:`, err.message);
			failedCount++;
		}
	}

	let createdSlideId = null;
	let dualImageSlideId = null;

	// TEST 1: Create campaign with desktop image upload (base64 -> Cloudinary)
	await assertTest("1. Create campaign with desktop image upload (Base64 -> Cloudinary)", async () => {
		const res = await fetch(`${BASE_URL}/api/campaign-slides`, {
			method: "POST",
			headers: adminHeaders,
			body: JSON.stringify({
				badge: "ATELIER COUTURE",
				leftHeadline: "SUMMER CAPSULE",
				leftSubheadline: "RAW SILK & LINEN",
				rightHeadline: "FLAT 25% OFF",
				rightSubheadline: "HAND-WOVEN ITALIAN SILHOUETTES",
				ctaText: "EXPLORE CAPSULE",
				ctaLink: "/category/suits",
				image: VALID_BASE64_PNG,
				displayOrder: 10,
				isActive: true,
			}),
		});

		const data = await res.json();
		if (res.status !== 201) throw new Error(`HTTP ${res.status}: ${data.message}`);
		if (!data._id) throw new Error("Slide ID not returned");
		if (!data.image.includes("res.cloudinary.com")) {
			throw new Error(`Desktop image was not uploaded to Cloudinary: ${data.image}`);
		}
		if (!data.imagePublicId) throw new Error("imagePublicId was not stored");
		createdSlideId = data._id;
	});

	// TEST 2: Create campaign with both desktop and mobile images
	await assertTest("2. Create campaign with desktop and mobile images", async () => {
		const res = await fetch(`${BASE_URL}/api/campaign-slides`, {
			method: "POST",
			headers: adminHeaders,
			body: JSON.stringify({
				badge: "RUNWAY EXCLUSIVE",
				leftHeadline: "PARIS FASHION WEEK",
				leftSubheadline: "BESPOKE OVERCOATS",
				rightHeadline: "LIMITED ALLOTMENT",
				rightSubheadline: "PURE CASHMERE & ALPACA",
				image: VALID_BASE64_PNG,
				mobileImage: VALID_BASE64_PNG,
				displayOrder: 11,
				isActive: true,
			}),
		});

		const data = await res.json();
		if (res.status !== 201) throw new Error(`HTTP ${res.status}: ${data.message}`);
		if (!data.mobileImage || !data.mobileImage.includes("res.cloudinary.com")) {
			throw new Error("Mobile image was not uploaded to Cloudinary");
		}
		if (!data.mobileImagePublicId) throw new Error("mobileImagePublicId was not stored");
		dualImageSlideId = data._id;
	});

	// TEST 3: Create campaign using a valid direct image URL
	await assertTest("3. Create campaign using a valid direct image URL", async () => {
		const res = await fetch(`${BASE_URL}/api/campaign-slides`, {
			method: "POST",
			headers: adminHeaders,
			body: JSON.stringify({
				badge: "SIGNATURE CUTS",
				leftHeadline: "ESSENTIAL DENIM",
				leftSubheadline: "JAPANESE SELVEDGE",
				rightHeadline: "STARTING ₹3,499",
				rightSubheadline: "14OZ RIGID WEAVE",
				image: VALID_DIRECT_IMAGE_URL,
				displayOrder: 12,
				isActive: true,
			}),
		});

		const data = await res.json();
		if (res.status !== 201) throw new Error(`HTTP ${res.status}: ${data.message}`);
		if (!data.image || !data.image.startsWith("http")) throw new Error("Invalid image URL stored");
		// Cleanup this test slide
		await CampaignSlide.findByIdAndDelete(data._id);
	});

	// TEST 4: Reject an Unsplash webpage URL (e.g. unsplash.com/photos/...)
	await assertTest("4. Reject an Unsplash webpage URL", async () => {
		const res = await fetch(`${BASE_URL}/api/campaign-slides`, {
			method: "POST",
			headers: adminHeaders,
			body: JSON.stringify({
				leftHeadline: "TEST",
				rightHeadline: "TEST",
				image: INVALID_UNSPLASH_WEBPAGE,
			}),
		});

		const data = await res.json();
		if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
		if (!data.message || !data.message.includes("Unsplash webpage URLs are not direct images")) {
			throw new Error(`Unexpected error message: ${data.message}`);
		}
	});

	// TEST 5: Reject invalid image file MIME type
	await assertTest("5. Reject invalid image file format (e.g. PDF)", async () => {
		const res = await fetch(`${BASE_URL}/api/campaign-slides`, {
			method: "POST",
			headers: adminHeaders,
			body: JSON.stringify({
				leftHeadline: "TEST",
				rightHeadline: "TEST",
				image: INVALID_MIME_BASE64,
			}),
		});

		const data = await res.json();
		if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
		if (!data.message || !data.message.includes("Only JPEG, PNG, and WebP are allowed")) {
			throw new Error(`Unexpected error message: ${data.message}`);
		}
	});

	// TEST 6: Reject oversized image upload (> 10MB)
	await assertTest("6. Reject oversized image payload (> 10MB limit)", async () => {
		// Construct simulated oversized payload string (~15MB)
		const oversizedBase64 = "data:image/png;base64," + "A".repeat(15 * 1024 * 1024);
		const res = await fetch(`${BASE_URL}/api/campaign-slides`, {
			method: "POST",
			headers: adminHeaders,
			body: JSON.stringify({
				leftHeadline: "OVERSIZED TEST",
				rightHeadline: "TEST",
				image: oversizedBase64,
			}),
		});

		// Either express.json limit rejected (413 Payload Too Large) or controller rejected (400)
		if (res.status !== 400 && res.status !== 413) {
			throw new Error(`Expected 400 or 413, got ${res.status}`);
		}
	});

	// TEST 7: Edit campaign text
	await assertTest("7. Edit campaign text (Headlines & CTA)", async () => {
		const res = await fetch(`${BASE_URL}/api/campaign-slides/${createdSlideId}`, {
			method: "PUT",
			headers: adminHeaders,
			body: JSON.stringify({
				leftHeadline: "UPDATED SUMMER CAPSULE",
				rightHeadline: "EXTRA 30% OFF AT CHECKOUT",
				ctaText: "SHOP THE EDIT",
			}),
		});

		const data = await res.json();
		if (res.status !== 200) throw new Error(`HTTP ${res.status}: ${data.message}`);
		if (data.leftHeadline !== "UPDATED SUMMER CAPSULE") throw new Error("Headline was not updated");
		if (data.rightHeadline !== "EXTRA 30% OFF AT CHECKOUT") throw new Error("Offer was not updated");
		if (data.ctaText !== "SHOP THE EDIT") throw new Error("CTA text was not updated");
	});

	// TEST 8: Replace desktop image
	await assertTest("8. Replace desktop image on existing slide", async () => {
		const oldSlide = await CampaignSlide.findById(createdSlideId);
		const oldImageUrl = oldSlide.image;

		const res = await fetch(`${BASE_URL}/api/campaign-slides/${createdSlideId}`, {
			method: "PUT",
			headers: adminHeaders,
			body: JSON.stringify({
				image: VALID_BASE64_PNG,
			}),
		});

		const data = await res.json();
		if (res.status !== 200) throw new Error(`HTTP ${res.status}: ${data.message}`);
		if (!data.image.includes("res.cloudinary.com")) throw new Error("New image not on Cloudinary");
	});

	// TEST 9: Preserve image when no replacement is selected
	await assertTest("9. Preserve existing image when updating without new image", async () => {
		const before = await CampaignSlide.findById(createdSlideId);
		const res = await fetch(`${BASE_URL}/api/campaign-slides/${createdSlideId}`, {
			method: "PUT",
			headers: adminHeaders,
			body: JSON.stringify({
				leftSubheadline: "HAND-STITCHED IN MILAN",
			}),
		});

		const data = await res.json();
		if (res.status !== 200) throw new Error(`HTTP ${res.status}: ${data.message}`);
		if (data.image !== before.image) throw new Error("Image changed unexpectedly when not provided");
		if (data.imagePublicId !== before.imagePublicId) throw new Error("imagePublicId changed unexpectedly");
	});

	// TEST 10: Change display order
	await assertTest("10. Change display order sequence", async () => {
		const res = await fetch(`${BASE_URL}/api/campaign-slides/${createdSlideId}`, {
			method: "PUT",
			headers: adminHeaders,
			body: JSON.stringify({
				displayOrder: 99,
			}),
		});

		const data = await res.json();
		if (res.status !== 200) throw new Error(`HTTP ${res.status}: ${data.message}`);
		if (data.displayOrder !== 99) throw new Error(`Expected order 99, got ${data.displayOrder}`);
	});

	// TEST 11: Activate and deactivate campaigns (toggle)
	await assertTest("11. Activate and deactivate campaigns (Toggle slide)", async () => {
		const toggle1 = await fetch(`${BASE_URL}/api/campaign-slides/${createdSlideId}/toggle`, {
			method: "PATCH",
			headers: adminHeaders,
		});
		const data1 = await toggle1.json();
		if (data1.isActive !== false) throw new Error("Expected slide to be paused");

		const toggle2 = await fetch(`${BASE_URL}/api/campaign-slides/${createdSlideId}/toggle`, {
			method: "PATCH",
			headers: adminHeaders,
		});
		const data2 = await toggle2.json();
		if (data2.isActive !== true) throw new Error("Expected slide to be reactivated");
	});

	// TEST 12: Delete campaign
	await assertTest("12. Delete campaign slide and clean up assets", async () => {
		const res = await fetch(`${BASE_URL}/api/campaign-slides/${dualImageSlideId}`, {
			method: "DELETE",
			headers: adminHeaders,
		});

		const data = await res.json();
		if (res.status !== 200) throw new Error(`HTTP ${res.status}: ${data.message}`);

		const inDb = await CampaignSlide.findById(dualImageSlideId);
		if (inDb) throw new Error("Slide record still exists in database");
	});

	// TEST 13: Verify homepage carousel updates with newly created active slide
	await assertTest("13. Verify homepage carousel reflects active slides in order", async () => {
		const res = await fetch(`${BASE_URL}/api/campaign-slides`);
		const activeSlides = await res.json();

		if (!Array.isArray(activeSlides)) throw new Error("Expected array of active slides");
		const found = activeSlides.find((s) => s._id.toString() === createdSlideId.toString());
		if (!found) throw new Error("Created active slide not found in active homepage slides API");
		if (found.leftHeadline !== "UPDATED SUMMER CAPSULE") {
			throw new Error("Homepage slide headline does not match updated value");
		}
	});

	// TEST 14: Verify mobile and desktop image selection stored correctly
	await assertTest("14. Verify mobile and desktop image presence in active slide", async () => {
		const slide = await CampaignSlide.findById(createdSlideId);
		if (!slide.image) throw new Error("Desktop image missing");
		if (!slide.mobileImage) throw new Error("Mobile image fallback missing");
	});

	// TEST 15: Verify unauthorized users cannot create campaigns
	await assertTest("15. Verify unauthorized users cannot create campaigns", async () => {
		// 15a: Unauthenticated
		const unauthRes = await fetch(`${BASE_URL}/api/campaign-slides`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ leftHeadline: "HACK", rightHeadline: "HACK", image: VALID_BASE64_PNG }),
		});
		if (unauthRes.status !== 401) throw new Error(`Unauthenticated: expected 401, got ${unauthRes.status}`);

		// 15b: Customer non-admin
		if (customerToken) {
			const custRes = await fetch(`${BASE_URL}/api/campaign-slides`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Cookie: `accessToken=${customerToken}`,
				},
				body: JSON.stringify({ leftHeadline: "HACK", rightHeadline: "HACK", image: VALID_BASE64_PNG }),
			});
			if (custRes.status !== 403) throw new Error(`Non-admin: expected 403, got ${custRes.status}`);
		}
	});

	console.log("\n======================================================================");
	console.log(`TEST SUMMARY: ${passedCount} PASSED / ${failedCount} FAILED`);
	console.log("======================================================================");

	// Cleanup test slide
	if (createdSlideId) {
		await CampaignSlide.findByIdAndDelete(createdSlideId);
	}

	process.exit(failedCount > 0 ? 1 : 0);
}

runTests().catch((err) => {
	console.error("FATAL ERROR in test runner:", err);
	process.exit(1);
});
