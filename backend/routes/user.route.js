import express from "express";
import { getWishlist, toggleWishlist, getProfile, updateProfile, getOrderHistory } from "../controllers/user.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/profile", protectRoute, getProfile);
router.put("/profile", protectRoute, updateProfile);
router.get("/wishlist", protectRoute, getWishlist);
router.post("/wishlist/toggle", protectRoute, toggleWishlist);
router.get("/orders", protectRoute, getOrderHistory);

export default router;
