import Newsletter from "../models/newsletter.model.js";
import { sendEmail } from "../services/email.service.js";

export const subscribeNewsletter = async (req, res) => {
	try {
		const { email } = req.body;

		if (!email || typeof email !== "string") {
			return res.status(400).json({ message: "A valid email address is required." });
		}

		const cleanEmail = email.trim().toLowerCase();
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(cleanEmail)) {
			return res.status(400).json({ message: "Please provide a valid email format (e.g. patron@luxestore.in)." });
		}

		let subscriber = await Newsletter.findOne({ email: cleanEmail });

		if (subscriber) {
			if (subscriber.subscriptionStatus === "active") {
				return res.status(409).json({
					message: "You are already an esteemed member of the sanctuary newsletter.",
				});
			}

			// Reactivate previously unsubscribed member
			subscriber.subscriptionStatus = "active";
			subscriber.subscribedAt = new Date();
			await subscriber.save();

			return res.json({
				success: true,
				message: "Welcome back. Your subscription to private LuxeStore drops has been reactivated.",
			});
		}

		// Create fresh subscription
		subscriber = await Newsletter.create({
			email: cleanEmail,
			subscriptionStatus: "active",
			source: "footer_newsletter",
			ipAddress: req.ip || req.headers["x-forwarded-for"] || "",
			subscribedAt: new Date(),
		});

		// Optional welcome notification email
		sendEmail({
			to: cleanEmail,
			subject: "Welcome to the Sanctuary | LuxeStore Private Drops",
			html: `
				<div style="background:#0d0d0f;color:#e5e5e5;padding:32px;font-family:sans-serif;max-width:540px;margin:auto;border-radius:12px;">
					<h1 style="color:#ffffff;font-size:22px;letter-spacing:0.2em;text-transform:uppercase;text-align:center;">LUXESTORE</h1>
					<p style="text-align:center;color:#a3a3a3;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;">Private Atelier Sanctuary</p>
					<hr style="border:0;border-top:1px solid #262626;margin:24px 0;" />
					<p style="font-size:14px;line-height:1.6;color:#d4d4d4;">You are now part of our private inner sanctuary. You will receive exclusive early access to runway drops, bespoke capsules, and seasonal private sales.</p>
					<p style="font-size:11px;color:#737373;margin-top:32px;text-align:center;">LuxeStore Atelier &copy; ${new Date().getFullYear()}</p>
				</div>
			`,
			template: "newsletter_welcome",
		}).catch(() => {});

		res.status(201).json({
			success: true,
			message: "Welcome to the sanctuary. You have successfully subscribed to private LuxeStore drops.",
		});
	} catch (error) {
		console.error("Error in subscribeNewsletter controller:", error);
		if (error.code === 11000) {
			return res.status(409).json({ message: "This email address is already subscribed." });
		}
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

