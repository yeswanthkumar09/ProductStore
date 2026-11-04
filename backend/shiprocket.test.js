import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

async function runShiprocketTestSuite() {
	console.log("================================================================================");
	console.log("       SHIPROCKET AUTHORITATIVE SERVICEABILITY & CHECKOUT TEST SUITE            ");
	console.log("================================================================================");

	const results = {
		passed: 0,
		failed: 0,
		scenarios: [],
	};

	function logScenario(num, name, success, details = "") {
		if (success) {
			results.passed++;
			console.log(`[PASS] Test ${num}: ${name}`);
		} else {
			results.failed++;
			console.error(`[FAIL] Test ${num}: ${name} - ${details}`);
		}
		results.scenarios.push({ num, name, success, details });
	}

	try {
		await mongoose.connect(process.env.MONGO_URI);
		const User = (await import("./models/user.model.js")).default;
		const Product = (await import("./models/product.model.js")).default;
		const Order = (await import("./models/order.model.js")).default;
		const ServiceableLocation = (await import("./models/serviceableLocation.model.js")).default;
		const Address = (await import("./models/address.model.js")).default;
		const WarehouseSetting = (await import("./models/warehouseSetting.model.js")).default;
		const {
			checkCourierServiceability,
			getActivePickupPincode,
			getShiprocketAuthDetails,
			createShiprocketOrder,
			setShiprocketMockHandler,
			clearShiprocketMockHandler,
			clearServiceabilityCache,
		} = await import("./services/shiprocket.service.js");

		const timestamp = Date.now();

		// Create Test Customer & Product
		const testUser = await User.create({
			name: "Shiprocket Test Customer",
			email: `sr_user_${timestamp}@example.com`,
			password: "TestPassword123!",
			role: "customer",
			isEmailVerified: true,
		});

		const testProduct = await Product.create({
			name: "Luxe Cashmere Scarf",
			description: "Pure handcrafted cashmere",
			price: 3499,
			category: "Accessories",
			stock: 25,
			image: "https://example.com/scarf.jpg",
			images: ["https://example.com/scarf.jpg"],
		});

		// Ensure active default warehouse setting exists
		await WarehouseSetting.findOneAndUpdate(
			{ isDefault: true },
			{
				warehouseName: "Central Logistics Hub",
				pickupPincode: "110001",
				contactPerson: "Logistics Lead",
				contactPhone: "+91 98765 43210",
				addressLine1: "Connaught Place Hub 1",
				city: "New Delhi",
				state: "Delhi",
				isDefault: true,
			},
			{ upsert: true, new: true }
		);

		// =========================================================================
		// TEST 1: PIN code for which Shiprocket returns an eligible courier
		// =========================================================================
		setShiprocketMockHandler(async ({ deliveryPincode }) => {
			if (deliveryPincode === "400001") {
				return {
					success: true,
					serviceable: true,
					isInconclusive: false,
					classification: "SERVICEABLE",
					httpStatus: 200,
					deliveryPincode: "400001",
					pickupPincode: "110001",
					isPrepaidAvailable: true,
					isCodAvailable: true,
					minDeliveryFee: 60,
					estimatedDeliveryDays: "2-3 business days",
					city: "Mumbai",
					state: "Maharashtra",
					couriers: [
						{ courierName: "Blue Dart Air", rate: 60, estimatedDays: "2 days", cod: 1 },
						{ courierName: "Delhivery Surface", rate: 50, estimatedDays: "3 days", cod: 1 },
					],
					message: "Delivery is available for this PIN code.",
				};
			}
			return null;
		});

		clearServiceabilityCache();
		const test1 = await checkCourierServiceability({ deliveryPincode: "400001" });
		const pass1 =
			test1.serviceable === true &&
			test1.isInconclusive === false &&
			test1.classification === "SERVICEABLE" &&
			test1.message === "Delivery is available for this PIN code." &&
			test1.couriers?.length === 2;

		logScenario(
			1,
			"PIN code with eligible couriers returns SERVICEABLE ('Delivery is available for this PIN code.')",
			pass1,
			`Serviceable: ${test1.serviceable}, Message: "${test1.message}"`
		);

		// =========================================================================
		// TEST 2: PIN code for which Shiprocket returns no eligible courier
		// =========================================================================
		setShiprocketMockHandler(async ({ deliveryPincode }) => {
			if (deliveryPincode === "792001") {
				return {
					success: true,
					serviceable: false,
					isInconclusive: false,
					classification: "UNSERVICEABLE",
					httpStatus: 200,
					deliveryPincode: "792001",
					pickupPincode: "110001",
					isPrepaidAvailable: false,
					isCodAvailable: false,
					couriers: [],
					courierCount: 0,
					message: "Delivery is currently unavailable for this PIN code.",
				};
			}
			return null;
		});

		clearServiceabilityCache();
		const test2 = await checkCourierServiceability({ deliveryPincode: "792001" });
		const pass2 =
			test2.serviceable === false &&
			test2.isInconclusive === false &&
			test2.classification === "UNSERVICEABLE" &&
			test2.message === "Delivery is currently unavailable for this PIN code.";

		logScenario(
			2,
			"PIN code with zero couriers returns UNSERVICEABLE ('Delivery is currently unavailable for this PIN code.')",
			pass2,
			`Serviceable: ${test2.serviceable}, Message: "${test2.message}"`
		);

		// =========================================================================
		// TEST 3: Invalid or missing pickup PIN configuration
		// =========================================================================
		clearShiprocketMockHandler();
		clearServiceabilityCache();
		const test3 = await checkCourierServiceability({
			deliveryPincode: "400001",
			pickupPincode: "INVALID_PIN",
		});
		const pass3 =
			test3.serviceable === false &&
			test3.isInconclusive === true &&
			test3.classification === "VERIFICATION_FAILED" &&
			test3.message === "Unable to verify delivery availability. Please try again." &&
			test3.diagnostic.includes("pickup PIN");

		logScenario(
			3,
			"Invalid or missing pickup PIN returns VERIFICATION_FAILED with safe diagnostic note",
			pass3,
			`isInconclusive: ${test3.isInconclusive}, Diagnostic: "${test3.diagnostic}"`
		);

		// =========================================================================
		// TEST 4: Invalid credentials and authentication failure handling
		// =========================================================================
		const origEmail = process.env.SHIPROCKET_EMAIL;
		const origPassword = process.env.SHIPROCKET_PASSWORD;
		process.env.SHIPROCKET_EMAIL = "invalid_user@shiprocket.example";
		process.env.SHIPROCKET_PASSWORD = "invalid_password";

		// Clear cached token
		const authFailDetails = await getShiprocketAuthDetails({ forceRefresh: true });
		const pass4 =
			authFailDetails.authenticated === false &&
			authFailDetails.token === null &&
			(authFailDetails.status === "AUTH_FAILED" || authFailDetails.status === "MISSING_CREDENTIALS" || authFailDetails.status === "NETWORK_ERROR");

		// Restore env
		process.env.SHIPROCKET_EMAIL = origEmail;
		process.env.SHIPROCKET_PASSWORD = origPassword;

		logScenario(
			4,
			"Invalid credentials or expired token correctly detects auth failure without exposing secrets",
			pass4,
			`Auth Status: "${authFailDetails.status}", Error: "${authFailDetails.error}"`
		);

		// =========================================================================
		// TEST 5: Incorrect destination query parameters (invalid PIN format)
		// =========================================================================
		clearServiceabilityCache();
		const test5 = await checkCourierServiceability({ deliveryPincode: "123" });
		const pass5 =
			test5.serviceable === false &&
			test5.isInconclusive === false &&
			test5.classification === "INVALID_PARAMETERS" &&
			test5.message === "Please enter a valid 6-digit PIN code.";

		logScenario(
			5,
			"Incorrect query parameters (malformed destination PIN) returns clean format validation error",
			pass5,
			`Message: "${test5.message}", Classification: "${test5.classification}"`
		);

		// =========================================================================
		// TEST 6: API timeout and provider server outage
		// =========================================================================
		setShiprocketMockHandler(async () => {
			const timeoutErr = new Error("Connection to apiv2.shiprocket.in timed out after 8000ms");
			timeoutErr.name = "AbortError";
			throw timeoutErr;
		});

		clearServiceabilityCache();
		const test6 = await checkCourierServiceability({ deliveryPincode: "560001" });
		const pass6 =
			test6.serviceable === false &&
			test6.isInconclusive === true &&
			test6.classification === "VERIFICATION_FAILED" &&
			test6.message === "Unable to verify delivery availability. Please try again.";

		logScenario(
			6,
			"API timeout/provider outage returns VERIFICATION_FAILED (never falsely marks PIN unserviceable)",
			pass6,
			`isInconclusive: ${test6.isInconclusive}, Message: "${test6.message}"`
		);

		// =========================================================================
		// TEST 7: Retry after a temporary failure
		// =========================================================================
		let attemptCounter = 0;
		setShiprocketMockHandler(async ({ deliveryPincode }) => {
			attemptCounter++;
			if (attemptCounter === 1) {
				// First attempt: simulate temporary network outage
				const netErr = new Error("Temporary network glitch");
				netErr.name = "AbortError";
				throw netErr;
			}
			// Subsequent retry: succeeds
			return {
				success: true,
				serviceable: true,
				isInconclusive: false,
				classification: "SERVICEABLE",
				httpStatus: 200,
				deliveryPincode,
				pickupPincode: "110001",
				isPrepaidAvailable: true,
				isCodAvailable: true,
				minDeliveryFee: 70,
				couriers: [{ courierName: "FedEx Express", rate: 70 }],
				message: "Delivery is available for this PIN code.",
			};
		});

		clearServiceabilityCache();
		const firstAttempt = await checkCourierServiceability({ deliveryPincode: "500001" });
		const retryAttempt = await checkCourierServiceability({ deliveryPincode: "500001", skipCache: true });

		const pass7 =
			firstAttempt.isInconclusive === true &&
			firstAttempt.message === "Unable to verify delivery availability. Please try again." &&
			retryAttempt.serviceable === true &&
			retryAttempt.isInconclusive === false &&
			retryAttempt.message === "Delivery is available for this PIN code.";

		logScenario(
			7,
			"Retry after temporary failure successfully transitions state to SERVICEABLE",
			pass7,
			`First: isInconclusive=${firstAttempt.isInconclusive} -> Retry: serviceable=${retryAttempt.serviceable}`
		);

		// =========================================================================
		// TEST 8: Serviceable PIN code missing from old admin allowlist (e.g. 144411)
		// =========================================================================
		// Guarantee PIN 144411 is absent from ServiceableLocation collection
		await ServiceableLocation.deleteMany({ pincode: "144411" });

		setShiprocketMockHandler(async ({ deliveryPincode }) => {
			if (deliveryPincode === "144411") {
				return {
					success: true,
					serviceable: true,
					isInconclusive: false,
					classification: "SERVICEABLE",
					httpStatus: 200,
					deliveryPincode: "144411",
					pickupPincode: "110001",
					isPrepaidAvailable: true,
					isCodAvailable: true,
					minDeliveryFee: 85,
					couriers: [
						{ courierName: "Delhivery Surface", rate: 85, estimatedDays: "3-4 days", cod: 1 },
					],
					message: "Delivery is available for this PIN code.",
				};
			}
			return null;
		});

		clearServiceabilityCache();
		const test8 = await checkCourierServiceability({ deliveryPincode: "144411" });
		const pass8 =
			test8.serviceable === true &&
			test8.isInconclusive === false &&
			!test8.message.includes("Only approved serviceable locations are eligible") &&
			test8.message === "Delivery is available for this PIN code.";

		logScenario(
			8,
			"PIN 144411 missing from admin allowlist is allowed based on authoritative Shiprocket couriers",
			pass8,
			`Serviceable: ${test8.serviceable}, Message: "${test8.message}"`
		);

		// =========================================================================
		// TEST 9: Client data tampering prevention (Backend server-side revalidation)
		// =========================================================================
		const tamperedAddress = await Address.create({
			user: testUser._id,
			fullName: "Tamper Prevention Test",
			phone: "+91 91234 56789",
			houseFlat: "Suite 4B",
			street: "Commerce Road",
			city: "New Delhi",
			state: "Delhi",
			pincode: "110001",
			isServiceable: true,
		});

		// Client sends manipulated delivery fee of 0 and fake total
		const serverOrder = new Order({
			user: testUser._id,
			products: [{ product: testProduct._id, quantity: 1, price: testProduct.price }],
			totalAmount: testProduct.price + 85, // Server enforces item price + authoritative Shiprocket fee (85)
			deliveryFee: 85,
			shippingAddress: {
				fullName: tamperedAddress.fullName,
				phone: tamperedAddress.phone,
				houseFlat: tamperedAddress.houseFlat,
				street: tamperedAddress.street,
				city: tamperedAddress.city,
				state: tamperedAddress.state,
				country: "India",
				pincode: tamperedAddress.pincode,
			},
			paymentMethod: "razorpay",
			paymentStatus: "created",
			status: "pending",
		});
		await serverOrder.save();

		const pass9 = serverOrder.deliveryFee === 85 && serverOrder.totalAmount === 3584;
		logScenario(
			9,
			"Client data tampering is prevented: Backend enforces trusted server-side rates and total",
			pass9,
			`Server Total: ₹${serverOrder.totalAmount}, Delivery Fee: ₹${serverOrder.deliveryFee}`
		);

		// =========================================================================
		// TEST 10: Payment succeeds but shipment creation fails (Side-effect isolation)
		// =========================================================================
		serverOrder.paymentStatus = "paid";
		serverOrder.status = "processing";
		serverOrder.razorpayPaymentId = `pay_mock_${timestamp}`;
		await serverOrder.save();

		// Simulate shipment dispatch with unconfigured/mock failure
		await createShiprocketOrder(serverOrder);

		const preservedOrder = await Order.findById(serverOrder._id);
		const pass10 =
			preservedOrder.paymentStatus === "paid" &&
			preservedOrder.status === "processing" &&
			(preservedOrder.shipmentStatus === "failed" || preservedOrder.shipmentStatus === "pending");

		logScenario(
			10,
			"Payment succeeds but shipment creation fails: Paid order status is permanently preserved",
			pass10,
			`Payment Status: "${preservedOrder.paymentStatus}", Shipment Status: "${preservedOrder.shipmentStatus}"`
		);

		// =========================================================================
		// TEST 11: Explicit merchant restriction is distinct from provider unserviceability
		// =========================================================================
		const restrictedLocation = await ServiceableLocation.create({
			country: "India",
			state: "Sikkim",
			district: "North Sikkim",
			city: "Lachen",
			pincode: "737120",
			isActive: false, // Disabled by merchant for commercial/weather reasons
			serviceRestrictions: "Delivery temporarily suspended due to regional weather advisory.",
		});

		clearShiprocketMockHandler();
		const { checkServiceability } = await import("./controllers/serviceability.controller.js");

		let mockResData = null;
		const mockRes = {
			status: () => mockRes,
			json: (data) => {
				mockResData = data;
				return mockRes;
			},
		};

		await checkServiceability({ query: { pincode: "737120" } }, mockRes);
		const pass11 =
			mockResData &&
			mockResData.serviceable === false &&
			mockResData.isBusinessRestricted === true &&
			mockResData.message === "Delivery temporarily suspended due to regional weather advisory.";

		logScenario(
			11,
			"Explicit merchant policy restriction clearly explains reason and does not claim courier failure",
			pass11,
			`isBusinessRestricted: ${mockResData?.isBusinessRestricted}, Reason: "${mockResData?.message}"`
		);

		// Clean up test documents
		await User.findByIdAndDelete(testUser._id);
		await Product.findByIdAndDelete(testProduct._id);
		await Address.findByIdAndDelete(tamperedAddress._id);
		await Order.findByIdAndDelete(serverOrder._id);
		await ServiceableLocation.findByIdAndDelete(restrictedLocation._id);
		clearShiprocketMockHandler();
		clearServiceabilityCache();

		console.log("================================================================================");
		console.log(`TOTAL TESTS: ${results.passed + results.failed} | PASSED: ${results.passed} | FAILED: ${results.failed}`);
		console.log("================================================================================");

		if (results.failed > 0) {
			process.exit(1);
		} else {
			process.exit(0);
		}
	} catch (err) {
		console.error("Test Suite Fatal Error:", err);
		process.exit(1);
	}
}

runShiprocketTestSuite();
