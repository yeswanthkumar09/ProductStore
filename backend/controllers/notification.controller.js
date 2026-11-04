import Notification from "../models/notification.model.js";

// Get notifications for current logged-in user
export const getUserNotifications = async (req, res) => {
	try {
		const userId = req.user._id;

		// Fetch notifications directed to this user OR global broadcasts (user: null)
		const notifications = await Notification.find({
			$or: [{ user: userId }, { user: null }],
		})
			.sort({ createdAt: -1 })
			.limit(30);

		// Format read status for each (checking readBy array for global notifications)
		const formatted = notifications.map((n) => {
			const isRead = n.user ? n.isRead : n.readBy.some((id) => id.toString() === userId.toString());
			return {
				_id: n._id,
				type: n.type,
				title: n.title,
				message: n.message,
				link: n.link,
				isRead,
				createdAt: n.createdAt,
			};
		});

		const unreadCount = formatted.filter((n) => !n.isRead).length;

		res.json({
			notifications: formatted,
			unreadCount,
		});
	} catch (error) {
		console.error("Error in getUserNotifications:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Mark single notification as read
export const markAsRead = async (req, res) => {
	try {
		const { id } = req.params;
		const userId = req.user._id;

		const notification = await Notification.findById(id);
		if (!notification) {
			return res.status(404).json({ message: "Notification not found" });
		}

		if (notification.user) {
			if (notification.user.toString() !== userId.toString()) {
				return res.status(403).json({ message: "Unauthorized" });
			}
			notification.isRead = true;
		} else {
			// Global notification: add user to readBy if not already there
			if (!notification.readBy.some((uId) => uId.toString() === userId.toString())) {
				notification.readBy.push(userId);
			}
		}

		await notification.save();
		res.json({ success: true, message: "Marked as read" });
	} catch (error) {
		console.error("Error in markAsRead:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Mark all as read for current user
export const markAllAsRead = async (req, res) => {
	try {
		const userId = req.user._id;

		// 1. Mark personal notifications
		await Notification.updateMany({ user: userId, isRead: false }, { isRead: true });

		// 2. Add userId to readBy for global notifications
		await Notification.updateMany(
			{ user: null, readBy: { $ne: userId } },
			{ $addToSet: { readBy: userId } }
		);

		res.json({ success: true, message: "All notifications marked as read" });
	} catch (error) {
		console.error("Error in markAllAsRead:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Admin broadcast campaign announcement
export const broadcastNotification = async (req, res) => {
	try {
		const { title, message, type = "announcement", link = "/", targetCategory } = req.body;

		if (!title || !message) {
			return res.status(400).json({ message: "Title and message are required" });
		}

		const notification = new Notification({
			user: null, // Broadcast to all
			type,
			title,
			message,
			link,
			targetCategory: targetCategory || null,
			readBy: [],
		});

		await notification.save();

		res.status(201).json({
			success: true,
			message: "Campaign notification sent successfully to all registered users",
			notification,
		});
	} catch (error) {
		console.error("Error in broadcastNotification:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};
