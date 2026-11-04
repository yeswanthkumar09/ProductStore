import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

console.log("\n==========================================================================");
console.log("  LUXESTORE DARK BOXES & BADGES FONT LEGIBILITY QA SUITE");
console.log("==========================================================================\n");

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

// --------------------------------------------------------------------------
// 1. INDEX.CSS GLOBAL CONTRAST SAFEGUARDS
// --------------------------------------------------------------------------
console.log("--- 1. Global CSS Safeguards for Dark Boxes in Light Mode ---");
const indexCss = fs.readFileSync(path.join(rootDir, "frontend/src/index.css"), "utf-8");

assert(
	indexCss.includes('.text-gray-400:not([class*="bg-black"] *)') &&
		indexCss.includes('.text-gray-300:not([class*="bg-black"] *)') &&
		indexCss.includes('.text-gray-500:not([class*="bg-black"] *)'),
	"CSS prevents light-mode text-gray overrides from forcing dark text inside dark boxes or badges"
);

assert(
	indexCss.includes('.light [class*="bg-gray-800"] .text-gray-300') &&
		indexCss.includes("color: #e5e7eb !important;"),
	"CSS guarantees dark background boxes force crisp high-contrast light text (#e5e7eb) in light mode"
);

assert(
	indexCss.includes('.light [class*="bg-gray-800"] .text-accent') &&
		indexCss.includes("color: #fbbf24 !important;"),
	"CSS guarantees accent labels inside dark boxes remain vivid gold/amber (#fbbf24)"
);

// --------------------------------------------------------------------------
// 2. CHECKOUT & CART ADDRESS PICKER (SCREENSHOT 1)
// --------------------------------------------------------------------------
console.log("\n--- 2. Checkout Address Picker Audit (Screenshot 1) ---");
const checkoutAddressPicker = fs.readFileSync(
	path.join(rootDir, "frontend/src/components/CheckoutAddressPicker.jsx"),
	"utf-8"
);

assert(
	checkoutAddressPicker.includes("bg-neutral-100 text-neutral-800 border border-neutral-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700"),
	"CheckoutAddressPicker address badge uses high-contrast readable styling in both light and dark mode"
);

assert(
	checkoutAddressPicker.includes("bg-black text-white hover:bg-neutral-800 dark:bg-gray-800"),
	"CheckoutAddressPicker 'Manage Address Book' button maintains high contrast in light mode"
);

// --------------------------------------------------------------------------
// 3. AVAILABLE STORE COUPONS CARD (SCREENSHOT 1)
// --------------------------------------------------------------------------
console.log("\n--- 3. GiftCouponCard Store Coupons Audit (Screenshot 1) ---");
const giftCouponCard = fs.readFileSync(
	path.join(rootDir, "frontend/src/components/GiftCouponCard.jsx"),
	"utf-8"
);

assert(
	giftCouponCard.includes("bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 hover:border-black text-xs font-mono text-neutral-900 dark:bg-gray-800/80 dark:border-gray-700 dark:text-gray-200"),
	"Available coupon chips use clean, legible pill styling with dark text in light mode and light text in dark mode"
);

assert(
	giftCouponCard.includes("text-black dark:text-accent"),
	"Coupon code label renders crisp, high-contrast text in both light and dark mode"
);

// --------------------------------------------------------------------------
// 4. RESTOCK SUBSCRIPTION MANAGEMENT (SCREENSHOT 2)
// --------------------------------------------------------------------------
console.log("\n--- 4. Restock Alerts Filter Pills Audit (Screenshot 2) ---");
const restockMgmt = fs.readFileSync(
	path.join(rootDir, "frontend/src/components/RestockSubscriptionManagement.jsx"),
	"utf-8"
);

assert(
	restockMgmt.includes("bg-black text-white dark:bg-white dark:text-neutral-950 font-bold shadow-sm") &&
		restockMgmt.includes("bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-100 hover:text-black dark:bg-gray-800/80"),
	"Restock Alerts filter pills have crisp high-contrast active (black/white) and inactive (white with border) states"
);

assert(
	restockMgmt.includes("bg-neutral-100 text-neutral-700 border border-neutral-300 dark:bg-gray-800 dark:text-gray-300"),
	"Restock Alerts Cancelled status badge has high-contrast styling in both modes"
);

// --------------------------------------------------------------------------
// 5. COUPON MANAGEMENT SCOPE PILL (SCREENSHOT 3)
// --------------------------------------------------------------------------
console.log("\n--- 5. Coupon Management Scope Pill Audit (Screenshot 3) ---");
const couponMgmt = fs.readFileSync(
	path.join(rootDir, "frontend/src/components/CouponManagement.jsx"),
	"utf-8"
);

assert(
	couponMgmt.includes("bg-neutral-100 text-neutral-800 border border-neutral-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700/80 font-bold"),
	"Coupon scope badge (CATEGORY, STOREWIDE) renders crystal-clear high-contrast typography in light and dark mode"
);

// --------------------------------------------------------------------------
// 6. CATEGORY MANAGEMENT SUBCATEGORIES & HERO OVERLAY (SCREENSHOT 4)
// --------------------------------------------------------------------------
console.log("\n--- 6. Category Management Subcategories & Overlay Audit (Screenshot 4) ---");
const categoryMgmt = fs.readFileSync(
	path.join(rootDir, "frontend/src/components/CategoryManagement.jsx"),
	"utf-8"
);

assert(
	categoryMgmt.includes("bg-neutral-100 text-neutral-800 border border-neutral-300 dark:bg-gray-950 dark:border-gray-800 dark:text-gray-200 text-[10px] font-medium"),
	"Category card subcategories chips render with clean, readable background and high-contrast font"
);

assert(
	categoryMgmt.includes("text-amber-400") &&
		categoryMgmt.includes("text-lg font-black text-white font-heading uppercase tracking-tight drop-shadow") &&
		categoryMgmt.includes("text-[11px] font-mono text-gray-200"),
	"Category card image banner overlay enforces bright, legible text on top of dark photo background in all modes"
);

console.log("\n==========================================================================");
console.log(`  QA SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log("==========================================================================\n");

if (failed > 0) {
	process.exit(1);
}

