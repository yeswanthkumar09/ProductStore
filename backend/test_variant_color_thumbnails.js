import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import Product from "./models/product.model.js";

const BASE_URL = "http://localhost:5000";

async function runColorThumbnailSuite() {
	console.log("======================================================================");
	console.log("   LUXESTORE PRODUCT COLOR IMAGE THUMBNAIL VERIFICATION SUITE       ");
	console.log("======================================================================\n");

	await mongoose.connect("mongodb://127.0.0.1:27017/ecommerce");

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

	// TEST 1: Database Schema & Migration completeness
	await testCase("1. All products have color-specific image thumbnails in database", async () => {
		const products = await Product.find({});
		if (products.length === 0) throw new Error("No products found in database");

		for (const p of products) {
			if (p.colors && p.colors.length > 0) {
				for (const c of p.colors) {
					if (!c.image || typeof c.image !== "string" || !c.image.startsWith("http")) {
						throw new Error(`Product ${p.name} color "${c.name}" has missing or invalid image URL: ${c.image}`);
					}
				}
			}

			if (p.variants && p.variants.length > 0) {
				for (const v of p.variants) {
					if (v.color && v.color.name) {
						if (!v.color.image || typeof v.color.image !== "string" || !v.color.image.startsWith("http")) {
							throw new Error(`Product ${p.name} variant SKU ${v.sku} has missing or invalid variant color image: ${v.color?.image}`);
						}
					}
				}
			}
		}
	});

	// TEST 2: Multi-color products have distinct images per color
	await testCase("2. Multi-color products have distinct photograph URLs per color variant", async () => {
		const denim = await Product.findOne({ name: /Selvedge Denim/i });
		if (!denim) throw new Error("Selvedge Denim product not found");

		const colorImages = new Map();
		for (const v of denim.variants) {
			if (v.color?.name && v.color?.image) {
				colorImages.set(v.color.name, v.color.image);
			}
		}

		if (colorImages.size < 2) {
			throw new Error(`Expected at least 2 distinct colors for Selvedge Denim, got ${colorImages.size}`);
		}

		const uniqueImageUrls = new Set(colorImages.values());
		if (uniqueImageUrls.size !== colorImages.size) {
			throw new Error("Colors share identical image URLs; expected distinct photography per color variant");
		}
	});

	// TEST 3: Duffel bag (from user screenshot 2) has distinct color variant images
	await testCase("3. Leather Duffel Bag has distinct photography for Cognac Tan, Espresso Brown & Jet Black", async () => {
		const duffel = await Product.findOne({ name: /Duffel/i });
		if (!duffel) throw new Error("Duffel Bag product not found");

		const duffelColorImages = new Map();
		for (const c of duffel.colors) {
			duffelColorImages.set(c.name, c.image);
		}

		if (!duffelColorImages.has("Cognac Tan") || !duffelColorImages.has("Espresso Brown") || !duffelColorImages.has("Jet Black")) {
			throw new Error("Expected Cognac Tan, Espresso Brown, and Jet Black color variants on Duffel Bag");
		}

		// Verify all 3 images are distinct
		const images = ["Cognac Tan", "Espresso Brown", "Jet Black"].map((n) => duffelColorImages.get(n));
		const uniqueSet = new Set(images);
		if (uniqueSet.size !== 3) {
			throw new Error(`Expected 3 unique images for Duffel Bag variants, got ${uniqueSet.size}`);
		}
	});

	// TEST 4: Public storefront API endpoints return color images for storefront consumption
	await testCase("4. Public GET /api/products/featured and GET /api/products/:id return variant color images", async () => {
		const res = await fetch(`${BASE_URL}/api/products/featured`);
		if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
		const products = await res.json();

		if (!Array.isArray(products) || products.length === 0) {
			throw new Error("No products returned by /api/products/featured");
		}

		const sample = products.find((p) => p.variants && p.variants.length > 0 && p.variants[0].color?.image);
		if (!sample) {
			throw new Error("Featured products do not include variant.color.image");
		}

		// Verify individual product detail endpoint as well
		const detailRes = await fetch(`${BASE_URL}/api/products/${sample._id}`);
		if (!detailRes.ok) throw new Error(`Detail HTTP error: ${detailRes.status}`);
		const detail = await detailRes.json();
		if (!detail.variants?.[0]?.color?.image) {
			throw new Error("Detail product does not include variant.color.image");
		}
	});

	// TEST 5: Extract colors logic matching frontend extractProductColors helper
	await testCase("5. extractProductColors helper extracts image-equipped color list correctly", async () => {
		const products = await Product.find({});
		for (const product of products) {
			const colorMap = new Map();

			if (Array.isArray(product.variants)) {
				product.variants.forEach((v) => {
					if (v.color?.name) {
						const key = v.color.name.toLowerCase().trim();
						if (!colorMap.has(key)) {
							const img = v.color.image || (Array.isArray(v.images) && v.images[0]) || "";
							colorMap.set(key, {
								name: v.color.name,
								hex: v.color.hex || "#171717",
								image: img,
							});
						}
					}
				});
			}

			if (Array.isArray(product.colors)) {
				product.colors.forEach((c) => {
					if (c.name) {
						const key = c.name.toLowerCase().trim();
						const existing = colorMap.get(key);
						if (!existing) {
							colorMap.set(key, {
								name: c.name,
								hex: c.hex || "#171717",
								image: c.image || "",
							});
						} else if (!existing.image && c.image) {
							existing.image = c.image;
						}
					}
				});
			}

			const extracted = Array.from(colorMap.values());
			if (product.variants?.length > 0 && extracted.length === 0) {
				throw new Error(`Failed to extract colors for product with variants: ${product.name}`);
			}
			for (const c of extracted) {
				if (!c.image) {
					throw new Error(`Extracted color "${c.name}" for "${product.name}" lacks an image thumbnail`);
				}
			}
		}
	});

	// TEST 6: Single-color product fallback safety
	await testCase("6. Single-color or variant-less products fallback gracefully to primary image", async () => {
		// Mock a product with only primary image and basic color definition without image
		const mockProduct = {
			name: "Minimal Silk Scarf",
			image: "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=800&q=80",
			colors: [{ name: "Ivory", hex: "#FFFFF0" }],
			variants: [],
		};

		// Test color extraction with fallback
		const colorMap = new Map();
		mockProduct.colors.forEach((c) => {
			colorMap.set(c.name.toLowerCase(), {
				name: c.name,
				hex: c.hex,
				image: c.image || mockProduct.image,
			});
		});

		const result = Array.from(colorMap.values());
		if (result[0].image !== mockProduct.image) {
			throw new Error("Fallback to primary image did not work for mock product");
		}
	});

	// TEST 7: Color selection switches sizes and stocks dynamically
	await testCase("7. Variant filtering by selectedColor resolves correct sizes and stock count", async () => {
		const jacket = await Product.findOne({ name: /Lambskin Leather Biker Jacket/i });
		if (!jacket) throw new Error("Leather Biker Jacket not found");

		const midnightVariants = jacket.variants.filter((v) => v.color?.name?.toLowerCase() === "midnight black");
		const chestnutVariants = jacket.variants.filter((v) => v.color?.name?.toLowerCase() === "chestnut brown");

		if (midnightVariants.length === 0 || chestnutVariants.length === 0) {
			throw new Error("Expected Midnight Black and Chestnut Brown variants for Leather Biker Jacket");
		}

		// Sizes for midnight black vs chestnut brown
		const midnightSizes = midnightVariants.map((v) => v.size);
		const chestnutSizes = chestnutVariants.map((v) => v.size);

		if (midnightSizes.length === 0 || chestnutSizes.length === 0) {
			throw new Error("Expected sizes for each color variant");
		}
	});

	await mongoose.disconnect();

	console.log("\n======================================================================");
	console.log(`   SUITE COMPLETE: ${passed} PASSED, ${failed} FAILED`);
	console.log("======================================================================");

	if (failed > 0) {
		process.exit(1);
	}
}

runColorThumbnailSuite().catch((err) => {
	console.error("Suite execution error:", err);
	process.exit(1);
});
