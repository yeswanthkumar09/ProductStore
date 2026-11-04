import mongoose from "mongoose";

const subcategorySchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
		},
		slug: {
			type: String,
			required: true,
			lowercase: true,
			trim: true,
		},
		description: {
			type: String,
			default: "",
		},
		imageUrl: {
			type: String,
			default: "",
		},
		displayOrder: {
			type: Number,
			default: 0,
		},
		isActive: {
			type: Boolean,
			default: true,
		},
	},
	{ _id: true }
);

const attributeDefinitionSchema = new mongoose.Schema(
	{
		key: {
			type: String,
			required: true,
			trim: true,
		},
		label: {
			type: String,
			required: true,
			trim: true,
		},
		type: {
			type: String,
			enum: ["text", "number", "boolean", "select", "multiselect", "measurement"],
			default: "select",
		},
		options: [{ type: String }],
		required: {
			type: Boolean,
			default: false,
		},
		unit: {
			type: String,
			default: "",
		},
		defaultValue: {
			type: mongoose.Schema.Types.Mixed,
			default: "",
		},
	},
	{ _id: true }
);

const sizeSystemSchema = new mongoose.Schema(
	{
		systemType: {
			type: String,
			enum: ["apparel_alpha", "waist_numeric", "footwear_numeric", "dimensions", "one_size"],
			default: "apparel_alpha",
		},
		allowedSizes: [{ type: String }],
		hasDimensions: {
			type: Boolean,
			default: false,
		},
		sizeChartId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "SizeChart",
			default: null,
		},
	},
	{ _id: false }
);

const categorySchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			unique: true,
			trim: true,
		},
		slug: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
			index: true,
		},
		parentCategory: {
			type: String,
			default: "MEN'S FASHION",
			trim: true,
		},
		description: {
			type: String,
			default: "",
		},
		imageUrl: {
			type: String,
			default: "",
		},
		displayOrder: {
			type: Number,
			default: 0,
		},
		isActive: {
			type: Boolean,
			default: true,
		},
		isArchived: {
			type: Boolean,
			default: false,
		},
		subcategories: [subcategorySchema],
		attributes: [attributeDefinitionSchema],
		sizeSystem: {
			type: sizeSystemSchema,
			default: () => ({
				systemType: "apparel_alpha",
				allowedSizes: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
				hasDimensions: false,
			}),
		},
		itemCount: {
			type: Number,
			default: 0,
		},
	},
	{ timestamps: true }
);

categorySchema.index({ isActive: 1, isArchived: 1, displayOrder: 1 });
categorySchema.index({ "subcategories.slug": 1 });

const Category = mongoose.model("Category", categorySchema);

export default Category;
