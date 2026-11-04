import Category from "../models/category.model.js";
import Product from "../models/product.model.js";
import cloudinary from "../lib/cloudinary.js";
import mongoose from "mongoose";

// Helper to sanitize slug
const slugify = (text) =>
	text
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");

// Helper to convert label to camelCase key
const toCamelCase = (str) =>
	str
		.trim()
		.replace(/[^a-zA-Z0-9 ]/g, "")
		.split(/\s+/)
		.map((word, index) =>
			index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
		)
		.join("");

// Process base64 image or direct URL
const processImageUpload = async (imageInput, folder = "categories") => {
	if (!imageInput) return "";
	if (imageInput.startsWith("data:")) {
		const uploadRes = await cloudinary.uploader.upload(imageInput, { folder });
		return uploadRes.secure_url;
	}
	return imageInput;
};

export const getAllCategories = async (req, res) => {
	try {
		const includeArchived = req.query.includeArchived === "true";
		const query = includeArchived ? {} : { isArchived: { $ne: true } };

		const categories = await Category.find(query).sort({ displayOrder: 1, name: 1 }).lean();

		// Count dynamic products per category (by slug or categoryId)
		const categoriesWithCounts = await Promise.all(
			categories.map(async (cat) => {
				const count = await Product.countDocuments({
					$or: [{ category: cat.slug }, { categoryId: cat._id }],
				});
				return { ...cat, itemCount: count };
			})
		);

		res.json(categoriesWithCounts);
	} catch (error) {
		console.log("Error in getAllCategories controller:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getCategoryBySlug = async (req, res) => {
	try {
		const { slug } = req.params;
		let category = null;

		if (mongoose.Types.ObjectId.isValid(slug)) {
			category = await Category.findById(slug).lean();
		}

		if (!category) {
			category = await Category.findOne({ slug: slug.toLowerCase().trim() }).lean();
		}

		if (!category) {
			return res.status(404).json({ message: "Category not found" });
		}

		const count = await Product.countDocuments({
			$or: [{ category: category.slug }, { categoryId: category._id }],
		});

		res.json({ ...category, itemCount: count });
	} catch (error) {
		console.log("Error in getCategoryBySlug controller:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const createCategory = async (req, res) => {
	try {
		const {
			name,
			slug,
			parentCategory,
			description,
			image,
			imageUrl,
			displayOrder,
			isActive,
			subcategories,
			attributes,
			sizeSystem,
		} = req.body;

		if (!name || !name.trim()) {
			return res.status(400).json({ message: "Category name is required" });
		}

		const cleanSlug = slugify(slug || name);
		if (!cleanSlug) {
			return res.status(400).json({ message: "A valid category slug is required" });
		}

		const existing = await Category.findOne({
			$or: [{ name: name.trim() }, { slug: cleanSlug }],
		});
		if (existing) {
			return res.status(400).json({ message: `Category with name "${name}" or slug "${cleanSlug}" already exists` });
		}

		const finalImageUrl = await processImageUpload(image || imageUrl, "categories");

		// Format and sanitize subcategories
		const formattedSubcategories = Array.isArray(subcategories)
			? subcategories.map((sub, idx) => ({
					name: sub.name?.trim() || "",
					slug: slugify(sub.slug || sub.name || `sub-${idx}`),
					description: sub.description?.trim() || "",
					imageUrl: sub.imageUrl || "",
					displayOrder: Number(sub.displayOrder) || idx + 1,
					isActive: sub.isActive !== undefined ? Boolean(sub.isActive) : true,
			  }))
			: [];

		// Format and sanitize attributes
		const formattedAttributes = Array.isArray(attributes)
			? attributes.map((attr) => ({
					key: attr.key ? attr.key.trim() : toCamelCase(attr.label || "attr"),
					label: attr.label?.trim() || attr.key || "Attribute",
					type: attr.type || "select",
					options: Array.isArray(attr.options)
						? attr.options.map((o) => (typeof o === "string" ? o.trim() : String(o))).filter(Boolean)
						: [],
					required: Boolean(attr.required),
					unit: attr.unit?.trim() || "",
					defaultValue: attr.defaultValue !== undefined ? attr.defaultValue : "",
			  }))
			: [];

		// Ensure sizeSystem defaults
		const formattedSizeSystem = sizeSystem || {
			systemType: "apparel_alpha",
			allowedSizes: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
			hasDimensions: false,
		};

		const category = await Category.create({
			name: name.trim(),
			slug: cleanSlug,
			parentCategory: parentCategory?.trim() || "MEN'S FASHION",
			description: description?.trim() || "",
			imageUrl: finalImageUrl,
			displayOrder: Number(displayOrder) || 0,
			isActive: isActive !== undefined ? Boolean(isActive) : true,
			isArchived: false,
			subcategories: formattedSubcategories,
			attributes: formattedAttributes,
			sizeSystem: formattedSizeSystem,
		});

		res.status(201).json(category);
	} catch (error) {
		console.log("Error in createCategory controller:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const updateCategory = async (req, res) => {
	try {
		const {
			name,
			slug,
			parentCategory,
			description,
			image,
			imageUrl,
			displayOrder,
			isActive,
			isArchived,
			subcategories,
			attributes,
			sizeSystem,
		} = req.body;

		const category = await Category.findById(req.params.id);
		if (!category) {
			return res.status(404).json({ message: "Category not found" });
		}

		const oldSlug = category.slug;
		const newSlug = slug ? slugify(slug) : category.slug;

		// Check duplicate slug if slug changed
		if (newSlug !== oldSlug) {
			const duplicate = await Category.findOne({ slug: newSlug, _id: { $ne: category._id } });
			if (duplicate) {
				return res.status(400).json({ message: `Category with slug "${newSlug}" already exists` });
			}
		}

		let finalImageUrl = category.imageUrl;
		if (image || imageUrl) {
			const rawImage = image || imageUrl;
			if (rawImage !== category.imageUrl) {
				finalImageUrl = await processImageUpload(rawImage, "categories");
			}
		}

		if (name !== undefined) category.name = name.trim();
		category.slug = newSlug;
		if (parentCategory !== undefined) category.parentCategory = parentCategory.trim();
		if (description !== undefined) category.description = description.trim();
		category.imageUrl = finalImageUrl;
		if (displayOrder !== undefined) category.displayOrder = Number(displayOrder);
		if (isActive !== undefined) category.isActive = Boolean(isActive);
		if (isArchived !== undefined) category.isArchived = Boolean(isArchived);

		if (Array.isArray(subcategories)) {
			category.subcategories = subcategories.map((sub, idx) => ({
				_id: sub._id || new mongoose.Types.ObjectId(),
				name: sub.name?.trim() || "",
				slug: slugify(sub.slug || sub.name || `sub-${idx}`),
				description: sub.description?.trim() || "",
				imageUrl: sub.imageUrl || "",
				displayOrder: Number(sub.displayOrder) || idx + 1,
				isActive: sub.isActive !== undefined ? Boolean(sub.isActive) : true,
			}));
		}

		if (Array.isArray(attributes)) {
			category.attributes = attributes.map((attr) => ({
				_id: attr._id || new mongoose.Types.ObjectId(),
				key: attr.key ? attr.key.trim() : toCamelCase(attr.label || "attr"),
				label: attr.label?.trim() || attr.key || "Attribute",
				type: attr.type || "select",
				options: Array.isArray(attr.options)
					? attr.options.map((o) => (typeof o === "string" ? o.trim() : String(o))).filter(Boolean)
					: [],
				required: Boolean(attr.required),
				unit: attr.unit?.trim() || "",
				defaultValue: attr.defaultValue !== undefined ? attr.defaultValue : "",
			}));
		}

		if (sizeSystem) {
			category.sizeSystem = {
				systemType: sizeSystem.systemType || category.sizeSystem?.systemType || "apparel_alpha",
				allowedSizes: Array.isArray(sizeSystem.allowedSizes)
					? sizeSystem.allowedSizes
					: category.sizeSystem?.allowedSizes || ["XS", "S", "M", "L", "XL", "XXL"],
				hasDimensions: Boolean(sizeSystem.hasDimensions),
				sizeChartId: sizeSystem.sizeChartId || category.sizeSystem?.sizeChartId || null,
			};
		}

		await category.save();

		// If slug changed, update products under this category
		if (oldSlug !== newSlug) {
			await Product.updateMany({ category: oldSlug }, { category: newSlug });
		}

		res.json(category);
	} catch (error) {
		console.log("Error in updateCategory controller:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const reorderCategories = async (req, res) => {
	try {
		const { orders } = req.body; // Array of { id, displayOrder }
		if (!Array.isArray(orders)) {
			return res.status(400).json({ message: "Array of { id, displayOrder } is required" });
		}

		const bulkOps = orders
			.filter((o) => o.id && mongoose.Types.ObjectId.isValid(o.id))
			.map((o) => ({
				updateOne: {
					filter: { _id: o.id },
					update: { $set: { displayOrder: Number(o.displayOrder) || 0 } },
				},
			}));

		if (bulkOps.length > 0) {
			await Category.bulkWrite(bulkOps);
		}

		const updated = await Category.find({ isArchived: { $ne: true } })
			.sort({ displayOrder: 1, name: 1 })
			.lean();
		res.json(updated);
	} catch (error) {
		console.log("Error in reorderCategories controller:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const deleteCategory = async (req, res) => {
	try {
		const category = await Category.findById(req.params.id);
		if (!category) {
			return res.status(404).json({ message: "Category not found" });
		}

		const productCount = await Product.countDocuments({
			$or: [{ category: category.slug }, { categoryId: category._id }],
		});

		const force = req.query.force === "true";

		// If category contains products and not forced, archive it safely
		if (productCount > 0 && !force) {
			category.isArchived = true;
			category.isActive = false;
			await category.save();
			return res.json({
				message: `Category "${category.name}" contains ${productCount} active products. It has been safely archived to preserve customer records and orders.`,
				category,
				archived: true,
			});
		}

		// Delete if 0 products or explicitly forced
		await category.deleteOne();
		res.json({ message: `Category "${category.name}" deleted successfully`, deleted: true });
	} catch (error) {
		console.log("Error in deleteCategory controller:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Subcategory Operations
export const addSubcategory = async (req, res) => {
	try {
		const { name, slug, description, imageUrl } = req.body;
		if (!name || !name.trim()) {
			return res.status(400).json({ message: "Subcategory name is required" });
		}

		const category = await Category.findById(req.params.id);
		if (!category) {
			return res.status(404).json({ message: "Category not found" });
		}

		const cleanSlug = slugify(slug || name);
		if (category.subcategories.some((s) => s.slug === cleanSlug)) {
			return res.status(400).json({ message: `Subcategory "${cleanSlug}" already exists in this category` });
		}

		const finalImage = await processImageUpload(imageUrl, "categories/subcategories");

		category.subcategories.push({
			name: name.trim(),
			slug: cleanSlug,
			description: description?.trim() || "",
			imageUrl: finalImage,
			displayOrder: category.subcategories.length + 1,
			isActive: true,
		});

		await category.save();
		res.status(201).json(category);
	} catch (error) {
		console.log("Error in addSubcategory controller:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const updateSubcategory = async (req, res) => {
	try {
		const { name, slug, description, imageUrl, isActive, displayOrder } = req.body;
		const category = await Category.findById(req.params.id);
		if (!category) {
			return res.status(404).json({ message: "Category not found" });
		}

		const sub = category.subcategories.id(req.params.subId);
		if (!sub) {
			return res.status(404).json({ message: "Subcategory not found" });
		}

		const oldSlug = sub.slug;
		const newSlug = slug ? slugify(slug) : sub.slug;

		if (name !== undefined) sub.name = name.trim();
		sub.slug = newSlug;
		if (description !== undefined) sub.description = description.trim();
		if (imageUrl) sub.imageUrl = await processImageUpload(imageUrl, "categories/subcategories");
		if (isActive !== undefined) sub.isActive = Boolean(isActive);
		if (displayOrder !== undefined) sub.displayOrder = Number(displayOrder);

		await category.save();

		// If subcategory slug changed, update products using this subcategory
		if (oldSlug !== newSlug) {
			await Product.updateMany(
				{ $or: [{ category: category.slug }, { categoryId: category._id }], subcategory: oldSlug },
				{ subcategory: newSlug }
			);
		}

		res.json(category);
	} catch (error) {
		console.log("Error in updateSubcategory controller:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const deleteSubcategory = async (req, res) => {
	try {
		const category = await Category.findById(req.params.id);
		if (!category) {
			return res.status(404).json({ message: "Category not found" });
		}

		const sub = category.subcategories.id(req.params.subId);
		if (!sub) {
			return res.status(404).json({ message: "Subcategory not found" });
		}

		sub.deleteOne();
		await category.save();

		res.json({ message: "Subcategory removed successfully", category });
	} catch (error) {
		console.log("Error in deleteSubcategory controller:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};
