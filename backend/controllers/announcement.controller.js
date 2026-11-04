import Announcement from "../models/announcement.model.js";
import Coupon from "../models/coupon.model.js";
import ServiceableLocation from "../models/serviceableLocation.model.js";

// Ensure default announcements exist
const ensureDefaultAnnouncements = async () => {
	const count = await Announcement.countDocuments();
	if (count === 0) {
		await Announcement.insertMany([
			{
				text: "FREE SHIPPING OVER ₹1,999",
				highlightText: "FREE SHIPPING",
				link: "/search",
				type: "shipping",
				freeShippingThreshold: 1999,
				displayOrder: 1,
				isActive: true,
			},
			{
				text: "USE CODE WELCOME10 FOR 10% OFF",
				highlightText: "WELCOME10",
				link: "/search",
				type: "coupon",
				couponCode: "WELCOME10",
				displayOrder: 2,
				isActive: true,
			},
			{
				text: "7-DAY EFFORTLESS RETURNS",
				highlightText: "7-DAY",
				link: "/profile",
				type: "policy",
				returnPolicyDays: 7,
				displayOrder: 3,
				isActive: true,
			},
		]);
	}
};

// Public: Get currently active announcements
export const getActiveAnnouncements = async (req, res) => {
	try {
		await ensureDefaultAnnouncements();

		const now = new Date();
		const announcements = await Announcement.find({
			isActive: true,
			$and: [
				{ $or: [{ startDate: null }, { startDate: { $lte: now } }] },
				{ $or: [{ endDate: null }, { endDate: { $gte: now } }] },
			],
		}).sort({ displayOrder: 1, createdAt: 1 });

		// Enhance with dynamic data
		const enhanced = await Promise.all(
			announcements.map(async (item) => {
				const obj = item.toObject();

				// If coupon type, verify coupon validity
				if (obj.type === "coupon" && obj.couponCode) {
					const coupon = await Coupon.findOne({ code: obj.couponCode.toUpperCase(), isActive: true });
					if (!coupon || (coupon.expirationDate && new Date(coupon.expirationDate) < now)) {
						obj.isCouponValid = false;
					} else {
						obj.isCouponValid = true;
						obj.couponDiscount = coupon.discountValue || coupon.discountPercentage;
					}
				}

				// If shipping type, check if default serviceable location has freeDeliveryThreshold override
				if (obj.type === "shipping") {
					const adminLocation = await ServiceableLocation.findOne({ isActive: true, freeDeliveryThreshold: { $gt: 0 } });
					if (adminLocation && adminLocation.freeDeliveryThreshold) {
						obj.freeShippingThreshold = adminLocation.freeDeliveryThreshold;
						obj.text = `FREE SHIPPING OVER ₹${adminLocation.freeDeliveryThreshold.toLocaleString("en-IN")}`;
					}
				}

				return obj;
			})
		);

		res.json(enhanced);
	} catch (error) {
		console.error("Error in getActiveAnnouncements:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Admin: Get all announcements
export const getAllAnnouncementsAdmin = async (req, res) => {
	try {
		await ensureDefaultAnnouncements();
		const announcements = await Announcement.find().sort({ displayOrder: 1, createdAt: -1 });
		res.json(announcements);
	} catch (error) {
		console.error("Error in getAllAnnouncementsAdmin:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Admin: Create announcement
export const createAnnouncement = async (req, res) => {
	try {
		const {
			text,
			highlightText = "",
			link = "",
			type = "custom",
			couponCode = "",
			freeShippingThreshold = 1999,
			returnPolicyDays = 7,
			displayOrder = 0,
			isActive = true,
			startDate = null,
			endDate = null,
		} = req.body;

		if (!text || !text.trim()) {
			return res.status(400).json({ message: "Announcement text is required." });
		}

		if (type === "coupon" && couponCode) {
			const coupon = await Coupon.findOne({ code: couponCode.trim().toUpperCase() });
			if (!coupon) {
				return res.status(400).json({ message: `Coupon '${couponCode}' was not found in the coupon registry.` });
			}
		}

		const announcement = await Announcement.create({
			text: text.trim(),
			highlightText: highlightText.trim(),
			link: link.trim(),
			type,
			couponCode: couponCode.trim().toUpperCase(),
			freeShippingThreshold: Number(freeShippingThreshold) || 1999,
			returnPolicyDays: Number(returnPolicyDays) || 7,
			displayOrder: Number(displayOrder) || 0,
			isActive: Boolean(isActive),
			startDate: startDate ? new Date(startDate) : null,
			endDate: endDate ? new Date(endDate) : null,
		});

		res.status(201).json(announcement);
	} catch (error) {
		console.error("Error in createAnnouncement:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Admin: Update announcement
export const updateAnnouncement = async (req, res) => {
	try {
		const { id } = req.params;
		const announcement = await Announcement.findById(id);

		if (!announcement) {
			return res.status(404).json({ message: "Announcement not found." });
		}

		const fields = [
			"text",
			"highlightText",
			"link",
			"type",
			"couponCode",
			"freeShippingThreshold",
			"returnPolicyDays",
			"displayOrder",
			"isActive",
			"startDate",
			"endDate",
		];

		fields.forEach((field) => {
			if (req.body[field] !== undefined) {
				announcement[field] = req.body[field];
			}
		});

		await announcement.save();
		res.json(announcement);
	} catch (error) {
		console.error("Error in updateAnnouncement:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Admin: Delete announcement
export const deleteAnnouncement = async (req, res) => {
	try {
		const { id } = req.params;
		const announcement = await Announcement.findByIdAndDelete(id);

		if (!announcement) {
			return res.status(404).json({ message: "Announcement not found." });
		}

		res.json({ success: true, message: "Announcement deleted successfully." });
	} catch (error) {
		console.error("Error in deleteAnnouncement:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Admin: Toggle active state
export const toggleAnnouncement = async (req, res) => {
	try {
		const { id } = req.params;
		const announcement = await Announcement.findById(id);

		if (!announcement) {
			return res.status(404).json({ message: "Announcement not found." });
		}

		announcement.isActive = !announcement.isActive;
		await announcement.save();

		res.json(announcement);
	} catch (error) {
		console.error("Error in toggleAnnouncement:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

