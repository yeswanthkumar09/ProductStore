import dotenv from "dotenv";
import WarehouseSetting from "../models/warehouseSetting.model.js";

dotenv.config();

const SHIPROCKET_API_BASE = "https://apiv2.shiprocket.in/v1/external";

// In-memory token cache: { token, expiresAt }
let cachedAuthToken = {
	token: null,
	expiresAt: 0,
};

// In-memory serviceability response cache: key -> { data, expiresAt }
const serviceabilityCache = new Map();

// Test / Mock handler injection for automated test suites
let mockHandler = null;

export const setShiprocketMockHandler = (handler) => {
	mockHandler = handler;
};

export const clearShiprocketMockHandler = () => {
	mockHandler = null;
};

export const clearServiceabilityCache = () => {
	serviceabilityCache.clear();
};

/**
 * Safe development diagnostic logger.
 * Never logs passwords, auth tokens, secrets, OTPs, or personal address details.
 */
export const logShiprocketDiagnostic = ({
	endpoint = "/v1/external/courier/serviceability/",
	authSucceeded,
	pickupPincode,
	destinationPincode,
	shiprocketHttpStatus,
	classification,
	reason,
}) => {
	if (process.env.NODE_ENV === "development") {
		console.log(
			`[SHIPROCKET_DIAGNOSTIC] Endpoint: ${endpoint} | Auth: ${authSucceeded ? "SUCCESS" : "FAILED"} | Pickup: ${pickupPincode || "UNSET"} | Dest: ${destinationPincode || "UNSET"} | HTTP: ${shiprocketHttpStatus ?? "N/A"} | Class: ${classification} | Reason: ${reason}`
		);
	}
};

/**
 * Resolve the authoritative warehouse / pickup PIN code.
 * Checks default WarehouseSetting in database, falls back to SHIPROCKET_PICKUP_PINCODE or '110001'.
 * Validates that the pickup PIN is a valid 6-digit number.
 */
export const getActivePickupPincode = async () => {
	try {
		const setting = await WarehouseSetting.findOne({ isDefault: true });
		if (setting && setting.pickupPincode && /^\d{6}$/.test(setting.pickupPincode.trim())) {
			return setting.pickupPincode.trim();
		}
	} catch (err) {
		// fallback to env on DB lookup failure
	}
	const envPin = (process.env.SHIPROCKET_PICKUP_PINCODE || "110001").toString().trim();
	return /^\d{6}$/.test(envPin) ? envPin : "110001";
};

/**
 * Authenticate with Shiprocket and retrieve detailed auth status.
 * Handles token caching (9 days), expiration, missing credentials, and provider failures.
 * Never exposes passwords or API secrets in return objects or logs.
 */
export const getShiprocketAuthDetails = async ({ forceRefresh = false } = {}) => {
	if (!forceRefresh && cachedAuthToken.token && Date.now() < cachedAuthToken.expiresAt) {
		return {
			token: cachedAuthToken.token,
			authenticated: true,
			status: "AUTHENTICATED",
			httpStatus: 200,
		};
	}

	const email = (process.env.SHIPROCKET_EMAIL || "").trim();
	const password = (process.env.SHIPROCKET_PASSWORD || "").trim();

	// Check if credentials are unconfigured or placeholder defaults
	if (
		!email ||
		!password ||
		email === "your_shiprocket_email@example.com" ||
		password === "your_shiprocket_password"
	) {
		return {
			token: null,
			authenticated: false,
			status: "MISSING_CREDENTIALS",
			httpStatus: null,
			error: "Shiprocket credentials (SHIPROCKET_EMAIL, SHIPROCKET_PASSWORD) are not configured or set to placeholder defaults in environment.",
		};
	}

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 10000);

	try {
		const res = await fetch(`${SHIPROCKET_API_BASE}/auth/login`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email, password }),
			signal: controller.signal,
		});
		clearTimeout(timeoutId);

		const responseText = await res.text();
		let responseJson = null;
		try {
			responseJson = JSON.parse(responseText);
		} catch (e) {
			// not JSON
		}

		if (res.status === 200 && responseJson?.token) {
			cachedAuthToken = {
				token: responseJson.token,
				expiresAt: Date.now() + 9 * 24 * 60 * 60 * 1000, // 9-day cache (Shiprocket token lifetime = 10 days)
			};
			return {
				token: responseJson.token,
				authenticated: true,
				status: "AUTHENTICATED",
				httpStatus: 200,
			};
		}

		// Handle 401 / 403 Invalid credentials
		if (res.status === 401 || res.status === 403) {
			const safeMsg = responseJson?.message || "Invalid Shiprocket API email or password combination.";
			console.warn(`[Shiprocket Auth Failed] HTTP ${res.status}: ${safeMsg}`);
			return {
				token: null,
				authenticated: false,
				status: "AUTH_FAILED",
				httpStatus: res.status,
				error: safeMsg,
			};
		}

		// Handle 429 Rate limit
		if (res.status === 429) {
			console.warn("[Shiprocket Auth Rate Limited] HTTP 429");
			return {
				token: null,
				authenticated: false,
				status: "RATE_LIMITED",
				httpStatus: 429,
				error: "Shiprocket authentication rate limit exceeded.",
			};
		}

		console.warn(`[Shiprocket Auth Provider Error] HTTP ${res.status}`);
		return {
			token: null,
			authenticated: false,
			status: "PROVIDER_ERROR",
			httpStatus: res.status,
			error: responseJson?.message || `Shiprocket authentication rejected with HTTP ${res.status}`,
		};
	} catch (err) {
		clearTimeout(timeoutId);
		const isTimeout = err.name === "AbortError";
		console.warn(`[Shiprocket Auth Error] ${isTimeout ? "Connection timed out after 10s" : err.message}`);
		return {
			token: null,
			authenticated: false,
			status: isTimeout ? "TIMEOUT" : "NETWORK_ERROR",
			httpStatus: isTimeout ? 408 : 503,
			error: isTimeout ? "Shiprocket auth request timed out." : err.message,
		};
	}
};

/**
 * Convenience helper returning token or null
 */
export const getShiprocketAuthToken = async (opts) => {
	const details = await getShiprocketAuthDetails(opts);
	return details.token;
};

/**
 * Deterministic cache key for serviceability queries.
 */
const getCacheKey = (pickup, delivery, cod, weight, declaredValue) => {
	const roundedWeight = Math.round((Number(weight) || 0.5) * 10) / 10;
	return `${pickup}_${delivery}_${cod ? 1 : 0}_${roundedWeight}_${Math.round(declaredValue || 0)}`;
};

/**
 * Query real-time courier serviceability from Shiprocket.
 *
 * Implements strict diagnosis across:
 * - HTTP 200 with couriers: SERVICEABLE
 * - HTTP 200 with no couriers: UNSERVICEABLE
 * - HTTP 401: Invalid credentials or expired token (triggers automatic refresh attempt)
 * - HTTP 400 or 422: Invalid or missing request parameters
 * - HTTP 404: Unserviceable route
 * - HTTP 429: Rate limit exceeded
 * - HTTP 5xx, timeout, network failure: VERIFICATION_FAILED
 *
 * @param {Object} params
 * @param {string} params.deliveryPincode - Destination 6-digit PIN code
 * @param {string} [params.pickupPincode] - Warehouse/pickup PIN code (defaults to active pickup PIN)
 * @param {number|boolean} [params.cod=0] - 0 for prepaid, 1 for COD
 * @param {number} [params.weight=0.5] - Weight in kg
 * @param {number} [params.declaredValue=500] - Order total in INR
 * @param {boolean} [params.skipCache=false]
 * @returns {Promise<Object>}
 */
export const checkCourierServiceability = async ({
	deliveryPincode,
	pickupPincode,
	cod = 0,
	weight = 0.5,
	declaredValue = 500,
	skipCache = false,
}) => {
	const cleanDeliveryPin = (deliveryPincode || "").toString().trim();
	if (!cleanDeliveryPin || !/^\d{6}$/.test(cleanDeliveryPin)) {
		const diag = "Invalid destination PIN code format (must be 6 digits).";
		logShiprocketDiagnostic({
			authSucceeded: false,
			destinationPincode: cleanDeliveryPin,
			classification: "INVALID_PARAMETERS",
			reason: diag,
		});
		return {
			success: false,
			serviceable: false,
			isInconclusive: false,
			classification: "INVALID_PARAMETERS",
			message: "Please enter a valid 6-digit PIN code.",
			diagnostic: diag,
		};
	}

	// Resolve pickup PIN code (must be valid 6-digit origin)
	const cleanPickupPin = pickupPincode
		? pickupPincode.toString().trim()
		: await getActivePickupPincode();

	if (!cleanPickupPin || !/^\d{6}$/.test(cleanPickupPin)) {
		const diag = "Origin warehouse pickup PIN code is unconfigured or invalid.";
		logShiprocketDiagnostic({
			authSucceeded: false,
			pickupPincode: cleanPickupPin,
			destinationPincode: cleanDeliveryPin,
			classification: "VERIFICATION_FAILED",
			reason: diag,
		});
		return {
			success: false,
			serviceable: false,
			isInconclusive: true,
			classification: "VERIFICATION_FAILED",
			httpStatus: 400,
			authSucceeded: false,
			deliveryPincode: cleanDeliveryPin,
			pickupPincode: cleanPickupPin || "",
			message: "Unable to verify delivery availability. Please try again.",
			diagnostic: diag,
			error: diag,
		};
	}

	const isCodRequested = cod === 1 || cod === true || cod === "1";
	const cacheKey = getCacheKey(cleanPickupPin, cleanDeliveryPin, isCodRequested, weight, declaredValue);

	// 1. Check if mock handler is injected (for automated integration/unit tests)
	if (mockHandler) {
		try {
			const mockResult = await mockHandler({
				deliveryPincode: cleanDeliveryPin,
				pickupPincode: cleanPickupPin,
				cod: isCodRequested ? 1 : 0,
				weight,
				declaredValue,
			});
			if (mockResult) {
				logShiprocketDiagnostic({
					authSucceeded: mockResult.authSucceeded ?? true,
					pickupPincode: cleanPickupPin,
					destinationPincode: cleanDeliveryPin,
					shiprocketHttpStatus: mockResult.httpStatus || (mockResult.serviceable ? 200 : 404),
					classification: mockResult.classification || (mockResult.serviceable ? "SERVICEABLE" : mockResult.isInconclusive ? "VERIFICATION_FAILED" : "UNSERVICEABLE"),
					reason: mockResult.diagnostic || mockResult.message,
				});
				return mockResult;
			}
		} catch (mockErr) {
			logShiprocketDiagnostic({
				authSucceeded: false,
				pickupPincode: cleanPickupPin,
				destinationPincode: cleanDeliveryPin,
				classification: "VERIFICATION_FAILED",
				reason: mockErr.message,
			});
			return {
				success: false,
				serviceable: false,
				isInconclusive: true,
				classification: "VERIFICATION_FAILED",
				message: "Unable to verify delivery availability. Please try again.",
				error: mockErr.message,
			};
		}
	}

	// 2. Check in-memory TTL cache (never override a newer confirmed unavailable result)
	if (!skipCache && serviceabilityCache.has(cacheKey)) {
		const cached = serviceabilityCache.get(cacheKey);
		if (Date.now() < cached.expiresAt) {
			return cached.data;
		}
		serviceabilityCache.delete(cacheKey);
	}

	// 3. Obtain authentication details
	const authDetails = await getShiprocketAuthDetails();

	if (!authDetails.token) {
		logShiprocketDiagnostic({
			authSucceeded: false,
			pickupPincode: cleanPickupPin,
			destinationPincode: cleanDeliveryPin,
			shiprocketHttpStatus: authDetails.httpStatus,
			classification: "VERIFICATION_FAILED",
			reason: authDetails.error,
		});
		return {
			success: false,
			serviceable: false,
			isInconclusive: true,
			classification: "VERIFICATION_FAILED",
			httpStatus: authDetails.httpStatus || 401,
			authSucceeded: false,
			deliveryPincode: cleanDeliveryPin,
			pickupPincode: cleanPickupPin,
			message: "Unable to verify delivery availability. Please try again.",
			diagnostic: authDetails.error,
			error: authDetails.error,
		};
	}

	// 4. Query Shiprocket Courier Serviceability API
	// Official endpoint: GET https://apiv2.shiprocket.in/v1/external/courier/serviceability/
	const queryParams = new URLSearchParams({
		pickup_postcode: cleanPickupPin,
		delivery_postcode: cleanDeliveryPin,
		cod: isCodRequested ? "1" : "0",
		weight: (Number(weight) || 0.5).toString(),
		declared_value: Math.round(Number(declaredValue) || 500).toString(),
	});

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 8000);

	try {
		const res = await fetch(`${SHIPROCKET_API_BASE}/courier/serviceability/?${queryParams.toString()}`, {
			method: "GET",
			headers: {
				Authorization: `Bearer ${authDetails.token}`,
				"Content-Type": "application/json",
			},
			signal: controller.signal,
		});
		clearTimeout(timeoutId);

		// Handle HTTP 401: Expired token -> single force-refresh and retry
		if (res.status === 401) {
			console.log("[Shiprocket] Bearer token expired. Attempting force-refresh and retry...");
			const refreshed = await getShiprocketAuthDetails({ forceRefresh: true });
			if (refreshed.token) {
				return checkCourierServiceability({
					deliveryPincode: cleanDeliveryPin,
					pickupPincode: cleanPickupPin,
					cod,
					weight,
					declaredValue,
					skipCache: true,
				});
			}

			const diag = "Shiprocket authentication token expired and renewal failed.";
			logShiprocketDiagnostic({
				authSucceeded: false,
				pickupPincode: cleanPickupPin,
				destinationPincode: cleanDeliveryPin,
				shiprocketHttpStatus: 401,
				classification: "VERIFICATION_FAILED",
				reason: diag,
			});
			return {
				success: false,
				serviceable: false,
				isInconclusive: true,
				classification: "VERIFICATION_FAILED",
				httpStatus: 401,
				authSucceeded: false,
				deliveryPincode: cleanDeliveryPin,
				pickupPincode: cleanPickupPin,
				message: "Unable to verify delivery availability. Please try again.",
				diagnostic: diag,
			};
		}

		// Handle HTTP 429: Rate limit exceeded
		if (res.status === 429) {
			const diag = "Shiprocket courier serviceability rate limit exceeded.";
			logShiprocketDiagnostic({
				authSucceeded: true,
				pickupPincode: cleanPickupPin,
				destinationPincode: cleanDeliveryPin,
				shiprocketHttpStatus: 429,
				classification: "VERIFICATION_FAILED",
				reason: diag,
			});
			return {
				success: false,
				serviceable: false,
				isInconclusive: true,
				classification: "VERIFICATION_FAILED",
				httpStatus: 429,
				authSucceeded: true,
				deliveryPincode: cleanDeliveryPin,
				pickupPincode: cleanPickupPin,
				message: "Unable to verify delivery availability. Please try again.",
				diagnostic: diag,
			};
		}

		// Handle HTTP 400 or HTTP 422: Invalid or missing parameters
		if (res.status === 400 || res.status === 422) {
			const errText = await res.text();
			let errJson = null;
			try {
				errJson = JSON.parse(errText);
			} catch (e) {}

			const diag = `Shiprocket rejected request parameters (HTTP ${res.status}): ${errJson?.message || errText.substring(0, 100)}`;
			logShiprocketDiagnostic({
				authSucceeded: true,
				pickupPincode: cleanPickupPin,
				destinationPincode: cleanDeliveryPin,
				shiprocketHttpStatus: res.status,
				classification: "VERIFICATION_FAILED",
				reason: diag,
			});
			return {
				success: false,
				serviceable: false,
				isInconclusive: true,
				classification: "VERIFICATION_FAILED",
				httpStatus: res.status,
				authSucceeded: true,
				deliveryPincode: cleanDeliveryPin,
				pickupPincode: cleanPickupPin,
				message: "Unable to verify delivery availability. Please try again.",
				diagnostic: diag,
			};
		}

		// Handle HTTP 404: In Shiprocket, 404 indicates non-serviceable route or delivery PIN
		if (res.status === 404) {
			const bodyText = await res.text();
			let bodyJson = null;
			try {
				bodyJson = JSON.parse(bodyText);
			} catch (e) {}

			const diag = bodyJson?.message || "Shiprocket confirmed no courier available for this route (HTTP 404).";
			logShiprocketDiagnostic({
				authSucceeded: true,
				pickupPincode: cleanPickupPin,
				destinationPincode: cleanDeliveryPin,
				shiprocketHttpStatus: 404,
				classification: "UNSERVICEABLE",
				reason: diag,
			});
			return {
				success: true,
				serviceable: false,
				isInconclusive: false,
				classification: "UNSERVICEABLE",
				httpStatus: 404,
				authSucceeded: true,
				deliveryPincode: cleanDeliveryPin,
				pickupPincode: cleanPickupPin,
				isPrepaidAvailable: false,
				isCodAvailable: false,
				couriers: [],
				courierCount: 0,
				message: "Delivery is currently unavailable for this PIN code.",
				diagnostic: diag,
			};
		}

		// Handle HTTP 5xx: Provider server outage
		if (res.status >= 500) {
			const diag = `Shiprocket server error (HTTP ${res.status}).`;
			logShiprocketDiagnostic({
				authSucceeded: true,
				pickupPincode: cleanPickupPin,
				destinationPincode: cleanDeliveryPin,
				shiprocketHttpStatus: res.status,
				classification: "VERIFICATION_FAILED",
				reason: diag,
			});
			return {
				success: false,
				serviceable: false,
				isInconclusive: true,
				classification: "VERIFICATION_FAILED",
				httpStatus: res.status,
				authSucceeded: true,
				deliveryPincode: cleanDeliveryPin,
				pickupPincode: cleanPickupPin,
				message: "Unable to verify delivery availability. Please try again.",
				diagnostic: diag,
			};
		}

		// Handle HTTP 200 OK: Inspect JSON response
		const data = await res.json();
		const rawCouriers = data?.data?.available_courier_companies || [];

		// Parse documented courier options
		const eligibleCouriers = rawCouriers.map((c) => ({
			courierId: c.courier_company_id,
			courierName: c.courier_name,
			rate: Number(c.rate) || 0,
			estimatedDeliveryDays: c.estimated_delivery_days || c.etd || "2-4 business days",
			etd: c.etd,
			isCodAvailable: Number(c.cod) === 1,
			city: c.city || "",
			state: c.state || "",
			rating: Number(c.rating) || 0,
		}));

		const hasEligibleCouriers = eligibleCouriers.length > 0;
		const isCodAvailable = eligibleCouriers.some((c) => c.isCodAvailable);
		const isPrepaidAvailable = hasEligibleCouriers;

		// If COD was specifically requested, check if at least one courier supports COD
		let isServiceable = hasEligibleCouriers;
		if (isCodRequested && !isCodAvailable) {
			// Delivery is available for prepaid, but COD is unavailable
			isServiceable = false;
		}

		const minDeliveryFee = hasEligibleCouriers ? Math.min(...eligibleCouriers.map((c) => c.rate)) : 0;
		const bestCourier = eligibleCouriers[0] || null;
		const estimatedDeliveryDays = bestCourier?.estimatedDeliveryDays || "2-4 business days";

		const classification = isServiceable ? "SERVICEABLE" : "UNSERVICEABLE";
		const displayMessage = isServiceable
			? "Delivery is available for this PIN code."
			: "Delivery is currently unavailable for this PIN code.";

		const result = {
			success: true,
			serviceable: isServiceable,
			isInconclusive: false,
			classification,
			httpStatus: 200,
			authSucceeded: true,
			deliveryPincode: cleanDeliveryPin,
			pickupPincode: cleanPickupPin,
			isPrepaidAvailable,
			isCodAvailable,
			minDeliveryFee,
			estimatedDeliveryDays,
			city: bestCourier?.city || "",
			state: bestCourier?.state || "",
			couriers: eligibleCouriers,
			courierCount: eligibleCouriers.length,
			message: displayMessage,
			diagnostic: `Shiprocket returned ${eligibleCouriers.length} eligible courier partner(s).`,
		};

		logShiprocketDiagnostic({
			authSucceeded: true,
			pickupPincode: cleanPickupPin,
			destinationPincode: cleanDeliveryPin,
			shiprocketHttpStatus: 200,
			classification,
			reason: result.diagnostic,
		});

		// Cache successful results
		const cacheTTL = (Number(process.env.SHIPROCKET_CACHE_TTL_SECONDS) || 1800) * 1000;
		serviceabilityCache.set(cacheKey, {
			data: result,
			expiresAt: Date.now() + cacheTTL,
		});

		return result;
	} catch (err) {
		clearTimeout(timeoutId);
		const isTimeout = err.name === "AbortError";
		const diag = isTimeout ? "Shiprocket serviceability query timed out (8s limit)." : `Network error: ${err.message}`;

		logShiprocketDiagnostic({
			authSucceeded: true,
			pickupPincode: cleanPickupPin,
			destinationPincode: cleanDeliveryPin,
			shiprocketHttpStatus: isTimeout ? 408 : 503,
			classification: "VERIFICATION_FAILED",
			reason: diag,
		});

		return {
			success: false,
			serviceable: false,
			isInconclusive: true,
			classification: "VERIFICATION_FAILED",
			httpStatus: isTimeout ? 408 : 503,
			authSucceeded: true,
			deliveryPincode: cleanDeliveryPin,
			pickupPincode: cleanPickupPin,
			message: "Unable to verify delivery availability. Please try again.",
			diagnostic: diag,
			error: diag,
		};
	}
};

/**
 * Create a shipment in Shiprocket for a confirmed, paid order.
 * Safely preserves the paid order status if shipment creation fails.
 */
export const createShiprocketOrder = async (order) => {
	if (!order || !order._id) return { success: false, error: "Invalid order" };

	try {
		const token = await getShiprocketAuthToken();
		if (!token) {
			console.log(
				`[Shiprocket Shipment Note] Provider credentials unconfigured; shipment for order #${order._id.toString().slice(-6)} marked as pending.`
			);
			order.shipmentStatus = "pending";
			await order.save();
			return { success: false, status: "credentials_missing" };
		}

		const pickupPin = await getActivePickupPincode();
		const shippingAddress = order.shippingAddress || {};

		const payload = {
			order_id: order._id.toString(),
			order_date: new Date(order.createdAt || Date.now()).toISOString().split("T")[0],
			pickup_location: "Primary",
			billing_customer_name: shippingAddress.fullName || "Customer",
			billing_last_name: "",
			billing_address: `${shippingAddress.houseFlat || ""} ${shippingAddress.street || ""}`.trim() || "Address Line 1",
			billing_city: shippingAddress.city || "New Delhi",
			billing_pincode: shippingAddress.pincode || "110001",
			billing_state: shippingAddress.state || "Delhi",
			billing_country: shippingAddress.country || "India",
			billing_email: order.user?.email || "customer@example.com",
			billing_phone: shippingAddress.phone || "9876543210",
			shipping_is_billing: true,
			order_items: (order.products || []).map((p) => ({
				name: p.product?.name || "Luxe Item",
				sku: p.sku || "LUXE-SKU",
				units: p.quantity || 1,
				selling_price: p.price || order.totalAmount,
			})),
			payment_method: order.paymentMethod === "cod" ? "COD" : "Prepaid",
			sub_total: order.totalAmount,
			length: 10,
			breadth: 10,
			height: 5,
			weight: 0.5,
		};

		const res = await fetch(`${SHIPROCKET_API_BASE}/orders/create/adhoc`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(payload),
		});

		const data = await res.json();
		if (res.ok && (data.order_id || data.shipment_id)) {
			order.shiprocketOrderId = (data.order_id || "").toString();
			order.shiprocketShipmentId = (data.shipment_id || "").toString();
			order.shipmentStatus = "created";
			await order.save();
			return { success: true, orderId: data.order_id, shipmentId: data.shipment_id };
		} else {
			// Shipment creation failed: preserve paid order and log for retry
			order.shipmentStatus = "failed";
			order.shiprocketError = data.message || "Shiprocket order creation rejected";
			await order.save();
			return { success: false, error: order.shiprocketError };
		}
	} catch (err) {
		// Side-effect isolation: order paid status is strictly preserved!
		order.shipmentStatus = "failed";
		order.shiprocketError = err.message;
		await order.save();
		console.warn(`[Shiprocket Shipment Note] Order #${order._id} paid, shipment deferred: ${err.message}`);
		return { success: false, error: err.message };
	}
};

/**
 * Cancel a shipment/order in Shiprocket upon cancellation.
 * Safely handles missing credentials, network errors, and returns accurate status without fabricating success.
 */
export const cancelShiprocketOrder = async ({ shiprocketOrderId, shiprocketAwb }) => {
	if (!shiprocketOrderId && !shiprocketAwb) {
		return { success: false, error: "No Shiprocket order ID or AWB provided for cancellation." };
	}

	try {
		const token = await getShiprocketAuthToken();
		if (!token) {
			console.log("[Shiprocket Cancel Note] Provider credentials unconfigured; shipment cancellation marked deferred.");
			return {
				success: false,
				status: "credentials_missing",
				error: "Shiprocket credentials are not configured in environment.",
			};
		}

		let endpoint = `${SHIPROCKET_API_BASE}/orders/cancel`;
		let payload = {};

		if (shiprocketOrderId) {
			payload = { ids: [shiprocketOrderId] };
		} else if (shiprocketAwb) {
			endpoint = `${SHIPROCKET_API_BASE}/orders/cancel/shipment/awbs`;
			payload = { awbs: [shiprocketAwb] };
		}

		const res = await fetch(endpoint, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(payload),
		});

		const data = await res.json().catch(() => ({}));

		if (res.ok && (data.status_code === 200 || data.status === 200 || data.message?.toLowerCase().includes("success") || data.message?.toLowerCase().includes("cancel"))) {
			console.log(`[Shiprocket Cancel Success] Order/AWB cancelled: ${shiprocketOrderId || shiprocketAwb}`);
			return { success: true, message: data.message || "Shipment successfully cancelled in Shiprocket." };
		} else {
			const errorMsg = data.message || data.error || `Shiprocket cancellation rejected with HTTP ${res.status}`;
			console.warn(`[Shiprocket Cancel Note] ${errorMsg}`);
			return { success: false, error: errorMsg, httpStatus: res.status };
		}
	} catch (err) {
		console.warn(`[Shiprocket Cancel Exception] ${err.message}`);
		return { success: false, error: err.message };
	}
};

export default {
	checkCourierServiceability,
	getActivePickupPincode,
	getShiprocketAuthDetails,
	getShiprocketAuthToken,
	createShiprocketOrder,
	cancelShiprocketOrder,
	setShiprocketMockHandler,
	clearShiprocketMockHandler,
	clearServiceabilityCache,
	logShiprocketDiagnostic,
};
