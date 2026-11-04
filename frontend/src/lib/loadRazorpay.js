/**
 * Safely and idempotently loads the official Razorpay Checkout SDK script.
 * Prevents duplicate script injection, manages pending promises, and provides clean error reporting.
 */

let razorpayScriptPromise = null;

export const loadRazorpayScript = () => {
	// 1. If Razorpay is already available globally on window, resolve immediately
	if (typeof window !== "undefined" && window.Razorpay) {
		return Promise.resolve(true);
	}

	// 2. If a script loading promise is already pending, return it to prevent duplicate injection
	if (razorpayScriptPromise) {
		return razorpayScriptPromise;
	}

	// 3. Check if script tag is already in DOM (e.g., from server rendering or previous load)
	const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
	if (existingScript) {
		razorpayScriptPromise = new Promise((resolve, reject) => {
			if (window.Razorpay) {
				resolve(true);
			} else {
				existingScript.addEventListener("load", () => resolve(true));
				existingScript.addEventListener("error", () => reject(new Error("Failed to load Razorpay SDK.")));
			}
		});
		return razorpayScriptPromise;
	}

	// 4. Create and append the official script tag safely
	razorpayScriptPromise = new Promise((resolve, reject) => {
		const script = document.createElement("script");
		script.id = "razorpay-checkout-sdk";
		script.src = "https://checkout.razorpay.com/v1/checkout.js";
		script.async = true;

		script.onload = () => {
			if (window.Razorpay) {
				resolve(true);
			} else {
				reject(new Error("Razorpay SDK loaded but window.Razorpay is undefined."));
			}
		};

		script.onerror = () => {
			// Cleanup script on error so subsequent attempts can retry
			if (script.parentNode) {
				script.parentNode.removeChild(script);
			}
			razorpayScriptPromise = null;
			reject(new Error("Failed to load Razorpay payment gateway script. Please check your internet connection."));
		};

		document.body.appendChild(script);
	});

	return razorpayScriptPromise;
};

export default loadRazorpayScript;
