import express from "express";
import {
	getUserAddresses,
	createAddress,
	updateAddress,
	deleteAddress,
	setDefaultAddress,
} from "../controllers/address.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protectRoute);

router.get("/", getUserAddresses);
router.post("/", createAddress);
router.put("/:id", updateAddress);
router.delete("/:id", deleteAddress);
router.patch("/:id/default", setDefaultAddress);

export default router;
