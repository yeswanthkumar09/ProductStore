import express from "express";
import {
	getAdminCustomers,
	getAdminCustomerDetail,
	updateCustomerStatus,
	exportCustomersCsv,
} from "../controllers/customer.controller.js";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protectRoute, adminRoute);

router.get("/", getAdminCustomers);
router.get("/export-csv", exportCustomersCsv);
router.get("/:id", getAdminCustomerDetail);
router.patch("/:id/status", updateCustomerStatus);

export default router;
