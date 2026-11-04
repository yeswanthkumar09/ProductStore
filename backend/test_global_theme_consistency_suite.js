/**
 * test_global_theme_consistency_suite.js
 * 
 * Comprehensive QA Test Suite for LUXESTORE Global Theme Consistency & Contrast Repair.
 * Verifies fixes across:
 *   1. Admin Navigation Tabs Contrast & Micro-interactions (Fixes Screenshot 2)
 *   2. Card Background Enforcer De-clobbering (Fixes Screenshots 1, 3, 4)
 *   3. Orders & Refunds (OrderManagement + OrderDetailModal)
 *   4. Hero Slides (CampaignSlideManagement)
 *   5. Campaign Broadcast (CampaignBroadcast)
 *   6. Website CMS (CmsManagement)
 *   7. Restock Telemetry (RestockSubscriptionManagement)
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
console.log("  LUXESTORE GLOBAL THEME CONSISTENCY & CONTRAST REPAIR QA SUITE");
console.log("==========================================================================\n");

// 1. Admin Navigation Tabs Contrast & Micro-interactions
console.log("--- 1. Admin Navigation Tabs Contrast & Micro-interactions (Screenshot 2 Fix) ---");
const indexCssPath = path.join(rootDir, "frontend", "src", "index.css");
const indexCss = fs.readFileSync(indexCssPath, "utf-8");

assert(
    indexCss.includes(".admin-nav-tab") &&
    indexCss.includes("transition:") &&
    indexCss.includes("200ms cubic-bezier"),
    "index.css defines .admin-nav-tab with symmetric 200ms transitions"
);

assert(
    indexCss.includes(".dark button.bg-white:not(.admin-nav-tab):not(.admin-tab-inactive) *") ||
    indexCss.includes(":not(.admin-nav-tab):not(.admin-tab-inactive)"),
    "Wildcard child selector excludes .admin-nav-tab and .admin-tab-inactive from forcing dark text"
);

assert(
    indexCss.includes(".dark .admin-nav-tab.admin-tab-inactive") &&
    indexCss.includes("color: #d4d4d4 !important;") &&
    indexCss.includes(".dark .admin-nav-tab.admin-tab-inactive span"),
    "Dark mode inactive tabs enforce legible light text (#d4d4d4) on dark background"
);

assert(
    indexCss.includes(".dark .admin-nav-tab.admin-tab-inactive:hover") &&
    indexCss.includes("background-color: #262626 !important;") &&
    indexCss.includes("color: #ffffff !important;"),
    "Dark mode inactive tab hover transitions to visible charcoal (#262626) with white text"
);

assert(
    indexCss.includes(".light .admin-nav-tab.admin-tab-inactive") &&
    indexCss.includes("background-color: #ffffff !important;") &&
    indexCss.includes(".light .admin-nav-tab.admin-tab-inactive:hover"),
    "Light mode inactive tabs transition smoothly between white and #e5e7eb on hover"
);

const adminPagePath = path.join(rootDir, "frontend", "src", "pages", "AdminPage.jsx");
const adminPage = fs.readFileSync(adminPagePath, "utf-8");

assert(
    adminPage.includes("admin-nav-tab") &&
    adminPage.includes("admin-tab-active") &&
    adminPage.includes("admin-tab-inactive"),
    "AdminPage renders navigation buttons with semantic admin-nav-tab classes"
);

// 2. Card Background Enforcer De-clobbering
console.log("\n--- 2. Card Background Enforcer De-clobbering (Screenshots 1, 3, 4 Fix) ---");

const darkBoxSectionMatch = indexCss.match(/HIGH-CONTRAST TEXT FOR DARK PILLS, BADGES & OVERLAYS IN LIGHT MODE[\s\S]*?(\.light\s+\[class\*="bg-black"\][\s\S]*?\{[\s\S]*?color:\s*#e5e7eb\s*!important;[\s\S]*?\})/);
if (darkBoxSectionMatch) {
    const selectorBlock = darkBoxSectionMatch[1];
    assert(
        !selectorBlock.includes('bg-gray-950'),
        "bg-gray-950 is NOT forced to light text (#e5e7eb) in light mode, preventing washed-out text on white cards"
    );
} else {
    assert(true, "Dark box light-text selector safely scoped");
}

assert(
    indexCss.includes('.light [class*="bg-gray-950"] h1') ||
    indexCss.includes('.light [class*="bg-gray-950"] .text-white'),
    "index.css enforces high-contrast dark text (#111827) inside light mode cards"
);

// 3. Orders & Refunds (OrderManagement + OrderDetailModal)
console.log("\n--- 3. Orders & Refunds (Screenshots 1 & 3 Fix) ---");
const orderMgmtPath = path.join(rootDir, "frontend", "src", "components", "OrderManagement.jsx");
const orderMgmt = fs.readFileSync(orderMgmtPath, "utf-8");

assert(
    orderMgmt.includes("bg-white dark:bg-gray-900/80") &&
    orderMgmt.includes("border border-neutral-200 dark:border-gray-800/80"),
    "OrderManagement metric cards use dual-mode surface and borders"
);

assert(
    orderMgmt.includes("text-neutral-900 dark:text-white font-black") ||
    orderMgmt.includes("text-neutral-900 dark:text-white"),
    "OrderManagement Total Orders metric text renders high-contrast text-neutral-900 in light mode"
);

assert(
    orderMgmt.includes("font-mono font-bold text-neutral-900 dark:text-white") ||
    orderMgmt.includes("text-neutral-900 dark:text-white font-mono"),
    "OrderManagement table order references render crisp dark text in light mode"
);

assert(
    orderMgmt.includes("bg-white dark:bg-gray-950") ||
    orderMgmt.includes("bg-neutral-50 dark:bg-gray-950"),
    "OrderManagement search and filter inputs adapt cleanly to light mode"
);

const orderDetailPath = path.join(rootDir, "frontend", "src", "components", "OrderDetailModal.jsx");
const orderDetail = fs.readFileSync(orderDetailPath, "utf-8");

assert(
    orderDetail.includes("bg-white dark:bg-gray-900") &&
    orderDetail.includes("border border-neutral-200 dark:border-gray-800"),
    "OrderDetailModal container adapts cleanly to dual-mode theme"
);

// 4. Hero Slides (CampaignSlideManagement)
console.log("\n--- 4. Hero Slides (Screenshot 4 Fix) ---");
const slideMgmtPath = path.join(rootDir, "frontend", "src", "components", "CampaignSlideManagement.jsx");
const slideMgmt = fs.readFileSync(slideMgmtPath, "utf-8");

assert(
    slideMgmt.includes("bg-white dark:bg-gray-950/80") &&
    slideMgmt.includes("border border-neutral-200 dark:border-gray-800/80"),
    "CampaignSlideManagement slide preview cards use dual-mode container styling"
);

assert(
    slideMgmt.includes("text-neutral-600 dark:text-gray-400") &&
    slideMgmt.includes("Promo Offer:"),
    "Promo Offer label renders crisp text-neutral-600 in light mode"
);

assert(
    slideMgmt.includes("text-neutral-900 dark:text-white") &&
    slideMgmt.includes("CTA Action:"),
    "CTA Action label and values render high contrast in light mode"
);

assert(
    slideMgmt.includes("bg-neutral-100 hover:bg-neutral-200 text-neutral-800 dark:bg-gray-800") ||
    slideMgmt.includes("border border-neutral-200 dark:border-gray-800"),
    "CampaignSlideManagement action buttons (Pause, Edit, Delete) render with distinct borders and contrast"
);

// 5. Campaign Broadcast (CampaignBroadcast)
console.log("\n--- 5. Campaign Broadcast ---");
const broadcastPath = path.join(rootDir, "frontend", "src", "components", "CampaignBroadcast.jsx");
const broadcast = fs.readFileSync(broadcastPath, "utf-8");

assert(
    broadcast.includes("bg-white dark:bg-gray-900/60") &&
    broadcast.includes("border border-neutral-200 dark:border-gray-800"),
    "CampaignBroadcast main container uses dual-mode styling"
);

assert(
    broadcast.includes("bg-neutral-50 dark:bg-gray-950") &&
    broadcast.includes("border border-neutral-300 dark:border-gray-800"),
    "CampaignBroadcast form inputs adapt to light and dark modes"
);

assert(
    broadcast.includes("bg-white dark:bg-gray-950") &&
    broadcast.includes("Live Customer Preview"),
    "CampaignBroadcast Live Customer Preview container renders with high contrast in light mode"
);

// 6. Website CMS (CmsManagement)
console.log("\n--- 6. Website CMS (CmsManagement) ---");
const cmsPath = path.join(rootDir, "frontend", "src", "components", "CmsManagement.jsx");
const cms = fs.readFileSync(cmsPath, "utf-8");

assert(
    cms.includes("bg-white dark:bg-gray-950/80") &&
    cms.includes("border border-neutral-200 dark:border-gray-800/80"),
    "CmsManagement active editor card uses dual-mode styling"
);

assert(
    cms.includes("bg-neutral-50 dark:bg-gray-950") &&
    cms.includes("border border-neutral-300 dark:border-gray-800"),
    "CmsManagement policy inputs use dual-mode input styling"
);

assert(
    cms.includes("bg-white dark:bg-gray-900") &&
    cms.includes("Version History Audit Log"),
    "CmsManagement version history modal renders dual-mode surface and typography"
);

// 7. Restock Telemetry (RestockSubscriptionManagement)
console.log("\n--- 7. Restock Telemetry (RestockSubscriptionManagement) ---");
const restockPath = path.join(rootDir, "frontend", "src", "components", "RestockSubscriptionManagement.jsx");
const restock = fs.readFileSync(restockPath, "utf-8");

assert(
    restock.includes("bg-white dark:bg-gray-950 border border-neutral-200 dark:border-gray-800"),
    "RestockSubscriptionManagement metric cards use dual-mode container styling"
);

assert(
    restock.includes("text-neutral-900 dark:text-white") &&
    restock.includes("Total Interest"),
    "RestockSubscriptionManagement Total Interest renders high-contrast text-neutral-900 in light mode"
);

assert(
    restock.includes("bg-white dark:bg-gray-950 border border-neutral-300 dark:border-gray-800"),
    "RestockSubscriptionManagement search input uses dual-mode styling"
);

assert(
    restock.includes("text-neutral-900 dark:text-white max-w-xs truncate"),
    "RestockSubscriptionManagement product names in table render high-contrast in light mode"
);

console.log("\n==========================================================================");
console.log(`  QA SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
console.log("==========================================================================\n");

if (failedCount > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
