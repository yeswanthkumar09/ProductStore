import mongoose from "mongoose";
import { redis } from "../lib/redis.js";
import cloudinary from "../lib/cloudinary.js";
import Product from "../models/product.model.js";
import Category from "../models/category.model.js";
import SearchQuery from "../models/searchQuery.model.js";
import { checkAndTriggerRestock } from "./restockSubscription.controller.js";
import { logAdminAction } from "../lib/auditLogger.js";

export const getAllProducts = async (req, res) => {
	try {
		const products = await Product.find({});
		res.json({ products });
	} catch (error) {
		console.log("Error in getAllProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getFeaturedProducts = async (req, res) => {
	try {
		let featuredProducts = null;
		try {
			const cached = await redis.get("featured_products");
			if (cached) {
				const parsed = JSON.parse(cached);
				if (Array.isArray(parsed) && parsed.length > 0) {
					// Validate that cached products genuinely exist in the active MongoDB instance
					const sampleIds = parsed
						.slice(0, 3)
						.map((p) => p._id)
						.filter((pId) => pId && mongoose.Types.ObjectId.isValid(pId));
					const existingCount = await Product.countDocuments({ _id: { $in: sampleIds } });
					const isStale = parsed.some((p) => p.variants?.length > 0 && p.variants[0].color && !p.variants[0].color.image);
					if (existingCount === sampleIds.length && !isStale) {
						return res.json(parsed);
					}
					console.log("[CACHE REFRESH] Inactive, mismatched, or stale-schema products detected in Redis cache. Purging stale cache...");
					await redis.del("featured_products");
				}
			}
		} catch (e) {
			console.log("Redis cache check error, fetching from DB:", e.message);
		}

		featuredProducts = await Product.find({ isFeatured: true }).lean();

		if (!featuredProducts || featuredProducts.length === 0) {
			featuredProducts = await Product.find({}).sort({ rating: -1 }).limit(10).lean();
		}

		try {
			await redis.set("featured_products", JSON.stringify(featuredProducts));
		} catch (e) {
			// ignore cache write error
		}

		res.json(featuredProducts);
	} catch (error) {
		console.log("Error in getFeaturedProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getProductById = async (req, res) => {
	try {
		const { id } = req.params;
		if (!id || id === "undefined" || id === "null") {
			return res.status(404).json({ message: "Product ID is missing or invalid." });
		}

		const cleanId = decodeURIComponent(id).trim();
		let product = null;

		// 1. Direct MongoDB ObjectId match
		if (mongoose.Types.ObjectId.isValid(cleanId)) {
			product = await Product.findById(cleanId);

			// 2. If not found by product _id, check if id belongs to a subdocument variant._id
			if (!product) {
				product = await Product.findOne({ "variants._id": cleanId });
			}
		}

		// 3. Fallback: match by product slug, normalized title, SKU, or variant SKU
		if (!product) {
			const slugCandidate = cleanId.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
			const namePattern = new RegExp(`^${cleanId.replace(/[-_]/g, " ")}$`, "i");

			product = await Product.findOne({
				$or: [
					{ slug: cleanId.toLowerCase() },
					{ slug: slugCandidate },
					{ name: namePattern },
					{ sku: cleanId },
					{ "variants.sku": cleanId },
				],
			});
		}

		if (!product) {
			return res.status(404).json({ message: "Product not found in our catalogue." });
		}

		res.json(product);
	} catch (error) {
		console.log("Error in getProductById controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const searchProducts = async (req, res) => {
	try {
		const { q, category, minPrice, maxPrice, sort, page = 1, limit = 12 } = req.query;

		const filter = {};

		if (q && q.trim()) {
			const cleanQuery = q.trim();
			const escaped = cleanQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
			const searchRegex = new RegExp(escaped, "i");
			filter.$or = [
				{ name: searchRegex },
				{ description: searchRegex },
				{ brand: searchRegex },
				{ category: searchRegex },
				{ tags: searchRegex },
			];
		}

		if (category && category !== "all") {
			filter.category = category.toLowerCase();
		}

		if (minPrice || maxPrice) {
			filter.price = {};
			if (minPrice) filter.price.$gte = Number(minPrice);
			if (maxPrice) filter.price.$lte = Number(maxPrice);
		}

		let sortOption = {};
		if (sort === "price_asc") sortOption = { price: 1 };
		else if (sort === "price_desc") sortOption = { price: -1 };
		else if (sort === "rating") sortOption = { rating: -1, numReviews: -1 };
		else if (sort === "newest") sortOption = { createdAt: -1 };
		else if (sort === "popular") sortOption = { popularityScore: -1, salesCount: -1, rating: -1 };
		else if (sort === "bestseller") sortOption = { salesCount: -1, rating: -1 };
		else sortOption = { isFeatured: -1, rating: -1, createdAt: -1 };

		const skip = (Number(page) - 1) * Number(limit);
		const total = await Product.countDocuments(filter);
		const products = await Product.find(filter)
			.sort(sortOption)
			.skip(skip)
			.limit(Number(limit));

		// Asynchronously log search term for intelligence and popular queries
		if (q && q.trim().length >= 2) {
			const cleanQuery = q.trim().toLowerCase();
			SearchQuery.findOneAndUpdate(
				{ query: cleanQuery },
				{
					$inc: { searchCount: 1 },
					$set: { resultsCount: total, lastSearchedAt: new Date() },
				},
				{ upsert: true }
			).catch(() => {});
		}

		res.json({
			products,
			total,
			page: Number(page),
			pages: Math.ceil(total / Number(limit)) || 1,
		});
	} catch (error) {
		console.log("Error in searchProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getPopularSearches = async (req, res) => {
	try {
		const top = await SearchQuery.find({ searchCount: { $gt: 0 } })
			.sort({ searchCount: -1, lastSearchedAt: -1 })
			.limit(8)
			.select("query searchCount");

		const defaults = [
			"Overshirts",
			"Linen Shirts",
			"Cargo Pants",
			"Heavyweight Boxy Tee",
			"Tailored Trousers",
			"Denim Jackets",
			"Festive Edit",
			"White Sneakers",
		];

		const queries = top.map((t) => t.query);
		defaults.forEach((d) => {
			if (!queries.some((q) => q.toLowerCase() === d.toLowerCase()) && queries.length < 8) {
				queries.push(d);
			}
		});

		res.json(queries);
	} catch (error) {
		console.error("Error in getPopularSearches:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getNewArrivals = async (req, res) => {
	try {
		const now = new Date();
		// Active products marked as new arrival within campaign date range, or products created in last 45 days
		const query = {
			status: "active",
			$or: [
				{
					isNewArrival: true,
					$and: [
						{ $or: [{ newArrivalStartDate: null }, { newArrivalStartDate: { $lte: now } }] },
						{ $or: [{ newArrivalEndDate: null }, { newArrivalEndDate: { $gte: now } }] },
					],
				},
				{
					createdAt: { $gte: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000) },
				},
			],
		};

		const products = await Product.find(query).sort({ createdAt: -1 }).limit(12).lean();
		res.json(products);
	} catch (error) {
		console.log("Error in getNewArrivals controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getSimilarProducts = async (req, res) => {
	try {
		const { id } = req.params;
		if (!id) return res.status(400).json({ message: "Product ID required" });

		const cleanId = decodeURIComponent(id).trim();
		let product = null;

		if (mongoose.Types.ObjectId.isValid(cleanId)) {
			product = await Product.findById(cleanId);
			if (!product) {
				product = await Product.findOne({ "variants._id": cleanId });
			}
		}

		if (!product) {
			const namePattern = new RegExp(`^${cleanId.replace(/[-_]/g, " ")}$`, "i");
			product = await Product.findOne({
				$or: [
					{ slug: cleanId.toLowerCase() },
					{ name: namePattern },
					{ sku: cleanId },
					{ "variants.sku": cleanId },
				],
			});
		}

		if (!product) return res.status(404).json({ message: "Product not found" });

		// Intelligent weighted scoring recommendation algorithm
		const minPrice = Math.max(0, (product.price || 0) * 0.4);
		const maxPrice = (product.price || 0) * 2.2;

		const candidateFilter = {
			_id: { $ne: product._id },
			status: "active",
			$and: [
				{
					$or: [
						{ stock: { $gt: 0 } },
						{ "variants.stock": { $gt: 0 } },
					],
				},
				{
					$or: [
						{ category: product.category },
						...(product.subcategory ? [{ subcategory: product.subcategory }] : []),
						...(product.tags?.length > 0 ? [{ tags: { $in: product.tags } }] : []),
						...(product.brand ? [{ brand: product.brand }] : []),
						{ price: { $gte: minPrice, $lte: maxPrice } },
					],
				},
			],
		};

		let candidates = await Product.find(candidateFilter).limit(24).lean();

		if (candidates.length < 4) {
			const fallbackCandidates = await Product.find({
				_id: { $ne: product._id, $nin: candidates.map((c) => c._id) },
				status: "active",
				$or: [{ stock: { $gt: 0 } }, { "variants.stock": { $gt: 0 } }],
			})
				.limit(8 - candidates.length)
				.lean();
			candidates = [...candidates, ...fallbackCandidates];
		}

		// Calculate relevance score for each alternative product
		const scoredCandidates = candidates.map((candidate) => {
			let score = 0;

			// Category match (weight: 35)
			if (candidate.category && candidate.category.toLowerCase() === (product.category || "").toLowerCase()) {
				score += 35;
			}
			// Subcategory match (weight: 20)
			if (candidate.subcategory && candidate.subcategory.toLowerCase() === (product.subcategory || "").toLowerCase()) {
				score += 20;
			}
			// Fit match (weight: 15)
			if (candidate.fit && product.fit && candidate.fit.toLowerCase() === product.fit.toLowerCase()) {
				score += 15;
			}
			// Occasion match (weight: 15)
			if (candidate.occasion && product.occasion && candidate.occasion.toLowerCase() === product.occasion.toLowerCase()) {
				score += 15;
			}
			// Fabric / Material match (weight: 10)
			if (candidate.fabric && product.fabric && candidate.fabric.toLowerCase() === product.fabric.toLowerCase()) {
				score += 10;
			}
			// Tag overlaps (weight: up to 15)
			if (Array.isArray(candidate.tags) && Array.isArray(product.tags)) {
				const commonTags = candidate.tags.filter((t) => product.tags.includes(t));
				score += Math.min(15, commonTags.length * 5);
			}
			// Price proximity (weight: 15)
			if (product.price > 0 && candidate.price > 0) {
				const priceDiff = Math.abs(candidate.price - product.price);
				const priceRatio = Math.max(0, 1 - priceDiff / product.price);
				score += priceRatio * 15;
			}
			// Verified customer rating bonus (weight: 5)
			if (candidate.rating) {
				score += (candidate.rating / 5) * 5;
			}

			return { ...candidate, _relevanceScore: Math.round(score) };
		});

		// Rank by highest relevance score
		scoredCandidates.sort((a, b) => b._relevanceScore - a._relevanceScore);
		const similar = scoredCandidates.slice(0, 8);

		res.json(similar);
	} catch (error) {
		console.log("Error in getSimilarProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const createProduct = async (req, res) => {
	try {
		const {
			name,
			slug,
			description,
			shortDescription,
			highlights,
			specifications,
			sku,
			price,
			originalPrice,
			image,
			images = [],
			video,
			category,
			subcategory,
			categoryAttributes = {},
			brand,
			stock,
			status = "active",
			isFeatured = false,
			isNewArrival = false,
			newArrivalStartDate,
			newArrivalEndDate,
			shippingInfo,
			warrantyInfo,
			returnInfo,
			tags,
			colors = [],
			variants = [],
		} = req.body;

		// Category lookup and validation
		let categoryDoc = null;
		if (category) {
			const cleanCat = String(category).toLowerCase().trim();
			if (mongoose.Types.ObjectId.isValid(category)) {
				categoryDoc = await Category.findById(category);
			}
			if (!categoryDoc) {
				categoryDoc = await Category.findOne({ slug: cleanCat });
			}
		}

		if (!categoryDoc) {
			return res.status(400).json({ message: `Selected category "${category}" does not exist in the catalog.` });
		}

		if (categoryDoc.isArchived) {
			return res.status(400).json({
				message: `Cannot publish products in archived category "${categoryDoc.name}". Please restore it first.`,
			});
		}

		// Subcategory validation
		let validSubcategory = subcategory ? String(subcategory).toLowerCase().trim() : "";
		if (validSubcategory && Array.isArray(categoryDoc.subcategories) && categoryDoc.subcategories.length > 0) {
			const subExists = categoryDoc.subcategories.some(
				(s) => s.slug === validSubcategory || s.name.toLowerCase() === validSubcategory
			);
			if (!subExists) {
				return res.status(400).json({
					message: `Subcategory "${subcategory}" does not belong to category "${categoryDoc.name}".`,
				});
			}
		}

		// Required category attributes validation
		const incomingAttrs = categoryAttributes || {};
		if (Array.isArray(categoryDoc.attributes)) {
			for (const attrDef of categoryDoc.attributes) {
				if (attrDef.required) {
					const val = incomingAttrs[attrDef.key] !== undefined ? incomingAttrs[attrDef.key] : req.body[attrDef.key];
					if (val === undefined || val === null || (typeof val === "string" && !val.trim())) {
						return res.status(400).json({
							message: `Category attribute "${attrDef.label}" is required for ${categoryDoc.name}.`,
						});
					}
				}
			}
		}

		let primaryImageUrl = image || "";
		let uploadedImages = [];

		// Handle primary image upload if base64
		if (primaryImageUrl && primaryImageUrl.startsWith("data:")) {
			try {
				const cloudinaryResponse = await cloudinary.uploader.upload(primaryImageUrl, { folder: "products" });
				primaryImageUrl = cloudinaryResponse.secure_url;
			} catch (e) {
				console.log("Cloudinary upload fallback:", e.message);
			}
		}

		// Handle additional images
		if (Array.isArray(images) && images.length > 0) {
			for (const img of images) {
				if (img.startsWith("data:")) {
					try {
						const res = await cloudinary.uploader.upload(img, { folder: "products" });
						uploadedImages.push(res.secure_url);
					} catch (e) {
						console.log("Cloudinary upload fallback for array:", e.message);
					}
				} else if (img) {
					uploadedImages.push(img);
				}
			}
		}

		// If no primary image but images array has items, use the first one
		if (!primaryImageUrl && uploadedImages.length > 0) {
			primaryImageUrl = uploadedImages[0];
		}

		// Ensure primary image is included in images array
		if (primaryImageUrl && !uploadedImages.includes(primaryImageUrl)) {
			uploadedImages.unshift(primaryImageUrl);
		}

		// Validate variants if provided
		const seenCombos = new Set();
		const seenSkus = new Set();
		let processedVariants = [];

		if (Array.isArray(variants) && variants.length > 0) {
			for (const v of variants) {
				if (v.price === undefined || Number(v.price) < 0) {
					return res.status(400).json({ message: "Each variant must have a valid non-negative price." });
				}
				if (v.stock !== undefined && Number(v.stock) < 0) {
					return res.status(400).json({ message: "Variant stock cannot be negative." });
				}

				const comboKey = `${(v.color?.name || "").trim().toLowerCase()}_${(v.size || "").trim().toLowerCase()}`;
				if (seenCombos.has(comboKey)) {
					return res.status(400).json({
						message: `Duplicate variant combination: Color "${v.color?.name || "Standard"}" with Size "${v.size || "Default"}". Each variant combination must be unique.`,
					});
				}
				seenCombos.add(comboKey);

				if (v.sku && String(v.sku).trim()) {
					const cleanSku = String(v.sku).trim().toUpperCase();
					if (seenSkus.has(cleanSku)) {
						return res.status(400).json({ message: `Duplicate variant SKU "${cleanSku}" within the same product.` });
					}
					seenSkus.add(cleanSku);
				}

				processedVariants.push({
					...v,
					price: Number(v.price),
					originalPrice: v.originalPrice ? Number(v.originalPrice) : undefined,
					stock: v.stock !== undefined ? Number(v.stock) : 0,
					images: Array.isArray(v.images) ? v.images : (v.image ? [v.image] : []),
					isAvailable: v.isAvailable !== undefined ? v.isAvailable : true,
				});
			}
		}

		const product = await Product.create({
			name,
			slug: slug ? slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") : undefined,
			description,
			shortDescription: shortDescription || "",
			highlights: Array.isArray(highlights) ? highlights : [],
			specifications: Array.isArray(specifications) ? specifications : [],
			sku: sku || "",
			price: Number(price),
			originalPrice: originalPrice ? Number(originalPrice) : undefined,
			image: primaryImageUrl,
			images: uploadedImages,
			video: video || "",
			colors: colors || [],
			variants: processedVariants,
			category: categoryDoc.slug,
			categoryId: categoryDoc._id,
			subcategory: validSubcategory,
			categoryAttributes: incomingAttrs,
			brand: brand || "",
			stock: stock !== undefined ? Number(stock) : 100,
			status: status || "active",
			isFeatured: !!isFeatured,
			isNewArrival: !!isNewArrival,
			newArrivalStartDate: newArrivalStartDate ? new Date(newArrivalStartDate) : null,
			newArrivalEndDate: newArrivalEndDate ? new Date(newArrivalEndDate) : null,
			shippingInfo: shippingInfo || undefined,
			warrantyInfo: warrantyInfo || undefined,
			returnInfo: returnInfo || undefined,
			tags: tags || [],
		});

		// Increment category itemCount
		await Category.findByIdAndUpdate(categoryDoc._id, { $inc: { itemCount: 1 } });

		await updateFeaturedProductsCache();
		res.status(201).json(product);
	} catch (error) {
		console.log("Error in createProduct controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const updateProduct = async (req, res) => {
	try {
		const {
			name,
			slug,
			description,
			shortDescription,
			highlights,
			specifications,
			sku,
			price,
			originalPrice,
			category,
			subcategory,
			categoryAttributes,
			brand,
			stock,
			status,
			tags,
			image,
			images,
			video,
			colors,
			variants,
			isFeatured,
			isNewArrival,
			newArrivalStartDate,
			newArrivalEndDate,
			shippingInfo,
			warrantyInfo,
			returnInfo,
		} = req.body;

		const product = await Product.findById(req.params.id);
		if (!product) return res.status(404).json({ message: "Product not found" });

		let primaryImageUrl = image !== undefined ? image : product.image;
		if (primaryImageUrl && primaryImageUrl.startsWith("data:")) {
			try {
				const cloudinaryResponse = await cloudinary.uploader.upload(primaryImageUrl, { folder: "products" });
				primaryImageUrl = cloudinaryResponse.secure_url;
			} catch (e) {
				console.log("Cloudinary upload fallback:", e.message);
			}
		}

		let finalImages = product.images || [];
		if (Array.isArray(images)) {
			finalImages = [];
			for (const img of images) {
				if (img.startsWith("data:")) {
					try {
						const res = await cloudinary.uploader.upload(img, { folder: "products" });
						finalImages.push(res.secure_url);
					} catch (e) {
						console.log("Cloudinary upload fallback for array:", e.message);
					}
				} else if (img) {
					finalImages.push(img);
				}
			}
		}

		if (primaryImageUrl && !finalImages.includes(primaryImageUrl)) {
			finalImages.unshift(primaryImageUrl);
		}

		let targetCategoryId = product.categoryId;
		let targetCategorySlug = product.category;
		if (category !== undefined) {
			const cleanCat = String(category).toLowerCase().trim();
			let catDoc = null;
			if (mongoose.Types.ObjectId.isValid(category)) {
				catDoc = await Category.findById(category);
			}
			if (!catDoc) {
				catDoc = await Category.findOne({ slug: cleanCat });
			}
			if (!catDoc) {
				return res.status(400).json({ message: `Category "${category}" does not exist in catalog.` });
			}
			targetCategoryId = catDoc._id;
			targetCategorySlug = catDoc.slug;
		}

		let validSubcategory = subcategory !== undefined ? String(subcategory).toLowerCase().trim() : product.subcategory;

		let processedVariants = product.variants;
		if (Array.isArray(variants)) {
			processedVariants = [];
			const seenCombos = new Set();
			const seenSkus = new Set();

			for (const v of variants) {
				if (v.price === undefined || Number(v.price) < 0) {
					return res.status(400).json({ message: "Each variant must have a valid non-negative price." });
				}
				if (v.stock !== undefined && Number(v.stock) < 0) {
					return res.status(400).json({ message: "Variant stock cannot be negative." });
				}

				const comboKey = `${(v.color?.name || "").trim().toLowerCase()}_${(v.size || "").trim().toLowerCase()}`;
				if (seenCombos.has(comboKey)) {
					return res.status(400).json({
						message: `Duplicate variant combination: Color "${v.color?.name || "Standard"}" with Size "${v.size || "Default"}". Each variant combination must be unique.`,
					});
				}
				seenCombos.add(comboKey);

				if (v.sku && String(v.sku).trim()) {
					const cleanSku = String(v.sku).trim().toUpperCase();
					if (seenSkus.has(cleanSku)) {
						return res.status(400).json({ message: `Duplicate variant SKU "${cleanSku}" within the same product.` });
					}
					seenSkus.add(cleanSku);
				}

				processedVariants.push({
					...v,
					price: Number(v.price),
					originalPrice: v.originalPrice ? Number(v.originalPrice) : undefined,
					stock: v.stock !== undefined ? Number(v.stock) : 0,
					images: Array.isArray(v.images) ? v.images : (v.image ? [v.image] : []),
					isAvailable: v.isAvailable !== undefined ? v.isAvailable : true,
				});
			}
		}

		const updatePayload = {
			name: name !== undefined ? name : product.name,
			slug: slug !== undefined ? slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") : product.slug,
			description: description !== undefined ? description : product.description,
			shortDescription: shortDescription !== undefined ? shortDescription : product.shortDescription,
			highlights: highlights !== undefined ? highlights : product.highlights,
			specifications: specifications !== undefined ? specifications : product.specifications,
			sku: sku !== undefined ? sku : product.sku,
			price: price !== undefined ? Number(price) : product.price,
			originalPrice: originalPrice !== undefined ? (originalPrice ? Number(originalPrice) : null) : product.originalPrice,
			category: targetCategorySlug,
			categoryId: targetCategoryId,
			subcategory: validSubcategory,
			categoryAttributes: categoryAttributes !== undefined ? categoryAttributes : product.categoryAttributes,
			brand: brand !== undefined ? brand : product.brand,
			stock: stock !== undefined ? Number(stock) : product.stock,
			status: status !== undefined ? status : product.status,
			tags: tags !== undefined ? tags : product.tags,
			image: primaryImageUrl,
			images: finalImages,
			video: video !== undefined ? video : product.video,
			colors: colors !== undefined ? colors : product.colors,
			variants: processedVariants,
			isFeatured: isFeatured !== undefined ? isFeatured : product.isFeatured,
			isNewArrival: isNewArrival !== undefined ? isNewArrival : product.isNewArrival,
			newArrivalStartDate: newArrivalStartDate !== undefined ? (newArrivalStartDate ? new Date(newArrivalStartDate) : null) : product.newArrivalStartDate,
			newArrivalEndDate: newArrivalEndDate !== undefined ? (newArrivalEndDate ? new Date(newArrivalEndDate) : null) : product.newArrivalEndDate,
			shippingInfo: shippingInfo !== undefined ? shippingInfo : product.shippingInfo,
			warrantyInfo: warrantyInfo !== undefined ? warrantyInfo : product.warrantyInfo,
			returnInfo: returnInfo !== undefined ? returnInfo : product.returnInfo,
		};

		const updated = await Product.findByIdAndUpdate(req.params.id, updatePayload, { new: true });

		// Restock Detection & Notification Dispatch (strictly when 0 -> >0)
		try {
			// 1. Product-level stock transition
			if ((product.stock || 0) === 0 && (updated.stock || 0) > 0) {
				checkAndTriggerRestock({
					productId: updated._id,
					previousStock: product.stock || 0,
					newStock: updated.stock,
				}).catch((e) => console.warn("Restock alert trigger note:", e.message));
			}

			// 2. Variant-level stock transitions
			if (Array.isArray(updated.variants) && updated.variants.length > 0) {
				for (const newVar of updated.variants) {
					const oldVar = (product.variants || []).find(
						(ov) => (newVar._id && ov._id?.toString() === newVar._id?.toString()) || ov.size === newVar.size
					);
					const oldStock = oldVar ? oldVar.stock || 0 : 0;
					const newStock = newVar.stock || 0;

					if (oldStock === 0 && newStock > 0) {
						checkAndTriggerRestock({
							productId: updated._id,
							variantId: newVar._id?.toString(),
							size: newVar.size,
							colorName: newVar.color?.name,
							previousStock: oldStock,
							newStock: newStock,
						}).catch((e) => console.warn("Variant restock alert note:", e.message));
					}
				}
			}
		} catch (restockErr) {
			console.warn("Restock check error:", restockErr.message);
		}

		await updateFeaturedProductsCache();
		res.json(updated);
	} catch (error) {
		console.log("Error in updateProduct controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const deleteProduct = async (req, res) => {
	try {
		const productId = req.params.id;
		const product = await Product.findById(productId);

		if (!product) {
			return res.status(404).json({ message: "Product not found" });
		}

		// Cloudinary image cleanup (isolated with timeout so it never blocks deletion)
		if (product.image && product.image.includes("cloudinary")) {
			try {
				const publicId = product.image.split("/").pop().split(".")[0];
				if (publicId) {
					// Non-blocking fire-and-forget destroy
					cloudinary.uploader.destroy(`products/${publicId}`).catch((err) => {
						console.log("Cloudinary destroy note:", err.message);
					});
				}
			} catch (imgErr) {
				console.log("Cloudinary parse note:", imgErr.message);
			}
		}

		// Delete from MongoDB
		await Product.findByIdAndDelete(productId);

		// Clean up Redis featured products cache
		try {
			await redis.del("featured_products");
		} catch (cacheErr) {
			console.log("Redis cache invalidation note:", cacheErr.message);
		}

		// Clean up dependent reviews and sales in background
		try {
			const Review = (await import("../models/review.model.js")).default;
			await Review.deleteMany({ product: productId }).catch(() => {});
			const Sale = (await import("../models/sale.model.js")).default;
			await Sale.updateMany({}, { $pull: { products: productId } }).catch(() => {});
		} catch (depErr) {
			// Non-critical cleanup
		}

		res.json({ success: true, message: "Product deleted successfully", productId });
	} catch (error) {
		console.log("Error in deleteProduct controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getRecommendedProducts = async (req, res) => {
	try {
		const products = await Product.aggregate([
			{
				$sample: { size: 4 },
			},
			{
				$project: {
					_id: 1,
					name: 1,
					description: 1,
					image: 1,
					price: 1,
					rating: 1,
					numReviews: 1,
				},
			},
		]);

		res.json(products);
	} catch (error) {
		console.log("Error in getRecommendedProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getProductsByCategory = async (req, res) => {
	const { category } = req.params;
	const {
		sort,
		minPrice,
		maxPrice,
		brand,
		subcategory,
		color,
		size,
		page = 1,
		limit = 12,
		...customAttributes
	} = req.query;

	try {
		const cleanCategory = category ? category.toLowerCase().trim() : "";
		const filter = { status: "active" };

		// Category matching (by slug or ObjectId), support "all"
		if (cleanCategory && cleanCategory !== "all") {
			filter.$or = [{ category: cleanCategory }];
			if (mongoose.Types.ObjectId.isValid(cleanCategory)) {
				filter.$or.push({ categoryId: cleanCategory });
			}
		}

		if (subcategory) {
			filter.subcategory = String(subcategory).toLowerCase().trim();
		}

		if (brand) {
			filter.brand = new RegExp(`^${brand}$`, "i");
		}

		if (minPrice || maxPrice) {
			filter.price = {};
			if (minPrice) filter.price.$gte = Number(minPrice);
			if (maxPrice) filter.price.$lte = Number(maxPrice);
		}

		if (color) {
			const colorRegex = new RegExp(`^${color}$`, "i");
			filter.$and = filter.$and || [];
			filter.$and.push({
				$or: [{ "colors.name": colorRegex }, { "variants.color.name": colorRegex }],
			});
		}

		if (size) {
			filter["variants.size"] = size;
		}

		// Filter by dynamic category attributes
		const reservedQueryKeys = ["sort", "minPrice", "maxPrice", "brand", "subcategory", "color", "size", "page", "limit"];
		Object.keys(req.query).forEach((key) => {
			if (!reservedQueryKeys.includes(key) && req.query[key]) {
				filter[`categoryAttributes.${key}`] = req.query[key];
			}
		});

		let sortOption = {};
		if (sort === "price_asc") sortOption = { price: 1 };
		else if (sort === "price_desc") sortOption = { price: -1 };
		else if (sort === "rating") sortOption = { rating: -1, numReviews: -1 };
		else if (sort === "popular") sortOption = { popularityScore: -1, salesCount: -1, rating: -1 };
		else if (sort === "bestseller") sortOption = { salesCount: -1, rating: -1 };
		else if (sort === "newest") sortOption = { createdAt: -1 };
		else sortOption = { isFeatured: -1, createdAt: -1 };

		const skip = (Number(page) - 1) * Number(limit);
		const total = await Product.countDocuments(filter);
		const products = await Product.find(filter).sort(sortOption).skip(skip).limit(Number(limit));

		res.json({ products, total, page: Number(page), pages: Math.ceil(total / Number(limit)) || 1 });
	} catch (error) {
		console.log("Error in getProductsByCategory controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const toggleFeaturedProduct = async (req, res) => {
	try {
		const product = await Product.findById(req.params.id);
		if (product) {
			product.isFeatured = !product.isFeatured;
			const updatedProduct = await product.save();
			await updateFeaturedProductsCache();
			res.json(updatedProduct);
		} else {
			res.status(404).json({ message: "Product not found" });
		}
	} catch (error) {
		console.log("Error in toggleFeaturedProduct controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

async function updateFeaturedProductsCache() {
	try {
		const featuredProducts = await Product.find({ isFeatured: true }).lean();
		await redis.set("featured_products", JSON.stringify(featuredProducts));
	} catch (error) {
		console.log("error in update cache function");
	}
}

/**
 * Helper to parse raw CSV string into an array of objects
 */
function parseCsvToObjects(csvText) {
	if (!csvText || typeof csvText !== "string") return [];
	const lines = csvText
		.split(/\r?\n/)
		.map((l) => l.trim())
		.filter(Boolean);
	if (lines.length < 2) return [];

	// Parse header line respecting quotes
	const parseRow = (line) => {
		const result = [];
		let inQuotes = false;
		let currentStr = "";
		for (let i = 0; i < line.length; i++) {
			const char = line[i];
			if (char === '"') {
				inQuotes = !inQuotes;
			} else if (char === "," && !inQuotes) {
				result.push(currentStr.trim());
				currentStr = "";
			} else {
				currentStr += char;
			}
		}
		result.push(currentStr.trim());
		return result.map((col) => col.replace(/^"(.*)"$/, "$1").replace(/""/g, '"'));
	};

	const headers = parseRow(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9_]/g, ""));
	const rows = [];

	for (let i = 1; i < lines.length; i++) {
		const cols = parseRow(lines[i]);
		if (cols.length === 0 || cols.every((c) => !c)) continue;
		const obj = {};
		headers.forEach((h, idx) => {
			obj[h] = cols[idx] !== undefined ? cols[idx] : "";
		});
		rows.push(obj);
	}

	return rows;
}

/**
 * Admin: Preview & Validate Bulk Product Import Records (JSON or CSV)
 */
export const previewBulkProducts = async (req, res) => {
	try {
		const { products, csvText } = req.body;

		let rawRecords = [];
		if (Array.isArray(products) && products.length > 0) {
			rawRecords = products;
		} else if (typeof csvText === "string" && csvText.trim()) {
			rawRecords = parseCsvToObjects(csvText);
		}

		if (rawRecords.length === 0) {
			return res.status(400).json({
				success: false,
				message: "No valid product records provided. Supply a JSON array or CSV text.",
			});
		}

		// Retrieve all active categories from MongoDB
		const categories = await Category.find({});
		const categoryMap = new Map();
		categories.forEach((c) => {
			categoryMap.set(c.slug.toLowerCase(), c);
			categoryMap.set(c.name.toLowerCase(), c);
		});

		// Retrieve all existing SKUs from MongoDB to detect collisions
		const existingProducts = await Product.find({}, "sku variants.sku").lean();
		const dbSkus = new Set();
		existingProducts.forEach((p) => {
			if (p.sku) dbSkus.add(p.sku.toUpperCase());
			if (Array.isArray(p.variants)) {
				p.variants.forEach((v) => {
					if (v.sku) dbSkus.add(v.sku.toUpperCase());
				});
			}
		});

		const batchSkus = new Set();
		const previewResults = [];
		let validCount = 0;
		let invalidCount = 0;

		rawRecords.forEach((record, index) => {
			const errors = [];
			const warnings = [];

			const name = (record.name || record.title || "").toString().trim();
			if (!name) {
				errors.push("Product name is required.");
			} else if (name.length < 3) {
				errors.push("Product name must be at least 3 characters.");
			}

			const description = (record.description || record.desc || "").toString().trim();
			if (!description) {
				errors.push("Product description is required.");
			}

			const rawPrice = record.price !== undefined ? Number(record.price) : NaN;
			if (isNaN(rawPrice) || rawPrice <= 0) {
				errors.push("Price must be a valid positive number.");
			}

			const rawOriginalPrice = record.originalprice || record.originalPrice ? Number(record.originalprice || record.originalPrice) : null;
			if (rawOriginalPrice !== null && (isNaN(rawOriginalPrice) || rawOriginalPrice < rawPrice)) {
				warnings.push("Original price should be greater than or equal to current price.");
			}

			const categoryKey = (record.category || "").toString().toLowerCase().trim();
			const matchedCat = categoryMap.get(categoryKey);
			if (!categoryKey) {
				errors.push("Category is required.");
			} else if (!matchedCat) {
				errors.push(`Category "${categoryKey}" does not exist in catalog.`);
			}

			const rawStock = record.stock !== undefined && record.stock !== "" ? Number(record.stock) : 10;
			if (isNaN(rawStock) || rawStock < 0) {
				errors.push("Stock must be a non-negative number.");
			}

			const image = (record.image || record.imageurl || record.imageUrl || "").toString().trim();
			if (!image) {
				warnings.push("No primary image URL supplied; placeholder image will be used.");
			}

			const sku = (record.sku || "").toString().trim().toUpperCase();
			if (sku) {
				if (dbSkus.has(sku)) {
					errors.push(`SKU "${sku}" already exists in catalog.`);
				} else if (batchSkus.has(sku)) {
					errors.push(`Duplicate SKU "${sku}" found within this import batch.`);
				} else {
					batchSkus.add(sku);
				}
			}

			const isValid = errors.length === 0;
			if (isValid) validCount++;
			else invalidCount++;

			previewResults.push({
				row: index + 1,
				isValid,
				errors,
				warnings,
				data: {
					name,
					description,
					category: matchedCat ? matchedCat.slug : categoryKey,
					categoryId: matchedCat ? matchedCat._id : null,
					categoryName: matchedCat ? matchedCat.name : categoryKey,
					price: isNaN(rawPrice) ? 0 : rawPrice,
					originalPrice: rawOriginalPrice,
					stock: isNaN(rawStock) ? 10 : rawStock,
					brand: (record.brand || "LUXESTORE Atelier").toString().trim(),
					sku: sku || `PROD-${name.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
					image: image || "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=800&q=80",
					images: record.images && Array.isArray(record.images) ? record.images : [image].filter(Boolean),
					subcategory: (record.subcategory || "").toString().toLowerCase().trim(),
					fabric: (record.fabric || "100% Premium Cotton").toString().trim(),
					fit: (record.fit || "Regular Fit").toString().trim(),
					isFeatured: Boolean(record.isfeatured || record.isFeatured),
					variants: Array.isArray(record.variants) ? record.variants : [],
				},
			});
		});

		res.json({
			success: true,
			totalRecords: rawRecords.length,
			validCount,
			invalidCount,
			records: previewResults,
		});
	} catch (error) {
		console.error("Error in previewBulkProducts:", error);
		res.status(500).json({ success: false, message: "Bulk preview failed", error: error.message });
	}
};

/**
 * Admin: Execute Bulk Product Import into MongoDB Catalog
 */
export const executeBulkImport = async (req, res) => {
	try {
		const { products } = req.body;

		if (!Array.isArray(products) || products.length === 0) {
			return res.status(400).json({ success: false, message: "No validated products supplied for import." });
		}

		// Re-fetch categories to populate ObjectId references
		const categories = await Category.find({});
		const catMap = new Map();
		categories.forEach((c) => {
			catMap.set(c.slug.toLowerCase(), c);
			catMap.set(c.name.toLowerCase(), c);
		});

		const importedProducts = [];
		const failedRows = [];

		for (let i = 0; i < products.length; i++) {
			const item = products[i];
			try {
				const catKey = (item.category || "").toLowerCase().trim();
				const catDoc = catMap.get(catKey);

				const cleanName = (item.name || "").trim();
				const slugCandidate =
					cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") +
					"-" +
					Math.random().toString(36).substring(2, 6);

				const productSku =
					item.sku && item.sku.trim()
						? item.sku.trim().toUpperCase()
						: `PROD-${cleanName.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

				const primaryImage =
					item.image ||
					(Array.isArray(item.images) && item.images[0]) ||
					"https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=800&q=80";

				const imagesArray = Array.isArray(item.images) && item.images.length > 0 ? item.images : [primaryImage];

				const createdProduct = await Product.create({
					name: cleanName,
					slug: slugCandidate,
					description: item.description || "Crafted with bespoke materials and meticulous attention to sartorial detail.",
					shortDescription: item.shortDescription || cleanName,
					price: Number(item.price),
					originalPrice: item.originalPrice ? Number(item.originalPrice) : Math.round(Number(item.price) * 1.3),
					category: catDoc ? catDoc.slug : catKey,
					categoryId: catDoc ? catDoc._id : null,
					subcategory: item.subcategory || "",
					brand: item.brand || "LUXESTORE Atelier",
					stock: item.stock !== undefined ? Number(item.stock) : 15,
					sku: productSku,
					image: primaryImage,
					images: imagesArray,
					status: "active",
					isFeatured: Boolean(item.isFeatured),
					fabric: item.fabric || "100% Premium Cotton",
					fit: item.fit || "Regular Fit",
					variants: Array.isArray(item.variants) ? item.variants : [],
				});

				importedProducts.push(createdProduct);
			} catch (err) {
				console.error(`Row ${i + 1} import failed:`, err.message);
				failedRows.push({ row: i + 1, name: item.name, error: err.message });
			}
		}

		await updateFeaturedProductsCache();

		await logAdminAction({
			req,
			action: "BULK_PRODUCTS_IMPORTED",
			targetType: "Product",
			details: {
				importedCount: importedProducts.length,
				failedCount: failedRows.length,
			},
		});

		res.status(201).json({
			success: true,
			importedCount: importedProducts.length,
			failedCount: failedRows.length,
			failures: failedRows,
			message: `Successfully imported ${importedProducts.length} products into the catalog.`,
		});
	} catch (error) {
		console.error("Error in executeBulkImport:", error);
		res.status(500).json({ success: false, message: "Bulk import execution failed", error: error.message });
	}
};
