import User from "../models/user.model.js";
import Order from "../models/order.model.js";

export const getWishlist = async (req, res) => {
	try {
		const user = await User.findById(req.user._id).populate("wishlist");
		res.json(user.wishlist);
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const toggleWishlist = async (req, res) => {
	try {
		const { productId } = req.body;
		const user = await User.findById(req.user._id);

		const idx = user.wishlist.findIndex((id) => id.toString() === productId);
		let added;
		if (idx >= 0) {
			user.wishlist.splice(idx, 1);
			added = false;
		} else {
			user.wishlist.push(productId);
			added = true;
		}

		await user.save();
		res.json({ wishlist: user.wishlist, added });
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getProfile = async (req, res) => {
	try {
		const user = await User.findById(req.user._id).select("-password");
		res.json(user);
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const updateProfile = async (req, res) => {
	try {
		const { name, phone, address } = req.body;
		const user = await User.findById(req.user._id);

		if (name) user.name = name;
		if (phone !== undefined) user.phone = phone;
		if (address) user.address = { ...(user.address?.toObject?.() || user.address || {}), ...address };

		await user.save();
		res.json({
			_id: user._id,
			name: user.name,
			email: user.email,
			phone: user.phone,
			address: user.address,
			role: user.role,
		});
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getOrderHistory = async (req, res) => {
	try {
		// Clean up any stale uncompleted draft checkout attempts for this user
		await Order.deleteMany({
			user: req.user._id,
			paymentStatus: { $in: ["created", "pending", "failed"] },
			razorpayPaymentId: { $in: [null, ""] },
		});

		const orders = await Order.find({
			user: req.user._id,
			paymentStatus: { $in: ["paid", "refunded", "partially_refunded"] },
		})
			.populate("products.product", "name image price")
			.sort({ createdAt: -1 });
		res.json(orders);
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};
