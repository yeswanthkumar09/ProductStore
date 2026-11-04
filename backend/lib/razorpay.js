import Razorpay from "razorpay";
import dotenv from "dotenv";

dotenv.config();

/**
 * Validate required Razorpay environment variables during backend startup
 * without logging secret values.
 */
export const validateRazorpayEnv = () => {
	const missing = [];
	if (!process.env.RAZORPAY_KEY_ID) missing.push("RAZORPAY_KEY_ID");
	if (!process.env.RAZORPAY_KEY_SECRET) missing.push("RAZORPAY_KEY_SECRET");

	if (missing.length > 0) {
		console.warn(`[WARNING] Razorpay environment variables missing: ${missing.join(", ")}`);
		console.warn("[WARNING] Razorpay online checkout will not function until valid credentials are provided.");
		return false;
	}

	const maskedKey = process.env.RAZORPAY_KEY_ID.length > 8
		? `${process.env.RAZORPAY_KEY_ID.substring(0, 8)}...`
		: "[CONFIGURED]";
	console.log(`[INFO] Razorpay SDK initialized with Key ID: ${maskedKey}`);
	return true;
};

/**
 * Singleton instance of Razorpay SDK
 */
export const razorpay = new Razorpay({
	key_id: process.env.RAZORPAY_KEY_ID || "rzp_placeholder_key",
	key_secret: process.env.RAZORPAY_KEY_SECRET || "rzp_placeholder_secret",
});

export const getRazorpayPublicConfig = () => {
	return {
		keyId: process.env.RAZORPAY_KEY_ID || "",
		currency: "INR",
		isConfigured: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
	};
};

export default razorpay;
