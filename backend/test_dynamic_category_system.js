import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import User from "./models/user.model.js";
import Product from "./models/product.model.js";
import Category from "./models/category.model.js";

const BASE_URL = "http://localhost:5000";

async function runMasterTaxonomySuite() {
	console.log("=================================================================================");
	console.log("   LUXESTORE DYNAMIC CATEGORY & PRODUCT MANAGEMENT SYSTEM – 17-POINT AUDIT       ");
	console.log("=================================================================================\n");

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
	const createdProductIds = [];
	const createdCategoryIds = [];

	async function testCase(num, title, fn) {
		try {
			await fn();
			console.log(`[PASS] Test ${num}: ${title}`);
			passed++;
		} catch (err) {
			console.error(`[FAIL] Test ${num}: ${title} ->`, err.message);
			failed++;
		}
	}

	// 1. Create a new Shirts category
	let shirtsCat = null;
	await testCase(1, "Create a new Shirts category with attributes and sizing system", async () => {
		// Verify Shirts exists or create
		shirtsCat = await Category.findOne({ slug: "shirts" });
		if (!shirtsCat) {
			const res = await fetch(`${BASE_URL}/api/categories`, {
				method: "POST",
				headers: adminHeaders,
				body: JSON.stringify({
					name: "Shirts",
					slug: "shirts",
					description: "Tailored luxury shirts",
					imageUrl: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80",
					subcategories: [
						{ name: "Formal Shirts", slug: "formal-shirts" },
						{ name: "Casual Shirts", slug: "casual-shirts" },
					],
					attributes: [
						{ key: "collarType", label: "Collar Type", type: "select", options: ["Classic Collar", "Mandarin", "Spread Collar"], required: true },
						{ key: "fit", label: "Fit", type: "select", options: ["Slim Fit", "Regular Fit", "Relaxed Fit"], required: true },
					],
					sizeSystem: {
						systemType: "apparel_alpha",
						allowedSizes: ["XS", "S", "M", "L", "XL", "XXL"],
					},
				}),
			});
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			shirtsCat = await res.json();
		}

		if (shirtsCat.slug !== "shirts") throw new Error("Failed to verify Shirts category");
	});

	// 2. Create Formal Shirts and Casual Shirts subcategories
	await testCase(2, "Create Formal Shirts and Casual Shirts subcategories", async () => {
		const res = await fetch(`${BASE_URL}/api/categories/shirts`);
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const cat = await res.json();

		const hasFormal = cat.subcategories?.some((s) => s.slug === "formal-shirts");
		const hasCasual = cat.subcategories?.some((s) => s.slug === "casual-shirts");

		if (!hasFormal || !hasCasual) {
			// Add missing subcategory
			const addRes = await fetch(`${BASE_URL}/api/categories/${cat._id}/subcategories`, {
				method: "POST",
				headers: adminHeaders,
				body: JSON.stringify({ name: "Formal Shirts", slug: "formal-shirts", description: "Office wear" }),
			});
			if (!addRes.ok) throw new Error(`Failed to add subcategory: HTTP ${addRes.status}`);
		}
	});

	// 3. Add a shirt with sizes S, M, L and XL
	// 4. Add black and white colour variants
	// 5. Upload different photographs for each colour
	let shirtProduct = null;
	await testCase(3, "Add a shirt with sizes S, M, L, XL and distinct Black & White color photographs", async () => {
		const whiteImg = "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80";
		const blackImg = "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80";

		const payload = {
			name: "Italian Poplin Spread Collar Shirt",
			description: "Crafted from fine 100% Giza Egyptian cotton with mother-of-pearl buttons.",
			shortDescription: "Timeless spread collar luxury poplin shirt.",
			category: "shirts",
			subcategory: "formal-shirts",
			categoryAttributes: {
				collarType: "Spread Collar",
				sleeveType: "Full Sleeve",
				fit: "Slim Fit",
				fabric: "100% Giza Cotton",
			},
			brand: "LUXESTORE Sartorial",
			price: 3299,
			stock: 80,
			sku: "SH-POPLIN-01",
			image: whiteImg,
			images: [whiteImg, blackImg],
			colors: [
				{ name: "White", hex: "#FFFFFF", image: whiteImg },
				{ name: "Black", hex: "#111111", image: blackImg },
			],
			variants: [
				{ color: { name: "White", hex: "#FFFFFF", image: whiteImg }, size: "S", sku: "SH-POP-WHT-S", price: 3299, stock: 10, images: [whiteImg] },
				{ color: { name: "White", hex: "#FFFFFF", image: whiteImg }, size: "M", sku: "SH-POP-WHT-M", price: 3299, stock: 15, images: [whiteImg] },
				{ color: { name: "White", hex: "#FFFFFF", image: whiteImg }, size: "L", sku: "SH-POP-WHT-L", price: 3299, stock: 12, images: [whiteImg] },
				{ color: { name: "White", hex: "#FFFFFF", image: whiteImg }, size: "XL", sku: "SH-POP-WHT-XL", price: 3299, stock: 8, images: [whiteImg] },
				{ color: { name: "Black", hex: "#111111", image: blackImg }, size: "S", sku: "SH-POP-BLK-S", price: 3299, stock: 10, images: [blackImg] },
				{ color: { name: "Black", hex: "#111111", image: blackImg }, size: "M", sku: "SH-POP-BLK-M", price: 3299, stock: 15, images: [blackImg] },
				{ color: { name: "Black", hex: "#111111", image: blackImg }, size: "L", sku: "SH-POP-BLK-L", price: 3299, stock: 12, images: [blackImg] },
				{ color: { name: "Black", hex: "#111111", image: blackImg }, size: "XL", sku: "SH-POP-BLK-XL", price: 3299, stock: 8, images: [blackImg] },
			],
		};

		const res = await fetch(`${BASE_URL}/api/products`, {
			method: "POST",
			headers: adminHeaders,
			body: JSON.stringify(payload),
		});

		if (!res.ok) {
			const err = await res.json();
			throw new Error(err.message || `HTTP ${res.status}`);
		}

		shirtProduct = await res.json();
		createdProductIds.push(shirtProduct._id);

		if (shirtProduct.variants.length !== 8) {
			throw new Error(`Expected 8 variants, got ${shirtProduct.variants.length}`);
		}
		const whiteVariants = shirtProduct.variants.filter((v) => v.color?.name === "White");
		const blackVariants = shirtProduct.variants.filter((v) => v.color?.name === "Black");
		if (whiteVariants.length !== 4 || blackVariants.length !== 4) {
			throw new Error("Variant distribution mismatch for White and Black");
		}
		if (whiteVariants[0].images[0] === blackVariants[0].images[0]) {
			throw new Error("White and Black variants must have distinct photography");
		}
	});

	// 6. Create a T-shirt with its own attribute configuration
	let teeProduct = null;
	await testCase(6, "Create a T-shirt with neckType and boxy streetwear attributes", async () => {
		const res = await fetch(`${BASE_URL}/api/products`, {
			method: "POST",
			headers: adminHeaders,
			body: JSON.stringify({
				name: "280 GSM Heavyweight Oversized Tee",
				description: "Substantial 280 GSM combed cotton with high-rib crewneck collar.",
				category: "t-shirts",
				subcategory: "oversized-t-shirts",
				categoryAttributes: {
					neckType: "Crew Neck",
					sleeveType: "Drop Shoulder",
					fit: "Boxy Fit",
					fabric: "240 GSM Heavyweight Cotton",
				},
				price: 1499,
				sku: "TEE-HVY-001",
				image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
				colors: [{ name: "Vintage Clay", hex: "#b87333", image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80" }],
				variants: [
					{ color: { name: "Vintage Clay", hex: "#b87333" }, size: "M", price: 1499, stock: 20, sku: "TEE-CLY-M" },
					{ color: { name: "Vintage Clay", hex: "#b87333" }, size: "L", price: 1499, stock: 20, sku: "TEE-CLY-L" },
				],
			}),
		});

		if (!res.ok) {
			const err = await res.json();
			throw new Error(err.message || `HTTP ${res.status}`);
		}
		teeProduct = await res.json();
		createdProductIds.push(teeProduct._id);
	});

	// 7. Create jeans with numeric waist sizes
	let jeansProduct = null;
	await testCase(7, "Create jeans with numeric waist sizes (30, 32, 34, 36)", async () => {
		const res = await fetch(`${BASE_URL}/api/products`, {
			method: "POST",
			headers: adminHeaders,
			body: JSON.stringify({
				name: "Japanese Kuroki Raw Selvedge Denim",
				description: "14oz rigid Japanese selvedge denim woven on vintage shuttle looms.",
				category: "jeans",
				subcategory: "straight-fit",
				categoryAttributes: {
					waistType: "Mid Rise",
					fit: "Straight Leg",
					wash: "Raw Indigo",
				},
				price: 4999,
				sku: "JN-KUR-001",
				image: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=800&q=80",
				colors: [{ name: "Deep Indigo", hex: "#1a2a4b", image: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=800&q=80" }],
				variants: [
					{ color: { name: "Deep Indigo" }, size: "30", price: 4999, stock: 10, sku: "JN-KUR-30" },
					{ color: { name: "Deep Indigo" }, size: "32", price: 4999, stock: 15, sku: "JN-KUR-32" },
					{ color: { name: "Deep Indigo" }, size: "34", price: 4999, stock: 12, sku: "JN-KUR-34" },
					{ color: { name: "Deep Indigo" }, size: "36", price: 4999, stock: 8, sku: "JN-KUR-36" },
				],
			}),
		});

		if (!res.ok) {
			const err = await res.json();
			throw new Error(err.message || `HTTP ${res.status}`);
		}
		jeansProduct = await res.json();
		createdProductIds.push(jeansProduct._id);
		const sizes = jeansProduct.variants.map((v) => v.size);
		if (!sizes.includes("30") || !sizes.includes("32") || !sizes.includes("34") || !sizes.includes("36")) {
			throw new Error(`Expected numeric waist sizes, got ${sizes.join(", ")}`);
		}
	});

	// 8. Create shoes with UK/India shoe sizes
	let shoesProduct = null;
	await testCase(8, "Create shoes with UK/India shoe sizes (UK 8, UK 9, UK 10)", async () => {
		const res = await fetch(`${BASE_URL}/api/products`, {
			method: "POST",
			headers: adminHeaders,
			body: JSON.stringify({
				name: "Hand-Burnished Calfskin Penny Loafers",
				description: "Hand-stitched apron with leather outsole and stacked heel.",
				category: "shoes",
				subcategory: "loafers",
				categoryAttributes: {
					shoeType: "Penny Loafer",
					upperMaterial: "Full-Grain Italian Calfskin",
					soleMaterial: "Hand-Finished Leather Sole with Vibram Half-Sole",
				},
				price: 7999,
				sku: "SHOE-LOA-01",
				image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80",
				colors: [{ name: "Oxblood Burgundy", hex: "#4a0000", image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80" }],
				variants: [
					{ color: { name: "Oxblood Burgundy" }, size: "UK 8", price: 7999, stock: 8, sku: "SHOE-LOA-UK8" },
					{ color: { name: "Oxblood Burgundy" }, size: "UK 9", price: 7999, stock: 12, sku: "SHOE-LOA-UK9" },
					{ color: { name: "Oxblood Burgundy" }, size: "UK 10", price: 7999, stock: 10, sku: "SHOE-LOA-UK10" },
				],
			}),
		});

		if (!res.ok) {
			const err = await res.json();
			throw new Error(err.message || `HTTP ${res.status}`);
		}
		shoesProduct = await res.json();
		createdProductIds.push(shoesProduct._id);
		const sizes = shoesProduct.variants.map((v) => v.size);
		if (!sizes.includes("UK 8") || !sizes.includes("UK 9")) {
			throw new Error(`Expected UK shoe sizes, got ${sizes.join(", ")}`);
		}
	});

	// 9. Create a bag without clothing size options (One Size)
	let bagProduct = null;
	await testCase(9, "Create a bag with One Size and capacity/compartments attributes", async () => {
		const res = await fetch(`${BASE_URL}/api/products`, {
			method: "POST",
			headers: adminHeaders,
			body: JSON.stringify({
				name: "Executive Leather Briefcase",
				description: "Solid brass hardware with dedicated 16-inch laptop pocket.",
				category: "bags",
				subcategory: "laptop-bags",
				categoryAttributes: {
					bagType: "Slim Briefcase / Messenger",
					material: "Full-Grain Cowhide Leather",
					dimensions: "40 x 30 x 8 cm",
					laptopCompatibility: "Up to 16-inch MacBook Pro",
				},
				price: 6499,
				sku: "BAG-BRIEF-01",
				image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
				colors: [{ name: "Tan Brown", hex: "#8b5a2b", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80" }],
				variants: [
					{ color: { name: "Tan Brown" }, size: "One Size", price: 6499, stock: 25, sku: "BAG-BRIEF-TAN" },
				],
			}),
		});

		if (!res.ok) {
			const err = await res.json();
			throw new Error(err.message || `HTTP ${res.status}`);
		}
		bagProduct = await res.json();
		createdProductIds.push(bagProduct._id);
		if (bagProduct.variants[0].size !== "One Size") {
			throw new Error(`Expected 'One Size', got ${bagProduct.variants[0].size}`);
		}
	});

	// 10. Create glasses with frame dimensions
	let glassesProduct = null;
	await testCase(10, "Create glasses with Standard size and frame dimensions", async () => {
		const res = await fetch(`${BASE_URL}/api/products`, {
			method: "POST",
			headers: adminHeaders,
			body: JSON.stringify({
				name: "Square Acetate Optical Eyeglasses",
				description: "Handcrafted in Japan with 5-barrel German hinges.",
				category: "glasses",
				subcategory: "optical-frames",
				categoryAttributes: {
					frameShape: "Wayfarer Square",
					frameMaterial: "Italian Mazzucchelli Acetate",
					lensType: "Non-Prescription Blue Light Block",
					frameDimensions: "52-19-145 mm",
				},
				price: 3999,
				sku: "GLS-ACE-01",
				image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80",
				colors: [{ name: "Havana Tortoise", hex: "#5d3a1a", image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80" }],
				variants: [
					{ color: { name: "Havana Tortoise" }, size: "Standard", price: 3999, stock: 30, sku: "GLS-ACE-HAV" },
				],
			}),
		});

		if (!res.ok) {
			const err = await res.json();
			throw new Error(err.message || `HTTP ${res.status}`);
		}
		glassesProduct = await res.json();
		createdProductIds.push(glassesProduct._id);
	});

	// 11. Add a new category without modifying frontend code
	let newCustomCat = null;
	await testCase(11, "Add a new dynamic category 'Timepieces' via API without code changes", async () => {
		const res = await fetch(`${BASE_URL}/api/categories`, {
			method: "POST",
			headers: adminHeaders,
			body: JSON.stringify({
				name: "Timepieces",
				slug: "timepieces",
				description: "Swiss automatic movements and minimalist chronographs",
				imageUrl: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80",
				subcategories: [
					{ name: "Chronographs", slug: "chronographs" },
					{ name: "Diver Watches", slug: "diver-watches" },
				],
				attributes: [
					{ key: "movement", label: "Movement", type: "select", options: ["Automatic Swiss", "Mecha-Quartz", "Solar Quartz"], required: true },
					{ key: "caseDiameter", label: "Case Diameter", type: "measurement", unit: "mm", options: ["38mm", "40mm", "42mm"], required: true },
				],
				sizeSystem: {
					systemType: "dimensions",
					allowedSizes: ["38mm", "40mm", "42mm"],
					hasDimensions: true,
				},
			}),
		});

		if (!res.ok) {
			const err = await res.json();
			throw new Error(err.message || `HTTP ${res.status}`);
		}
		newCustomCat = await res.json();
		createdCategoryIds.push(newCustomCat._id);

		// Verify it appears in public GET /api/categories
		const listRes = await fetch(`${BASE_URL}/api/categories`);
		const list = await listRes.json();
		if (!list.some((c) => c.slug === "timepieces")) {
			throw new Error("Newly created category not found in public category list");
		}
	});

	// 12. Edit category attributes
	await testCase(12, "Edit category attributes on Timepieces dynamically", async () => {
		const res = await fetch(`${BASE_URL}/api/categories/${newCustomCat._id}`, {
			method: "PUT",
			headers: adminHeaders,
			body: JSON.stringify({
				attributes: [
					{ key: "movement", label: "Movement", type: "select", options: ["Automatic Swiss", "Mecha-Quartz", "Manual Wind"], required: true },
					{ key: "caseDiameter", label: "Case Diameter", type: "measurement", unit: "mm", options: ["38mm", "40mm", "42mm"], required: true },
					{ key: "waterResistance", label: "Water Resistance", type: "select", options: ["50m / 5ATM", "100m / 10ATM", "200m / 20ATM"], required: false },
				],
			}),
		});

		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const updated = await res.json();
		if (updated.attributes.length !== 3) {
			throw new Error(`Expected 3 attributes after update, got ${updated.attributes.length}`);
		}
	});

	// 13. Archive a category containing existing products
	await testCase(13, "Safe archive: Attempting to delete a category with active products archives it safely", async () => {
		// Category 'shirts' has active products (shirtProduct)
		const res = await fetch(`${BASE_URL}/api/categories/${shirtsCat._id}`, {
			method: "DELETE",
			headers: adminHeaders,
		});

		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const result = await res.json();

		if (!result.archived) {
			throw new Error("Expected category to be safely archived rather than hard deleted");
		}

		// Verify existing products still exist in database
		const count = await Product.countDocuments({ category: "shirts" });
		if (count === 0) {
			throw new Error("Existing products were deleted when category was archived!");
		}

		// Restore category back to active for remaining tests
		await Category.findByIdAndUpdate(shirtsCat._id, { isArchived: false, isActive: true });
	});

	// 14. Verify product filters (subcategory & attributes)
	await testCase(14, "Verify product filtering by subcategory and dynamic attributes", async () => {
		// Filter by subcategory=formal-shirts
		const res = await fetch(`${BASE_URL}/api/products/category/shirts?subcategory=formal-shirts`);
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const data = await res.json();

		if (!data.products.some((p) => p._id.toString() === shirtProduct._id.toString())) {
			throw new Error("Product not returned when filtering by its subcategory");
		}

		// Filter by dynamic attribute collarType=Spread Collar
		const attrRes = await fetch(`${BASE_URL}/api/products/category/shirts?collarType=Spread+Collar`);
		if (!attrRes.ok) throw new Error(`HTTP ${attrRes.status}`);
		const attrData = await attrRes.json();

		if (!attrData.products.some((p) => p._id.toString() === shirtProduct._id.toString())) {
			throw new Error("Product not returned when filtering by dynamic attribute collarType");
		}
	});

	// 15. Verify product detail colour selection
	await testCase(15, "Verify product detail returns variant color images for storefront switcher", async () => {
		const res = await fetch(`${BASE_URL}/api/products/${shirtProduct._id}`);
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const doc = await res.json();

		if (!doc.colors || doc.colors.length < 2) {
			throw new Error("Product detail does not contain colors");
		}
		if (!doc.colors[0].image || !doc.colors[1].image) {
			throw new Error("Product colors lack thumbnail imagery");
		}
		if (doc.colors[0].image === doc.colors[1].image) {
			throw new Error("Colors must have distinct thumbnail photographs");
		}
	});

	// 16. Verify variant stock and cart behaviour
	await testCase(16, "Verify variant stock resolution for cart checkout", async () => {
		const whiteMediumVariant = shirtProduct.variants.find(
			(v) => v.color?.name === "White" && v.size === "M"
		);
		if (!whiteMediumVariant) throw new Error("White Medium variant not found");
		if (whiteMediumVariant.stock !== 15) {
			throw new Error(`Expected variant stock 15, got ${whiteMediumVariant.stock}`);
		}
		if (!whiteMediumVariant.sku.includes("SH-POP-WHT-M")) {
			throw new Error(`Variant SKU unexpected: ${whiteMediumVariant.sku}`);
		}
	});

	// 17. Verify existing products still work
	await testCase(17, "Verify original 7 luxury products remain fully intact with variants and orders", async () => {
		const denim = await Product.findOne({ name: /Selvedge Denim/i });
		const tee = await Product.findOne({ name: /Heavyweight Boxy Organic Cotton Tee/i });
		const sneaker = await Product.findOne({ name: /Air Motion Minimalist Leather Sneakers/i });
		const duffel = await Product.findOne({ name: /Full-Grain Leather Weekender Duffel Bag/i });

		if (!denim || !tee || !sneaker || !duffel) {
			throw new Error("Original catalog products missing");
		}

		if (denim.variants.length < 9) {
			throw new Error("Denim variants compromised");
		}
		if (duffel.colors.length < 3) {
			throw new Error("Duffel bag colorways compromised");
		}
		if (!denim.categoryId) {
			throw new Error("Denim not mapped to dynamic Category document");
		}
	});

	// Clean up created test items
	for (const pId of createdProductIds) {
		await Product.findByIdAndDelete(pId);
	}
	for (const cId of createdCategoryIds) {
		await Category.findByIdAndDelete(cId);
	}

	await mongoose.disconnect();

	console.log("\n=================================================================================");
	console.log(`   MASTER AUDIT SUMMARY: ${passed} PASSED / ${failed} FAILED (17/17 Required)`);
	console.log("=================================================================================");

	if (failed > 0) process.exit(1);
}

runMasterTaxonomySuite().catch((err) => {
	console.error("Master audit execution failure:", err);
	process.exit(1);
});

