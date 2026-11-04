import express from "express";
import {
	createTicket,
	getMyTickets,
	getTicketById,
	replyTicket,
	adminGetAllTickets,
	adminUpdateTicketStatus,
} from "../controllers/supportTicket.controller.js";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Customer routes
router.post("/", protectRoute, createTicket);
router.get("/my", protectRoute, getMyTickets);
router.get("/:id", protectRoute, getTicketById);
router.post("/:id/messages", protectRoute, replyTicket);

// Admin routes
router.get("/admin/all", protectRoute, adminRoute, adminGetAllTickets);
router.patch("/admin/:id/status", protectRoute, adminRoute, adminUpdateTicketStatus);

export default router;

