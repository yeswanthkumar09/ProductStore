import express from "express";
import { rateLimit } from "express-rate-limit";
import { subscribeNewsletter } from "../controllers/newsletter.controller.js";

const router = express.Router();

const newsletterLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 10,
	standardHeaders: true,
	legacyHeaders: false,
	message: { message: "Too many subscription requests from this network. Please try again later." },
});

router.post("/subscribe", newsletterLimiter, subscribeNewsletter);

export default router;

