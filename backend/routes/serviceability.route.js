import express from "express";
import multer from "multer";
import {
	checkServiceability,
	getAdminLocations,
	createLocation,
	updateLocation,
	deleteLocation,
	getServiceabilityStats,
	exportCsv,
	getCsvTemplate,
	importCsv,
	getWarehouseSettings,
	updateWarehouseSettings,
	testShiprocketServiceability,
} from "../controllers/serviceability.controller.js";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Public lookup (Real-time Shiprocket courier serviceability)
router.get("/check", checkServiceability);

// Admin endpoints
router.get("/admin/warehouse", protectRoute, adminRoute, getWarehouseSettings);
router.put("/admin/warehouse", protectRoute, adminRoute, updateWarehouseSettings);
router.post("/admin/test-serviceability", protectRoute, adminRoute, testShiprocketServiceability);
router.get("/admin", protectRoute, adminRoute, getAdminLocations);
router.get("/admin/stats", protectRoute, adminRoute, getServiceabilityStats);
router.get("/admin/template-csv", protectRoute, adminRoute, getCsvTemplate);
router.get("/admin/export-csv", protectRoute, adminRoute, exportCsv);
router.post("/admin/import-csv", protectRoute, adminRoute, upload.single("file"), importCsv);
router.post("/admin", protectRoute, adminRoute, createLocation);
router.put("/admin/:id", protectRoute, adminRoute, updateLocation);
router.delete("/admin/:id", protectRoute, adminRoute, deleteLocation);

export default router;
