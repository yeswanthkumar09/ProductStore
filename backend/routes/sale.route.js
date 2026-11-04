import express from "express";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
import {
	getActiveSales,
	getSaleDetails,
	getAllSalesAdmin,
	createSaleAdmin,
	updateSaleAdmin,
	deleteSaleAdmin,
} from "../controllers/sale.controller.js";

const router = express.Router();

// Public endpoints
router.get("/active", getActiveSales);
router.get("/:id", getSaleDetails);

// Admin endpoints
router.get("/admin/all", protectRoute, adminRoute, getAllSalesAdmin);
router.post("/admin", protectRoute, adminRoute, createSaleAdmin);
router.put("/admin/:id", protectRoute, adminRoute, updateSaleAdmin);
router.delete("/admin/:id", protectRoute, adminRoute, deleteSaleAdmin);

export default router;
