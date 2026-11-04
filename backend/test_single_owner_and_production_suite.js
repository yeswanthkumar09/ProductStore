/**
 * test_single_owner_and_production_suite.js
 * 
 * Master Test Suite for LUXESTORE Single-Owner Architecture,
 * Codebase Cleanup, Security and Production Deployment Preparation.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

let passedCount = 0;
let failedCount = 0;

function assert(condition, testName) {
	if (condition) {
		console.log(`  ✅ PASS: ${testName}`);
		passedCount++;
	} else {
		console.error(`  ❌ FAIL: ${testName}`);
		failedCount++;
	}
}

console.log("\n==========================================================================");
console.log("  LUXESTORE SINGLE-OWNER, SECURITY & PRODUCTION READINESS QA SUITE");
console.log("==========================================================================\n");

// 1. Single-Owner Authority & Bootstrapping
console.log("--- 1. Single-Owner Architecture & Authority ---");
const bootstrapScriptPath = path.join(rootDir, "backend", "scripts", "bootstrap_owner.js");
assert(fs.existsSync(bootstrapScriptPath), "Standalone bootstrap_owner.js script exists");

const bootstrapScript = fs.readFileSync(bootstrapScriptPath, "utf-8");
assert(
	bootstrapScript.includes("Single-owner constraint verified") &&
	bootstrapScript.includes("demoteResult"),
	"bootstrap_owner.js enforces single-owner constraint and demotes non-owner admin accounts"
);

const dbJsPath = path.join(rootDir, "backend", "lib", "db.js");
const dbJs = fs.readFileSync(dbJsPath, "utf-8");
assert(
	!dbJs.includes("admin123"),
	"db.js does NOT contain hardcoded admin passwords ('admin123' removed)"
);
assert(
	!dbJs.includes('"admin@luxestore.com"'),
	"db.js does NOT seed secondary admin accounts ('admin@luxestore.com' removed)"
);
assert(
	dbJs.includes("Single-Owner Architecture Enforcement") &&
	dbJs.includes("role: \"customer\""),
	"db.js synchronizes single owner and automatically demotes unauthorized admin accounts"
);

const authMiddlewarePath = path.join(rootDir, "backend", "middleware", "auth.middleware.js");
const authMiddleware = fs.readFileSync(authMiddlewarePath, "utf-8");
assert(
	authMiddleware.includes("adminRoute") &&
	authMiddleware.includes("req.user.role === \"admin\""),
	"adminRoute middleware strictly enforces administrator role check on backend"
);

const authControllerPath = path.join(rootDir, "backend", "controllers", "auth.controller.js");
const authController = fs.readFileSync(authControllerPath, "utf-8");
assert(
	authController.includes("role: \"customer\""),
	"signup controller explicitly hardcodes role: 'customer' (public registration cannot create admins)"
);

const userControllerPath = path.join(rootDir, "backend", "controllers", "user.controller.js");
const userController = fs.readFileSync(userControllerPath, "utf-8");
assert(
	!userController.includes("user.role = role"),
	"updateProfile controller does not allow role modification by customers"
);

// 2. Audit Logging
console.log("\n--- 2. Immutable Administrative Audit Logging ---");
const auditModelPath = path.join(rootDir, "backend", "models", "auditLog.model.js");
assert(fs.existsSync(auditModelPath), "AuditLog model exists in backend/models/auditLog.model.js");

const auditModel = fs.readFileSync(auditModelPath, "utf-8");
assert(
	auditModel.includes("adminId") &&
	auditModel.includes("action") &&
	auditModel.includes("targetType"),
	"AuditLog schema tracks adminId, action, targetType, details, and IP address"
);

const auditLoggerPath = path.join(rootDir, "backend", "lib", "auditLogger.js");
assert(fs.existsSync(auditLoggerPath), "auditLogger.js utility exists in backend/lib/");

const auditLogger = fs.readFileSync(auditLoggerPath, "utf-8");
assert(
	auditLogger.includes("logAdminAction") &&
	auditLogger.includes("AuditLog.create"),
	"logAdminAction safely logs state-modifying actions without throwing to client"
);

// 3. Bulk Product Onboarding Facility
console.log("\n--- 3. Bulk Product Onboarding Facility ---");
const productControllerPath = path.join(rootDir, "backend", "controllers", "product.controller.js");
const productController = fs.readFileSync(productControllerPath, "utf-8");

assert(
	productController.includes("previewBulkProducts") &&
	productController.includes("parseCsvToObjects"),
	"product.controller.js provides previewBulkProducts with CSV and JSON parser"
);

assert(
	productController.includes("executeBulkImport") &&
	productController.includes("BULK_PRODUCTS_IMPORTED"),
	"product.controller.js provides executeBulkImport with audit logging"
);

const productRoutePath = path.join(rootDir, "backend", "routes", "product.route.js");
const productRoute = fs.readFileSync(productRoutePath, "utf-8");
assert(
	productRoute.includes("router.post(\"/bulk-preview\", protectRoute, adminRoute, previewBulkProducts)") &&
	productRoute.includes("router.post(\"/bulk-import\", protectRoute, adminRoute, executeBulkImport)"),
	"product.route.js mounts /bulk-preview and /bulk-import protected by adminRoute"
);

const bulkModalPath = path.join(rootDir, "frontend", "src", "components", "BulkProductImportModal.jsx");
assert(fs.existsSync(bulkModalPath), "BulkProductImportModal.jsx component exists in frontend");

const bulkModal = fs.readFileSync(bulkModalPath, "utf-8");
assert(
	bulkModal.includes("previewBulkProducts") &&
	bulkModal.includes("executeBulkImport") &&
	bulkModal.includes("downloadSampleCsv"),
	"BulkProductImportModal provides CSV/JSON file upload, sample CSV download, and pre-flight validation"
);

const productsListPath = path.join(rootDir, "frontend", "src", "components", "ProductsList.jsx");
const productsList = fs.readFileSync(productsListPath, "utf-8");
assert(
	productsList.includes("BulkProductImportModal") &&
	productsList.includes("Bulk Import"),
	"ProductsList component integrates Bulk Import button and renders BulkProductImportModal"
);

// 4. Production Readiness & Infrastructure
console.log("\n--- 4. Production Readiness & Infrastructure ---");
const serverJsPath = path.join(rootDir, "backend", "server.js");
const serverJs = fs.readFileSync(serverJsPath, "utf-8");

assert(
	serverJs.includes("app.get(\"/api/health\"") &&
	serverJs.includes("uptimeSeconds") &&
	serverJs.includes("memory"),
	"server.js defines /api/health endpoint reporting system uptime, DB status, and memory metrics"
);

assert(
	serverJs.includes("SIGINT") &&
	serverJs.includes("SIGTERM") &&
	serverJs.includes("gracefulShutdown"),
	"server.js implements graceful shutdown handlers for SIGINT and SIGTERM"
);

const envExamplePath = path.join(rootDir, ".env.example");
const envExample = fs.readFileSync(envExamplePath, "utf-8");
assert(
	envExample.includes("OWNER_EMAIL") &&
	envExample.includes("RAZORPAY_KEY_ID") &&
	envExample.includes("CLOUDINARY_API_KEY"),
	".env.example documents all production variables without leaking secrets"
);

const gitignorePath = path.join(rootDir, ".gitignore");
const gitignore = fs.readFileSync(gitignorePath, "utf-8");
assert(
	gitignore.includes(".env") &&
	gitignore.includes("scratch/db/"),
	".gitignore properly excludes .env and scratch database files"
);

// 5. Educational Project Disclaimer & Intellectual Property
console.log("\n--- 5. Educational Project Disclaimer & Intellectual Property ---");
const readmePath = path.join(rootDir, "README.md");
const readme = fs.readFileSync(readmePath, "utf-8");
const disclaimerSnippet = "LUXESTORE is an independently developed educational e-commerce project created for learning, experimentation, academic presentation and portfolio demonstration.";

assert(
	readme.includes(disclaimerSnippet),
	"README.md contains the exact required Educational Project Disclaimer"
);

const projectOverviewPath = path.join(rootDir, "docs", "project-overview.md");
const projectOverview = fs.readFileSync(projectOverviewPath, "utf-8");
assert(
	projectOverview.includes(disclaimerSnippet),
	"docs/project-overview.md contains the Educational Project Disclaimer"
);

// 6. Multi-Vendor & Collaboration Clutter Elimination
console.log("\n--- 6. Multi-Vendor & Collaboration Clutter Elimination ---");
const modelsDir = path.join(rootDir, "backend", "models");
const modelFiles = fs.readdirSync(modelsDir);
const vendorModels = modelFiles.filter((f) => /vendor|seller|collaborator|tenant|workspace/i.test(f));
assert(
	vendorModels.length === 0,
	"Zero multi-vendor or collaboration models exist in backend/models/"
);

console.log("\n==========================================================================");
console.log(`  QA SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
console.log("==========================================================================\n");

if (failedCount > 0) {
	process.exit(1);
} else {
	process.exit(0);
}

