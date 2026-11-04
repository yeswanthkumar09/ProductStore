import { useState, useCallback } from "react";
import axios from "../lib/axios";
import { loadRazorpayScript } from "../lib/loadRazorpay";

/**
 * Custom React hook managing Razorpay Standard Checkout lifecycle.
 * Strictly initializes the official Razorpay Checkout SDK (checkout.js).
 */
export const useRazorpay = () => {
	const [isProcessing, setIsProcessing] = useState(false);
	const [paymentError, setPaymentError] = useState(null);

	const initiatePayment = useCallback(
		async ({ cart, coupon, selectedAddress, onSuccess, onError, onDismiss }) => {
			if (isProcessing) return;

			setPaymentError(null);
			setIsProcessing(true);

			try {
				// 1. Client-side sanity checks
				if (!cart || cart.length === 0) {
					throw new Error("Your shopping cart is empty.");
				}
				if (!selectedAddress) {
					throw new Error("Please add or select a delivery address.");
				}
				if (!selectedAddress.isServiceable) {
					throw new Error(
						`Delivery is unavailable for PIN ${selectedAddress.pincode}. Please select another address.`
					);
				}

				// 2. Request backend order creation (calculates trusted amount server-side)
				const { data: orderDetails } = await axios.post("/payments/create-order", {
					products: cart,
					couponCode: coupon?.code || null,
					addressId: selectedAddress._id,
				});

				if (!orderDetails || !orderDetails.orderId || !orderDetails.key) {
					throw new Error("Invalid order configuration received from server.");
				}

				// 3. Load official Razorpay Checkout SDK safely
				await loadRazorpayScript();

				if (!window.Razorpay) {
					throw new Error("Razorpay Checkout SDK is not available.");
				}

				// 4. Configure Razorpay Standard Checkout options with Expiration Timer
				const options = {
					key: orderDetails.key,
					amount: orderDetails.amount,
					currency: orderDetails.currency || "INR",
					name: "LuxeStore",
					description: `Order #${orderDetails.internalOrderId ? orderDetails.internalOrderId.slice(-6).toUpperCase() : ""}`,
					image: "/LuxeStore_Razorpay_Logo.png",
					order_id: orderDetails.orderId,
					timeout: 300, // 5-minute payment session expiration timer (in seconds)
					prefill: {
						name: orderDetails.customer?.name || "",
						email: orderDetails.customer?.email || "",
						contact: orderDetails.customer?.contact || "",
					},
					notes: {
						internalOrderId: orderDetails.internalOrderId,
						storeName: "LuxeStore",
					},
					theme: {
						color: "#10b981", // Emerald luxury brand accent
					},
					modal: {
						ondismiss: function () {
							setIsProcessing(false);
							console.log("[Razorpay Checkout] Checkout modal dismissed by user.");
							if (onDismiss) {
								onDismiss();
							}
						},
						escape: true,
						backdropclose: false,
						confirm_close: true, // Prevents accidental modal closure during QR scan or OTP input
					},
					handler: async function (response) {
						try {
							console.log("[Razorpay Checkout] Gateway payment successful. Processing verification:", response);
							const verifyRes = await axios.post("/payments/verify", {
								razorpay_order_id: response.razorpay_order_id,
								razorpay_payment_id: response.razorpay_payment_id,
								razorpay_signature: response.razorpay_signature,
								internalOrderId: orderDetails.internalOrderId,
							});

							console.log("[Razorpay Checkout] Backend verification response:", verifyRes.data);

							if (verifyRes.data?.success) {
								if (onSuccess) {
									onSuccess({
										...verifyRes.data,
										orderId: verifyRes.data.orderId || orderDetails.internalOrderId,
									});
								}
							} else {
								const err = new Error(
									verifyRes.data?.error || "Payment verification could not be confirmed."
								);
								setPaymentError(err.message);
								if (onError) onError(err);
							}
						} catch (verifyErr) {
							console.error("[Razorpay Checkout] Verification error details:", verifyErr);
							const msg =
								verifyErr.response?.data?.error ||
								verifyErr.response?.data?.message ||
								"Payment verification failed. If your account was debited, your order will reconcile automatically.";
							setPaymentError(msg);
							if (onError) onError(new Error(msg));
						} finally {
							setIsProcessing(false);
						}
					},
				};

				const rzpInstance = new window.Razorpay(options);

				rzpInstance.on("payment.failed", function (response) {
					setIsProcessing(false);
					console.warn("[Razorpay Checkout] Payment failed event:", response.error);
					const failureReason =
						response.error?.description ||
						response.error?.reason ||
						"Payment was cancelled or rejected by your bank.";
					setPaymentError(failureReason);
					if (onError) onError(new Error(failureReason));
				});

				rzpInstance.open();
			} catch (err) {
				setIsProcessing(false);
				const errorMsg =
					err.response?.data?.error ||
					err.response?.data?.message ||
					err.message ||
					"Failed to initiate payment. Please try again.";
				setPaymentError(errorMsg);
				if (onError) onError(new Error(errorMsg));
			}
		},
		[isProcessing]
	);

	return {
		initiatePayment,
		isProcessing,
		paymentError,
	};
};

export default useRazorpay;
