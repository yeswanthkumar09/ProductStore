import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import mongoose from "mongoose";

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

import fs from "fs";
import { connectDB } from "./lib/db.js";

dotenv.config();

const app = express();
const __dirname = path.resolve();

// Trust reverse proxy (Vercel, Render, AWS ECS, Cloudflare)
app.set("trust proxy", 1);

// Security Headers
app.use(helmet({ contentSecurityPolicy: false }));

// Resolve allowed CORS origins from environment (supports comma-separated values)
const getParsedAllowedOrigins = () => {
	const raw = [
		process.env.CLIENT_URL,
		process.env.ALLOWED_ORIGINS,
		process.env.FRONTEND_URL,
		"http://localhost:5173",
		"http://127.0.0.1:5173",
		"http://localhost:5000",
		"http://127.0.0.1:5000",
	];
	const set = new Set();
	for (const item of raw) {
		if (!item) continue;
		for (const part of item.split(",")) {
			const trimmed = part.trim().replace(/\/+$/, "");
			if (trimmed) set.add(trimmed);
		}
	}
	return Array.from(set);
};

// Strict, credentialed CORS configuration
app.use(
	cors({
		origin: (origin, callback) => {
			// Allow non-browser requests (e.g. mobile apps, server-to-server, curl) without Origin header
			if (!origin) {
				return callback(null, true);
			}

			const normalizedOrigin = origin.trim().replace(/\/+$/, "");
			const allowed = getParsedAllowedOrigins();

			// 1. Exact match against configured frontend origins
			if (allowed.includes(normalizedOrigin)) {
				return callback(null, true);
			}

			// 2. Localhost development origins
			if (
				process.env.NODE_ENV !== "production" &&
				(normalizedOrigin.startsWith("http://localhost:") || normalizedOrigin.startsWith("http://127.0.0.1:"))
			) {
				return callback(null, true);
			}

			// 3. Explicitly configured preview domain pattern (avoids arbitrary *.vercel.app access)
			const previewPattern = process.env.VERCEL_PREVIEW_PATTERN;
			if (previewPattern) {
				try {
					const regex = new RegExp(previewPattern);
					if (regex.test(normalizedOrigin)) {
						return callback(null, true);
					}
				} catch (e) {
					console.warn("[CORS] Invalid VERCEL_PREVIEW_PATTERN regular expression:", e.message);
				}
			}

			callback(new Error(`CORS policy violation: Origin '${origin}' is not authorized.`));
		},
		credentials: true,
		methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "x-razorpay-signature"],
	})
);

// System Health Check Endpoint
const handleHealthCheck = (req, res) => {
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
};

app.get("/api/health", handleHealthCheck);
app.get("/health", handleHealthCheck);

// Rate limiting on sensitive auth routes
const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: process.env.NODE_ENV === "production" ? 50 : 500,
	message: { message: "Too many authentication requests, please try again later." },
	standardHeaders: true,
	legacyHeaders: false,
});

// JSON body parser with rawBody capture for webhook signature verification (Razorpay)
app.use(
	express.json({
		limit: "10mb",
		verify: (req, res, buf) => {
			req.rawBody = buf;
		},
	})
);
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Normalizes URL paths when incoming requests arrive via serverless rewrites
app.use((req, res, next) => {
	if (
		req.url !== "/" &&
		!req.url.startsWith("/api") &&
		req.url !== "/health" &&
		!req.url.startsWith("/static")
	) {
		req.url = "/api" + (req.url.startsWith("/") ? req.url : "/" + req.url);
	}
	next();
});

// Ensure database connection is active before handling API requests
app.use(async (req, res, next) => {
	if (req.path === "/health" || req.path === "/api/health") {
		return next();
	}
	try {
		await connectDB();
	} catch (e) {
		// Individual route handlers will manage database state
	}
	next();
});

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

// Root API Info Endpoint
app.get("/", (req, res) => {
	res.json({
		name: "LUXESTORE API",
		status: "healthy",
		version: "1.0.0",
		documentation: "/api/health",
		timestamp: new Date().toISOString(),
	});
});

// Static Asset Serving in Standalone Monorepo Production Mode (only if frontend/dist exists)
if (process.env.NODE_ENV === "production") {
	const distPath = path.join(__dirname, "frontend", "dist");
	if (fs.existsSync(distPath)) {
		app.use(express.static(distPath));

		app.get("*", (req, res, next) => {
			if (req.path.startsWith("/api") || req.path === "/health") {
				return next();
			}
			res.sendFile(path.resolve(distPath, "index.html"));
		});
	}
}

// Global Unhandled Error Handler
app.use((err, req, res, next) => {
	console.error("[EXPRESS UNHANDLED ERROR]", err);
	res.status(err.status || 500).json({
		message: err.message || "Internal Server Error",
		error: process.env.NODE_ENV === "production" ? undefined : err.stack,
	});
});

export { app };
export default app;

