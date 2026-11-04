import dotenv from "dotenv";
dotenv.config();

import { connectDB } from "../lib/db.js";
import Product from "../models/product.model.js";
import Address from "../models/address.model.js";

async function testCheckoutFlow() {
	try {
		await connectDB();

		// Login admin
		const loginRes = await fetch("http://localhost:5000/api/auth/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email: "yeswanthagathamudi@gmail.com", password: "admin123" }),
		});
		const cookie = loginRes.headers.get("set-cookie");

		const product = await Product.findOne();
		const address = await Address.findOne();

		console.log(`Testing with product: ${product.name} (₹${product.price}), Address PIN: ${address.pincode}`);

		const orderRes = await fetch("http://localhost:5000/api/payments/create-order", {
			method: "POST",
			headers: { "Content-Type": "application/json", Cookie: cookie },
			body: JSON.stringify({
				products: [{ _id: product._id, quantity: 1, price: product.price }],
				addressId: address._id,
			}),
		});

		const orderData = await orderRes.json();
		console.log("Create Order Status:", orderRes.status);
		console.log("Order Data:", orderData);

		if (orderData.success) {
			const verifyRes = await fetch("http://localhost:5000/api/payments/verify", {
				method: "POST",
				headers: { "Content-Type": "application/json", Cookie: cookie },
				body: JSON.stringify({
					razorpay_order_id: orderData.orderId,
					razorpay_payment_id: "pay_sim_test123",
					razorpay_signature: "0".repeat(64),
					internalOrderId: orderData.internalOrderId,
				}),
			});

			const verifyData = await verifyRes.json();
			console.log("Verify Status:", verifyRes.status);
			console.log("Verify Data:", verifyData);
		}

		process.exit(0);
	} catch (err) {
		console.error("Test failed:", err);
		process.exit(1);
	}
}

testCheckoutFlow();
