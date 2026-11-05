/**
 * test_vercel_serverless_suite.js
 *
 * Automated Verification Suite for LUXESTORE Vercel Serverless Deployment Architecture.
 * Verifies Express application decoupling, serverless entrypoint, connection caching,
 * raw-body preservation, strict CORS policy, cross-site cookie configuration, and vercel.json.
 */

import fs from "fs";
import path from "path";
import http from "http";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

let passed = 0;
let failed = 0;

function assert(condition, description) {
	if (condition) {
		console.log(`  ✅ PASS: ${description}`);
		passed++;
	} else {
		console.error(`  ❌ FAIL: ${description}`);
		failed++;
	}
}

async function runSuite() {
	console.log("\n==========================================================================");
	console.log("  LUXESTORE VERCEL SERVERLESS ARCHITECTURE VERIFICATION SUITE");
	console.log("==========================================================================\n");

	// -------------------------------------------------------------------------
	// 1. Separation of Express App from Standalone Server
	// -------------------------------------------------------------------------
	console.log("--- 1. Architecture Separation (backend/app.js & backend/server.js) ---");

	const appJsPath = path.join(rootDir, "backend", "app.js");
	assert(fs.existsSync(appJsPath), "backend/app.js exists");

	const appJsContent = fs.readFileSync(appJsPath, "utf-8");
	assert(!appJsContent.includes("app.listen("), "backend/app.js does NOT call app.listen() (pure application export)");
	assert(appJsContent.includes("export default app") || appJsContent.includes("export { app }"), "backend/app.js exports Express application");
	assert(appJsContent.includes("app.set(\"trust proxy\""), "backend/app.js configures trust proxy for serverless environment");
	assert(appJsContent.includes("rawBody = buf"), "backend/app.js configures rawBody buffer capture for webhook HMAC verification");

	const serverJsPath = path.join(rootDir, "backend", "server.js");
	assert(fs.existsSync(serverJsPath), "backend/server.js exists for standalone execution");

	const serverJsContent = fs.readFileSync(serverJsPath, "utf-8");
	assert(serverJsContent.includes("from \"./app.js\"") || serverJsContent.includes("from './app.js'"), "backend/server.js imports app from ./app.js");
	assert(serverJsContent.includes("app.listen("), "backend/server.js calls app.listen() for local dev and containerized hosting");
	assert(serverJsContent.includes("SIGINT") && serverJsContent.includes("SIGTERM"), "backend/server.js retains graceful shutdown listeners");
	assert(serverJsContent.includes("app.get(\"/api/health\""), "backend/server.js retains /api/health endpoint signature");

	// Dynamically import app.js to confirm it loads without side effects
	const { app } = await import("./app.js");
	assert(typeof app === "function" && typeof app.use === "function", "backend/app.js exports valid Express application instance");

	// -------------------------------------------------------------------------
	// 2. Vercel Serverless Function Entry Point (api/index.js)
	// -------------------------------------------------------------------------
	console.log("\n--- 2. Vercel Serverless Function Entrypoint (api/index.js) ---");

	const apiIndexJsPath = path.join(rootDir, "api", "index.js");
	assert(fs.existsSync(apiIndexJsPath), "api/index.js exists at repository root");

	const apiIndexContent = fs.readFileSync(apiIndexJsPath, "utf-8");
	assert(apiIndexContent.includes("bodyParser: false"), "api/index.js exports config with bodyParser: false to prevent stream consumption");
	assert(apiIndexContent.includes("export default async function handler"), "api/index.js exports default async function handler(req, res)");
	assert(apiIndexContent.includes("connectDB()"), "api/index.js ensures database connection is established / reused");

	const serverlessModule = await import("../api/index.js");
	assert(typeof serverlessModule.default === "function", "api/index.js default export is an executable function");
	assert(serverlessModule.config?.api?.bodyParser === false, "api/index.js exports config.api.bodyParser === false");

	// -------------------------------------------------------------------------
	// 3. Database Connection Caching for Serverless Warm Lambdas
	// -------------------------------------------------------------------------
	console.log("\n--- 3. Database Connection Caching (backend/lib/db.js) ---");

	const dbJsPath = path.join(rootDir, "backend", "lib", "db.js");
	const dbJsContent = fs.readFileSync(dbJsPath, "utf-8");
	assert(dbJsContent.includes("global.mongooseConnection"), "backend/lib/db.js implements global.mongooseConnection caching");
	assert(dbJsContent.includes("mongoose.connection.readyState === 1"), "backend/lib/db.js checks readyState === 1 for instant connection return");
	assert(dbJsContent.includes("ensureDatabaseDefaults"), "backend/lib/db.js exports ensureDatabaseDefaults for decoupled seeding");
	assert(!dbJsContent.includes("setTimeout(connectDB, 10000)"), "backend/lib/db.js removed dangling retry timers that freeze serverless functions");

	const { connectDB, ensureDatabaseDefaults } = await import("./lib/db.js");
	assert(typeof connectDB === "function", "connectDB is exported from db.js");
	assert(typeof ensureDatabaseDefaults === "function", "ensureDatabaseDefaults is exported from db.js");

	// Test connection caching across consecutive invocations
	console.log("  Testing connection caching across simulated invocations...");
	const conn1 = await connectDB();
	const startTime = Date.now();
	const conn2 = await connectDB();
	const durationMs = Date.now() - startTime;

	assert(conn1 === conn2, "Subsequent connectDB() calls return identical cached Mongoose instance");
	assert(durationMs < 50, `Subsequent connectDB() call resolves in ${durationMs}ms (immediate cached return)`);
	assert(global.mongooseConnection?.conn !== null, "global.mongooseConnection cache is populated");

	// -------------------------------------------------------------------------
	// 4. Webhook Raw-Body Preservation & End-to-End Express Handler Test
	// -------------------------------------------------------------------------
	console.log("\n--- 4. Webhook Raw-Body Preservation & HTTP Request Handling ---");

	const ephemeralServer = http.createServer(app);
	await new Promise((resolve) => ephemeralServer.listen(0, "127.0.0.1", resolve));
	const testPort = ephemeralServer.address().port;

	try {
		// Test Health Endpoint
		const healthRes = await fetch(`http://127.0.0.1:${testPort}/api/health`);
		const healthData = await healthRes.json();
		assert(healthRes.status === 200, `/api/health responded with status ${healthRes.status}`);
		assert(healthData.status === "ok", `/api/health reports status: '${healthData.status}'`);
		assert(healthData.database === "connected", `/api/health reports database: '${healthData.database}'`);
		assert(typeof healthData.uptimeSeconds === "number", `/api/health reports uptime: ${healthData.uptimeSeconds}s`);

		// Test Root Info Endpoint
		const rootRes = await fetch(`http://127.0.0.1:${testPort}/`);
		const rootData = await rootRes.json();
		assert(rootRes.status === 200, `/ endpoint responded with status 200`);
		assert(rootData.name === "LUXESTORE API", `/ reports API name: '${rootData.name}'`);

		// Test Raw-Body preservation on POST request (simulating Razorpay Webhook)
		const webhookPayload = JSON.stringify({
			entity: "event",
			account_id: "acc_luxestore_test",
			event: "payment.captured",
			contains: ["payment"],
			payload: {
				payment: {
					entity: {
						id: "pay_test_serverless_rawbody_999",
						amount: 499900,
						currency: "INR",
						status: "captured",
						notes: { orderId: "650000000000000000000001" },
					},
				},
			},
		});

		// Create a test route dynamically on app to inspect req.rawBody
		let capturedRawBody = null;
		app.post("/api/test-raw-body-inspector", (req, res) => {
			capturedRawBody = req.rawBody ? req.rawBody.toString("utf-8") : null;
			res.json({ success: true, hasRawBody: Boolean(req.rawBody) });
		});

		const webhookRes = await fetch(`http://127.0.0.1:${testPort}/api/test-raw-body-inspector`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-Razorpay-Signature": "simulated_test_hmac_hex_digest",
			},
			body: webhookPayload,
		});

		const webhookData = await webhookRes.json();
		assert(webhookData.hasRawBody === true, "Express attached req.rawBody Buffer to incoming POST request");
		assert(capturedRawBody === webhookPayload, "Captured req.rawBody matches exact original unparsed byte stream for HMAC verification");

	} finally {
		await new Promise((resolve) => ephemeralServer.close(resolve));
	}

	// -------------------------------------------------------------------------
	// 5. CORS Handling: Strict Approved Origins & Rejection of Arbitrary Vercel Domains
	// -------------------------------------------------------------------------
	console.log("\n--- 5. CORS Security: Specific Origin Authorization & Arbitrary *.vercel.app Rejection ---");

	// Temporarily configure approved origin in env for test
	process.env.ALLOWED_ORIGINS = "https://luxestore-frontend.vercel.app,https://my-store.com";
	process.env.VERCEL_PREVIEW_PATTERN = "^https:\\/\\/luxestore-.*\\.vercel\\.app$";

	const ephemeralServer2 = http.createServer(app);
	await new Promise((resolve) => ephemeralServer2.listen(0, "127.0.0.1", resolve));
	const testPort2 = ephemeralServer2.address().port;

	try {
		// Test 1: Configured Exact Allowed Origin
		const allowedOrigin = "https://luxestore-frontend.vercel.app";
		const corsRes1 = await fetch(`http://127.0.0.1:${testPort2}/api/health`, {
			headers: { Origin: allowedOrigin },
		});
		assert(corsRes1.headers.get("access-control-allow-origin") === allowedOrigin, `CORS permits configured exact frontend domain (${allowedOrigin})`);
		assert(corsRes1.headers.get("access-control-allow-credentials") === "true", "CORS permits credentials for session cookies across Vercel deployments");

		// Test 2: Approved Preview Pattern Match
		const previewOrigin = "https://luxestore-git-feature-preview.vercel.app";
		const corsRes2 = await fetch(`http://127.0.0.1:${testPort2}/api/health`, {
			headers: { Origin: previewOrigin },
		});
		assert(corsRes2.headers.get("access-control-allow-origin") === previewOrigin, `CORS permits authorized project preview domain (${previewOrigin})`);

		// Test 3: Arbitrary Malicious *.vercel.app Domain (Must be REJECTED)
		const maliciousOrigin = "https://arbitrary-malicious-attacker.vercel.app";
		const corsRes3 = await fetch(`http://127.0.0.1:${testPort2}/api/health`, {
			headers: { Origin: maliciousOrigin },
		});
		assert(corsRes3.headers.get("access-control-allow-origin") === null, "CORS strictly REJECTS unauthorized arbitrary *.vercel.app origin");

	} finally {
		await new Promise((resolve) => ephemeralServer2.close(resolve));
	}

	// -------------------------------------------------------------------------
	// 6. Cross-Site Cookie Settings for Decoupled Deployments
	// -------------------------------------------------------------------------
	console.log("\n--- 6. Cross-Site Cookie Policy (backend/controllers/auth.controller.js) ---");

	const authControllerPath = path.join(rootDir, "backend", "controllers", "auth.controller.js");
	const authControllerContent = fs.readFileSync(authControllerPath, "utf-8");

	assert(
		authControllerContent.includes("sameSite: isProd ? \"none\" : \"lax\"") ||
		authControllerContent.includes("sameSite: process.env.NODE_ENV === \"production\" ? \"none\" : \"lax\""),
		"auth.controller.js sets SameSite='none' in production for cross-site cookies between separate Vercel projects"
	);
	assert(
		authControllerContent.includes("secure: isProd") ||
		authControllerContent.includes("secure: process.env.NODE_ENV === \"production\""),
		"auth.controller.js enforces Secure=true in production for HTTPS cross-site cookies"
	);
	assert(
		authControllerContent.includes("httpOnly: true"),
		"auth.controller.js maintains HttpOnly=true on auth cookies to prevent XSS exfiltration"
	);

	// -------------------------------------------------------------------------
	// 7. Vercel Project Configurations (Backend root vercel.json & Frontend vercel.json)
	// -------------------------------------------------------------------------
	console.log("\n--- 7. Vercel Configuration Files ---");

	const rootVercelJsonPath = path.join(rootDir, "vercel.json");
	assert(fs.existsSync(rootVercelJsonPath), "Root vercel.json exists for Backend Vercel project");

	const rootVercelConfig = JSON.parse(fs.readFileSync(rootVercelJsonPath, "utf-8"));
	assert(rootVercelConfig.version === 2, "Backend vercel.json specifies version: 2");

	const apiRewrite = rootVercelConfig.rewrites?.find((r) => r.source === "/api/(.*)" && r.destination === "/api");
	assert(Boolean(apiRewrite), "Backend vercel.json rewrites /api/(.*) -> /api");

	assert(Boolean(rootVercelConfig.functions?.["api/**/*.js"]), "Backend vercel.json configures memory and maxDuration for serverless functions");

	// Ensure Backend vercel.json does not conflict with frontend
	assert(rootVercelConfig.buildCommand === undefined, "Backend vercel.json does NOT contain frontend buildCommand conflict");
	assert(rootVercelConfig.outputDirectory === undefined, "Backend vercel.json does NOT contain frontend outputDirectory conflict");

	const frontendVercelJsonPath = path.join(rootDir, "frontend", "vercel.json");
	assert(fs.existsSync(frontendVercelJsonPath), "frontend/vercel.json exists for Frontend Vercel project");

	const frontendVercelConfig = JSON.parse(fs.readFileSync(frontendVercelJsonPath, "utf-8"));
	const spaRewrite = frontendVercelConfig.rewrites?.find((r) => r.source === "/(.*)" && r.destination === "/index.html");
	assert(Boolean(spaRewrite), "frontend/vercel.json configures SPA fallback rewrite: /(.*) -> /index.html");

	// -------------------------------------------------------------------------
	// 8. Route Completeness Check
	// -------------------------------------------------------------------------
	console.log("\n--- 8. Route Mount Completeness ---");
	const expectedMounts = [
		"/api/auth",
		"/api/products",
		"/api/reviews",
		"/api/categories",
		"/api/cart",
		"/api/coupons",
		"/api/payments",
		"/api/analytics",
		"/api/users",
		"/api/notifications",
		"/api/recommendations",
		"/api/sales",
		"/api/serviceability",
		"/api/addresses",
		"/api/admin/customers",
		"/api/shipping",
		"/api/orders",
		"/api/campaign-slides",
		"/api/announcements",
		"/api/restock-subscriptions",
		"/api/cms",
		"/api/size-charts",
		"/api/support-tickets",
		"/api/newsletter",
	];

	for (const mount of expectedMounts) {
		assert(appJsContent.includes(`"${mount}"`) || appJsContent.includes(`'${mount}'`), `app.js mounts route group: ${mount}`);
	}

	// -------------------------------------------------------------------------
	// SUMMARY
	// -------------------------------------------------------------------------
	console.log("\n==========================================================================");
	console.log(`  VERCEL SERVERLESS VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
	console.log("==========================================================================\n");

	try {
		await mongoose.connection.close(false);
	} catch (e) {}

	if (failed > 0) {
		process.exit(1);
	} else {
		process.exit(0);
	}
}

runSuite().catch((err) => {
	console.error("Test execution failed with unhandled error:", err);
	process.exit(1);
});
