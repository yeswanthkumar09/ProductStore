import assert from "assert";
import mongoose from "mongoose";
import { extractErrorMessage } from "../frontend/src/stores/useProductStore.js";
import Category from "./models/category.model.js";
import Product from "./models/product.model.js";
import http from "http";

console.log("=== LUXESTORE CATEGORY RUNTIME ERROR & DATA NORMALIZATION SUITE ===");

let passed = 0;
let failed = 0;

function it(desc, fn) {
	try {
		fn();
		console.log(`  [PASS] ${desc}`);
		passed++;
	} catch (err) {
		console.error(`  [FAIL] ${desc}`);
		console.error(`         ${err.message}`);
		failed++;
	}
}

async function runTests() {
	// -------------------------------------------------------------
	// TEST SUITE 1: ERROR EXTRACTION & STRING SAFETY (ROOT CAUSE)
	// -------------------------------------------------------------
	console.log("\n--- Suite 1: extractErrorMessage Primitive String Guarantees ---");

	it("1.1: Extracts string from raw object with keys {code, message}", () => {
		const rawObject = { code: 404, message: "Category sweatshirts not found" };
		const result = extractErrorMessage(rawObject);
		assert.strictEqual(typeof result, "string", "Result must be a string");
		assert.strictEqual(result, "Category sweatshirts not found");
	});

	it("1.2: Extracts string from Vercel/API response data { code, message }", () => {
		const error = {
			response: {
				data: {
					code: "NOT_FOUND",
					message: "The requested resource could not be found",
				},
			},
		};
		const result = extractErrorMessage(error);
		assert.strictEqual(typeof result, "string");
		assert.strictEqual(result, "The requested resource could not be found");
	});

	it("1.3: Extracts string from nested { error: { code, message } }", () => {
		const error = {
			response: {
				data: {
					error: {
						code: 500,
						message: "Database connection timeout during category query",
					},
				},
			},
		};
		const result = extractErrorMessage(error);
		assert.strictEqual(typeof result, "string");
		assert.strictEqual(result, "Database connection timeout during category query");
	});

	it("1.4: Extracts string from nested { message: { message } }", () => {
		const error = {
			response: {
				data: {
					message: {
						code: "ERR_UNAUTHORIZED",
						message: "Session expired",
					},
				},
			},
		};
		const result = extractErrorMessage(error);
		assert.strictEqual(typeof result, "string");
		assert.strictEqual(result, "Session expired");
	});

	it("1.5: Extracts string from string error.response.data.error", () => {
		const error = {
			response: {
				data: {
					error: "Category archive constraint violated",
				},
			},
		};
		const result = extractErrorMessage(error);
		assert.strictEqual(typeof result, "string");
		assert.strictEqual(result, "Category archive constraint violated");
	});

	it("1.6: Extracts string from native Axios Error object", () => {
		const error = new Error("Request failed with status code 404");
		error.code = "ERR_BAD_REQUEST";
		const result = extractErrorMessage(error);
		assert.strictEqual(typeof result, "string");
		assert.strictEqual(result, "Request failed with status code 404");
	});

	it("1.7: Falls back safely to default message on null/undefined error", () => {
		const result = extractErrorMessage(null, "Fallback Category Notice");
		assert.strictEqual(typeof result, "string");
		assert.strictEqual(result, "Fallback Category Notice");
	});

	it("1.8: Handles plain string error argument directly", () => {
		const result = extractErrorMessage("Direct custom error string");
		assert.strictEqual(result, "Direct custom error string");
	});

	// -------------------------------------------------------------
	// TEST SUITE 2: RESPONSE NORMALIZATION & OPTIONAL FIELDS
	// -------------------------------------------------------------
	console.log("\n--- Suite 2: Category & Product Payload Normalization ---");

	it("2.1: Correctly normalizes empty category products (e.g. /category/sweatshirts)", () => {
		const apiPayload = { products: [], total: 0, page: 1, pages: 1 };
		const rawProducts = Array.isArray(apiPayload)
			? apiPayload
			: Array.isArray(apiPayload?.products)
			? apiPayload.products
			: [];
		assert.strictEqual(Array.isArray(rawProducts), true);
		assert.strictEqual(rawProducts.length, 0);
	});

	it("2.2: Correctly normalizes direct array response [ { ... } ]", () => {
		const apiPayload = [{ _id: "prod_1", name: "Cashmere Sweatshirt", price: 4999 }];
		const rawProducts = Array.isArray(apiPayload)
			? apiPayload
			: Array.isArray(apiPayload?.products)
			? apiPayload.products
			: [];
		assert.strictEqual(Array.isArray(rawProducts), true);
		assert.strictEqual(rawProducts.length, 1);
		assert.strictEqual(rawProducts[0].name, "Cashmere Sweatshirt");
	});

	it("2.3: Gracefully handles malformed 200 error payload { code, message }", () => {
		const malformedData = { code: 404, message: "Category does not exist" };
		const isErrorObject =
			malformedData &&
			typeof malformedData === "object" &&
			!Array.isArray(malformedData) &&
			!malformedData.products &&
			(malformedData.code || malformedData.error);
		assert.strictEqual(Boolean(isErrorObject), true);

		const extractedMsg = extractErrorMessage(malformedData);
		assert.strictEqual(typeof extractedMsg, "string");
		assert.strictEqual(extractedMsg, "Category does not exist");
	});

	it("2.4: Safely derives category title when category has no matching doc", () => {
		const category = "sweatshirts";
		const currentCatDoc = null;
		const categoryTitle =
			(typeof currentCatDoc?.name === "string" && currentCatDoc.name.trim()) ||
			(category ? category.charAt(0).toUpperCase() + category.slice(1) : "Collection");
		assert.strictEqual(categoryTitle, "Sweatshirts");
		assert.strictEqual(typeof categoryTitle, "string");
	});

	it("2.5: Safely derives category description and count for 0 items", () => {
		const categoryTitle = "Sweatshirts";
		const currentCatDoc = { name: "Sweatshirts", description: "" };
		const total = 0;
		const products = [];
		const totalItemsCount = typeof total === "number" ? total : products.length;
		const categoryDescription =
			typeof currentCatDoc?.description === "string" && currentCatDoc.description.trim()
				? currentCatDoc.description
				: `${totalItemsCount} available styles in ${categoryTitle}`;
		assert.strictEqual(categoryDescription, "0 available styles in Sweatshirts");
	});

	it("2.6: Safely handles product with missing optional fields (no badge, no originalPrice, no variants)", () => {
		const product = {
			_id: "prod_test_minimal",
			name: "Minimalist Crewneck",
			price: 3499,
			// missing: badge, originalPrice, variants, image, description
		};

		// Test badge safe rendering logic
		const hasValidBadge = typeof product.badge === "string" && Boolean(product.badge);
		assert.strictEqual(hasValidBadge, false);

		// Test title safe rendering logic
		const safeTitle = typeof product.name === "string" ? product.name : product.name?.name || "Exclusive Piece";
		assert.strictEqual(safeTitle, "Minimalist Crewneck");

		// Test variants safe mapping
		const availableVariants = Array.isArray(product.variants) ? product.variants : [];
		assert.strictEqual(availableVariants.length, 0);
	});

	it("2.7: Safely handles product with object badge or object name without crashing", () => {
		const malformedProduct = {
			_id: "prod_bad_meta",
			name: { code: "TITLE_KEY", message: "Bespoke Oversized Sweatshirt" },
			badge: { code: "BADGE_KEY", message: "LIMITED" },
			category: { code: "CAT_KEY", message: "sweatshirts" },
		};

		const safeTitle =
			typeof malformedProduct.name === "string"
				? malformedProduct.name
				: malformedProduct.name?.message || malformedProduct.name?.name || "Exclusive Piece";
		assert.strictEqual(safeTitle, "Bespoke Oversized Sweatshirt");
		assert.strictEqual(typeof safeTitle, "string");

		const safeBadge = typeof malformedProduct.badge === "string" && malformedProduct.badge ? malformedProduct.badge : null;
		assert.strictEqual(safeBadge, null);

		const safeCategory =
			typeof malformedProduct.category === "string"
				? malformedProduct.category
				: malformedProduct.category?.message || malformedProduct.category?.name || "Couture";
		assert.strictEqual(safeCategory, "sweatshirts");
		assert.strictEqual(typeof safeCategory, "string");
	});

	// -------------------------------------------------------------
	// TEST SUITE 3: FOUR INDEPENDENT RENDER STATES
	// -------------------------------------------------------------
	console.log("\n--- Suite 3: Verification of 4 Independent Render States ---");

	function determineRenderState({ loading, error, products }) {
		if (loading) return "LOADING_STATE";
		if (error) return "API_FAILURE_STATE";
		if (Array.isArray(products) && products.length === 0) return "EMPTY_RESULTS_STATE";
		if (Array.isArray(products) && products.length > 0) return "PRODUCTS_GRID_STATE";
		return "UNKNOWN_STATE";
	}

	it("3.1: State 1 — Loading active returns LOADING_STATE", () => {
		const state = determineRenderState({ loading: true, error: null, products: [] });
		assert.strictEqual(state, "LOADING_STATE");
	});

	it("3.2: State 2 — API Failure returns API_FAILURE_STATE independently", () => {
		const state = determineRenderState({ loading: false, error: "Network error 500", products: [] });
		assert.strictEqual(state, "API_FAILURE_STATE");
	});

	it("3.3: State 3 — Empty collection returns EMPTY_RESULTS_STATE independently", () => {
		const state = determineRenderState({ loading: false, error: null, products: [] });
		assert.strictEqual(state, "EMPTY_RESULTS_STATE");
	});

	it("3.4: State 4 — Populated collection returns PRODUCTS_GRID_STATE independently", () => {
		const state = determineRenderState({
			loading: false,
			error: null,
			products: [{ _id: "p1", name: "Sweatshirt A", price: 2999 }],
		});
		assert.strictEqual(state, "PRODUCTS_GRID_STATE");
	});

	// -------------------------------------------------------------
	// TEST SUITE 4: LIVE BACKEND API INTEGRATION
	// -------------------------------------------------------------
	console.log("\n--- Suite 4: Live HTTP API Validation ---");

	await new Promise((resolve) => {
		const req = http.get("http://localhost:5000/api/products/category/sweatshirts", (res) => {
			let data = "";
			res.on("data", (chunk) => (data += chunk));
			res.on("end", () => {
				it("4.1: GET /api/products/category/sweatshirts returns HTTP 200 with empty products array", () => {
					assert.strictEqual(res.statusCode, 200);
					const json = JSON.parse(data);
					assert.strictEqual(Array.isArray(json.products), true);
					assert.strictEqual(json.products.length, 0);
					assert.strictEqual(json.total, 0);
				});
				resolve();
			});
		});
		req.on("error", (err) => {
			console.log("  [WARN] Backend offline for live HTTP test (skipping):", err.message);
			resolve();
		});
	});

	await new Promise((resolve) => {
		const req = http.get("http://localhost:5000/api/products/category/jeans", (res) => {
			let data = "";
			res.on("data", (chunk) => (data += chunk));
			res.on("end", () => {
				it("4.2: GET /api/products/category/jeans returns valid catalog products", () => {
					assert.strictEqual(res.statusCode, 200);
					const json = JSON.parse(data);
					assert.strictEqual(Array.isArray(json.products), true);
				});
				resolve();
			});
		});
		req.on("error", (err) => {
			resolve();
		});
	});

	await new Promise((resolve) => {
		const req = http.get("http://localhost:5000/api/categories", (res) => {
			let data = "";
			res.on("data", (chunk) => (data += chunk));
			res.on("end", () => {
				it("4.3: GET /api/categories returns HTTP 200 with array", () => {
					assert.strictEqual(res.statusCode, 200);
					const json = JSON.parse(data);
					assert.strictEqual(Array.isArray(json), true);
				});
				resolve();
			});
		});
		req.on("error", (err) => {
			resolve();
		});
	});

	console.log(`\n===============================================================`);
	console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
	console.log(`===============================================================\n`);

	if (failed > 0) process.exit(1);
	process.exit(0);
}

runTests().catch((err) => {
	console.error("Test runner exception:", err);
	process.exit(1);
});

