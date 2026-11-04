import express from "express";
import {
	getAllSizeCharts,
	getSizeChartByCategory,
	createOrUpdateSizeChart,
} from "../controllers/sizeChart.controller.js";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", getAllSizeCharts);
router.get("/category/:category", getSizeChartByCategory);
router.post("/", protectRoute, adminRoute, createOrUpdateSizeChart);
router.put("/:id", protectRoute, adminRoute, createOrUpdateSizeChart);

export default router;

