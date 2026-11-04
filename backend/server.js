import express from "express";
// LuxeStore Backend Server - Enhanced with Variant Color Thumbnails
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";

import authRoutes from "./routes/auth.route.js";
import productRoutes from "./routes/product.route.js";
import cartRoutes from "./routes/cart.route.js";
import couponRoutes from "./routes/coupon.route.js";
import paymentRoutes from "./routes/payment.route.js";
import analyticsRoutes from "./routes/analytics.route.js";
import userRoutes from "./routes/user.route.js";
import reviewRoutes from "./routes/review.route.js";
import categoryRoutes from "./routes/category.route.js";
import notificationRoutes from "./routes/notification.route.js";
import recommendationRoutes from "./routes/recommendation.route.js";
import saleRoutes from "./routes/sale.route.js";
import serviceabilityRoutes from "./routes/serviceability.route.js";
import addressRoutes from "./routes/address.route.js";
import customerRoutes from "./routes/customer.route.js";
import shippingRoutes from "./routes/shipping.route.js";
import orderRoutes from "./routes/order.route.js";
import campaignSlideRoutes from "./routes/campaignSlide.route.js";
import announcementRoutes from "./routes/announcement.route.js";
import restockSubscriptionRoutes from "./routes/restockSubscription.route.js";
import cmsRoutes from "./routes/cms.route.js";
import sizeChartRoutes from "./routes/sizeChart.route.js";
import supportTicketRoutes from "./routes/supportTicket.route.js";
import newsletterRoutes from "./routes/newsletter.route.js";

import mongoose from "mongoose";
import { connectDB } from "./lib/db.js";
import { validateRazorpayEnv } from "./lib/razorpay.js";
import { ensureDefaultSizeCharts } from "./controllers/sizeChart.controller.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const __dirname = path.resolve();

// System Health Check Endpoint for Deployment Orchestrators (Render / Railway / AWS ECS)
app.get("/api/health", (req, res) => {
	const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
	const memory = process.memoryUsage();

	res.status(dbStatus === "connected" ? 200 : 503).json({
		status: "ok",
		uptimeSeconds: Math.floor(process.uptime()),
		timestamp: new Date().toISOString(),
		database: dbStatus,
		memory: {
			rssMb: (memory.rss / (1024 * 1024)).toFixed(1),
			heapUsedMb: (memory.heapUsed / (1024 * 1024)).toFixed(1),
		},
		environment: process.env.NODE_ENV || "development",
		version: "1.0.0",
	});
});

// Security middleware
app.use(helmet({ contentSecurityPolicy: false }));

const allowedOrigins = [
	"http://localhost:5173",
	"http://127.0.0.1:5173",
	"http://localhost:5000",
	"http://127.0.0.1:5000",
	process.env.CLIENT_URL,
].filter(Boolean);

app.use(
	cors({
		origin: (origin, callback) => {
			if (!origin || allowedOrigins.includes(origin) || origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) {
				callback(null, true);
			} else {
				callback(new Error("Not allowed by CORS"));
			}
		},
		credentials: true,
	})
);

// Rate limiting on auth routes
const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: process.env.NODE_ENV === "production" ? 50 : 500,
	message: { message: "Too many authentication requests, please try again later." },
	standardHeaders: true,
	legacyHeaders: false,
});

// JSON body parser with rawBody capture for webhook signature verification
app.use(
	express.json({
		limit: "10mb",
		verify: (req, res, buf) => {
			req.rawBody = buf;
		},
	})
);
app.use(cookieParser());

// Route Handlers
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/products/:productId/reviews", reviewRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/serviceability", serviceabilityRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/admin/customers", customerRoutes);
app.use("/api/shipping", shippingRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/campaign-slides", campaignSlideRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/restock-subscriptions", restockSubscriptionRoutes);
app.use("/api/cms", cmsRoutes);
app.use("/api/size-charts", sizeChartRoutes);
app.use("/api/support-tickets", supportTicketRoutes);
app.use("/api/newsletter", newsletterRoutes);

if (process.env.NODE_ENV === "production") {
	app.use(express.static(path.join(__dirname, "/frontend/dist")));

	app.get("*", (req, res) => {
		res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
	});
}

const server = app.listen(PORT, "0.0.0.0", async () => {
	console.log("Server is running on http://localhost:" + PORT);
	validateRazorpayEnv();
	await connectDB();
	ensureDefaultSizeCharts();
});

// Graceful Shutdown Handling
const gracefulShutdown = (signal) => {
	console.log(`\n[SHUTDOWN] Received ${signal}. Closing HTTP listener and database connections...`);
	server.close(async () => {
		console.log("[SHUTDOWN] HTTP server closed.");
		try {
			await mongoose.connection.close(false);
			console.log("[SHUTDOWN] MongoDB connection closed.");
		} catch (err) {
			console.error("[SHUTDOWN ERROR] Error during DB close:", err.message);
		}
		process.exit(0);
	});

	// Force close if graceful shutdown stalls beyond 8 seconds
	setTimeout(() => {
		console.error("[SHUTDOWN] Force closing process after timeout.");
		process.exit(1);
	}, 8000);
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
