import { parsePhoneNumber, isValidPhoneNumber } from "libphonenumber-js";

// Normalize phone number to consistent international E.164 format (Used for logistics and delivery addresses)
export const normalizePhoneNumber = (rawPhone, defaultCountry = "IN") => {
	if (!rawPhone) return { isValid: false, normalized: null, error: "Phone number is required" };

	try {
		const str = rawPhone.toString().trim();
		if (!isValidPhoneNumber(str, defaultCountry)) {
			return {
				isValid: false,
				normalized: null,
				error: "Please enter a valid mobile number with country code (e.g., +91 98765 43210).",
			};
		}

		const parsed = parsePhoneNumber(str, defaultCountry);
		if (!parsed.isValid()) {
			return { isValid: false, normalized: null, error: "Invalid mobile number." };
		}

		return {
			isValid: true,
			normalized: parsed.format("E.164"), // e.g. +919876543210
			country: parsed.country,
			nationalNumber: parsed.nationalNumber,
		};
	} catch (err) {
		return { isValid: false, normalized: null, error: err.message };
	}
};
