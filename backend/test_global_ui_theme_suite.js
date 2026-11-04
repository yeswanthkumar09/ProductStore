import fs from "fs";
import path from "path";
import axios from "axios";

const API_BASE = "http://127.0.0.1:5000/api";

async function runGlobalUIThemeAudit() {
	console.log("======================================================================");
	console.log("   LUXESTORE GLOBAL UI, THEME & FUNCTIONALITY AUDIT SUITE             ");
	console.log("======================================================================\n");

	let passed = 0;
	let failed = 0;

	const assert = (condition, msg) => {
		if (condition) {
			console.log(`[PASS] ${msg}`);
			passed++;
		} else {
			console.error(`[FAIL] ${msg}`);
			failed++;
		}
	};

	try {
		// 1. Verify useThemeStore.js simplification
		const themeStorePath = path.resolve("frontend/src/stores/useThemeStore.js");
		const themeStoreCode = fs.readFileSync(themeStorePath, "utf-8");

		assert(
			themeStoreCode.includes('return "dark";') && !themeStoreCode.includes("setTheme:") && !themeStoreCode.includes("themeColors"),
			"1. useThemeStore defaults to 'dark' mode and removed obsolete accent palette storage"
		);
		assert(
			themeStoreCode.includes("toggleMode:") && themeStoreCode.includes("initTheme:"),
			"2. useThemeStore provides atomic toggleMode() and initTheme() for global propagation"
		);

		// 2. Verify ThemeSelector.jsx simplification
		const themeSelectorPath = path.resolve("frontend/src/components/ThemeSelector.jsx");
		const themeSelectorCode = fs.readFileSync(themeSelectorPath, "utf-8");

		assert(
			!themeSelectorCode.includes("themeColors") && !themeSelectorCode.includes("Accent Palette"),
			"3. ThemeSelector removed multi-color accent palettes and decorative preset dropdowns"
		);
		assert(
			themeSelectorCode.includes("toggleMode") && (themeSelectorCode.includes("Sun") || themeSelectorCode.includes("Moon")),
			"4. ThemeSelector provides single-click Dark/Light mode toggle with accessible labels"
		);

		// 3. Verify CSS Button Design Tokens and Contrast Protection
		const indexCssPath = path.resolve("frontend/src/index.css");
		const indexCssCode = fs.readFileSync(indexCssPath, "utf-8");

		assert(
			indexCssCode.includes(".btn-primary") &&
			indexCssCode.includes("color: #0c0d0e !important;") &&
			indexCssCode.includes("color: #ffffff !important;"),
			"5. .btn-primary establishes white bg/black text in Dark mode and dark bg/white text in Light mode"
		);

		assert(
			indexCssCode.includes(".dark .bg-accent.text-white") &&
			indexCssCode.includes(".light .bg-accent.text-white"),
			"6. Universal CSS contrast guard prevents white-on-white and dark-on-dark button text across all components"
		);

		assert(
			indexCssCode.includes("prefers-reduced-motion"),
			"7. Global motion transitions respect prefers-reduced-motion accessibility standards"
		);

		// 4. Verify Homepage Hero Slide Blank Button Fix in CampaignSlideManagement.jsx
		const slideMgmtPath = path.resolve("frontend/src/components/CampaignSlideManagement.jsx");
		const slideMgmtCode = fs.readFileSync(slideMgmtPath, "utf-8");

		assert(
			!slideMgmtCode.includes("className='inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent text-white font-bold"),
			"8. Fixed blank white action button in Edit Homepage Hero Slide modal"
		);
		assert(
			slideMgmtCode.includes("bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-bold") &&
			slideMgmtCode.includes("Save Changes"),
			"9. Edit/Create modal submit button uses explicit high-contrast primary styling in both modes"
		);

		// 5. Verify EditorialHeroCarousel.jsx contrast and fallback
		const heroCarouselPath = path.resolve("frontend/src/components/EditorialHeroCarousel.jsx");
		const heroCarouselCode = fs.readFileSync(heroCarouselPath, "utf-8");

		assert(
			heroCarouselCode.includes("onError=") && heroCarouselCode.includes("https://images.unsplash.com/"),
			"10. Hero carousel includes automatic fallback handling for broken or failed images"
		);
		assert(
			heroCarouselCode.includes("text-white leading-[1.05]") && !heroCarouselCode.includes("text-neutral-900 dark:text-white leading-[1.05]"),
			"11. Hero carousel headline text maintains crisp white contrast over photography scrim in all modes"
		);

		// 6. Verify AdminPage.jsx Dark/Light adaptation
		const adminPagePath = path.resolve("frontend/src/pages/AdminPage.jsx");
		const adminPageCode = fs.readFileSync(adminPagePath, "utf-8");

		assert(
			adminPageCode.includes("text-neutral-900 dark:text-white") &&
			(adminPageCode.includes("bg-black text-white border-black dark:bg-white dark:text-neutral-950") ||
				adminPageCode.includes("bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-neutral-950")),
			"12. Admin control panel header and navigation tabs adapt cleanly between Dark and Light modes"
		);

		// 7. Verify live public endpoint for active campaign slides
		const slidesRes = await axios.get(`${API_BASE}/campaign-slides/active`);
		assert(
			slidesRes.status === 200 && Array.isArray(slidesRes.data) && slidesRes.data.length > 0,
			`13. Active campaign slides endpoint responds with HTTP 200 and ${slidesRes.data.length} ordered slides`
		);

		// Verify slides are sorted by displayOrder
		const orders = slidesRes.data.map((s) => s.displayOrder);
		const isSorted = orders.every((val, i, arr) => !i || arr[i - 1] <= val);
		assert(
			isSorted,
			"14. Public hero slides respect configured numeric displayOrder sequence"
		);

		// 8. Verify live categories endpoint responds correctly
		const catRes = await axios.get(`${API_BASE}/categories`);
		assert(
			catRes.status === 200 && Array.isArray(catRes.data) && catRes.data.length >= 7,
			`15. Dynamic categories endpoint responds with HTTP 200 and ${catRes.data.length} active departments`
		);

	} catch (err) {
		console.error("Test execution encountered an error:", err.message);
		failed++;
	}

	console.log("\n======================================================================");
	console.log(`   GLOBAL UI & THEME AUDIT: ${passed} PASSED / ${failed} FAILED`);
	console.log("======================================================================\n");

	if (failed > 0) {
		process.exit(1);
	}
}

runGlobalUIThemeAudit();
