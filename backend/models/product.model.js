import mongoose from "mongoose";

const colorSchema = new mongoose.Schema(
	{
		name: { type: String, required: true },
		hex: { type: String, default: "#000000" },
		image: { type: String, default: "" },
	},
	{ _id: false }
);

const specificationSchema = new mongoose.Schema(
	{
		key: { type: String, required: true },
		value: { type: String, required: true },
	},
	{ _id: false }
);

const variantSchema = new mongoose.Schema({
	color: {
		name: { type: String, default: "" },
		hex: { type: String, default: "#000000" },
		image: { type: String, default: "" },
	},
	size: { type: String, default: "" },
	material: { type: String, default: "" },
	sku: { type: String, default: "" },
	price: {
		type: Number,
		required: true,
		min: [0, "Price cannot be negative"],
	},
	originalPrice: {
		type: Number,
		min: [0, "Original price cannot be negative"],
	},
	stock: {
		type: Number,
		default: 0,
		min: [0, "Stock cannot be negative"],
	},
	images: [{ type: String }],
	video: { type: String, default: "" },
	isAvailable: { type: Boolean, default: true },
});

const productSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
		},
		slug: {
			type: String,
			lowercase: true,
			trim: true,
			index: true,
		},
		description: {
			type: String,
			required: true,
		},
		shortDescription: {
			type: String,
			default: "",
		},
		highlights: [{ type: String }],
		specifications: [specificationSchema],
		sku: {
			type: String,
			default: "",
			trim: true,
		},
		price: {
			type: Number,
			min: [0, "Price cannot be negative"],
			required: true,
		},
		originalPrice: {
			type: Number,
			min: [0, "Original price cannot be negative"],
		},
		image: {
			type: String,
			required: [true, "Primary image is required"],
		},
		images: [
			{
				type: String,
			},
		],
		video: {
			type: String,
			default: "",
		},
		colors: [colorSchema],
		variants: [variantSchema],
		category: {
			type: String,
			required: true,
			lowercase: true,
			trim: true,
		},
		categoryId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Category",
			default: null,
			index: true,
		},
		subcategory: {
			type: String,
			default: "",
			lowercase: true,
			trim: true,
			index: true,
		},
		categoryAttributes: {
			type: Map,
			of: mongoose.Schema.Types.Mixed,
			default: {},
		},
		brand: {
			type: String,
			default: "",
			trim: true,
		},
		stock: {
			type: Number,
			default: 100,
			min: [0, "Stock cannot be negative"],
		},
		status: {
			type: String,
			enum: ["draft", "active", "inactive", "archived"],
			default: "active",
		},
		isFeatured: {
			type: Boolean,
			default: false,
		},
		isNewArrival: {
			type: Boolean,
			default: false,
		},
		newArrivalStartDate: {
			type: Date,
			default: null,
		},
		newArrivalEndDate: {
			type: Date,
			default: null,
		},
		shippingInfo: {
			type: String,
			default: "Free Express Shipping on orders over ₹1,999. Dispatched within 24 hours.",
		},
		warrantyInfo: {
			type: String,
			default: "1-Year Brand Quality Assurance guarantee.",
		},
		returnInfo: {
			type: String,
			default: "Hassle-free 30-day exchange and return policy.",
		},
		rating: {
			type: Number,
			default: 0,
			min: 0,
			max: 5,
		},
		numReviews: {
			type: Number,
			default: 0,
		},
		tags: [{ type: String }],
		sizeChartId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "SizeChart",
			default: null,
		},
		fit: {
			type: String,
			enum: ["Slim Fit", "Regular Fit", "Relaxed Fit", "Oversized", "Tailored Fit", "Classic Fit", ""],
			default: "Regular Fit",
		},
		fabric: {
			type: String,
			default: "100% Premium Cotton",
			trim: true,
		},
		occasion: {
			type: String,
			enum: ["Casual", "Formal", "Party", "Festive", "Lounge", "Streetwear", "Workwear", ""],
			default: "Casual",
		},
		pattern: {
			type: String,
			default: "Solid",
			trim: true,
		},
		neckline: {
			type: String,
			default: "Classic Collar",
			trim: true,
		},
		sleeve: {
			type: String,
			default: "Full Sleeve",
			trim: true,
		},
		season: {
			type: String,
			default: "All Season",
			trim: true,
		},
		washCare: {
			type: String,
			default: "Machine wash cold with like colours. Do not bleach. Tumble dry low or line dry in shade.",
		},
		popularityScore: {
			type: Number,
			default: 0,
			index: true,
		},
		salesCount: {
			type: Number,
			default: 0,
		},
		badge: {
			type: String,
			enum: ["BESTSELLER", "TRENDING", "NEW ARRIVAL", "LIMITED STOCK", "PREMIUM", "FLAT 50% OFF", "PRICE DROP", ""],
			default: "",
		},
	},
	{ timestamps: true }
);

// Auto-generate slug before saving if not provided
productSchema.pre("save", function (next) {
	if (!this.slug && this.name) {
		const base = this.name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "");
		const rand = Math.random().toString(36).substring(2, 6);
		this.slug = `${base}-${rand}`;
	}
	next();
});

// Text index for search
productSchema.index({ name: "text", description: "text", brand: "text", tags: "text", category: "text" });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ category: 1, subcategory: 1, status: 1 });
productSchema.index({ categoryId: 1, status: 1 });
productSchema.index({ isNewArrival: 1, status: 1 });
productSchema.index({ isFeatured: 1, status: 1 });

const Product = mongoose.model("Product", productSchema);

export default Product;
