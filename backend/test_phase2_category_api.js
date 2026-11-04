import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import User from "./models/user.model.js";

const BASE_URL = "http://localhost:5000";

async function runApiVerification() {
	console.log("======================================================================");
	console.log("   LUXESTORE DYNAMIC CATEGORY & PRODUCT MANAGEMENT API TEST           ");
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

	// TEST 1: Public GET /api/categories returns all 10 fashion departments
	await testCase("1. GET /api/categories returns active categories with subcategories and attributes", async () => {
		const res = await fetch(`${BASE_URL}/api/categories`);
		if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
		const categories = await res.json();

		if (!Array.isArray(categories) || categories.length < 10) {
			throw new Error(`Expected at least 10 categories, got ${categories.length}`);
		}

		const shirts = categories.find((c) => c.slug === "shirts");
		if (!shirts) throw new Error("Shirts category not found in /api/categories");
		if (!shirts.subcategories || shirts.subcategories.length < 4) {
			throw new Error(`Expected at least 4 subcategories for Shirts, got ${shirts.subcategories?.length}`);
		}
		if (!shirts.attributes || shirts.attributes.length < 5) {
			throw new Error(`Expected at least 5 configurable attributes for Shirts, got ${shirts.attributes?.length}`);
		}
		if (shirts.sizeSystem?.systemType !== "apparel_alpha") {
			throw new Error(`Expected sizeSystem "apparel_alpha", got ${shirts.sizeSystem?.systemType}`);
		}
	});

	// TEST 2: GET /api/categories/:slug
	await testCase("2. GET /api/categories/:slug returns single category metadata", async () => {
		const res = await fetch(`${BASE_URL}/api/categories/jeans`);
		if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
		const jeans = await res.json();

		if (jeans.slug !== "jeans" || !jeans.subcategories?.length) {
			throw new Error("Failed to retrieve jeans category details");
		}
		if (jeans.sizeSystem?.systemType !== "waist_numeric") {
			throw new Error(`Expected jeans size system to be waist_numeric, got ${jeans.sizeSystem?.systemType}`);
		}
	});

	// TEST 3: Admin create category
	let testCatId = null;
	await testCase("3. POST /api/categories creates a new custom category with attributes and subcategories", async () => {
		const newCatPayload = {
			name: "Knitwear & Sweaters",
			slug: "knitwear-sweaters",
			description: "Luxury merino wool, cashmere crewnecks & ribbed cardigans",
			imageUrl: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80",
			subcategories: [
				{ name: "Cashmere Sweaters", slug: "cashmere-sweaters" },
				{ name: "Cardigans", slug: "cardigans" },
			],
			attributes: [
				{ key: "yarnType", label: "Yarn Type", type: "select", options: ["100% Cashmere", "Merino Wool", "Alpaca Blend"], required: true },
				{ key: "gauge", label: "Knit Gauge", type: "select", options: ["Fine 14-Gauge", "Chunky 7-Gauge", "Waffle Knit"], required: false },
			],
			sizeSystem: {
				systemType: "apparel_alpha",
				allowedSizes: ["S", "M", "L", "XL"],
			},
		};

		const res = await fetch(`${BASE_URL}/api/categories`, {
			method: "POST",
			headers: adminHeaders,
			body: JSON.stringify(newCatPayload),
		});

		if (!res.ok) {
			const err = await res.json();
			throw new Error(err.message || `HTTP ${res.status}`);
		}

		const data = await res.json();
		testCatId = data._id;
		if (data.name !== "Knitwear & Sweaters" || data.subcategories.length !== 2) {
			throw new Error("Created category data does not match payload");
		}
	});

	// TEST 4: Product creation with category-specific attribute validation
	let createdShirtId = null;
	await testCase("4. POST /api/products successfully creates a shirt with category attributes and variant matrix", async () => {
		const shirtPayload = {
			name: "Bespoke Royal Oxford Spread Collar Shirt",
			description: "Woven in Italy from 100% Egyptian Giza 87 long-staple cotton with mother-of-pearl buttons.",
			shortDescription: "Ultra-luxurious Italian Oxford cotton formal shirt.",
			category: "shirts",
			subcategory: "formal-shirts",
			categoryAttributes: {
				collarType: "Spread Collar",
				sleeveType: "Full Sleeve",
				fit: "Slim Fit",
				fabric: "100% Giza Cotton",
				pattern: "Solid",
				occasion: "Formal",
				closureType: "Full Button Placket",
			},
			brand: "LUXESTORE Sartorial",
			price: 3499,
			originalPrice: 4999,
			stock: 45,
			image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80",
			colors: [
				{ name: "Crisp White", hex: "#FFFFFF", image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80" },
				{ name: "French Sky Blue", hex: "#7ba05b", image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80" },
			],
			variants: [
				{
					color: { name: "Crisp White", hex: "#FFFFFF", image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80" },
					size: "S",
					sku: "SH-OXF-WHT-S",
					price: 3499,
					stock: 10,
					images: ["https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80"],
				},
				{
					color: { name: "Crisp White", hex: "#FFFFFF", image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80" },
					size: "M",
					sku: "SH-OXF-WHT-M",
					price: 3499,
					stock: 15,
					images: ["https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80"],
				},
				{
					color: { name: "French Sky Blue", hex: "#7ba05b", image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80" },
					size: "M",
					sku: "SH-OXF-BLU-M",
					price: 3499,
					stock: 20,
					images: ["https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80"],
				},
			],
		};

		const res = await fetch(`${BASE_URL}/api/products`, {
			method: "POST",
			headers: adminHeaders,
			body: JSON.stringify(shirtPayload),
		});

		if (!res.ok) {
			const err = await res.json();
			throw new Error(err.message || `HTTP ${res.status}`);
		}

		const prod = await res.json();
		createdShirtId = prod._id;
		if (prod.category !== "shirts" || prod.subcategory !== "formal-shirts" || prod.variants.length !== 3) {
			throw new Error("Created product does not match expected category or variants");
		}
	});

	// TEST 5: Reject product with missing required category attribute
	await testCase("5. Reject product when required category attribute is missing", async () => {
		const invalidShirt = {
			name: "Incomplete Shirt",
			description: "Missing collarType attribute",
			category: "shirts",
			subcategory: "casual-shirts",
			categoryAttributes: {
				// collarType is missing!
				sleeveType: "Half Sleeve",
				fit: "Relaxed Fit",
				fabric: "Pure Linen",
			},
			price: 2499,
			image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80",
		};

		const res = await fetch(`${BASE_URL}/api/products`, {
			method: "POST",
			headers: adminHeaders,
			body: JSON.stringify(invalidShirt),
		});

		if (res.ok) {
			throw new Error("Expected failure due to missing required category attribute 'Collar Type'");
		}
		const err = await res.json();
		if (!err.message.includes("Collar Type")) {
			throw new Error(`Expected error mentioning "Collar Type", got "${err.message}"`);
		}
	});

	// TEST 6: Reject duplicate variant combination
	await testCase("6. Reject duplicate variant combination (Color + Size)", async () => {
		const duplicateVariantProduct = {
			name: "Duplicate Variant Denim",
			description: "Has two identical variants",
			category: "jeans",
			subcategory: "slim-fit",
			categoryAttributes: {
				waistType: "Mid Rise",
				fit: "Slim Fit",
				wash: "Raw Indigo",
			},
			price: 2999,
			image: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=800&q=80",
			variants: [
				{ color: { name: "Raw Indigo" }, size: "32", price: 2999, stock: 10 },
				{ color: { name: "Raw Indigo" }, size: "32", price: 2999, stock: 5 }, // Duplicate!
			],
		};

		const res = await fetch(`${BASE_URL}/api/products`, {
			method: "POST",
			headers: adminHeaders,
			body: JSON.stringify(duplicateVariantProduct),
		});

		if (res.ok) {
			throw new Error("Expected failure due to duplicate variant combination");
		}
		const err = await res.json();
		if (!err.message.toLowerCase().includes("duplicate variant combination")) {
			throw new Error(`Expected duplicate variant combination error, got "${err.message}"`);
		}
	});

	// TEST 7: Clean up test category & product
	await testCase("7. Clean up test records safely", async () => {
		if (createdShirtId) {
			await fetch(`${BASE_URL}/api/products/${createdShirtId}`, {
				method: "DELETE",
				headers: adminHeaders,
			});
		}
		if (testCatId) {
			await fetch(`${BASE_URL}/api/categories/${testCatId}?force=true`, {
				method: "DELETE",
				headers: adminHeaders,
			});
		}
	});

	await mongoose.disconnect();

	console.log("\n======================================================================");
	console.log(`   API TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
	console.log("======================================================================");

	if (failed > 0) process.exit(1);
}

runApiVerification().catch((err) => {
	console.error("Test execution error:", err);
	process.exit(1);
});

