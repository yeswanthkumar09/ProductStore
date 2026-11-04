import SupportTicket from "../models/supportTicket.model.js";
import Order from "../models/order.model.js";
import Notification from "../models/notification.model.js";

// 1. Create a new support ticket (Customer)
export const createTicket = async (req, res) => {
	try {
		const { subject, category, message, orderId, priority } = req.body;

		if (!subject || !message) {
			return res.status(400).json({ message: "Subject and message are required." });
		}

		let orderNumber = "";
		let verifiedOrderId = null;

		if (orderId) {
			const order = await Order.findOne({ _id: orderId, user: req.user._id });
			if (order) {
				verifiedOrderId = order._id;
				orderNumber = order.orderNumber || order._id.toString().slice(-8).toUpperCase();
			}
		}

		const ticket = await SupportTicket.create({
			user: req.user._id,
			userEmail: req.user.email,
			userName: req.user.name,
			userPhone: req.user.phone || "",
			orderId: verifiedOrderId,
			orderNumber,
			category: category || "Order Issue",
			subject: subject.trim(),
			priority: priority || "medium",
			status: "open",
			messages: [
				{
					sender: "customer",
					senderName: req.user.name,
					message: message.trim(),
					createdAt: new Date(),
				},
			],
		});

		// Create in-app notification for the customer
		try {
			await Notification.create({
				user: req.user._id,
				type: "support",
				title: `Support Ticket Created: #${ticket.ticketNumber}`,
				message: `We have received your inquiry regarding "${subject.trim()}". A fashion concierge will assist you promptly.`,
				link: `/help?ticket=${ticket._id}`,
			});
		} catch (e) {}

		res.status(201).json({
			message: "Support ticket registered successfully.",
			ticket,
		});
	} catch (error) {
		console.error("Error in createTicket:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// 2. Get customer's tickets
export const getMyTickets = async (req, res) => {
	try {
		const tickets = await SupportTicket.find({ user: req.user._id }).sort({ updatedAt: -1 });
		res.json(tickets);
	} catch (error) {
		console.error("Error in getMyTickets:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// 3. Get ticket details by ID (Patron or Admin)
export const getTicketById = async (req, res) => {
	try {
		const ticket = await SupportTicket.findById(req.params.id);

		if (!ticket) {
			return res.status(404).json({ message: "Ticket not found." });
		}

		// Authorization check: Customer can only view their own ticket, Admin can view all
		if (req.user.role !== "admin" && ticket.user.toString() !== req.user._id.toString()) {
			return res.status(403).json({ message: "Access denied." });
		}

		res.json(ticket);
	} catch (error) {
		console.error("Error in getTicketById:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// 4. Post message/reply to ticket
export const replyTicket = async (req, res) => {
	try {
		const { message } = req.body;
		if (!message || !message.trim()) {
			return res.status(400).json({ message: "Message content cannot be empty." });
		}

		const ticket = await SupportTicket.findById(req.params.id);
		if (!ticket) {
			return res.status(404).json({ message: "Ticket not found." });
		}

		const isAdmin = req.user.role === "admin";
		const isOwner = ticket.user.toString() === req.user._id.toString();

		if (!isAdmin && !isOwner) {
			return res.status(403).json({ message: "Access denied." });
		}

		const senderRole = isAdmin ? "support" : "customer";
		const senderName = isAdmin ? "LuxeStore Concierge" : req.user.name;

		ticket.messages.push({
			sender: senderRole,
			senderName,
			message: message.trim(),
			createdAt: new Date(),
		});

		ticket.lastRepliedAt = new Date();

		// If admin replied, mark in_progress or leave as is
		if (isAdmin && ticket.status === "open") {
			ticket.status = "in_progress";
		}
		// If user replied and it was resolved, reopen
		if (!isAdmin && ticket.status === "resolved") {
			ticket.status = "in_progress";
		}

		await ticket.save();

		// Notify customer if admin replied
		if (isAdmin) {
			try {
				await Notification.create({
					user: ticket.user,
					type: "support",
					title: `Update on Ticket #${ticket.ticketNumber}`,
					message: `Concierge response: "${message.trim().slice(0, 80)}..."`,
					link: `/help?ticket=${ticket._id}`,
				});
			} catch (e) {}
		}

		res.json({ message: "Reply submitted successfully.", ticket });
	} catch (error) {
		console.error("Error in replyTicket:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// 5. Admin: List tickets with filter and pagination
export const adminGetAllTickets = async (req, res) => {
	try {
		const { status, category, priority, search, page = 1, limit = 20 } = req.query;

		const filter = {};
		if (status && status !== "all") filter.status = status;
		if (category && category !== "all") filter.category = category;
		if (priority && priority !== "all") filter.priority = priority;
		if (search) {
			filter.$or = [
				{ ticketNumber: new RegExp(search, "i") },
				{ subject: new RegExp(search, "i") },
				{ userEmail: new RegExp(search, "i") },
				{ userName: new RegExp(search, "i") },
				{ orderNumber: new RegExp(search, "i") },
			];
		}

		const skip = (Number(page) - 1) * Number(limit);
		const tickets = await SupportTicket.find(filter)
			.sort({ updatedAt: -1 })
			.skip(skip)
			.limit(Number(limit));

		const total = await SupportTicket.countDocuments(filter);

		res.json({
			tickets,
			total,
			page: Number(page),
			totalPages: Math.ceil(total / Number(limit)),
		});
	} catch (error) {
		console.error("Error in adminGetAllTickets:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// 6. Admin: Update status (open, in_progress, resolved, closed)
export const adminUpdateTicketStatus = async (req, res) => {
	try {
		const { status } = req.body;
		if (!["open", "in_progress", "resolved", "closed"].includes(status)) {
			return res.status(400).json({ message: "Invalid status value." });
		}

		const ticket = await SupportTicket.findById(req.params.id);
		if (!ticket) {
			return res.status(404).json({ message: "Ticket not found." });
		}

		ticket.status = status;
		if (status === "resolved" || status === "closed") {
			ticket.resolvedAt = new Date();
		}
		await ticket.save();

		// Notify customer
		try {
			await Notification.create({
				user: ticket.user,
				type: "support",
				title: `Ticket #${ticket.ticketNumber} marked as ${status.replace("_", " ").toUpperCase()}`,
				message: `Your ticket regarding "${ticket.subject}" has been marked as ${status}.`,
				link: `/help?ticket=${ticket._id}`,
			});
		} catch (e) {}

		res.json({ message: `Ticket status updated to ${status}.`, ticket });
	} catch (error) {
		console.error("Error in adminUpdateTicketStatus:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

