import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

console.log("\n==========================================================================");
console.log("  LUXESTORE ADMIN PRODUCTS HOVER & DARK MODE DEFAULT QA SUITE");
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
// 1. DARK MODE AS DEFAULT & ZERO-FLASH INITIALIZATION
// --------------------------------------------------------------------------
console.log("--- 1. Dark Mode Default & Pre-Paint Synchronization ---");

const indexHtml = fs.readFileSync(path.join(rootDir, "frontend/index.html"), "utf-8");

assert(
	indexHtml.includes('<html lang="en" class="dark" data-mode="dark">'),
	"HTML document root element starts with class='dark' and data-mode='dark' by default"
);

assert(
	indexHtml.includes("var mode = localStorage.getItem('luxestore-mode');") &&
		indexHtml.includes("if (mode === 'light')") &&
		indexHtml.includes("document.documentElement.classList.add('dark');"),
	"Head inline script synchronously checks 'luxestore-mode' and defaults to dark when empty"
);

assert(
	!indexHtml.includes("matchMedia") && !indexHtml.includes("prefers-color-scheme"),
	"Head script does not let OS prefers-color-scheme override the LUXESTORE dark default"
);

assert(
	indexHtml.includes('class="bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors duration-200"'),
	"Body element uses dual-mode background styling matching dark default and light toggle"
);

const themeStoreSrc = fs.readFileSync(path.join(rootDir, "frontend/src/stores/useThemeStore.js"), "utf-8");

assert(
	themeStoreSrc.includes('return "dark"; // Default to signature LUXESTORE obsidian dark luxury aesthetic'),
	"useThemeStore getInitialMode() returns 'dark' when no saved preference exists"
);

assert(
	themeStoreSrc.includes("const newMode = get().mode === \"dark\" ? \"light\" : \"dark\";") &&
		themeStoreSrc.includes('localStorage.setItem("luxestore-mode", newMode);'),
	"useThemeStore persists manual user toggle atomically into 'luxestore-mode'"
);

const mainJsxSrc = fs.readFileSync(path.join(rootDir, "frontend/src/main.jsx"), "utf-8");

assert(
	mainJsxSrc.includes("useThemeStore.getState().initTheme();"),
	"main.jsx calls initTheme() synchronously before mounting React root to prevent light-mode flash"
);

// --------------------------------------------------------------------------
// 2. ADMIN CONTROL PANEL NAVIGATION & HOVER TRANSITIONS (SCREENSHOTS 4 & 5)
// --------------------------------------------------------------------------
console.log("\n--- 2. Admin Navigation Tabs & Immediate Hover Transitions ---");

const adminPageSrc = fs.readFileSync(path.join(rootDir, "frontend/src/pages/AdminPage.jsx"), "utf-8");

assert(
	adminPageSrc.includes("admin-nav-tab") &&
		adminPageSrc.includes("admin-tab-active") &&
		adminPageSrc.includes("admin-tab-inactive"),
	"AdminPage navigation buttons use dedicated semantic classes: admin-nav-tab, admin-tab-active, admin-tab-inactive"
);

assert(
	adminPageSrc.includes("focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white"),
	"Admin navigation tabs provide visible accessibility focus indicators"
);

assert(
	adminPageSrc.includes("role='tab'") && adminPageSrc.includes("aria-selected={isActive}"),
	"Admin navigation tabs implement proper WAI-ARIA tab semantics"
);

const indexCssSrc = fs.readFileSync(path.join(rootDir, "frontend/src/index.css"), "utf-8");

assert(
	indexCssSrc.includes(".admin-nav-tab {") &&
		indexCssSrc.includes("200ms cubic-bezier(0.4, 0, 0.2, 1)"),
	"Admin navigation tabs implement smooth 200ms ease-in-out transition curves on all interactive properties"
);

assert(
	indexCssSrc.includes(".light .admin-nav-tab.admin-tab-inactive:hover") &&
		indexCssSrc.includes("background-color: #e5e7eb !important;") &&
		indexCssSrc.includes("color: #000000 !important;") &&
		indexCssSrc.includes("border-color: #9ca3af !important;"),
	"Light Mode inactive tab hover immediately transitions on mouse enter to visible subtle grey (#e5e7eb) with black text and defined border"
);

assert(
	indexCssSrc.includes(".light .admin-nav-tab.admin-tab-inactive:hover svg") &&
		indexCssSrc.includes("color: #000000 !important;"),
	"Light Mode inactive tab hover transitions icon immediately to high-contrast black (#000000)"
);

assert(
	indexCssSrc.includes(".light .admin-nav-tab.admin-tab-inactive,") &&
		indexCssSrc.includes("background-color: #ffffff !important;") &&
		indexCssSrc.includes("color: #374151 !important;") &&
		indexCssSrc.includes("border: 1px solid #d1d5db !important;"),
	"Light Mode inactive tab default state smoothly returns on mouse leave to clean white background, dark text and visible border"
);

assert(
	indexCssSrc.includes(".light .admin-nav-tab.admin-tab-active,") &&
		indexCssSrc.includes("background-color: #000000 !important;") &&
		indexCssSrc.includes("color: #ffffff !important;"),
	"Light Mode active tab maintains prominent solid black luxury appearance with white text and elevation"
);

assert(
	indexCssSrc.includes(".light .admin-nav-tab.admin-tab-active:hover") &&
		indexCssSrc.includes("background-color: #262626 !important;") &&
		indexCssSrc.includes("transform: translateY(-1px);"),
	"Light Mode active tab hover visibly transitions to rich charcoal (#262626) with tactile translateY(-1px) lift"
);

assert(
	indexCssSrc.includes(".light .admin-nav-tab.admin-tab-inactive:hover") &&
		indexCssSrc.includes("transform: translateY(-1px);"),
	"Light Mode inactive tab hover smoothly elevates with tactile translateY(-1px) lift"
);

assert(
	indexCssSrc.includes(".dark .admin-nav-tab.admin-tab-active,") &&
		indexCssSrc.includes("background-color: #ffffff !important;") &&
		indexCssSrc.includes("color: #0a0a0a !important;"),
	"Dark Mode active tab renders crisp white background with dark text"
);

assert(
	indexCssSrc.includes(".dark .admin-nav-tab.admin-tab-inactive:hover") &&
		indexCssSrc.includes("background-color: #262626 !important;") &&
		indexCssSrc.includes("color: #ffffff !important;"),
	"Dark Mode inactive tab hover smoothly elevates to subtle charcoal (#262626) with crisp white text and icon"
);

// --------------------------------------------------------------------------
// 3. PRODUCT CATALOG TABLE HOVER TRANSITIONS
// --------------------------------------------------------------------------
console.log("\n--- 3. Product Catalog Table Hover Transitions ---");

assert(
	indexCssSrc.includes("table tbody tr") &&
		indexCssSrc.includes("200ms cubic-bezier(0.4, 0, 0.2, 1)") &&
		indexCssSrc.includes("table tbody td"),
	"Catalog table rows and cells implement smooth 200ms ease-in-out transition curves"
);

assert(
	indexCssSrc.includes(".light tbody tr:hover td") &&
		indexCssSrc.includes("background-color: #f3f4f6 !important;"),
	"Light Mode product row hover smoothly highlights cell background to #f3f4f6"
);

// --------------------------------------------------------------------------
// 4. GLOBAL SECONDARY BUTTON HOVER REFINEMENT
// --------------------------------------------------------------------------
console.log("\n--- 4. Universal Secondary Button Hover Refinement ---");

assert(
	indexCssSrc.includes(".light button.bg-white:hover:not(:disabled)") &&
		indexCssSrc.includes("background-color: #e5e7eb !important;"),
	"Global secondary light buttons hover transitions to distinct #e5e7eb (preventing invisible white-on-white transitions)"
);

console.log("\n==========================================================================");
console.log(`  QA SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log("==========================================================================\n");

if (failed > 0) {
	process.exit(1);
}

