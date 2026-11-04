import express from "express";
import {
	getPickupLocations,
	geocodeAddress,
	calculateRouteEstimate,
	trackOrderShipment,
	handleShippingWebhook,
} from "../controllers/shipping.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public: Get verified store locations and warehouse dispatch location
router.get("/pickup-locations", getPickupLocations);

// Public / Protected: Resolve address into coordinates
router.post("/geocode", geocodeAddress);

// Public / Protected: Calculate road distance and estimated driving duration
router.post("/route-estimate", calculateRouteEstimate);

// Protected: Live order tracking with Shiprocket milestones & route overview
router.get("/track/:orderId", protectRoute, trackOrderShipment);

// Webhook: Shiprocket milestone tracking updates
router.post("/webhook", handleShippingWebhook);

export default router;
