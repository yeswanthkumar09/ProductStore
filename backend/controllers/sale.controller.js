import Sale from "../models/sale.model.js";
import Product from "../models/product.model.js";
import Notification from "../models/notification.model.js";

// Public: Get currently active featured sales
export const getActiveSales = async (req, res) => {
	try {
		const now = new Date();
		const sales = await Sale.find({
			isActive: true,
			startDate: { $lte: now },
			endDate: { $gte: now },
		}).sort({ isFeatured: -1, createdAt: -1 });

		res.json(sales);
	} catch (error) {
		console.error("Error in getActiveSales:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Public: Get sale details by ID along with eligible products
export const getSaleDetails = async (req, res) => {
	try {
		const { id } = req.params;
		const sale = await Sale.findById(id);

		if (!sale) {
			return res.status(404).json({ message: "Sale campaign not found" });
		}

		let productQuery = { status: { $ne: "archived" } };

		if (sale.scope === "category" && sale.eligibleCategories?.length > 0) {
			productQuery.category = { $in: sale.eligibleCategories };
		} else if (sale.scope === "product" && sale.eligibleProducts?.length > 0) {
			productQuery._id = { $in: sale.eligibleProducts };
		}

		const products = await Product.find(productQuery).limit(32);

		res.json({
			sale,
			products,
		});
	} catch (error) {
		console.error("Error in getSaleDetails:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Admin: Get all sales
export const getAllSalesAdmin = async (req, res) => {
	try {
		const sales = await Sale.find().sort({ createdAt: -1 });
		res.json(sales);
	} catch (error) {
		console.error("Error in getAllSalesAdmin:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Admin: Create sale
export const createSaleAdmin = async (req, res) => {
	try {
		const {
			name,
			description,
			badgeText = "MEGA SALE",
			bannerImage,
			startDate,
			endDate,
			discountType = "percentage",
			discountValue,
			scope = "storewide",
			eligibleCategories = [],
			isActive = true,
			isFeatured = true,
			sendNotification = false,
		} = req.body;

		if (!name || !startDate || !endDate || discountValue === undefined) {
			return res.status(400).json({ message: "Name, start date, end date, and discount value are required" });
		}

		const slug = name
			.toLowerCase()
			.replace(/[^\w ]+/g, "")
			.replace(/ +/g, "-");

		const sale = new Sale({
			name,
			slug,
			description: description || "",
			badgeText: badgeText || "MEGA SALE",
			bannerImage: bannerImage || "",
			startDate: new Date(startDate),
			endDate: new Date(endDate),
			discountType,
			discountValue: Number(discountValue),
			scope,
			eligibleCategories: Array.isArray(eligibleCategories) ? eligibleCategories : [],
			isActive: Boolean(isActive),
			isFeatured: Boolean(isFeatured),
		});

		await sale.save();

		// Optional broadcast notification to all customers
		if (sendNotification) {
			await Notification.create({
				user: null,
				type: "sale",
				title: `🔥 ${name} is Live!`,
				message: `Enjoy up to ${discountValue}% off! Limited time offer ending soon.`,
				link: `/sales/${sale._id}`,
			});
		}

		res.status(201).json(sale);
	} catch (error) {
		console.error("Error in createSaleAdmin:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Admin: Update sale
export const updateSaleAdmin = async (req, res) => {
	try {
		const { id } = req.params;
		const updates = req.body;

		const sale = await Sale.findByIdAndUpdate(id, updates, { new: true });
		if (!sale) {
			return res.status(404).json({ message: "Sale not found" });
		}

		res.json(sale);
	} catch (error) {
		console.error("Error in updateSaleAdmin:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Admin: Delete sale
export const deleteSaleAdmin = async (req, res) => {
	try {
		const { id } = req.params;
		const sale = await Sale.findByIdAndDelete(id);
		if (!sale) {
			return res.status(404).json({ message: "Sale not found" });
		}
		res.json({ success: true, message: "Sale deleted successfully" });
	} catch (error) {
		console.error("Error in deleteSaleAdmin:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};
