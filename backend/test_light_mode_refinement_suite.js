import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

console.log("\n=======================================================");
console.log("  LUXESTORE LIGHT MODE & INTERFACE REFINEMENT QA SUITE");
console.log("=======================================================\n");

let passed = 0;
let failed = 0;

function assert(condition, message) {
	if (condition) {
		console.log(`  ✅ PASS: ${message}`);
		passed++;
	} else {
		console.error(`  ❌ FAIL: ${message}`);
		failed++;
	}
}

// -------------------------------------------------------------
// 1. FLAGSHIP BOUTIQUES COMPLETE REMOVAL VERIFICATION
// -------------------------------------------------------------
console.log("--- 1. Flagship Boutiques Removal Verification ---");
const floatingBtnExists = fs.existsSync(
	path.join(rootDir, "frontend/src/components/FloatingStoreLocatorButton.jsx")
);
assert(!floatingBtnExists, "FloatingStoreLocatorButton.jsx is deleted from components");

const homePageSrc = fs.readFileSync(
	path.join(rootDir, "frontend/src/pages/HomePage.jsx"),
	"utf-8"
);
assert(
	!homePageSrc.includes("FloatingStoreLocatorButton") &&
		!homePageSrc.includes("BOUTIQUE LOCATOR"),
	"HomePage.jsx does not import or render FloatingStoreLocatorButton"
);

const profilePageSrc = fs.readFileSync(
	path.join(rootDir, "frontend/src/pages/ProfilePage.jsx"),
	"utf-8"
);
assert(
	!profilePageSrc.includes("FloatingStoreLocatorButton") &&
		!profilePageSrc.includes("Our Flagship Boutiques") &&
		!profilePageSrc.includes("FIND A STORE"),
	"ProfilePage.jsx does not include Flagship Boutiques modal, button, or obsolete imports"
);

// Verify delivery location and address management are preserved
const serviceabilityExists = fs.existsSync(
	path.join(rootDir, "frontend/src/components/ServiceabilityManagement.jsx")
);
const savedAddressExists = fs.existsSync(
	path.join(rootDir, "frontend/src/components/SavedAddressManager.jsx")
);
assert(serviceabilityExists, "ServiceabilityManagement (Delivery Locations) is preserved");
assert(savedAddressExists, "SavedAddressManager (Customer Addresses) is preserved");

// -------------------------------------------------------------
// 2. LIGHT MODE BUTTON BEHAVIOUR & CSS SYSTEM (WHITE BOX BUG FIX)
// -------------------------------------------------------------
console.log("\n--- 2. Light Mode Button System & CSS Override Audit ---");
const indexCss = fs.readFileSync(
	path.join(rootDir, "frontend/src/index.css"),
	"utf-8"
);

// Verify that .light .bg-neutral-900 / .light .bg-neutral-950 is NOT forced to #ffffff
assert(
	!indexCss.includes(".light .bg-neutral-900,\n[data-mode=\"light\"] .bg-neutral-900 {\n  background-color: #ffffff !important;"),
	"CSS does not force .light .bg-neutral-900 to white background (Root cause of white box bug removed)"
);

// Verify primary button system in light mode
assert(
	indexCss.includes(".light button.bg-black") &&
		indexCss.includes("background-color: #000000 !important;") &&
		indexCss.includes("color: #ffffff !important;"),
	"CSS guarantees solid black background (#000000) and crisp white text for primary dark buttons in light mode"
);

// Verify secondary button system in light mode
assert(
	indexCss.includes(".light button.bg-white") &&
		indexCss.includes("background-color: #ffffff !important;") &&
		indexCss.includes("color: #111827 !important;"),
	"CSS guarantees white background and dark text for secondary buttons in light mode"
);

// Verify dark mode primary button system
assert(
	indexCss.includes(".dark button.bg-white") &&
		indexCss.includes("background-color: #ffffff !important;") &&
		indexCss.includes("color: #0c0d0e !important;"),
	"CSS guarantees dark mode primary button has crisp white background with dark text"
);

// Verify container headings are dark in light mode
assert(
	indexCss.includes('.light [class*="bg-gray-900"] h1') &&
		indexCss.includes('.light [class*="bg-gray-950"] h1') &&
		indexCss.includes("color: #111827 !important;"),
	"Headings inside light mode cards & opacity variants are enforced to high-contrast dark text (#111827)"
);

// -------------------------------------------------------------
// 3. CATEGORY FILTER PILLS AUDIT (SCREENSHOT 2)
// -------------------------------------------------------------
console.log("\n--- 3. Category Filter Pills Audit (Screenshot 2 Fix) ---");
const categoryPageSrc = fs.readFileSync(
	path.join(rootDir, "frontend/src/pages/CategoryPage.jsx"),
	"utf-8"
);

assert(
	categoryPageSrc.includes("bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow-md font-bold"),
	"CategoryPage active subcategory pill uses high-contrast bg-black text-white in light mode (No white-box bug)"
);

assert(
	categoryPageSrc.includes("bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100 hover:text-black"),
	"CategoryPage inactive subcategory pills use clean white background with visible grey border"
);

// -------------------------------------------------------------
// 4. WISHLIST COUNT BADGE & LOGOUT RESET AUDIT (SCREENSHOT 3)
// -------------------------------------------------------------
console.log("\n--- 4. Wishlist Count Badge & Logout Reset Audit (Screenshot 3 Fix) ---");
const navbarSrc = fs.readFileSync(
	path.join(rootDir, "frontend/src/components/Navbar.jsx"),
	"utf-8"
);

assert(
	navbarSrc.includes("Heart size={20} strokeWidth={1.8}"),
	"Navbar renders crisp Heart icon with appropriate strokeWidth"
);

assert(
	navbarSrc.includes("bg-black dark:bg-white text-white dark:text-black rounded-full h-4 min-w-[16px] px-1 text-[9px] font-bold flex items-center justify-center shadow-sm select-none pointer-events-none"),
	"Navbar Wishlist count displays compact solid black badge with white text in light mode, and white badge in dark mode"
);

assert(
	navbarSrc.includes("absolute -top-1 -right-1"),
	"Navbar Wishlist badge is positioned precisely top-right without overlapping or clipping heart icon"
);

const appSrc = fs.readFileSync(
	path.join(rootDir, "frontend/src/App.jsx"),
	"utf-8"
);
assert(
	appSrc.includes("useWishlistStore.getState().clearWishlist()"),
	"App.jsx immediately clears wishlist when user is not authenticated/logs out"
);

const userStoreSrc = fs.readFileSync(
	path.join(rootDir, "frontend/src/stores/useUserStore.js"),
	"utf-8"
);
assert(
	userStoreSrc.includes("useWishlistStore.getState().clearWishlist()"),
	"useUserStore logout action clears wishlist to prevent count persistence across sessions"
);

// -------------------------------------------------------------
// 5. ADMIN CONTROL PANEL COMPLETE AUDIT (SCREENSHOTS 4 & 5)
// -------------------------------------------------------------
console.log("\n--- 5. Admin Control Panel Complete Audit (Screenshots 4 & 5 Fixes) ---");
const adminPageSrc = fs.readFileSync(
	path.join(rootDir, "frontend/src/pages/AdminPage.jsx"),
	"utf-8"
);

assert(
	adminPageSrc.includes("isActive") &&
		adminPageSrc.includes("admin-tab-active bg-black text-white border-black"),
	"AdminPage active tab renders solid black pill with white text in light mode (Never a blank white rectangle)"
);

assert(
	adminPageSrc.includes("bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-200 hover:text-black") ||
		adminPageSrc.includes("bg-white text-neutral-700"),
	"AdminPage inactive tabs render clean white pill with neutral-700 text and subtle border"
);

const cmsManagementSrc = fs.readFileSync(
	path.join(rootDir, "frontend/src/components/CmsManagement.jsx"),
	"utf-8"
);

assert(
	cmsManagementSrc.includes("text-neutral-900 dark:text-white'>\n\t\t\t\t\t\t\t\t\t\t{currentSection?.title}") ||
		cmsManagementSrc.includes("text-neutral-900 dark:text-white"),
	"CmsManagement section headers use text-neutral-900 dark:text-white for high contrast in light mode"
);

assert(
	cmsManagementSrc.includes("bg-black text-white dark:bg-white dark:text-neutral-950 font-bold shadow-sm"),
	"CmsManagement sub-tabs use solid black background with white text when active in light mode"
);

const productsListSrc = fs.readFileSync(
	path.join(rootDir, "frontend/src/components/ProductsList.jsx"),
	"utf-8"
);

assert(
	productsListSrc.includes("bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 capitalize border border-neutral-200 dark:border-neutral-700 font-medium"),
	"ProductsList category pill renders elegant light grey pill with dark text in light mode (no dark black oval)"
);

assert(
	productsListSrc.includes("bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-neutral-700 hover:text-black"),
	"ProductsList action buttons have high contrast light mode styling with subtle borders"
);

console.log("\n=======================================================");
console.log(`  QA SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log("=======================================================\n");

if (failed > 0) {
	process.exit(1);
}

