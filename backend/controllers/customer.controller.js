import User from "../models/user.model.js";
import Order from "../models/order.model.js";
import Address from "../models/address.model.js";
import mongoose from "mongoose";

// Admin: Get paginated, filtered, and aggregated customer directory
export const getAdminCustomers = async (req, res) => {
	try {
		const {
			search,
			state,
			district,
			city,
			status,
			verification,
			hasPurchased,
			minSpend,
			maxSpend,
			dateFrom,
			dateTo,
			sort = "newest",
			page = 1,
			limit = 15,
		} = req.query;

		const matchUser = { role: "customer" };

		if (status && status !== "all") {
			matchUser.accountStatus = status;
		}

		if (verification && verification !== "all") {
			if (verification === "email_verified") {
				matchUser.isEmailVerified = true;
			} else if (verification === "phone_verified") {
				matchUser.isPhoneVerified = true;
			} else if (verification === "unverified") {
				matchUser.isEmailVerified = false;
				matchUser.isPhoneVerified = false;
			}
		}

		if (dateFrom || dateTo) {
			matchUser.createdAt = {};
			if (dateFrom) matchUser.createdAt.$gte = new Date(dateFrom);
			if (dateTo) {
				const end = new Date(dateTo);
				end.setHours(23, 59, 59, 999);
				matchUser.createdAt.$lte = end;
			}
		}

		if (search && search.trim()) {
			const s = search.trim();
			const orConditions = [
				{ name: new RegExp(s, "i") },
				{ email: new RegExp(s, "i") },
				{ phone: new RegExp(s, "i") },
			];
			if (mongoose.Types.ObjectId.isValid(s)) {
				orConditions.push({ _id: new mongoose.Types.ObjectId(s) });
			}
			matchUser.$or = orConditions;
		}

		// Aggregation pipeline to enrich customers with orders & addresses
		const pipeline = [
			{ $match: matchUser },
			{
				$lookup: {
					from: "orders",
					localField: "_id",
					foreignField: "user",
					as: "orders",
				},
			},
			{
				$lookup: {
					from: "addresses",
					localField: "_id",
					foreignField: "user",
					as: "addresses",
				},
			},
			{
				$addFields: {
					totalOrders: { $size: "$orders" },
					successfulOrders: {
						$filter: {
							input: "$orders",
							as: "o",
							cond: { $eq: ["$$o.paymentStatus", "paid"] },
						},
					},
					defaultAddress: {
						$arrayElemAt: [
							{
								$filter: {
									input: "$addresses",
									as: "a",
									cond: { $eq: ["$$a.isDefault", true] },
								},
							},
							0,
						],
					},
					latestAddress: { $arrayElemAt: ["$addresses", 0] },
				},
			},
			{
				$addFields: {
					totalSpent: {
						$sum: "$successfulOrders.totalAmount",
					},
					successfulOrdersCount: { $size: "$successfulOrders" },
					latestPurchaseDate: { $max: "$orders.createdAt" },
					customerState: {
						$ifNull: ["$defaultAddress.state", { $ifNull: ["$latestAddress.state", "$address.state"] }],
					},
					customerCity: {
						$ifNull: ["$defaultAddress.city", { $ifNull: ["$latestAddress.city", "$address.city"] }],
					},
					customerDistrict: {
						$ifNull: [
							"$defaultAddress.district",
							{ $ifNull: ["$latestAddress.district", "$defaultAddress.city"] },
						],
					},
				},
			},
		];

		// Filter by purchase behavior
		const postMatch = {};

		if (hasPurchased && hasPurchased !== "all") {
			if (hasPurchased === "yes") {
				postMatch.successfulOrdersCount = { $gt: 0 };
			} else if (hasPurchased === "no") {
				postMatch.successfulOrdersCount = 0;
			}
		}

		if (minSpend || maxSpend) {
			postMatch.totalSpent = {};
			if (minSpend) postMatch.totalSpent.$gte = Number(minSpend);
			if (maxSpend) postMatch.totalSpent.$lte = Number(maxSpend);
		}

		if (state && state !== "all") {
			postMatch.customerState = new RegExp(`^${state.trim()}$`, "i");
		}

		if (city && city.trim()) {
			postMatch.customerCity = new RegExp(city.trim(), "i");
		}

		if (district && district.trim()) {
			postMatch.customerDistrict = new RegExp(district.trim(), "i");
		}

		if (Object.keys(postMatch).length > 0) {
			pipeline.push({ $match: postMatch });
		}

		// Sorting
		let sortStage = { createdAt: -1 };
		if (sort === "spent_desc") sortStage = { totalSpent: -1 };
		else if (sort === "spent_asc") sortStage = { totalSpent: 1 };
		else if (sort === "orders_desc") sortStage = { totalOrders: -1 };
		else if (sort === "name_asc") sortStage = { name: 1 };
		else if (sort === "oldest") sortStage = { createdAt: 1 };

		pipeline.push({ $sort: sortStage });

		// Count total before pagination
		const countPipeline = [...pipeline, { $count: "total" }];
		const countResult = await User.aggregate(countPipeline);
		const total = countResult[0]?.total || 0;

		// Pagination
		const skip = (Number(page) - 1) * Number(limit);
		pipeline.push({ $skip: skip });
		pipeline.push({ $limit: Number(limit) });

		// Project only safe fields (never return passwords or secrets)
		pipeline.push({
			$project: {
				password: 0,
				orders: 0,
				successfulOrders: 0,
				addresses: 0,
			},
		});

		const customers = await User.aggregate(pipeline);

		res.json({
			customers,
			total,
			page: Number(page),
			pages: Math.ceil(total / Number(limit)) || 1,
		});
	} catch (error) {
		console.error("Error in getAdminCustomers:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Admin: Get complete details for a single customer
export const getAdminCustomerDetail = async (req, res) => {
	try {
		const { id } = req.params;

		const user = await User.findById(id).select("-password");
		if (!user) {
			return res.status(404).json({ message: "Customer not found." });
		}

		// Fetch user's orders populated with product info
		const orders = await Order.find({ user: id })
			.populate("products.product", "name image price category")
			.sort({ createdAt: -1 });

		// Fetch user's saved addresses
		const addresses = await Address.find({ user: id }).sort({ isDefault: -1, createdAt: -1 });

		// Spending statistics
		const paidOrders = orders.filter((o) => o.paymentStatus === "paid");
		const totalSpent = paidOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

		res.json({
			user,
			orders,
			addresses,
			metrics: {
				totalOrders: orders.length,
				paidOrdersCount: paidOrders.length,
				totalSpent,
				latestOrderDate: orders[0]?.createdAt || null,
			},
		});
	} catch (error) {
		console.error("Error in getAdminCustomerDetail:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Admin: Update customer account status (e.g. suspend / activate)
export const updateCustomerStatus = async (req, res) => {
	try {
		const { id } = req.params;
		const { status } = req.body;

		if (!["active", "suspended", "pending_verification"].includes(status)) {
			return res.status(400).json({
				message: "Invalid status. Allowed values: active, suspended, pending_verification.",
			});
		}

		const user = await User.findById(id);
		if (!user) {
			return res.status(404).json({ message: "Customer not found." });
		}

		if (user.role === "admin") {
			return res.status(403).json({ message: "Cannot change the status of an administrator." });
		}

		user.accountStatus = status;
		await user.save();

		res.json({
			message: `Customer account status updated to "${status}".`,
			user: {
				_id: user._id,
				name: user.name,
				email: user.email,
				accountStatus: user.accountStatus,
			},
		});
	} catch (error) {
		console.error("Error in updateCustomerStatus:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Admin: Export customers list to CSV (excluding sensitive secrets)
export const exportCustomersCsv = async (req, res) => {
	try {
		const users = await User.find({ role: "customer" })
			.select("name email phone isEmailVerified isPhoneVerified accountStatus createdAt")
			.sort({ createdAt: -1 });

		const userIds = users.map((u) => u._id);
		const orders = await Order.find({ user: { $in: userIds }, paymentStatus: "paid" });
		const addresses = await Address.find({ user: { $in: userIds } });

		const spendMap = new Map();
		const orderCountMap = new Map();
		orders.forEach((o) => {
			const uId = o.user.toString();
			spendMap.set(uId, (spendMap.get(uId) || 0) + (o.totalAmount || 0));
			orderCountMap.set(uId, (orderCountMap.get(uId) || 0) + 1);
		});

		const addressMap = new Map();
		addresses.forEach((a) => {
			const uId = a.user.toString();
			if (!addressMap.has(uId) || a.isDefault) {
				addressMap.set(uId, `${a.city || ""}, ${a.state || ""}`.trim());
			}
		});

		const headers = [
			"CustomerID",
			"Name",
			"Email",
			"Phone",
			"EmailVerified",
			"PhoneVerified",
			"AccountStatus",
			"Location",
			"TotalOrders",
			"TotalSpentINR",
			"RegisteredAt",
		];

		const escapeCsv = (val) => {
			if (val === null || val === undefined) return "";
			const str = String(val);
			if (str.includes(",") || str.includes('"') || str.includes("\n")) {
				return `"${str.replace(/"/g, '""')}"`;
			}
			return str;
		};

		const rows = users.map((u) => {
			const uId = u._id.toString();
			return [
				uId,
				escapeCsv(u.name),
				escapeCsv(u.email),
				escapeCsv(u.phone),
				u.isEmailVerified ? "YES" : "NO",
				u.isPhoneVerified ? "YES" : "NO",
				u.accountStatus || "active",
				escapeCsv(addressMap.get(uId) || ""),
				orderCountMap.get(uId) || 0,
				spendMap.get(uId) || 0,
				new Date(u.createdAt).toISOString().slice(0, 10),
			].join(",");
		});

		const csvContent = [headers.join(","), ...rows].join("\r\n");

		res.setHeader("Content-Type", "text/csv");
		res.setHeader("Content-Disposition", 'attachment; filename="customers_directory.csv"');
		res.status(200).send(csvContent);
	} catch (error) {
		console.error("Error in exportCustomersCsv:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};
