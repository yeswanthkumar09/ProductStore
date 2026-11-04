import nodemailer from "nodemailer";
import EmailLog from "../models/emailLog.model.js";

// Initialize nodemailer transporter if credentials exist (Supports Gmail SMTP and standard SMTP)
const createTransporter = () => {
	const user = process.env.EMAIL_USER || process.env.SMTP_USER;
	const rawPass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
	const pass = rawPass ? rawPass.replace(/\s+/g, "") : null;

	if (!user || !pass) {
		return null;
	}

	const host = process.env.SMTP_HOST || "smtp.gmail.com";
	const port = Number(process.env.SMTP_PORT) || 465;

	// If using Gmail host, use nodemailer gmail service configuration
	if (host.includes("gmail.com")) {
		return nodemailer.createTransport({
			service: "gmail",
			auth: {
				user,
				pass,
			},
		});
	}

	return nodemailer.createTransport({
		host,
		port,
		secure: port === 465, // true for 465, false for 587
		auth: {
			user,
			pass,
		},
	});
};

const getFromAddress = () => {
	const senderEmail = process.env.EMAIL_USER || process.env.SMTP_USER || "no-reply@luxestore.in";
	return process.env.FROM_EMAIL || `"LUXESTORE ATELIER" <${senderEmail}>`;
};

// Generic sender with audit logging
export const sendEmail = async ({ to, subject, html, template, metadata = {} }) => {
	const recipient = (to || "").toLowerCase().trim();

	// Create initial log
	const logRecord = new EmailLog({
		recipient,
		subject,
		template,
		metadata,
		status: "queued",
	});

	const transporter = createTransporter();

	if (!transporter) {
		const reason = "SMTP provider credentials (SMTP_HOST, SMTP_USER, SMTP_PASS) not configured in .env";
		logRecord.status = "provider_not_configured";
		logRecord.error = reason;
		await logRecord.save();
		console.log(`[Email Service - Provider Not Configured] To: ${recipient} | Subject: "${subject}" | Template: ${template}`);
		return {
			success: false,
			status: "provider_not_configured",
			message: reason,
			logId: logRecord._id,
		};
	}

	try {
		const info = await transporter.sendMail({
			from: getFromAddress(),
			to: recipient,
			subject,
			html,
		});

		logRecord.status = "delivered";
		logRecord.messageId = info.messageId;
		await logRecord.save();

		console.log(`[Email Service - Sent] MessageId: ${info.messageId} to ${recipient}`);
		return {
			success: true,
			status: "delivered",
			messageId: info.messageId,
			logId: logRecord._id,
		};
	} catch (error) {
		logRecord.status = "failed";
		logRecord.error = error.message;
		await logRecord.save();

		console.error(`[Email Service - Error] Failed to send email to ${recipient}:`, error.message);
		return {
			success: false,
			status: "failed",
			error: error.message,
			logId: logRecord._id,
		};
	}
};

// ==========================================
// TEMPLATE BUILDERS & ACTION DISPATCHERS
// ==========================================

export const sendEmailVerificationLink = async ({ email, name, verificationUrl }) => {
	const html = `
	<!DOCTYPE html>
	<html>
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<style>
			body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0d0d0f; color: #e5e5e5; margin: 0; padding: 24px; }
			.card { max-width: 540px; margin: 0 auto; background: #131316; border: 1px solid #262626; border-radius: 16px; padding: 36px 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.6); }
			.brand { color: #ffffff; font-size: 24px; font-weight: 900; letter-spacing: 0.25em; text-align: center; text-transform: uppercase; margin-bottom: 24px; }
			.btn { display: inline-block; background: #ffffff; color: #000000 !important; font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 0.15em; text-decoration: none; padding: 16px 32px; border-radius: 8px; margin: 28px 0; }
			.link-fallback { font-size: 11px; color: #737373; word-break: break-all; margin-top: 16px; line-height: 1.5; }
			.footer { font-size: 11px; color: #525252; text-align: center; margin-top: 32px; border-top: 1px solid #262626; padding-top: 16px; }
		</style>
	</head>
	<body>
		<div class="card">
			<div class="brand">LUXESTORE</div>
			<h2 style="color: #ffffff; font-size: 20px; font-weight: 800; margin-top: 0; text-align: center;">Verify Your Email Address</h2>
			<p style="color: #a3a3a3; font-size: 14px; line-height: 1.6;">Hello ${name || "Valued Patron"},</p>
			<p style="color: #a3a3a3; font-size: 14px; line-height: 1.6;">Thank you for registering with LuxeStore Atelier. To activate your account and access private runway drops and curated capsule collections, please verify your email address by clicking below:</p>
			<div style="text-align: center;">
				<a href="${verificationUrl}" class="btn" target="_blank">VERIFY EMAIL ADDRESS</a>
			</div>
			<p style="font-size: 12px; color: #737373; text-align: center;">This link is valid for <strong>15 minutes</strong> and can only be used once.</p>
			<div class="link-fallback">
				If the button above does not work, copy and paste this link into your browser:<br>
				<a href="${verificationUrl}" style="color: #e05338;">${verificationUrl}</a>
			</div>
			<div class="footer">
				If you did not create an account on LUXESTORE, you can safely disregard this email.
			</div>
		</div>
	</body>
	</html>
	`;

	return sendEmail({
		to: email,
		subject: "Verify Your LuxeStore Account",
		html,
		template: "email_verification_link",
		metadata: { email, verificationUrl },
	});
};

export const sendWelcomeEmail = async ({ email, name }) => {
	const html = `
	<!DOCTYPE html>
	<html>
	<head>
		<meta charset="utf-8">
		<style>
			body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0b0f19; color: #e2e8f0; margin: 0; padding: 24px; }
			.card { max-width: 540px; margin: 0 auto; background: #131b2e; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; }
			.brand { color: #10b981; font-size: 24px; font-weight: 800; text-align: center; margin-bottom: 20px; }
			.cta-btn { display: inline-block; background: #10b981; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: bold; margin: 24px 0; }
		</style>
	</head>
	<body>
		<div class="card">
			<div class="brand">LuxeStore</div>
			<h2 style="color: #ffffff; margin-top: 0;">Welcome to LuxeStore Luxury, ${name}!</h2>
			<p>Your account has been fully verified and is ready for use. Discover curated designer apparel, precision footwear, and handcrafted essentials.</p>
			<p>As a welcome gift, use the code <strong>WELCOME10</strong> at checkout for 10% off your purchase.</p>
			<div style="text-align: center;">
				<a href="${process.env.CLIENT_URL || "http://localhost:5173"}" class="cta-btn">Start Exploring</a>
			</div>
			<p style="font-size: 12px; color: #64748b; text-align: center;">Crafted with excellence for discerning patrons.</p>
		</div>
	</body>
	</html>
	`;

	return sendEmail({
		to: email,
		subject: "Welcome to LuxeStore — Your account is active!",
		html,
		template: "welcome",
		metadata: { email, name },
	});
};

export const sendPasswordResetEmail = async ({ email, name, resetUrl }) => {
	const html = `
	<!DOCTYPE html>
	<html>
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<style>
			body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0d0d0f; color: #e5e5e5; margin: 0; padding: 24px; }
			.card { max-width: 540px; margin: 0 auto; background: #131316; border: 1px solid #262626; border-radius: 16px; padding: 36px 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.6); }
			.brand { color: #ffffff; font-size: 24px; font-weight: 900; letter-spacing: 0.25em; text-align: center; text-transform: uppercase; margin-bottom: 24px; }
			.btn { display: inline-block; background: #ffffff; color: #000000 !important; font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 0.15em; text-decoration: none; padding: 16px 32px; border-radius: 8px; margin: 28px 0; }
			.link-fallback { font-size: 11px; color: #737373; word-break: break-all; margin-top: 16px; line-height: 1.5; }
			.footer { font-size: 11px; color: #525252; text-align: center; margin-top: 32px; border-top: 1px solid #262626; padding-top: 16px; }
		</style>
	</head>
	<body>
		<div class="card">
			<div class="brand">LUXESTORE</div>
			<h2 style="color: #ffffff; font-size: 20px; font-weight: 800; margin-top: 0; text-align: center;">Reset Your Password</h2>
			<p style="color: #a3a3a3; font-size: 14px; line-height: 1.6;">Hello ${name || "Valued Patron"},</p>
			<p style="color: #a3a3a3; font-size: 14px; line-height: 1.6;">We received a request to reset the password for your LuxeStore account. Click the secure link below to choose a new password:</p>
			<div style="text-align: center;">
				<a href="${resetUrl}" class="btn" target="_blank">RESET PASSWORD</a>
			</div>
			<p style="font-size: 12px; color: #737373; text-align: center;">This recovery link is active for <strong>30 minutes</strong> and can only be used once.</p>
			<div class="link-fallback">
				If the button above does not work, copy and paste this link into your browser:<br>
				<a href="${resetUrl}" style="color: #e05338;">${resetUrl}</a>
			</div>
			<div class="footer">
				If you did not request a password reset, your account remains secure and no action is required.
			</div>
		</div>
	</body>
	</html>
	`;

	return sendEmail({
		to: email,
		subject: "Reset Your LuxeStore Password",
		html,
		template: "password_reset_link",
		metadata: { email, resetUrl },
	});
};

export const sendPasswordChangedEmail = async ({ email, name }) => {
	const html = `
	<!DOCTYPE html>
	<html>
	<head>
		<meta charset="utf-8">
		<style>
			body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0b0f19; color: #e2e8f0; margin: 0; padding: 24px; }
			.card { max-width: 540px; margin: 0 auto; background: #131b2e; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; }
			.brand { color: #10b981; font-size: 24px; font-weight: 800; text-align: center; margin-bottom: 20px; }
		</style>
	</head>
	<body>
		<div class="card">
			<div class="brand">LuxeStore</div>
			<h2 style="color: #ffffff; margin-top: 0;">Password Successfully Changed</h2>
			<p>Hello ${name || "Patron"},</p>
			<p>This is a security confirmation that your LuxeStore account password was recently changed. All other active sessions have been securely terminated.</p>
			<p style="font-size: 13px; color: #f87171;">If you did not perform this change, please contact our security support team immediately.</p>
		</div>
	</body>
	</html>
	`;

	return sendEmail({
		to: email,
		subject: "Security Alert: Your LuxeStore password was changed",
		html,
		template: "password_changed",
		metadata: { email },
	});
};

export const sendOrderConfirmationEmail = async ({
	order,
	user,
	products,
	shippingAddress = {},
	couponCode,
}) => {
	const orderNumber = order._id.toString().slice(-8).toUpperCase();
	const orderDate = new Date(order.createdAt || Date.now()).toLocaleDateString("en-IN", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});

	const itemsHtml = products
		.map((item) => {
			const variantDetails = [item.color ? `Color: ${item.color}` : "", item.size ? `Size: ${item.size}` : ""]
				.filter(Boolean)
				.join(" | ");

			return `
			<tr>
				<td style="padding: 12px 8px; border-bottom: 1px solid #1e293b;">
					<strong style="color: #ffffff;">${item.name || "Product"}</strong>
					${variantDetails ? `<br><span style="font-size: 12px; color: #94a3b8;">${variantDetails}</span>` : ""}
					${item.sku ? `<br><span style="font-size: 11px; color: #64748b; font-family: monospace;">SKU: ${item.sku}</span>` : ""}
				</td>
				<td style="padding: 12px 8px; border-bottom: 1px solid #1e293b; text-align: center; color: #cbd5e1;">${item.quantity}</td>
				<td style="padding: 12px 8px; border-bottom: 1px solid #1e293b; text-align: right; color: #10b981; font-weight: bold;">₹${Number(
					item.price * item.quantity
				).toLocaleString("en-IN")}</td>
			</tr>
		`;
		})
		.join("");

	const fullAddressStr = [
		shippingAddress.houseFlat,
		shippingAddress.street,
		shippingAddress.locality,
		shippingAddress.city,
		shippingAddress.district,
		`${shippingAddress.state} - ${shippingAddress.pincode}`,
		shippingAddress.country || "India",
	]
		.filter(Boolean)
		.join(", ");

	const html = `
	<!DOCTYPE html>
	<html>
	<head>
		<meta charset="utf-8">
		<style>
			body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0b0f19; color: #e2e8f0; margin: 0; padding: 20px; }
			.card { max-width: 640px; margin: 0 auto; background: #131b2e; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; }
			.brand { color: #10b981; font-size: 26px; font-weight: 800; text-align: center; margin-bottom: 24px; }
			.order-meta { background: #0f172a; border-radius: 12px; padding: 16px; margin: 20px 0; border: 1px solid #1e293b; }
			table { width: 100%; border-collapse: collapse; margin: 20px 0; }
			th { text-align: left; padding: 8px; color: #64748b; font-size: 12px; text-transform: uppercase; border-bottom: 1px solid #1e293b; }
			.total-row { font-size: 16px; font-weight: bold; color: #10b981; }
			.cta-btn { display: inline-block; background: #10b981; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; }
		</style>
	</head>
	<body>
		<div class="card">
			<div class="brand">LuxeStore</div>
			<h2 style="color: #ffffff; margin-top: 0;">Order Confirmed! Receipt #${orderNumber}</h2>
			<p>Hello ${shippingAddress.fullName || user.name || "Customer"},</p>
			<p>Thank you for choosing LuxeStore. We have received your purchase and our fulfillment center is preparing your dispatch.</p>

			<div class="order-meta">
				<p style="margin: 4px 0;"><strong>Order ID:</strong> #${order._id}</p>
				<p style="margin: 4px 0;"><strong>Order Date:</strong> ${orderDate}</p>
				<p style="margin: 4px 0;"><strong>Payment Status:</strong> Verified Paid (Stripe Secure)</p>
				<p style="margin: 4px 0;"><strong>Estimated Delivery:</strong> ${order.estimatedDeliveryDays || "2-4 business days"}</p>
			</div>

			<h3 style="color: #ffffff; border-bottom: 1px solid #1e293b; padding-bottom: 8px;">Order Details</h3>
			<table>
				<thead>
					<tr>
						<th>Item</th>
						<th style="text-align: center;">Qty</th>
						<th style="text-align: right;">Amount</th>
					</tr>
				</thead>
				<tbody>
					${itemsHtml}
				</tbody>
			</table>

			<div style="background: #0f172a; padding: 16px; border-radius: 12px; margin-bottom: 24px;">
				${order.deliveryFee > 0 ? `<p style="margin: 4px 0; display: flex; justify-content: space-between;"><span>Delivery Fee:</span> <strong>₹${order.deliveryFee.toLocaleString("en-IN")}</strong></p>` : `<p style="margin: 4px 0; display: flex; justify-content: space-between; color: #10b981;"><span>Delivery:</span> <strong>FREE</strong></p>`}
				${couponCode ? `<p style="margin: 4px 0; display: flex; justify-content: space-between; color: #38bdf8;"><span>Applied Coupon:</span> <strong>${couponCode}</strong></p>` : ""}
				<p style="margin: 8px 0 0 0; border-top: 1px solid #1e293b; padding-top: 8px; font-size: 18px; color: #10b981; font-weight: 900;">
					Total Paid: ₹${Number(order.totalAmount).toLocaleString("en-IN")}
				</p>
			</div>

			<div style="background: #0f172a; padding: 16px; border-radius: 12px; margin-bottom: 24px;">
				<h4 style="margin: 0 0 8px 0; color: #ffffff;">Delivery Destination</h4>
				<p style="margin: 4px 0; font-size: 13px; color: #cbd5e1;"><strong>${shippingAddress.fullName}</strong> (${shippingAddress.phone})</p>
				<p style="margin: 4px 0; font-size: 13px; color: #94a3b8;">${fullAddressStr}</p>
				${shippingAddress.deliveryInstructions ? `<p style="margin: 4px 0; font-size: 12px; color: #64748b;"><em>Instructions: ${shippingAddress.deliveryInstructions}</em></p>` : ""}
			</div>

			<div style="text-align: center; margin-top: 24px;">
				<a href="${process.env.CLIENT_URL || "http://localhost:5173"}/orders" class="cta-btn">View My Orders</a>
			</div>
		</div>
	</body>
	</html>
	`;

	return sendEmail({
		to: user.email,
		subject: `Order Confirmation #${orderNumber} — ₹${Number(order.totalAmount).toLocaleString("en-IN")}`,
		html,
		template: "order_confirmation",
		metadata: { orderId: order._id, totalAmount: order.totalAmount },
	});
};

export const sendPaymentSuccessEmail = async ({ order, user, amount }) => {
	const orderNumber = order._id.toString().slice(-8).toUpperCase();
	const html = `
	<!DOCTYPE html>
	<html>
	<head>
		<meta charset="utf-8">
		<style>
			body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0b0f19; color: #e2e8f0; margin: 0; padding: 24px; }
			.card { max-width: 540px; margin: 0 auto; background: #131b2e; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; }
			.brand { color: #10b981; font-size: 24px; font-weight: 800; text-align: center; margin-bottom: 20px; }
		</style>
	</head>
	<body>
		<div class="card">
			<div class="brand">LuxeStore</div>
			<h2 style="color: #ffffff; margin-top: 0;">Payment Received (₹${Number(amount).toLocaleString("en-IN")})</h2>
			<p>Hello ${user.name || "Customer"},</p>
			<p>Your payment for Order <strong>#${orderNumber}</strong> has been successfully processed and verified.</p>
			<p style="font-size: 13px; color: #94a3b8;">No further action is required. We will dispatch your shipment shortly.</p>
		</div>
	</body>
	</html>
	`;

	return sendEmail({
		to: user.email,
		subject: `Payment Receipt for Order #${orderNumber}`,
		html,
		template: "payment_success",
		metadata: { orderId: order._id, amount },
	});
};

export const sendOrderCancellationEmail = async ({ order, user, reason, refundInfo }) => {
	const orderNumber = order._id.toString().slice(-8).toUpperCase();
	const hasRefund = refundInfo && refundInfo.amount > 0;

	const html = `
	<!DOCTYPE html>
	<html>
	<head>
		<meta charset="utf-8">
		<style>
			body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0b0f19; color: #e2e8f0; margin: 0; padding: 24px; }
			.card { max-width: 540px; margin: 0 auto; background: #131b2e; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; }
			.brand { color: #10b981; font-size: 24px; font-weight: 800; text-align: center; margin-bottom: 20px; }
			.cancel-meta { background: #0f172a; border-radius: 12px; padding: 16px; margin: 20px 0; border: 1px solid #1e293b; }
			.refund-box { background: #064e3b; border: 1px solid #059669; border-radius: 12px; padding: 16px; margin: 20px 0; }
		</style>
	</head>
	<body>
		<div class="card">
			<div class="brand">LuxeStore</div>
			<h2 style="color: #f87171; margin-top: 0;">Order #${orderNumber} Cancelled</h2>
			<p>Hello ${user?.name || "Customer"},</p>
			<p>Your order <strong>#${orderNumber}</strong> has been cancelled as requested.</p>

			<div class="cancel-meta">
				<p style="margin: 4px 0;"><strong>Order ID:</strong> #${order._id}</p>
				<p style="margin: 4px 0;"><strong>Cancellation Reason:</strong> ${reason || "Customer cancellation"}</p>
				<p style="margin: 4px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}</p>
			</div>

			${
				hasRefund
					? `
			<div class="refund-box">
				<h3 style="margin-top: 0; color: #34d399;">Refund Initiated</h3>
				<p style="margin: 4px 0; color: #e2e8f0;">A full refund of <strong>₹${Number(refundInfo.amount).toLocaleString("en-IN")}</strong> has been initiated to your original payment method.</p>
				${refundInfo.refundId ? `<p style="margin: 4px 0; font-size: 12px; color: #a7f3d0; font-family: monospace;">Razorpay Refund Reference: ${refundInfo.refundId}</p>` : ""}
				<p style="margin: 8px 0 0 0; font-size: 12px; color: #cbd5e1;">Online refunds typically reflect within 5-7 business days depending on your bank.</p>
			</div>
			`
					: `<p style="font-size: 13px; color: #94a3b8;">No payment was captured for this order, or this was a Cash on Delivery order. No refund is necessary.</p>`
			}

			<p style="font-size: 13px; color: #94a3b8;">If you have any questions regarding this cancellation, please contact our patron care team.</p>
		</div>
	</body>
	</html>
	`;

	return sendEmail({
		to: user?.email,
		subject: `Order #${orderNumber} Cancellation Confirmation`,
		html,
		template: "order_cancellation",
		metadata: { orderId: order._id, reason },
	});
};

export const sendRefundUpdateEmail = async ({ order, user, refundInfo }) => {
	const orderNumber = order._id.toString().slice(-8).toUpperCase();

	const html = `
	<!DOCTYPE html>
	<html>
	<head>
		<meta charset="utf-8">
		<style>
			body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0b0f19; color: #e2e8f0; margin: 0; padding: 24px; }
			.card { max-width: 540px; margin: 0 auto; background: #131b2e; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; }
			.brand { color: #10b981; font-size: 24px; font-weight: 800; text-align: center; margin-bottom: 20px; }
			.refund-box { background: #064e3b; border: 1px solid #059669; border-radius: 12px; padding: 16px; margin: 20px 0; }
		</style>
	</head>
	<body>
		<div class="card">
			<div class="brand">LuxeStore</div>
			<h2 style="color: #34d399; margin-top: 0;">Refund Update for Order #${orderNumber}</h2>
			<p>Hello ${user?.name || "Customer"},</p>
			<p>Here is an update on the refund for your order <strong>#${orderNumber}</strong>:</p>

			<div class="refund-box">
				<p style="margin: 4px 0;"><strong>Refund Status:</strong> ${refundInfo.status?.toUpperCase() || "PROCESSED"}</p>
				<p style="margin: 4px 0;"><strong>Amount:</strong> ₹${Number(refundInfo.amount || order.totalAmount).toLocaleString("en-IN")}</p>
				${refundInfo.refundId ? `<p style="margin: 4px 0; font-size: 12px; font-family: monospace;">Reference: ${refundInfo.refundId}</p>` : ""}
			</div>

			<p style="font-size: 13px; color: #94a3b8;">Depending on your bank, credit card, or UPI provider, the credited amount will appear in your statement within 5-7 business days.</p>
		</div>
	</body>
	</html>
	`;

	return sendEmail({
		to: user?.email,
		subject: `Refund Notice for Order #${orderNumber}`,
		html,
		template: "refund_update",
		metadata: { orderId: order._id, refundId: refundInfo?.refundId },
	});
};

export const sendSignInAlertEmail = async ({ email, name, ipAddress, userAgent, time }) => {
	const formattedTime = time || new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
	const html = `
	<!DOCTYPE html>
	<html>
	<head>
		<meta charset="utf-8">
		<style>
			body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0b0f19; color: #e2e8f0; margin: 0; padding: 24px; }
			.card { max-width: 540px; margin: 0 auto; background: #131b2e; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; }
			.brand { color: #10b981; font-size: 24px; font-weight: 800; text-align: center; margin-bottom: 20px; }
			.alert-box { background: #1e293b; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 13px; }
		</style>
	</head>
	<body>
		<div class="card">
			<div class="brand">LuxeStore</div>
			<h2 style="color: #ffffff; margin-top: 0;">Security Alert: New Sign-In Detected</h2>
			<p>Hello ${name || "Valued Patron"},</p>
			<p>A new sign-in was detected for your LuxeStore account:</p>
			<div class="alert-box">
				<p style="margin: 4px 0;"><strong>Time:</strong> ${formattedTime} (IST)</p>
				${ipAddress ? `<p style="margin: 4px 0;"><strong>IP Address:</strong> ${ipAddress}</p>` : ""}
				${userAgent ? `<p style="margin: 4px 0;"><strong>Client:</strong> ${userAgent.slice(0, 100)}</p>` : ""}
			</div>
			<p style="font-size: 13px; color: #94a3b8;">If this was you, no action is required. If you did not authorize this session, please reset your password immediately in your account settings.</p>
		</div>
	</body>
	</html>
	`;

	return sendEmail({
		to: email,
		subject: "LuxeStore Security Alert — New Sign-In Detected",
		html,
		template: "security_signin_alert",
		metadata: { email, ipAddress },
	});
};

export const sendOrderStatusUpdateEmail = async ({ order, user, newStatus, trackingNumber, courierName }) => {
	const orderNumber = order._id.toString().slice(-6).toUpperCase();
	const statusLabels = {
		processing: "In Tailoring & Preparation",
		shipped: "Dispatched with Courier",
		out_for_delivery: "Out for Delivery Today",
		delivered: "Delivered Successfully",
	};

	const statusLabel = statusLabels[newStatus] || newStatus.toUpperCase();

	const html = `
	<!DOCTYPE html>
	<html>
	<head>
		<meta charset="utf-8">
		<style>
			body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0b0f19; color: #e2e8f0; margin: 0; padding: 24px; }
			.card { max-width: 540px; margin: 0 auto; background: #131b2e; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; }
			.brand { color: #10b981; font-size: 24px; font-weight: 800; text-align: center; margin-bottom: 20px; }
			.status-box { background: #1e293b; border-left: 4px solid #10b981; border-radius: 8px; padding: 16px; margin: 20px 0; }
			.cta-btn { display: inline-block; background: #10b981; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; margin-top: 16px; }
		</style>
	</head>
	<body>
		<div class="card">
			<div class="brand">LuxeStore</div>
			<h2 style="color: #ffffff; margin-top: 0;">Order Status Update: #${orderNumber}</h2>
			<p>Hello ${user?.name || "Customer"},</p>
			<p>Your order has reached a new fulfillment stage:</p>
			<div class="status-box">
				<p style="margin: 4px 0; font-size: 16px; font-weight: bold; color: #10b981;">${statusLabel}</p>
				${courierName ? `<p style="margin: 4px 0; font-size: 13px;"><strong>Logistics Partner:</strong> ${courierName}</p>` : ""}
				${trackingNumber ? `<p style="margin: 4px 0; font-size: 13px;"><strong>AWB / Tracking Number:</strong> ${trackingNumber}</p>` : ""}
			</div>
			<div style="text-align: center;">
				<a href="${process.env.CLIENT_URL || "http://localhost:5173"}/orders/${order._id}" class="cta-btn">Track Order Live</a>
			</div>
		</div>
	</body>
	</html>
	`;

	return sendEmail({
		to: user?.email,
		subject: `Shipment Update: Order #${orderNumber} is ${statusLabel}`,
		html,
		template: "order_status_update",
		metadata: { orderId: order._id, newStatus, trackingNumber },
	});
};

export const sendRestockAlertEmail = async ({
	email,
	subscriberName,
	product,
	size,
	color,
	directUrl,
	subscriptionId,
}) => {
	const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
	const targetUrl = directUrl || `${clientUrl}/product/${product._id || product.id}`;
	const manageUrl = `${clientUrl}/profile?tab=restock-alerts`;
	const formattedPrice = `₹${Number(product.price || 0).toLocaleString("en-IN")}`;

	const html = `
	<!DOCTYPE html>
	<html>
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<style>
			body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #e2e8f0; margin: 0; padding: 24px; }
			.card { max-width: 540px; margin: 0 auto; background: #131b2e; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; }
			.brand { color: #ffffff; font-size: 20px; font-weight: 900; letter-spacing: 0.15em; text-transform: uppercase; text-align: center; margin-bottom: 24px; }
			.tag { display: inline-block; background: #10b981; color: #ffffff; font-size: 11px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; padding: 4px 10px; border-radius: 4px; margin-bottom: 12px; }
			.product-box { background: #0b0f19; border: 1px solid #1e293b; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center; }
			.product-img { width: 140px; height: 180px; object-fit: cover; border-radius: 8px; margin-bottom: 14px; border: 1px solid #334155; }
			.product-title { color: #ffffff; font-size: 18px; font-weight: 800; margin: 0 0 6px 0; }
			.variant-specs { font-size: 13px; color: #94a3b8; margin: 4px 0; }
			.price { font-size: 20px; font-weight: 900; color: #10b981; margin: 8px 0; }
			.cta-btn { display: inline-block; background: #ffffff; color: #000000 !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 13px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; margin-top: 16px; }
			.notice { font-size: 12px; color: #94a3b8; line-height: 1.6; margin-top: 24px; border-top: 1px solid #1e293b; pt: 16px; }
			.footer-links { font-size: 11px; color: #64748b; text-align: center; margin-top: 20px; }
			.footer-links a { color: #94a3b8; text-decoration: underline; }
		</style>
	</head>
	<body>
		<div class="card">
			<div class="brand">LuxeStore Studio</div>
			<div style="text-align: center;">
				<span class="tag">Restock Alert</span>
				<h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 0 0 8px 0;">Back In Stock</h1>
				<p style="font-size: 14px; color: #94a3b8; margin: 0;">Good news, ${subscriberName || "Valued Patron"}. A piece you were waiting for is available again.</p>
			</div>

			<div class="product-box">
				${product.image ? `<img src="${product.image}" alt="${product.name}" class="product-img" />` : ""}
				<h2 class="product-title">${product.name}</h2>
				<div class="variant-specs">
					${size ? `<strong>Size:</strong> ${size}` : ""}
					${size && color ? ` &bull; ` : ""}
					${color ? `<strong>Colour:</strong> ${color}` : ""}
				</div>
				<div class="price">${formattedPrice}</div>
				<div>
					<a href="${targetUrl}" class="cta-btn">Claim Yours Now</a>
				</div>
			</div>

			<div class="notice">
				<p style="margin: 0;"><strong>Important:</strong> Our limited-run pieces sell out quickly. Availability is live at the time of this email and is fulfilled on a first-come, first-served basis.</p>
			</div>

			<div class="footer-links">
				<p>You received this email because you subscribed to availability alerts for this piece.</p>
				<p><a href="${manageUrl}">Manage Your Restock Subscriptions</a></p>
			</div>
		</div>
	</body>
	</html>
	`;

	return sendEmail({
		to: email,
		subject: `Restock Alert: ${product.name} ${size ? `(${size}) ` : ""}is back in stock!`,
		html,
		template: "restock_alert",
		metadata: {
			productId: product._id || product.id,
			subscriptionId,
			size,
			color,
		},
	});
};
