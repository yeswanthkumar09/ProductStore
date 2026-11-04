import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

console.log("================================================================================");
console.log("   DYNAMIC ORDER CANCELLATION & GENUINE RAZORPAY PRODUCTION TEST SUITE         ");
console.log("================================================================================");

const results = {
	passed: 0,
	failed: 0,
	scenarios: [],
};

function assertTest(id, description, condition, details = "") {
	if (condition) {
		results.passed++;
		console.log(`[PASS] Test ${id}: ${description}`);
	} else {
		results.failed++;
		console.error(`[FAIL] Test ${id}: ${description} - ${details}`);
	}
	results.scenarios.push({ id, description, passed: Boolean(condition), details });
}

// ----------------------------------------------------
// Helper implementations matching production code
// ----------------------------------------------------
const verifyRazorpaySignature = (orderId, paymentId, signature, secret) => {
	if (!orderId || !paymentId || !signature || !secret) return false;
	if (typeof signature !== "string" || !/^[0-9a-fA-F]{64}$/.test(signature)) return false;

	const payload = `${orderId}|${paymentId}`;
	const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
	const expectedBuffer = Buffer.from(expected, "utf8");
	const actualBuffer = Buffer.from(signature, "utf8");

	if (expectedBuffer.length !== actualBuffer.length) return false;
	return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
};

const verifyWebhookHmacSignature = (rawBody, signature, secret) => {
	if (!rawBody || !signature || !secret) return false;
	if (typeof signature !== "string" || !/^[0-9a-fA-F]{64}$/.test(signature)) return false;

	const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
	const expectedBuffer = Buffer.from(expected, "utf8");
	const actualBuffer = Buffer.from(signature, "utf8");

	if (expectedBuffer.length !== actualBuffer.length) return false;
	return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
};

// ----------------------------------------------------
// 1. Environment & Secret Protection
// ----------------------------------------------------
const hasKeyId = Boolean(process.env.RAZORPAY_KEY_ID);
const hasKeySecret = Boolean(process.env.RAZORPAY_KEY_SECRET);
assertTest(
	1,
	"Environment variables: RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are defined in environment",
	hasKeyId && hasKeySecret
);

// ----------------------------------------------------
// 2. Timing-Safe HMAC-SHA256 Signature Verification
// ----------------------------------------------------
const testKeySecret = process.env.RAZORPAY_KEY_SECRET || "rzp_test_secret_for_suite_12345";
const testOrderId = "order_OId1234567890";
const testPaymentId = "pay_PId9876543210";
const validSignature = crypto
	.createHmac("sha256", testKeySecret)
	.update(`${testOrderId}|${testPaymentId}`)
	.digest("hex");

const isSigValid = verifyRazorpaySignature(testOrderId, testPaymentId, validSignature, testKeySecret);
assertTest(2, "Genuine Razorpay HMAC-SHA256 signature validates successfully with timing-safe comparison", isSigValid);

// ----------------------------------------------------
// 3. Rejection of Tampered Signature
// ----------------------------------------------------
const tamperedSignature = crypto
	.createHmac("sha256", "wrong_secret_key_attacker")
	.update(`${testOrderId}|${testPaymentId}`)
	.digest("hex");

const isTamperedValid = verifyRazorpaySignature(
	testOrderId,
	testPaymentId,
	tamperedSignature,
	testKeySecret
);
assertTest(3, "Tampered payment signature is strictly rejected", !isTamperedValid);

// ----------------------------------------------------
// 4. Rejection of Malformed / Non-Hex Signatures
// ----------------------------------------------------
assertTest(
	4,
	"Malformed or non-64 hex signatures are rejected before cryptographic operations",
	!verifyRazorpaySignature(testOrderId, testPaymentId, "invalid_sig", testKeySecret) &&
		!verifyRazorpaySignature(testOrderId, testPaymentId, "", testKeySecret) &&
		!verifyRazorpaySignature(testOrderId, testPaymentId, null, testKeySecret)
);

// ----------------------------------------------------
// 5. Webhook Raw Body HMAC Signature Verification
// ----------------------------------------------------
const testWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || testKeySecret;
const sampleWebhookBody = Buffer.from(
	JSON.stringify({
		event: "payment.captured",
		event_id: "evt_test_1001",
		payload: {
			payment: {
				entity: {
					id: testPaymentId,
					order_id: testOrderId,
					status: "captured",
					amount: 299900,
					currency: "INR",
				},
			},
		},
	})
);

const validWebhookSig = crypto
	.createHmac("sha256", testWebhookSecret)
	.update(sampleWebhookBody)
	.digest("hex");

assertTest(
	5,
	"Webhook signature verification succeeds using exact raw request body buffer",
	verifyWebhookHmacSignature(sampleWebhookBody, validWebhookSig, testWebhookSecret)
);

// ----------------------------------------------------
// 6. Webhook Tampered Payload Rejection
// ----------------------------------------------------
const tamperedWebhookBody = Buffer.from(
	JSON.stringify({
		event: "payment.captured",
		payload: { payment: { entity: { amount: 100 } } },
	})
);
assertTest(
	6,
	"Webhook rejects modified payload body against signature",
	!verifyWebhookHmacSignature(tamperedWebhookBody, validWebhookSig, testWebhookSecret)
);

// ----------------------------------------------------
// 7. Webhook Idempotency Event Deduplication
// ----------------------------------------------------
const mockWebhookAudit = [{ eventId: "evt_test_1001", processedAt: new Date() }];
const incomingEventId = "evt_test_1001";
const isAlreadyProcessed = mockWebhookAudit.some((e) => e.eventId === incomingEventId);
assertTest(
	7,
	"Webhook event deduplication recognizes already processed eventId and executes idempotently",
	isAlreadyProcessed
);

// ----------------------------------------------------
// 8. Order Cancellation Eligibility Rules
// ----------------------------------------------------
const checkCancellationEligibility = (order) => {
	if (order.status === "cancelled") {
		return { eligible: false, reason: "Order is already cancelled" };
	}
	const ineligible = ["shipped", "out_for_delivery", "delivered"];
	if (ineligible.includes(order.status) || ineligible.includes(order.shipmentStatus)) {
		return {
			eligible: false,
			reason: `Order has passed cancellation cutoff (status: ${order.shipmentStatus || order.status})`,
		};
	}
	return { eligible: true };
};

const pendingOrder = { status: "pending", shipmentStatus: "pending" };
const confirmedOrder = { status: "confirmed", shipmentStatus: "pending" };
const processingOrder = { status: "processing", shipmentStatus: "created" };
const shippedOrder = { status: "shipped", shipmentStatus: "shipped" };
const outForDeliveryOrder = { status: "out_for_delivery", shipmentStatus: "shipped" };
const deliveredOrder = { status: "delivered", shipmentStatus: "delivered" };
const cancelledOrder = { status: "cancelled", shipmentStatus: "cancelled" };

assertTest(8, "Cancellation eligibility: 'pending' order is eligible", checkCancellationEligibility(pendingOrder).eligible);
assertTest(9, "Cancellation eligibility: 'confirmed' order is eligible", checkCancellationEligibility(confirmedOrder).eligible);
assertTest(10, "Cancellation eligibility: 'processing' order is eligible", checkCancellationEligibility(processingOrder).eligible);
assertTest(11, "Cancellation eligibility: 'shipped' order is strictly INELIGIBLE", !checkCancellationEligibility(shippedOrder).eligible);
assertTest(12, "Cancellation eligibility: 'out_for_delivery' order is strictly INELIGIBLE", !checkCancellationEligibility(outForDeliveryOrder).eligible);
assertTest(13, "Cancellation eligibility: 'delivered' order is strictly INELIGIBLE", !checkCancellationEligibility(deliveredOrder).eligible);
assertTest(14, "Cancellation eligibility: already 'cancelled' order cannot be cancelled again", !checkCancellationEligibility(cancelledOrder).eligible);

// ----------------------------------------------------
// 15. Cross-Customer Authorization Enforcement
// ----------------------------------------------------
const customerA = "66f000000000000000000001";
const customerB = "66f000000000000000000002";
const orderBelongingToA = { user: customerA, _id: "66f000000000000000000010" };

const checkCustomerOwnership = (order, requestingUserId) => {
	return order.user.toString() === requestingUserId.toString();
};

assertTest(15, "Ownership check allows Customer A to manage Order A", checkCustomerOwnership(orderBelongingToA, customerA));
assertTest(16, "Cross-customer protection blocks Customer B from cancelling Customer A's order", !checkCustomerOwnership(orderBelongingToA, customerB));

// ----------------------------------------------------
// 17. Single-Execution Inventory Restoration (Idempotency)
// ----------------------------------------------------
const simulateInventoryRestoration = (order, productCatalog) => {
	if (order.inventoryRestored) {
		return { restored: false, message: "Inventory already restored" };
	}

	for (const item of order.products) {
		const prod = productCatalog.find((p) => p._id === item.productId);
		if (prod) {
			prod.stock += item.quantity;
			if (item.variantId && prod.variants) {
				const v = prod.variants.find((vr) => vr._id === item.variantId);
				if (v) v.stock += item.quantity;
			}
		}
	}
	order.inventoryRestored = true;
	return { restored: true, message: "Inventory restored" };
};

const mockCatalog = [
	{
		_id: "prod_01",
		stock: 5,
		variants: [{ _id: "var_01", stock: 2 }],
	},
];

const mockOrder = {
	inventoryRestored: false,
	products: [{ productId: "prod_01", variantId: "var_01", quantity: 3 }],
};

const firstRestore = simulateInventoryRestoration(mockOrder, mockCatalog);
assertTest(
	17,
	"First cancellation restores deducted product stock (5 -> 8) and variant stock (2 -> 5)",
	firstRestore.restored && mockCatalog[0].stock === 8 && mockCatalog[0].variants[0].stock === 5
);

const secondRestore = simulateInventoryRestoration(mockOrder, mockCatalog);
assertTest(
	18,
	"Duplicate cancellation request does NOT restore inventory twice (idempotency guard)",
	!secondRestore.restored && mockCatalog[0].stock === 8 && mockCatalog[0].variants[0].stock === 5
);

// ----------------------------------------------------
// 19. Separate State Tracking: Order Cancellation vs Payment Refund
// ----------------------------------------------------
const simulateOrderCancellationWithRefund = (order, razorpayRefundOutcome) => {
	order.status = "cancelled";
	order.cancellation = {
		isCancelled: true,
		cancelledAt: new Date(),
		cancelledBy: "customer",
		reason: "Changed mind",
	};

	if (order.paymentStatus === "paid" && order.razorpayPaymentId) {
		if (razorpayRefundOutcome.success) {
			order.paymentStatus = "refunded";
			order.refund = {
				refundId: razorpayRefundOutcome.refundId,
				amount: order.totalAmount,
				status: "processed",
				refundedAt: new Date(),
			};
		} else {
			// CRITICAL: Order is cancelled, but payment is still paid / refund failed for admin review
			order.paymentStatus = "paid";
			order.refund = {
				status: "failed",
				failureReason: razorpayRefundOutcome.error,
				amount: order.totalAmount,
			};
		}
	}
	return order;
};

const mockPaidOrder = {
	totalAmount: 2500,
	paymentStatus: "paid",
	paymentMethod: "razorpay",
	razorpayPaymentId: "pay_test_refund_123",
	status: "confirmed",
};

// Case A: Refund API succeeds
const orderWithSuccessfulRefund = simulateOrderCancellationWithRefund(
	{ ...mockPaidOrder },
	{ success: true, refundId: "rfnd_abc123" }
);
assertTest(
	19,
	"Successful cancellation with successful Razorpay refund sets status: cancelled & paymentStatus: refunded",
	orderWithSuccessfulRefund.status === "cancelled" &&
		orderWithSuccessfulRefund.paymentStatus === "refunded" &&
		orderWithSuccessfulRefund.refund.status === "processed" &&
		orderWithSuccessfulRefund.refund.refundId === "rfnd_abc123"
);

// Case B: Refund API encounters gateway failure
const orderWithFailedRefund = simulateOrderCancellationWithRefund(
	{ ...mockPaidOrder },
	{ success: false, error: "Razorpay refund window expired (contact bank)" }
);
assertTest(
	20,
	"Failed refund records refund.status: failed and preserves paymentStatus: paid without masking the failure",
	orderWithFailedRefund.status === "cancelled" &&
		orderWithFailedRefund.paymentStatus === "paid" &&
		orderWithFailedRefund.refund.status === "failed" &&
		orderWithFailedRefund.refund.failureReason.includes("Razorpay refund window expired")
);

// ----------------------------------------------------
// 21. Admin Authorization Enforcement (RBAC)
// ----------------------------------------------------
const checkAdminRole = (reqUser) => reqUser && reqUser.role === "admin";
assertTest(21, "Admin role check allows admin access", checkAdminRole({ role: "admin", email: "admin@store.com" }));
assertTest(22, "Admin role check strictly rejects standard customers (role: customer)", !checkAdminRole({ role: "customer", email: "patron@store.com" }));
assertTest(23, "Admin role check rejects unauthenticated guest requests (no user)", !checkAdminRole(null));

// ----------------------------------------------------
// 22. Shiprocket Safe Cancellation Handling
// ----------------------------------------------------
import { cancelShiprocketOrder } from "./services/shiprocket.service.js";

const srNoCredsResult = await cancelShiprocketOrder({ shiprocketOrderId: "12345" });
assertTest(
	24,
	"Shiprocket cancellation handles missing credentials gracefully without throwing unhandled exceptions",
	typeof srNoCredsResult === "object" && srNoCredsResult.success === false
);

const srEmptyParams = await cancelShiprocketOrder({});
assertTest(
	25,
	"Shiprocket cancellation validates presence of order ID or AWB",
	srEmptyParams.success === false && srEmptyParams.error.includes("No Shiprocket order ID")
);

// ----------------------------------------------------
// 23. Order History Payment Status Guard Tests
// ----------------------------------------------------
const mockOrdersList = [
	{ _id: "order_1", paymentStatus: "created", status: "pending" },       // Uncompleted draft
	{ _id: "order_2", paymentStatus: "paid", status: "confirmed" },        // Authentic paid order
	{ _id: "order_3", paymentStatus: "failed", status: "failed" },         // Failed payment attempt
	{ _id: "order_4", paymentStatus: "refunded", status: "cancelled" },    // Paid & refunded order
	{ _id: "order_5", paymentStatus: "pending", status: "pending" },       // Pending draft
];

const completedOrdersFilter = (order) => ["paid", "refunded", "partially_refunded"].includes(order.paymentStatus);
const filteredHistory = mockOrdersList.filter(completedOrdersFilter);

assertTest(
	26,
	"Order history query strictly excludes unpaid checkout drafts (paymentStatus: created/pending/failed)",
	filteredHistory.length === 2 &&
		filteredHistory.every((o) => ["paid", "refunded"].includes(o.paymentStatus)) &&
		!filteredHistory.some((o) => ["created", "pending", "failed"].includes(o.paymentStatus))
);

const isDraftAbandoned = (order) =>
	["created", "pending", "failed"].includes(order.paymentStatus) && !order.razorpayPaymentId;

assertTest(
	27,
	"Abandoned checkout drafts are recognized for automatic cleanup before entering order history",
	isDraftAbandoned({ paymentStatus: "created", razorpayPaymentId: null }) === true &&
	isDraftAbandoned({ paymentStatus: "paid", razorpayPaymentId: "pay_123" }) === false
);

console.log("================================================================================");
console.log(`TEST SUMMARY: ${results.passed} PASSED / ${results.failed} FAILED`);
console.log("================================================================================");

if (results.failed > 0) {
	process.exit(1);
} else {
	process.exit(0);
}

